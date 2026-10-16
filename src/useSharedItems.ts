import { useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User } from 'firebase/auth';
import { auth, cloudEnabled, db, googleProvider } from './firebase';
import type { ImportItem } from './utils/trackerLogic';

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'saving' | 'error';

const COLLECTION = 'imports';

// JSON with sorted keys so "same data" always gives the same string
function stable(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((o: any, k) => ((o[k] = v[k]), o), {})
      : v
  );
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
  const lastSynced = useRef(new Map<string, string>());

  // 1) Who is signed in?
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) setLoaded(false);
    });
  }, []);

  // 2) Listen to the shared database (live updates from everyone)
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
      (err) => {
        setStatus('error');
        setError(err.message);
      }
    );
  }, [user]);

  // 3) Push local changes up (small delay so typing doesn't save on every key)
  useEffect(() => {
    if (!db || !user || !loaded) return;
    const t = setTimeout(async () => {
      const ids = new Set(items.map((i) => i.id));
      const writes: Promise<void>[] = [];
      for (const item of items) {
        const s = stable(item);
        if (lastSynced.current.get(item.id) !== s) {
          lastSynced.current.set(item.id, s);
          writes.push(setDoc(doc(db!, COLLECTION, item.id), JSON.parse(s)));
        }
      }
      for (const id of [...lastSynced.current.keys()]) {
        if (!ids.has(id)) {
          lastSynced.current.delete(id);
          writes.push(deleteDoc(doc(db!, COLLECTION, id)));
        }
      }
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

  return {
    cloudEnabled,
    user,
    authReady,
    status,
    error,
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
