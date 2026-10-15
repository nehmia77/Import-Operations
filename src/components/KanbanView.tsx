import React from 'react';
import { ImportItem, MilestoneId } from '../utils/trackerLogic';
import {
  DollarSign,
  ShieldCheck,
  Landmark,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface KanbanViewProps {
  items: ImportItem[];
  onUpdateMilestone: (
    item: ImportItem,
    milestoneId: MilestoneId,
    isCompleted: boolean,
    completedDate?: string | null
  ) => void;
  onOpenDetails: (item: ImportItem) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  items,
  onUpdateMilestone,
  onOpenDetails,
}) => {
  // Categorize items by stage
  const fxPending = items.filter((i) => !i.milestones.fx_approval.isCompleted);
  const insurancePending = items.filter(
    (i) => i.milestones.fx_approval.isCompleted && !i.milestones.insurance.isCompleted
  );
  const bankPermitPending = items.filter(
    (i) =>
      i.milestones.fx_approval.isCompleted &&
      i.milestones.insurance.isCompleted &&
      !i.milestones.bank_permit.isCompleted
  );
  const fullyCleared = items.filter(
    (i) =>
      i.milestones.fx_approval.isCompleted &&
      i.milestones.insurance.isCompleted &&
      i.milestones.bank_permit.isCompleted
  );

  const columns = [
    {
      id: 'fx',
      title: '1. FX Approval Pending',
      subtitle: 'Awaiting Central Bank / CBE Allocation',
      items: fxPending,
      icon: DollarSign,
      headerBg: 'bg-blue-50 text-blue-900 border-blue-200',
      actionMilestone: 'fx_approval' as MilestoneId,
      actionLabel: 'Mark FX Approved',
    },
    {
      id: 'insurance',
      title: '2. Marine Insurance Pending',
      subtitle: 'Awaiting Marine Cargo Policy Cover',
      items: insurancePending,
      icon: ShieldCheck,
      headerBg: 'bg-amber-50 text-amber-900 border-amber-200',
      actionMilestone: 'insurance' as MilestoneId,
      actionLabel: 'Mark Insurance Done',
    },
    {
      id: 'bank_permit',
      title: '3. Bank Permit Pending',
      subtitle: 'Awaiting Import Permit / LC Opening',
      items: bankPermitPending,
      icon: Landmark,
      headerBg: 'bg-purple-50 text-purple-900 border-purple-200',
      actionMilestone: 'bank_permit' as MilestoneId,
      actionLabel: 'Issue Bank Permit',
    },
    {
      id: 'cleared',
      title: '4. Permits Complete',
      subtitle: 'Ready for Shipment & Cargo Dispatch',
      items: fullyCleared,
      icon: CheckCircle2,
      headerBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      actionMilestone: null,
      actionLabel: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((col) => {
        const Icon = col.icon;
        return (
          <div
            key={col.id}
            className="bg-slate-100/70 rounded-xl border border-slate-200 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b rounded-t-xl ${col.headerBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-xs">{col.title}</span>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-white/80 rounded-full">
                  {col.items.length}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">{col.subtitle}</p>
            </div>

            {/* Cards List */}
            <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
              {col.items.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-400 text-xs italic">
                  No orders at this stage
                </div>
              ) : (
                col.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span>{item.piNo || 'PI-PENDING'}</span>
                      <span>{item.piDate}</span>
                    </div>

                    <h5
                      onClick={() => onOpenDetails(item)}
                      className="font-semibold text-slate-900 cursor-pointer hover:text-emerald-700 line-clamp-2 leading-tight"
                    >
                      {item.item}
                    </h5>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {item.currency} {item.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.termOfDelivery} · {item.termOfPayment}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {item.supplier}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {item.bank}
                    </div>

                    {/* Progress Pills */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono ${
                          item.milestones.fx_approval.isCompleted
                            ? 'bg-emerald-100 text-emerald-800 font-semibold'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        FX {item.milestones.fx_approval.isCompleted ? '✓' : '...'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono ${
                          item.milestones.insurance.isCompleted
                            ? 'bg-emerald-100 text-emerald-800 font-semibold'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        INS {item.milestones.insurance.isCompleted ? '✓' : '...'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono ${
                          item.milestones.bank_permit.isCompleted
                            ? 'bg-emerald-100 text-emerald-800 font-semibold'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        PERMIT {item.milestones.bank_permit.isCompleted ? '✓' : '...'}
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenDetails(item)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {col.actionMilestone && (
                        <button
                          onClick={() =>
                            onUpdateMilestone(item, col.actionMilestone!, true)
                          }
                          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          <span>{col.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
