import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { CustomColumn } from '../useSharedItems';

interface Props {
  columns: CustomColumn[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export const ColumnsModal: React.FC<Props> = ({ columns, onAdd, onRename, onRemove, onClose }) => {
  const [newName, setNewName] = useState('');
  const add = () => {
    if (!newName.trim()) return;
    onAdd(newName);
    setNewName('');
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Custom columns</h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          New columns appear at the end of the table for everyone. Double-click a cell to type in it.
        </p>

        <div className="mt-4 space-y-2">
          {columns.length === 0 && <p className="text-xs text-slate-400 italic">No custom columns yet.</p>}
          {columns.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                defaultValue={c.name}
                maxLength={40}
                onBlur={(e) => onRename(c.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => {
                  if (window.confirm(`Remove the column "${c.name}"? It will disappear for everyone.`)) onRemove(c.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                aria-label={`Remove ${c.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={newName}
            maxLength={40}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="New column name, e.g. Container No"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <button
            onClick={add}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
};
