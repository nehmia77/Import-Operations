import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

interface Entry {
  id: string;
  at: Date | null;
  byName: string;
  by: string;
  action: string;
  rowLabel: string;
  fieldLabel: string;
  from: string;
  to: string;
}

export const HistoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      query(collection(db, 'audit'), orderBy('at', 'desc'), limit(300)),
      (snap) =>
        setEntries(
          snap.docs.map((d) => {
            const x: any = d.data();
            return { id: d.id, ...x, at: x.at?.toDate ? x.at.toDate() : null } as Entry;
          })
        ),
      (e) => setErr(e.message)
    );
  }, []);

  const q = search.toLowerCase().trim();
  const shown = entries.filter(
    (e) =>
      !q ||
      [e.byName, e.by, e.rowLabel, e.fieldLabel, e.from, e.to].some((v) => (v || '').toLowerCase().includes(q))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Edit history</h2>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by person, row or field…"
            className="mt-3 w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div className="overflow-y-auto p-5 pt-3 space-y-2">
          {err && <p className="text-xs text-rose-600">{err}</p>}
          {!err && shown.length === 0 && <p className="text-sm text-slate-400 italic">Nothing recorded yet.</p>}
          {shown.map((e) => (
            <div key={e.id} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{e.byName || e.by}</span>
                <span>{e.at ? e.at.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'just now'}</span>
              </div>
              <div className="mt-1 text-slate-800">
                {e.rowLabel && <span className="font-semibold">{e.rowLabel}</span>}
                {e.rowLabel && ' · '}
                {e.fieldLabel}
              </div>
              {(e.from || e.to) && e.action === 'edit' && (
                <div className="mt-0.5 text-xs text-slate-600">
                  <span className="text-rose-600 line-through">{e.from || '(empty)'}</span>
                  {' → '}
                  <span className="text-emerald-700 font-medium">{e.to || '(empty)'}</span>
                </div>
              )}
              {e.action !== 'edit' && e.to && <div className="mt-0.5 text-xs text-slate-500">{e.to}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
