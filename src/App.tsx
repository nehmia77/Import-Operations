import React, { useState, useEffect } from 'react';
import { ImportItem, MilestoneId, calculateSummaryStats, createNewImportItem, updateMilestone } from './utils/trackerLogic';
import { INITIAL_IMPORT_ITEMS } from './data/mockImports';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { SpreadsheetView } from './components/SpreadsheetView';
import { KanbanView } from './components/KanbanView';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { NewItemModal } from './components/NewItemModal';
import { ItemDrawer } from './components/ItemDrawer';
import { LocalSetupModal } from './components/LocalSetupModal';
import { RotateCcw, FileSpreadsheet, Download, Laptop, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'importops_tracker_data_v1';

export default function App() {
  const [items, setItems] = useState<ImportItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return INITIAL_IMPORT_ITEMS;
  });

  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'kanban' | 'googlesheets'>('spreadsheet');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [isLocalSetupModalOpen, setIsLocalSetupModalOpen] = useState(false);
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState<ImportItem | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }, [items]);

  const summaryStats = calculateSummaryStats(items);

  // Update milestone completion & timestamp
  const handleUpdateMilestone = (
    item: ImportItem,
    milestoneId: MilestoneId,
    isCompleted: boolean,
    completedDate?: string | null
  ) => {
    const updated = updateMilestone(item, milestoneId, isCompleted, completedDate);
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    if (selectedItemForDrawer?.id === item.id) {
      setSelectedItemForDrawer(updated);
    }
  };

  // Update single field from inline spreadsheet cell edit
  const handleUpdateItemField = (
    itemId: string,
    field: keyof ImportItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          [field]: value,
        };
      })
    );
  };

  // Delete row
  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this import operation?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (selectedItemForDrawer?.id === id) {
        setSelectedItemForDrawer(null);
      }
    }
  };

  // Duplicate row
  const handleDuplicateItem = (item: ImportItem) => {
    const duplicate = createNewImportItem({
      item: `${item.item} (Copy)`,
      quantity: item.quantity,
      totalAmount: item.totalAmount,
      currency: item.currency,
      supplier: item.supplier,
      termOfDelivery: item.termOfDelivery,
      termOfPayment: item.termOfPayment,
      bank: item.bank,
      voyageFrom: item.voyageFrom,
      voyageTo: item.voyageTo,
      piNo: item.piNo ? `${item.piNo}-COPY` : '',
      piDate: item.piDate,
    });
    setItems((prev) => [duplicate, ...prev]);
  };

  // Quick insert new row with default Foreign currency approval, Insurance, Bank Permit
  const handleAddNewRow = () => {
    const newItem = createNewImportItem({
      item: 'New Import Goods',
      quantity: '1 Lot',
      totalAmount: 25000,
      currency: 'USD',
      supplier: 'Supplier Global Ltd',
      termOfDelivery: 'FOB',
      termOfPayment: 'LC at Sight',
      bank: 'Commercial Bank of Ethiopia (CBE)',
      voyageFrom: 'Shanghai, China',
      voyageTo: 'Djibouti Port',
      piNo: `PI-2026-${Math.floor(100 + Math.random() * 900)}`,
    });
    setItems((prev) => [...prev, newItem]);
  };

  // Add from modal form
  const handleAddNewItem = (newItem: ImportItem) => {
    setItems((prev) => [newItem, ...prev]);
  };

  // Update item from drawer
  const handleUpdateItem = (updatedItem: ImportItem) => {
    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    setSelectedItemForDrawer(null);
  };

  // Reset to demo data
  const handleResetData = () => {
    if (confirm('Reset tracker data to initial template items?')) {
      setItems(INITIAL_IMPORT_ITEMS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddNewItem={() => setIsNewItemModalOpen(true)}
        onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
        onOpenLocalSetupModal={() => setIsLocalSetupModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner with guidance and save status */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Import Operation Follow-Up Sheet
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-Saved in Browser</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track Proforma Invoices with automated <strong>Foreign currency approval</strong>, <strong>Insurance</strong>, and <strong>Bank Permit</strong> milestones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGoogleSheetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export as Google Sheet / Excel</span>
            </button>

            <button
              onClick={() => setIsLocalSetupModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Laptop className="w-3.5 h-3.5 text-indigo-600" />
              <span>Run on PC & Backup</span>
            </button>

            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Reset to sample dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Operational KPI Cards */}
        <StatsBar
          stats={summaryStats}
          onFilterClick={(filter) => {
            setActiveStatusFilter(filter);
            setActiveTab('spreadsheet');
          }}
          activeFilter={activeStatusFilter}
        />

        {/* Main View: Spreadsheet Grid or Milestone Pipeline */}
        {activeTab === 'spreadsheet' ? (
          <SpreadsheetView
            items={items}
            onUpdateMilestone={handleUpdateMilestone}
            onUpdateItemField={handleUpdateItemField}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            onAddNewRow={handleAddNewRow}
            onOpenDetails={(item) => setSelectedItemForDrawer(item)}
            onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
            activeStatusFilter={activeStatusFilter}
            setActiveStatusFilter={setActiveStatusFilter}
          />
        ) : (
          <KanbanView
            items={items}
            onUpdateMilestone={handleUpdateMilestone}
            onOpenDetails={(item) => setSelectedItemForDrawer(item)}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <NewItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        onAddItem={handleAddNewItem}
      />

      <GoogleSheetModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        items={items}
      />

      <LocalSetupModal
        isOpen={isLocalSetupModalOpen}
        onClose={() => setIsLocalSetupModalOpen(false)}
        items={items}
        onImportItems={(imported) => setItems(imported)}
      />

      <ItemDrawer
        item={selectedItemForDrawer}
        onClose={() => setSelectedItemForDrawer(null)}
        onUpdateItem={handleUpdateItem}
      />
    </div>
  );
}
