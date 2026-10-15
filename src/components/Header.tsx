import React from 'react';
import { Plus, Sheet, Kanban, FileSpreadsheet, Download, Laptop } from 'lucide-react';

interface HeaderProps {
  activeTab: 'spreadsheet' | 'kanban' | 'googlesheets';
  setActiveTab: (tab: 'spreadsheet' | 'kanban' | 'googlesheets') => void;
  onAddNewItem: () => void;
  onOpenGoogleSheetModal: () => void;
  onOpenLocalSetupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onAddNewItem,
  onOpenGoogleSheetModal,
  onOpenLocalSetupModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                ImportOps Follow-Up
              </span>
              <span className="text-xs text-slate-500 font-normal">
                PI & Milestone Tracking Sheet
              </span>
            </div>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'spreadsheet'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sheet className="w-4 h-4 text-emerald-600" />
              <span>Spreadsheet Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Kanban className="w-4 h-4 text-blue-600" />
              <span>Milestone Pipeline</span>
            </button>

            <button
              onClick={onOpenGoogleSheetModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Google Sheet Export</span>
            </button>

            <button
              onClick={onOpenLocalSetupModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <Laptop className="w-4 h-4 text-indigo-600" />
              <span>Run on PC & Save</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onAddNewItem}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="Add New Proforma Invoice Item"
            >
              <Plus className="w-4 h-4" />
              <span>Add Import PI</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
