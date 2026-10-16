import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import { auth, cloudEnabled, db, googleProvider } from './firebase';
import type { ImportItem } from './utils/trackerLogic';

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'saving' | 'error';
export interface CustomColumn {
  id: string;
  name: string;
}

const COLLECTION = 'imports';
const LOCAL_COLUMNS_KEY = 'importops_columns';

// JSON with sorted keys so "same data" always gives the same string
function stable(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((o: any, k) => ((o[k] = v[k]), o), {})
      : v
  );
}

// ---------- edit-history helpers ----------
const IGNORE = new Set(['id', 'createdAt', 'updatedAt', 'updatedBy', 'updatedByName', 'overallStatus']);
const LABELS: Record<string, string> = {
  item: 'Item Description',
  quantity: 'Quantity',
  totalAmount: 'Total Amount',
  currency: 'Currency',
  supplier: 'Supplier',
  termOfDelivery: 'Delivery Term',
  termOfPayment: 'Payment Term',
  bank: 'Bank',
  voyageFrom: 'Voyage From',
  voyageTo: 'Voyage To',
  piNo: 'PI No',
  piDate: 'Date',
};
const MILESTONE_LABELS: Record<string, string> = {
  fx_approval: 'Foreign currency approval',
  insurance: 'Insurance',
  bank_permit: 'Bank Permit',
};
const MILESTONE_PARTS: Record<string, string> = {
  isCompleted: 'done',
  completedDate: 'date',
  referenceNo: 'reference no',
  notes: 'notes',
};

function flatten(o: any, prefix = '', out: Record<string, any> = {}) {
  for (const k of Object.keys(o || {})) {
    const v = o[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const show = (v: any) => {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return String(v ?? '').slice(0, 200);
};

const rowLabel = (i: any) => String(i?.item || i?.piNo || (i?.id || '').slice(0, 6) || 'row').slice(0, 80);

function fieldLabel(key: string, columns: CustomColumn[]): string {
  if (LABELS[key]) return LABELS[key];
  if (key.startsWith('custom.')) {
    return columns.find((c) => c.id === key.slice(7))?.name || 'Custom column';
  }
  const m = key.match(/^milestones\.(\w+)\.(\w+)$/);
  if (m) return `${MILESTONE_LABELS[m[1]] || m[1]} — ${MILESTONE_PARTS[m[2]] || m[2]}`;
  return key;
}

function diffItems(oldItem: any, newItem: any, columns: CustomColumn[]) {
  const a = flatten(oldItem);
  const b = flatten(newItem);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: { field: string; fieldLabel: string; from: string; to: string }[] = [];
  keys.forEach((k) => {
    if (IGNORE.has(k.split('.')[0]) && !k.startsWith('custom.')) return;
    if (show(a[k]) === show(b[k])) return;
    out.push({ field: k, fieldLabel: fieldLabel(k, columns), from: show(a[k]), to: show(b[k]) });
  });
  return out;
}

export function useSharedItems(
  items: ImportItem[],
  setItems: (items: ImportItem[]) => void
) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!cloudEnabled);
  const [status, setStatus] = useState<SyncStatus>(cloudEnabled ? 'connecting' : 'local');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [denied, setDenied] = useState(false);
  const [columns, setColumns] = useState<CustomColumn[]>(() => {
    if (cloudEnabled) return [];
    try {
      return JSON.parse(localStorage.getItem(LOCAL_COLUMNS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const lastSynced = useRef(new Map<string, string>());
  const columnsRef = useRef<CustomColumn[]>(columns);
  columnsRef.current = columns;

  const me = user?.email || '';
  const meName = user?.displayName || me;

  const onListenError = (err: any) => {
    if (err?.code === 'permission-denied') setDenied(true);
    setStatus('error');
    setError(err?.message || 'Sync error');
  };

  // 1) Who is signed in?
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      setDenied(false);
      if (!u) setLoaded(false);
    });
  }, []);

  // 2) Listen to the shared rows (live updates from everyone)
  useEffect(() => {
    if (!db || !user) return;
    setStatus('connecting');
    let first = true;
    return onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        const remote: ImportItem[] = [];
        snap.forEach((d) => remote.push(d.data() as ImportItem));

        if (first) {
          first = false;
          setLoaded(true);
          // Database is empty but this device has rows → keep them; they get uploaded below
          if (remote.length === 0) {
            setStatus('synced');
            return;
          }
        }
        lastSynced.current = new Map(remote.map((i) => [i.id, stable(i)]));
        remote.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setItems(remote);
        setStatus('synced');
      },
      onListenError
    );
  }, [user]);

  // 3) Listen to the shared custom-column list
  useEffect(() => {
    if (!db || !user) return;
    return onSnapshot(
      doc(db, 'config', 'columns'),
      (snap) => setColumns(snap.exists() ? ((snap.data().list as CustomColumn[]) || []) : []),
      onListenError
    );
  }, [user]);

  // 4) Push local changes up (small delay so typing doesn't save on every key)
  useEffect(() => {
    if (!db || !user || !loaded) return;
    const t = setTimeout(async () => {
      const ids = new Set(items.map((i) => i.id));
      const writes: Promise<unknown>[] = [];
      const audits: any[] = [];
      const created: string[] = [];
      const removed: string[] = [];

      for (const item of items) {
        const s = stable(item);
        const prev = lastSynced.current.get(item.id);
        if (prev === s) continue;
        lastSynced.current.set(item.id, s);
        const payload = {
          ...JSON.parse(s),
          updatedBy: me,
          updatedByName: meName,
          updatedAt: new Date().toISOString(),
        };
        writes.push(setDoc(doc(db!, COLLECTION, item.id), payload));
        if (!prev) {
          created.push(rowLabel(item));
        } else {
          for (const d of diffItems(JSON.parse(prev), JSON.parse(s), columnsRef.current)) {
            audits.push({ action: 'edit', itemId: item.id, rowLabel: rowLabel(item), ...d });
          }
        }
      }
      for (const [id, prev] of [...lastSynced.current.entries()]) {
        if (!ids.has(id)) {
          lastSynced.current.delete(id);
          writes.push(deleteDoc(doc(db!, COLLECTION, id)));
          removed.push(rowLabel(JSON.parse(prev)));
        }
      }

      const bulk = (action: string, list: string[], verb: string) => {
        if (!list.length) return;
        if (list.length <= 5) {
          list.forEach((l) =>
            audits.push({ action, itemId: '', rowLabel: l, field: '', fieldLabel: `Row ${verb}`, from: '', to: '' })
          );
        } else {
          audits.push({
            action,
            itemId: '',
            rowLabel: `${list.length} rows`,
            field: '',
            fieldLabel: `Rows ${verb}`,
            from: '',
            to: list.slice(0, 5).join(', ') + '…',
          });
        }
      };
      bulk('create', created, 'added');
      bulk('delete', removed, 'deleted');

      audits.slice(0, 100).forEach((a) =>
        writes.push(
          addDoc(collection(db!, 'audit'), { ...a, by: me, byName: meName, at: serverTimestamp() })
        )
      );

      if (!writes.length) return;
      setStatus('saving');
      try {
        await Promise.all(writes);
        setStatus('synced');
      } catch (e: any) {
        setStatus('error');
        setError(e?.message || 'Could not save');
      }
    }, 600);
    return () => clearTimeout(t);
  }, [items, user, loaded]);

  // ---------- custom columns ----------
  const saveColumns = async (list: CustomColumn[], what: string) => {
    setColumns(list);
    if (!db || !user) {
      try {
        localStorage.setItem(LOCAL_COLUMNS_KEY, JSON.stringify(list));
      } catch {}
      return;
    }
    try {
      await setDoc(doc(db, 'config', 'columns'), { list });
      await addDoc(collection(db, 'audit'), {
        action: 'column',
        itemId: '',
        rowLabel: '',
        field: '',
        fieldLabel: what,
        from: '',
        to: '',
        by: me,
        byName: meName,
        at: serverTimestamp(),
      });
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || 'Could not save columns');
    }
  };

  const addColumn = (name: string) => {
    const clean = name.trim().slice(0, 40);
    if (!clean) return;
    const id = 'c' + Date.now().toString(36);
    saveColumns([...columnsRef.current, { id, name: clean }], `Column added: "${clean}"`);
  };
  const renameColumn = (id: string, name: string) => {
    const clean = name.trim().slice(0, 40);
    const old = columnsRef.current.find((c) => c.id === id);
    if (!clean || !old || old.name === clean) return;
    saveColumns(
      columnsRef.current.map((c) => (c.id === id ? { ...c, name: clean } : c)),
      `Column renamed: "${old.name}" → "${clean}"`
    );
  };
  const removeColumn = (id: string) => {
    const old = columnsRef.current.find((c) => c.id === id);
    if (!old) return;
    saveColumns(columnsRef.current.filter((c) => c.id !== id), `Column removed: "${old.name}"`);
  };

  return {
    cloudEnabled,
    user,
    authReady,
    status,
    error,
    denied,
    columns,
    addColumn,
    renameColumn,
    removeColumn,
    signIn: async () => {
      try {
        await signInWithPopup(auth!, googleProvider);
      } catch (e: any) {
        // Popup blocked by the browser → fall back to a full-page redirect
        if (e?.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth!, googleProvider);
          return;
        }
        throw e;
      }
    },
    signOut: () => signOut(auth!),
  };
}
