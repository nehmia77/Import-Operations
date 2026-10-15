import React, { useState } from 'react';
import {
  ImportItem,
  MilestoneId,
} from '../utils/trackerLogic';
import {
  COMMON_DELIVERY_TERMS,
  COMMON_PAYMENT_TERMS,
} from '../types';
import {
  Search,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Edit3,
  Trash2,
  Copy,
  Plus,
  Download,
  Eye,
  Check,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpreadsheetViewProps {
  items: ImportItem[];
  onUpdateMilestone: (
    item: ImportItem,
    milestoneId: MilestoneId,
    isCompleted: boolean,
    completedDate?: string | null
  ) => void;
  onUpdateItemField: (
    itemId: string,
    field: keyof ImportItem,
    value: string | number
  ) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: ImportItem) => void;
  onAddNewRow: () => void;
  onOpenDetails: (item: ImportItem) => void;
  onOpenGoogleSheetModal: () => void;
  activeStatusFilter: string;
  setActiveStatusFilter: (filter: any) => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  items,
  onUpdateMilestone,
  onUpdateItemField,
  onDeleteItem,
  onDuplicateItem,
  onAddNewRow,
  onOpenDetails,
  onOpenGoogleSheetModal,
  activeStatusFilter,
  setActiveStatusFilter,
}) => {
  const [columnLayout, setColumnLayout] = useState<'workflow' | 'skeleton'>('workflow');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [activeCellAddress, setActiveCellAddress] = useState<string>('A2: Item');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [dateEditingMilestone, setDateEditingMilestone] = useState<{
    itemId: string;
    milestoneId: MilestoneId;
    currentDate: string;
  } | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search query
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchItem = item.item.toLowerCase().includes(query);
      const matchSupplier = item.supplier.toLowerCase().includes(query);
      const matchPi = item.piNo.toLowerCase().includes(query);
      const matchBank = item.bank.toLowerCase().includes(query);
      if (!matchItem && !matchSupplier && !matchPi && !matchBank) return false;
    }

    // Bank filter
    if (selectedBank !== 'ALL' && !item.bank.toLowerCase().includes(selectedBank.toLowerCase())) {
      return false;
    }

    // Status filter
    if (activeStatusFilter === 'fx_pending') {
      return !item.milestones.fx_approval.isCompleted;
    }
    if (activeStatusFilter === 'insurance_pending') {
      return !item.milestones.insurance.isCompleted;
    }
    if (activeStatusFilter === 'bank_permit_pending') {
      return !item.milestones.bank_permit.isCompleted;
    }
    if (activeStatusFilter === 'completed') {
      return (
        item.milestones.fx_approval.isCompleted &&
        item.milestones.insurance.isCompleted &&
        item.milestones.bank_permit.isCompleted
      );
    }

    return true;
  });

  // Extract distinct banks for filter
  const distinctBanks = Array.from(
    new Set(items.map((i) => i.bank).filter(Boolean))
  );

  const handleStartEdit = (id: string, field: string, currentValue: any, cellAddr: string) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue ?? ''));
    setActiveCellAddress(cellAddr);
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const value = field === 'totalAmount' ? parseFloat(editValue) || 0 : editValue;
    onUpdateItemField(id, field as keyof ImportItem, value);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleToggleMilestone = (
    item: ImportItem,
    milestoneId: MilestoneId,
    currentState: boolean
  ) => {
    const newState = !currentState;
    onUpdateMilestone(item, milestoneId, newState);

    // If this completes all 3 milestones, celebrate!
    if (newState) {
      const willBeComplete =
        (milestoneId === 'fx_approval' || item.milestones.fx_approval.isCompleted) &&
        (milestoneId === 'insurance' || item.milestones.insurance.isCompleted) &&
        (milestoneId === 'bank_permit' || item.milestones.bank_permit.isCompleted);

      if (willBeComplete) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch (_) {}
      }
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRowIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === filteredItems.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper renderers for reusable cells
  const renderItemCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="item"
      onClick={() => setActiveCellAddress(`A${rowNumber}: ${item.item}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'item', item.item, `A${rowNumber}: ${item.item}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text font-medium text-slate-900 min-w-[200px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'item' ? (
        <input
          type="text"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none"
        />
      ) : (
        <span className="line-clamp-2" title={item.item}>
          {item.item || <span className="text-slate-300 italic">Enter item...</span>}
        </span>
      )}
    </td>
  );

  const renderQuantityCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="qty"
      onClick={() => setActiveCellAddress(`Qty ${rowNumber}: ${item.quantity}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'quantity', item.quantity, `Qty ${rowNumber}: ${item.quantity}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text text-slate-700 whitespace-nowrap min-w-[90px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'quantity' ? (
        <input
          type="text"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none"
        />
      ) : (
        item.quantity || <span className="text-slate-300 italic">-</span>
      )}
    </td>
  );

  const renderAmountCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="amount"
      onClick={() => setActiveCellAddress(`Amount ${rowNumber}: ${formatAmount(item.totalAmount, item.currency)}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'totalAmount', item.totalAmount, `Amount ${rowNumber}: ${item.totalAmount}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap min-w-[110px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'totalAmount' ? (
        <input
          type="number"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none text-right font-mono"
        />
      ) : (
        formatAmount(item.totalAmount, item.currency)
      )}
    </td>
  );

  const renderSupplierCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="supplier"
      onClick={() => setActiveCellAddress(`Supplier ${rowNumber}: ${item.supplier}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'supplier', item.supplier, `Supplier ${rowNumber}: ${item.supplier}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text text-slate-700 min-w-[160px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'supplier' ? (
        <input
          type="text"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none"
        />
      ) : (
        <span className="truncate block max-w-[180px]" title={item.supplier}>
          {item.supplier || <span className="text-slate-300 italic">Enter supplier...</span>}
        </span>
      )}
    </td>
  );

  const renderDeliveryCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="delivery"
      onClick={() => setActiveCellAddress(`Delivery ${rowNumber}: ${item.termOfDelivery}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'termOfDelivery', item.termOfDelivery, `Delivery ${rowNumber}: ${item.termOfDelivery}`)}
      className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap min-w-[100px] cursor-pointer"
      title="Double-click to edit Delivery Term (Incoterm)"
    >
      {editingCell?.id === item.id && editingCell.field === 'termOfDelivery' ? (
        <select
          autoFocus
          value={editValue}
          onChange={(e) => {
            const val = e.target.value;
            setEditValue(val);
            onUpdateItemField(item.id, 'termOfDelivery', val);
            setEditingCell(null);
          }}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none font-medium"
        >
          {COMMON_DELIVERY_TERMS.map((term) => {
            const code = term.split(' ')[0];
            return (
              <option key={term} value={code}>
                {term}
              </option>
            );
          })}
        </select>
      ) : (
        <div
          onClick={() => handleStartEdit(item.id, 'termOfDelivery', item.termOfDelivery, `Delivery ${rowNumber}: ${item.termOfDelivery}`)}
          className="flex items-center gap-1.5 group cursor-pointer"
        >
          <span className="px-2 py-0.5 bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-800 group-hover:border-emerald-300 text-slate-800 rounded font-mono text-[11px] font-semibold border border-slate-200 transition-colors">
            {item.termOfDelivery}
          </span>
          <Edit3 className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </td>
  );

  const renderPaymentCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="payment"
      onClick={() => setActiveCellAddress(`Payment ${rowNumber}: ${item.termOfPayment}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'termOfPayment', item.termOfPayment, `Payment ${rowNumber}: ${item.termOfPayment}`)}
      className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap min-w-[130px] cursor-pointer"
      title="Double-click to edit Payment Term"
    >
      {editingCell?.id === item.id && editingCell.field === 'termOfPayment' ? (
        <select
          autoFocus
          value={editValue}
          onChange={(e) => {
            const val = e.target.value;
            setEditValue(val);
            onUpdateItemField(item.id, 'termOfPayment', val);
            setEditingCell(null);
          }}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none"
        >
          {COMMON_PAYMENT_TERMS.map((pay) => (
            <option key={pay} value={pay}>
              {pay}
            </option>
          ))}
        </select>
      ) : (
        <div
          onClick={() => handleStartEdit(item.id, 'termOfPayment', item.termOfPayment, `Payment ${rowNumber}: ${item.termOfPayment}`)}
          className="flex items-center gap-1.5 group cursor-pointer"
        >
          <span className="text-xs text-slate-800 font-medium group-hover:text-emerald-700">
            {item.termOfPayment}
          </span>
          <Edit3 className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </td>
  );

  const renderBankCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="bank"
      onClick={() => setActiveCellAddress(`Bank ${rowNumber}: ${item.bank}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'bank', item.bank, `Bank ${rowNumber}: ${item.bank}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text text-slate-700 min-w-[150px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'bank' ? (
        <input
          type="text"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none"
        />
      ) : (
        <span className="truncate block max-w-[160px]" title={item.bank}>
          {item.bank}
        </span>
      )}
    </td>
  );

  const renderVoyageFromCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="vfrom"
      onClick={() => setActiveCellAddress(`Voyage From ${rowNumber}: ${item.voyageFrom}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'voyageFrom', item.voyageFrom, `Voyage From ${rowNumber}: ${item.voyageFrom}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text text-slate-600 whitespace-nowrap min-w-[110px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'voyageFrom' ? (
        <input
          type="text"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none"
        />
      ) : (
        item.voyageFrom || '-'
      )}
    </td>
  );

  const renderVoyageToCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="vto"
      onClick={() => setActiveCellAddress(`Voyage To ${rowNumber}: ${item.voyageTo}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'voyageTo', item.voyageTo, `Voyage To ${rowNumber}: ${item.voyageTo}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text text-slate-600 whitespace-nowrap min-w-[110px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'voyageTo' ? (
        <input
          type="text"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none"
        />
      ) : (
        item.voyageTo || '-'
      )}
    </td>
  );

  // MILESTONE 1: FOREIGN CURRENCY APPROVAL
  const renderFxMilestoneCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="fx"
      onClick={() =>
        setActiveCellAddress(
          `FX Approval ${rowNumber}: ${
            item.milestones.fx_approval.isCompleted
              ? `Finished on ${item.milestones.fx_approval.completedDate}`
              : 'Pending'
          }`
        )
      }
      className="px-2.5 py-2 border-r border-slate-200 bg-blue-50/20 min-w-[185px]"
    >
      <div className="flex items-center justify-between gap-1.5">
        <button
          onClick={() =>
            handleToggleMilestone(
              item,
              'fx_approval',
              item.milestones.fx_approval.isCompleted
            )
          }
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all w-full text-left cursor-pointer ${
            item.milestones.fx_approval.isCompleted
              ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-semibold shadow-2xs hover:bg-emerald-200'
              : 'bg-blue-100/80 text-blue-900 border border-blue-200 hover:bg-blue-200/80 font-medium'
          }`}
          title={
            item.milestones.fx_approval.isCompleted
              ? `Completed on ${item.milestones.fx_approval.completedDate}. Click to unmark.`
              : 'Click to mark Foreign Currency Approval as finished'
          }
        >
          <div
            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
              item.milestones.fx_approval.isCompleted
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'border-blue-400 bg-white'
            }`}
          >
            {item.milestones.fx_approval.isCompleted && (
              <Check className="w-3 h-3 stroke-[3]" />
            )}
          </div>

          <div className="flex-1 truncate">
            <span className="block text-[11px] leading-tight">
              {item.milestones.fx_approval.isCompleted ? '✓ FX Approved' : '○ FX Pending'}
            </span>
            {item.milestones.fx_approval.isCompleted && (
              <span className="text-[10px] font-mono text-emerald-800 block">
                {item.milestones.fx_approval.completedDate}
              </span>
            )}
          </div>
        </button>

        {item.milestones.fx_approval.isCompleted && (
          <button
            onClick={() =>
              setDateEditingMilestone({
                itemId: item.id,
                milestoneId: 'fx_approval',
                currentDate: item.milestones.fx_approval.completedDate || '',
              })
            }
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
            title="Edit completion date"
          >
            <Calendar className="w-3 h-3" />
          </button>
        )}
      </div>
    </td>
  );

  // MILESTONE 2: INSURANCE
  const renderInsuranceCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="insurance"
      onClick={() =>
        setActiveCellAddress(
          `Insurance ${rowNumber}: ${
            item.milestones.insurance.isCompleted
              ? `Finished on ${item.milestones.insurance.completedDate}`
              : 'Pending'
          }`
        )
      }
      className="px-2.5 py-2 border-r border-slate-200 bg-amber-50/20 min-w-[185px]"
    >
      <div className="flex items-center justify-between gap-1.5">
        <button
          onClick={() =>
            handleToggleMilestone(
              item,
              'insurance',
              item.milestones.insurance.isCompleted
            )
          }
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all w-full text-left cursor-pointer ${
            item.milestones.insurance.isCompleted
              ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-semibold shadow-2xs hover:bg-emerald-200'
              : 'bg-amber-100/80 text-amber-900 border border-amber-200 hover:bg-amber-200/80 font-medium'
          }`}
          title={
            item.milestones.insurance.isCompleted
              ? `Completed on ${item.milestones.insurance.completedDate}. Click to unmark.`
              : 'Click to mark Marine Insurance as finished'
          }
        >
          <div
            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
              item.milestones.insurance.isCompleted
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'border-amber-400 bg-white'
            }`}
          >
            {item.milestones.insurance.isCompleted && (
              <Check className="w-3 h-3 stroke-[3]" />
            )}
          </div>

          <div className="flex-1 truncate">
            <span className="block text-[11px] leading-tight">
              {item.milestones.insurance.isCompleted ? '✓ Policy Issued' : '○ Insure Cargo'}
            </span>
            {item.milestones.insurance.isCompleted && (
              <span className="text-[10px] font-mono text-emerald-800 block">
                {item.milestones.insurance.completedDate}
              </span>
            )}
          </div>
        </button>

        {item.milestones.insurance.isCompleted && (
          <button
            onClick={() =>
              setDateEditingMilestone({
                itemId: item.id,
                milestoneId: 'insurance',
                currentDate: item.milestones.insurance.completedDate || '',
              })
            }
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
            title="Edit completion date"
          >
            <Calendar className="w-3 h-3" />
          </button>
        )}
      </div>
    </td>
  );

  // MILESTONE 3: BANK PERMIT
  const renderBankPermitCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="bank_permit"
      onClick={() =>
        setActiveCellAddress(
          `Bank Permit ${rowNumber}: ${
            item.milestones.bank_permit.isCompleted
              ? `Finished on ${item.milestones.bank_permit.completedDate}`
              : 'Pending'
          }`
        )
      }
      className="px-2.5 py-2 border-r border-slate-200 bg-purple-50/20 min-w-[185px]"
    >
      <div className="flex items-center justify-between gap-1.5">
        <button
          onClick={() =>
            handleToggleMilestone(
              item,
              'bank_permit',
              item.milestones.bank_permit.isCompleted
            )
          }
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all w-full text-left cursor-pointer ${
            item.milestones.bank_permit.isCompleted
              ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-semibold shadow-2xs hover:bg-emerald-200'
              : 'bg-purple-100/80 text-purple-900 border border-purple-200 hover:bg-purple-200/80 font-medium'
          }`}
          title={
            item.milestones.bank_permit.isCompleted
              ? `Completed on ${item.milestones.bank_permit.completedDate}. Click to unmark.`
              : 'Click to mark Bank Permit as finished'
          }
        >
          <div
            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
              item.milestones.bank_permit.isCompleted
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'border-purple-400 bg-white'
            }`}
          >
            {item.milestones.bank_permit.isCompleted && (
              <Check className="w-3 h-3 stroke-[3]" />
            )}
          </div>

          <div className="flex-1 truncate">
            <span className="block text-[11px] leading-tight">
              {item.milestones.bank_permit.isCompleted ? '✓ Permit Issued' : '○ Issue Permit'}
            </span>
            {item.milestones.bank_permit.isCompleted && (
              <span className="text-[10px] font-mono text-emerald-800 block">
                {item.milestones.bank_permit.completedDate}
              </span>
            )}
          </div>
        </button>

        {item.milestones.bank_permit.isCompleted && (
          <button
            onClick={() =>
              setDateEditingMilestone({
                itemId: item.id,
                milestoneId: 'bank_permit',
                currentDate: item.milestones.bank_permit.completedDate || '',
              })
            }
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
            title="Edit completion date"
          >
            <Calendar className="w-3 h-3" />
          </button>
        )}
      </div>
    </td>
  );

  const renderStatusCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="status"
      onClick={() => setActiveCellAddress(`Status ${rowNumber}: ${item.overallStatus}`)}
      className="px-3 py-2 border-r border-slate-200 whitespace-nowrap min-w-[130px]"
    >
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
          item.overallStatus === 'Permit Approved'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : item.overallStatus === 'Bank Permit Pending'
            ? 'bg-purple-50 text-purple-800 border-purple-200'
            : item.overallStatus === 'Insurance Pending'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}
      >
        {item.overallStatus}
      </span>
    </td>
  );

  const renderPiNoCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="pino"
      onClick={() => setActiveCellAddress(`PI No ${rowNumber}: ${item.piNo}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'piNo', item.piNo, `PI No ${rowNumber}: ${item.piNo}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text font-mono text-slate-800 whitespace-nowrap min-w-[110px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'piNo' ? (
        <input
          type="text"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none font-mono"
        />
      ) : (
        item.piNo || '-'
      )}
    </td>
  );

  const renderDateCell = (item: ImportItem, rowNumber: number) => (
    <td
      key="pidate"
      onClick={() => setActiveCellAddress(`PI Date ${rowNumber}: ${item.piDate}`)}
      onDoubleClick={() => handleStartEdit(item.id, 'piDate', item.piDate, `PI Date ${rowNumber}: ${item.piDate}`)}
      className="px-3 py-2 border-r border-slate-200 cursor-text font-mono text-slate-600 whitespace-nowrap min-w-[95px]"
    >
      {editingCell?.id === item.id && editingCell.field === 'piDate' ? (
        <input
          type="date"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white text-xs outline-none font-mono"
        />
      ) : (
        item.piDate || '-'
      )}
    </td>
  );

  const renderActionsCell = (item: ImportItem, rowNumber: number) => (
    <td key="actions" className="px-3 py-2 text-center whitespace-nowrap w-24">
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onOpenDetails(item)}
          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
          title="Open Order Details & Notes"
          aria-label={`Open details for ${item.item}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDuplicateItem(item)}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          title="Duplicate row"
          aria-label={`Duplicate row ${rowNumber}`}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDeleteItem(item.id)}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="Delete row"
          aria-label={`Delete row ${rowNumber}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Google Sheets / Excel Style Formula & Action Toolbar */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Search & Status Segment Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[210px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search item, PI No, supplier, bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Segmented status filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeStatusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setActiveStatusFilter('fx_pending')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeStatusFilter === 'fx_pending'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FX Pending
            </button>
            <button
              onClick={() => setActiveStatusFilter('insurance_pending')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeStatusFilter === 'insurance_pending'
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Insurance Pending
            </button>
            <button
              onClick={() => setActiveStatusFilter('bank_permit_pending')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeStatusFilter === 'bank_permit_pending'
                  ? 'bg-purple-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bank Permit Pending
            </button>
            <button
              onClick={() => setActiveStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeStatusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ready to Ship
            </button>
          </div>

          {/* Bank selector */}
          <div className="relative">
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="text-xs py-1.5 pl-2.5 pr-7 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Banks</option>
              {distinctBanks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode: Milestones Upfront vs Skeleton Order */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setColumnLayout('workflow')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                columnLayout === 'workflow'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Milestone columns (FX, Insurance, Bank Permit) placed upfront"
            >
              Milestones Upfront
            </button>
            <button
              onClick={() => setColumnLayout('skeleton')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                columnLayout === 'skeleton'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Classic Skeleton column sequence"
            >
              Classic Order
            </button>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGoogleSheetModal}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Export or sync with Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Google Sheet Export</span>
          </button>

          <button
            onClick={onAddNewRow}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Row</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Formula / Active Cell Indicator Bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 text-xs font-mono text-slate-600">
        <span className="font-semibold text-slate-800 px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] min-w-[70px] text-center">
          {activeCellAddress.split(':')[0]}
        </span>
        <div className="h-4 w-px bg-slate-300"></div>
        <span className="text-slate-400 font-serif italic text-xs">fx</span>
        <span className="text-slate-700 truncate font-sans text-xs">
          {activeCellAddress.includes(':') ? activeCellAddress.split(':')[1]?.trim() : 'Select cell to inspect'}
        </span>
        <div className="ml-auto text-[11px] text-slate-500 font-sans hidden sm:block">
          💡 Click milestone checkbox to mark finished date · Double-click any cell to edit
        </div>
      </div>

      {/* Interactive Spreadsheet Grid */}
      <div className="overflow-x-auto min-h-[440px]">
        <table className="w-full border-collapse text-left text-xs">
          {/* Column Group Headers & Names */}
          <thead>
            {columnLayout === 'workflow' ? (
              // WORKFLOW UPFRONT HEADERS
              <>
                <tr className="bg-slate-100 text-slate-500 font-mono text-[10px] border-b border-slate-200">
                  <th className="w-10 px-2 py-1 text-center border-r border-slate-200 font-normal">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.size === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleSelectAll}
                      aria-label="Select all rows"
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="w-10 px-2 py-1 text-center border-r border-slate-200 font-normal">#</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">A</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">B</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">C</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal bg-blue-50/80 text-blue-900 font-semibold">D (Milestone 1)</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal bg-amber-50/80 text-amber-900 font-semibold">E (Milestone 2)</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal bg-purple-50/80 text-purple-900 font-semibold">F (Milestone 3)</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">G</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">H</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">I</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">J</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">K</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">L</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">M</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">N</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">O</th>
                  <th className="w-24 px-3 py-1 text-center font-normal">Actions</th>
                </tr>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 tracking-tight">
                  <th className="px-2 py-2.5 text-center border-r border-slate-200"></th>
                  <th className="px-2 py-2.5 text-center border-r border-slate-200 text-slate-400 font-mono">Row</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[200px]">Item Description</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[90px]">Quantity</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[110px] text-right">Total Amount</th>

                  {/* PROMINENT MILESTONES UPFRONT */}
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[185px] bg-blue-50/70 text-blue-900">
                    <div className="flex items-center justify-between">
                      <span>Foreign Currency Approval</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded">M1</span>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[185px] bg-amber-50/70 text-amber-900">
                    <div className="flex items-center justify-between">
                      <span>Insurance</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-200 text-amber-800 rounded">M2</span>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[185px] bg-purple-50/70 text-purple-900">
                    <div className="flex items-center justify-between">
                      <span>Bank Permit</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-200 text-purple-800 rounded">M3</span>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[130px]">Overall Status</th>

                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[160px]">Supplier</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[150px]">Bank</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[90px]">Delivery Term</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[105px]">Payment Term</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[110px]">Voyage From</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[110px]">Voyage To</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[110px]">PI No</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[95px]">Date</th>
                  <th className="px-3 py-2.5 text-center">Manage</th>
                </tr>
              </>
            ) : (
              // SKELETON ORDER HEADERS
              <>
                <tr className="bg-slate-100 text-slate-500 font-mono text-[10px] border-b border-slate-200">
                  <th className="w-10 px-2 py-1 text-center border-r border-slate-200 font-normal">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.size === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleSelectAll}
                      aria-label="Select all rows"
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="w-10 px-2 py-1 text-center border-r border-slate-200 font-normal">#</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">A</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">B</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">C</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">D</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">E</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">F</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">G</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">H</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">I</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal bg-blue-50/80 text-blue-900 font-semibold">J (Milestone 1)</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal bg-amber-50/80 text-amber-900 font-semibold">K (Milestone 2)</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal bg-purple-50/80 text-purple-900 font-semibold">L (Milestone 3)</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">M</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">N</th>
                  <th className="px-3 py-1 border-r border-slate-200 font-normal">O</th>
                  <th className="w-24 px-3 py-1 text-center font-normal">Actions</th>
                </tr>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 tracking-tight">
                  <th className="px-2 py-2.5 text-center border-r border-slate-200"></th>
                  <th className="px-2 py-2.5 text-center border-r border-slate-200 text-slate-400 font-mono">Row</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[200px]">Item Description</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[90px]">Quantity</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[110px] text-right">Total Amount</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[160px]">Supplier</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[90px]">Delivery Term</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[105px]">Payment Term</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[150px]">Bank</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[110px]">Voyage From</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[110px]">Voyage To</th>

                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[185px] bg-blue-50/70 text-blue-900">
                    <div className="flex items-center justify-between">
                      <span>Foreign Currency Approval</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded">M1</span>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[185px] bg-amber-50/70 text-amber-900">
                    <div className="flex items-center justify-between">
                      <span>Insurance</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-200 text-amber-800 rounded">M2</span>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[185px] bg-purple-50/70 text-purple-900">
                    <div className="flex items-center justify-between">
                      <span>Bank Permit</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-200 text-purple-800 rounded">M3</span>
                    </div>
                  </th>

                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[130px]">Overall Status</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[110px]">PI No</th>
                  <th className="px-3 py-2.5 border-r border-slate-200 min-w-[95px]">Date</th>
                  <th className="px-3 py-2.5 text-center">Manage</th>
                </tr>
              </>
            )}
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-900 text-sm">Clean Follow-Up Sheet Ready</p>
                    <p className="text-xs text-slate-500 mt-1">
                      No default items. Click below to add your first Proforma Invoice item. Foreign currency approval, Insurance, and Bank Permit will be automatically initialized for you!
                    </p>
                    <button
                      onClick={onAddNewRow}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Insert First Import PI</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const rowNumber = idx + 2; // In spreadsheet, row 1 is header
                const isSelected = selectedRowIds.has(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="px-2 py-2 text-center border-r border-slate-200">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(item.id)}
                        aria-label={`Select row ${rowNumber}`}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* Row Number */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 font-mono text-[11px] text-slate-400 select-none">
                      {rowNumber}
                    </td>

                    {/* Reordered based on columnLayout */}
                    {columnLayout === 'workflow' ? (
                      // WORKFLOW ORDER: Milestones visible upfront
                      <>
                        {renderItemCell(item, rowNumber)}
                        {renderQuantityCell(item, rowNumber)}
                        {renderAmountCell(item, rowNumber)}
                        {renderFxMilestoneCell(item, rowNumber)}
                        {renderInsuranceCell(item, rowNumber)}
                        {renderBankPermitCell(item, rowNumber)}
                        {renderStatusCell(item, rowNumber)}
                        {renderSupplierCell(item, rowNumber)}
                        {renderBankCell(item, rowNumber)}
                        {renderDeliveryCell(item, rowNumber)}
                        {renderPaymentCell(item, rowNumber)}
                        {renderVoyageFromCell(item, rowNumber)}
                        {renderVoyageToCell(item, rowNumber)}
                        {renderPiNoCell(item, rowNumber)}
                        {renderDateCell(item, rowNumber)}
                        {renderActionsCell(item, rowNumber)}
                      </>
                    ) : (
                      // SKELETON ORDER: Exact initial skeleton
                      <>
                        {renderItemCell(item, rowNumber)}
                        {renderQuantityCell(item, rowNumber)}
                        {renderAmountCell(item, rowNumber)}
                        {renderSupplierCell(item, rowNumber)}
                        {renderDeliveryCell(item, rowNumber)}
                        {renderPaymentCell(item, rowNumber)}
                        {renderBankCell(item, rowNumber)}
                        {renderVoyageFromCell(item, rowNumber)}
                        {renderVoyageToCell(item, rowNumber)}
                        {renderFxMilestoneCell(item, rowNumber)}
                        {renderInsuranceCell(item, rowNumber)}
                        {renderBankPermitCell(item, rowNumber)}
                        {renderStatusCell(item, rowNumber)}
                        {renderPiNoCell(item, rowNumber)}
                        {renderDateCell(item, rowNumber)}
                        {renderActionsCell(item, rowNumber)}
                      </>
                    )}
                  </tr>
                );
              })
            )}

            {/* Quick Inline Row Addition Row */}
            <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors border-t-2 border-dashed border-slate-200">
              <td colSpan={18} className="py-2.5 px-4 text-center">
                <button
                  onClick={onAddNewRow}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 py-1.5 px-3 rounded-lg hover:bg-emerald-100/60 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Insert New Proforma Invoice Row (auto-generates Foreign currency approval, Insurance, Bank Permit milestones)</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Date Picker Modal for precise completion date adjustment */}
      {dateEditingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 max-w-sm w-full mx-4">
            <h4 className="font-semibold text-slate-900 text-sm mb-1">
              Set Completion Date
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Select the date when this milestone was finalized.
            </p>
            <input
              type="date"
              value={dateEditingMilestone.currentDate}
              onChange={(e) =>
                setDateEditingMilestone({
                  ...dateEditingMilestone,
                  currentDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDateEditingMilestone(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetItem = items.find((i) => i.id === dateEditingMilestone.itemId);
                  if (targetItem) {
                    onUpdateMilestone(
                      targetItem,
                      dateEditingMilestone.milestoneId,
                      true,
                      dateEditingMilestone.currentDate
                    );
                  }
                  setDateEditingMilestone(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
              >
                Save Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
