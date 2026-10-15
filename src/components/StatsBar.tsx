import React from 'react';
import { SummaryStats } from '../utils/trackerLogic';
import { CheckCircle2, Clock, Landmark, ShieldCheck, DollarSign } from 'lucide-react';

interface StatsBarProps {
  stats: SummaryStats;
  onFilterClick?: (status: string) => void;
  activeFilter?: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, onFilterClick, activeFilter }) => {
  const usdTotal = stats.totalAmountsByCurrency['USD'] || 0;
  const eurTotal = stats.totalAmountsByCurrency['EUR'] || 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
      {/* Total Active Operations */}
      <div
        onClick={() => onFilterClick && onFilterClick('all')}
        className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
          activeFilter === 'all'
            ? 'border-slate-800 ring-2 ring-slate-800/10 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1 gap-2">
          <span className="font-medium">Total Import PIs</span>
          <span className="font-mono tabular-nums text-slate-700 font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-[11px] whitespace-nowrap">
            {stats.totalItems} Active
          </span>
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-slate-900 leading-tight">
          {formatCurrency(usdTotal)}
        </div>
        {eurTotal > 0 && (
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            + €{eurTotal.toLocaleString()} EUR
          </div>
        )}
      </div>

      {/* Stage 1: Foreign Currency Approval */}
      <div
        onClick={() => onFilterClick && onFilterClick('fx_pending')}
        className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
          activeFilter === 'fx_pending'
            ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
            : 'border-blue-100 hover:border-blue-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-blue-900 mb-1">
          <span className="font-semibold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            1. FX Approval
          </span>
          <span className="font-mono tabular-nums text-blue-700 text-xs">
            {stats.totalItems - stats.pendingFxCount}/{stats.totalItems}
          </span>
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-blue-950 leading-tight">
          {stats.pendingFxCount}
          <span className="text-xs font-normal text-blue-700 ml-1.5">Pending</span>
        </div>
        <div className="text-xs text-blue-600/80 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>{stats.totalItems - stats.pendingFxCount} Approved by Bank</span>
        </div>
      </div>

      {/* Stage 2: Insurance */}
      <div
        onClick={() => onFilterClick && onFilterClick('insurance_pending')}
        className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
          activeFilter === 'insurance_pending'
            ? 'border-amber-600 ring-2 ring-amber-600/10 shadow-xs'
            : 'border-amber-100 hover:border-amber-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
          <span className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            2. Marine Insurance
          </span>
          <span className="font-mono tabular-nums text-amber-700 text-xs">
            {stats.totalItems - stats.pendingInsuranceCount}/{stats.totalItems}
          </span>
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-amber-950 leading-tight">
          {stats.pendingInsuranceCount}
          <span className="text-xs font-normal text-amber-700 ml-1.5">Pending</span>
        </div>
        <div className="text-xs text-amber-600/80 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>{stats.totalItems - stats.pendingInsuranceCount} Policies Issued</span>
        </div>
      </div>

      {/* Stage 3: Bank Permit */}
      <div
        onClick={() => onFilterClick && onFilterClick('bank_permit_pending')}
        className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
          activeFilter === 'bank_permit_pending'
            ? 'border-purple-600 ring-2 ring-purple-600/10 shadow-xs'
            : 'border-purple-100 hover:border-purple-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-purple-900 mb-1">
          <span className="font-semibold flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-purple-600" />
            3. Bank Permit / LC
          </span>
          <span className="font-mono tabular-nums text-purple-700 text-xs">
            {stats.totalItems - stats.pendingBankPermitCount}/{stats.totalItems}
          </span>
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-purple-950 leading-tight">
          {stats.pendingBankPermitCount}
          <span className="text-xs font-normal text-purple-700 ml-1.5">Pending</span>
        </div>
        <div className="text-xs text-purple-600/80 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          <span>{stats.totalItems - stats.pendingBankPermitCount} Permits Ready</span>
        </div>
      </div>

      {/* Fully Cleared / Ready */}
      <div
        onClick={() => onFilterClick && onFilterClick('completed')}
        className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
          activeFilter === 'completed'
            ? 'border-emerald-600 ring-2 ring-emerald-600/10 shadow-xs'
            : 'border-emerald-100 hover:border-emerald-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-emerald-900 mb-1">
          <span className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Permits Complete
          </span>
          <span className="font-mono tabular-nums text-emerald-700 text-xs">
            {Math.round((stats.fullyApprovedCount / (stats.totalItems || 1)) * 100)}%
          </span>
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-emerald-900 leading-tight">
          {stats.fullyApprovedCount}
          <span className="text-xs font-normal text-emerald-700 ml-1.5">Ready to Ship</span>
        </div>
        <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>All 3 Milestones Done</span>
        </div>
      </div>
    </div>
  );
};
