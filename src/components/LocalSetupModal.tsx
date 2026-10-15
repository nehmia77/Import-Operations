import React, { useState } from 'react';
import { X, Terminal, Copy, Check, HardDrive, Laptop, Database, Download, Upload } from 'lucide-react';
import { ImportItem } from '../types';

interface LocalSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ImportItem[];
  onImportItems: (items: ImportItem[]) => void;
}

export const LocalSetupModal: React.FC<LocalSetupModalProps> = ({
  isOpen,
  onClose,
  items,
  onImportItems,
}) => {
  const [copiedBash, setCopiedBash] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const bashCommands = `# 1. Make sure you have Node.js installed (https://nodejs.org)
# 2. Open Terminal or PowerShell in your project folder
npm install

# 3. Start the application locally
npm run dev

# 4. Open http://localhost:3000 in your browser
# All your data and statuses are automatically saved in your browser!`;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `importops_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportItems(parsed);
          setImportStatus('Successfully restored ' + parsed.length + ' operations!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid backup file format');
        }
      } catch (err) {
        setImportStatus('Error reading JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center">
              <Laptop className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                How It Saves Data & How to Run on Your PC
              </h3>
              <p className="text-xs text-slate-500">
                Data persistence, offline backups, and local PC execution instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Section 1: How Data is Currently Saved */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  Is your data already saved right now? YES!
                </h4>
                <p className="text-emerald-900 mt-1 leading-relaxed">
                  Every time you tick a milestone, change a date, or add a row in this web app, it is <strong>automatically saved immediately in your browser's persistent storage (localStorage)</strong>.
                  When you refresh the page or bookmark the URL and return tomorrow, all your statuses and completed dates remain exactly as you left them!
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Backup & Restore */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-700" />
              <span>Offline Backup & Restore (Save to your PC)</span>
            </h4>
            <p className="text-slate-600 mb-3">
              You can download a full backup file of your tracking data anytime, and restore it on any computer:
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Data Backup (.json)</span>
              </button>

              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold rounded-lg shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              {importStatus && (
                <span className="text-emerald-700 font-medium">{importStatus}</span>
              )}
            </div>
          </div>

          {/* Section 3: How to Run the Website Locally on Your PC */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <span>How to run this website locally on your computer</span>
              </h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bashCommands);
                  setCopiedBash(true);
                  setTimeout(() => setCopiedBash(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                {copiedBash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBash ? 'Commands Copied!' : 'Copy Commands'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-slate-600 mb-3">
              <li>
                <strong>Download the codebase:</strong> In AI Studio, click the project export/download button to save the project folder onto your PC.
              </li>
              <li>
                <strong>Install Node.js:</strong> If you don't have Node.js installed, download it from <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-indigo-600 underline">nodejs.org</a> (v18 or v20+ LTS).
              </li>
              <li>
                <strong>Run commands:</strong> Open your terminal (Command Prompt, PowerShell, or macOS Terminal) inside the folder and run:
              </li>
            </ol>

            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto select-all leading-relaxed">
              npm install<br />
              npm run dev
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              The server will start at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">http://localhost:3000</code>. It runs 100% locally on your computer, does not require an active internet connection, and automatically preserves your data in your browser!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
