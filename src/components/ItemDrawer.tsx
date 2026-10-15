import React, { useState } from 'react';
import { ImportItem, MilestoneId } from '../utils/trackerLogic';
import {
  X,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Landmark,
  FileText,
  Clock,
  Save,
  Check,
} from 'lucide-react';

interface ItemDrawerProps {
  item: ImportItem | null;
  onClose: () => void;
  onUpdateItem: (updatedItem: ImportItem) => void;
}

export const ItemDrawer: React.FC<ItemDrawerProps> = ({
  item,
  onClose,
  onUpdateItem,
}) => {
  if (!item) return null;

  const [formData, setFormData] = useState<ImportItem>({ ...item });
  const [savedNotification, setSavedNotification] = useState(false);

  const handleMilestoneToggle = (milestoneId: MilestoneId) => {
    const current = formData.milestones[milestoneId];
    const willBeCompleted = !current.isCompleted;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    const updatedMilestone = {
      ...current,
      isCompleted: willBeCompleted,
      completedDate: willBeCompleted ? current.completedDate || dateStr : null,
    };

    const updatedMilestones = {
      ...formData.milestones,
      [milestoneId]: updatedMilestone,
    };

    setFormData({
      ...formData,
      milestones: updatedMilestones,
    });
  };

  const handleSave = () => {
    onUpdateItem(formData);
    setSavedNotification(true);
    setTimeout(() => {
      setSavedNotification(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-semibold">
                {formData.piNo || 'PI-DRAFT'}
              </span>
              <span className="text-xs text-slate-500">· {formData.piDate}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">
              {formData.item || 'Import Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Key Overview */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Value</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formData.currency} {formData.totalAmount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Quantity</span>
              <span className="font-medium text-slate-800">{formData.quantity}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Supplier</span>
              <span className="font-medium text-slate-800 truncate block">{formData.supplier}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Bank</span>
              <span className="font-medium text-slate-800 truncate block">{formData.bank}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Delivery / Payment</span>
              <span className="font-medium text-slate-800">
                {formData.termOfDelivery} · {formData.termOfPayment}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Route</span>
              <span className="font-medium text-slate-800">
                {formData.voyageFrom} &rarr; {formData.voyageTo}
              </span>
            </div>
          </div>

          {/* Operational Milestones Manager */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">
              Follow-Up Milestone Tracking
            </h4>

            <div className="space-y-4">
              {/* Milestone 1: Foreign currency approval */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  formData.milestones.fx_approval.isCompleted
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-blue-200 bg-blue-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        1. Foreign Currency Approval
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Central Bank / Commercial Bank FX Allocation
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMilestoneToggle('fx_approval')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      formData.milestones.fx_approval.isCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white border border-blue-300 text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    {formData.milestones.fx_approval.isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <span>Mark Finished</span>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/70">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Finished Date
                    </label>
                    <input
                      type="date"
                      value={formData.milestones.fx_approval.completedDate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milestones: {
                            ...formData.milestones,
                            fx_approval: {
                              ...formData.milestones.fx_approval,
                              completedDate: e.target.value,
                              isCompleted: Boolean(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      FX Reference / Queue #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FX-NBE-88291"
                      value={formData.milestones.fx_approval.referenceNo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milestones: {
                            ...formData.milestones,
                            fx_approval: {
                              ...formData.milestones.fx_approval,
                              referenceNo: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Approval Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Priority list approval from CBE Head Office"
                    value={formData.milestones.fx_approval.notes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        milestones: {
                          ...formData.milestones,
                          fx_approval: {
                            ...formData.milestones.fx_approval,
                            notes: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
              </div>

              {/* Milestone 2: Insurance */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  formData.milestones.insurance.isCompleted
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        2. Marine Insurance Policy
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Cargo Marine Insurance Certificate Cover
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMilestoneToggle('insurance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      formData.milestones.insurance.isCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    {formData.milestones.insurance.isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <span>Mark Finished</span>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/70">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Finished Date
                    </label>
                    <input
                      type="date"
                      value={formData.milestones.insurance.completedDate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milestones: {
                            ...formData.milestones,
                            insurance: {
                              ...formData.milestones.insurance,
                              completedDate: e.target.value,
                              isCompleted: Boolean(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Policy # / Insurer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. POL-NIC-44910-MAR"
                      value={formData.milestones.insurance.referenceNo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milestones: {
                            ...formData.milestones,
                            insurance: {
                              ...formData.milestones.insurance,
                              referenceNo: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Insurance Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. All risks cargo clause, premium paid"
                    value={formData.milestones.insurance.notes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        milestones: {
                          ...formData.milestones,
                          insurance: {
                            ...formData.milestones.insurance,
                            notes: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
              </div>

              {/* Milestone 3: Bank Permit */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  formData.milestones.bank_permit.isCompleted
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-purple-200 bg-purple-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        3. Commercial Bank Permit / LC
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Import Permit Issued, LC Opened or CAD Approved
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMilestoneToggle('bank_permit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      formData.milestones.bank_permit.isCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white border border-purple-300 text-purple-800 hover:bg-purple-50'
                    }`}
                  >
                    {formData.milestones.bank_permit.isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <span>Mark Finished</span>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/70">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Finished Date
                    </label>
                    <input
                      type="date"
                      value={formData.milestones.bank_permit.completedDate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milestones: {
                            ...formData.milestones,
                            bank_permit: {
                              ...formData.milestones.bank_permit,
                              completedDate: e.target.value,
                              isCompleted: Boolean(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Import Permit # / LC Ref
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. IMP-PERMIT-2026-551"
                      value={formData.milestones.bank_permit.referenceNo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milestones: {
                            ...formData.milestones,
                            bank_permit: {
                              ...formData.milestones.bank_permit,
                              referenceNo: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Bank Permit Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dispatched via SWIFT MT700 to supplier bank"
                    value={formData.milestones.bank_permit.notes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        milestones: {
                          ...formData.milestones,
                          bank_permit: {
                            ...formData.milestones.bank_permit,
                            notes: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {savedNotification ? 'Changes saved!' : 'Review and update milestone records'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Update</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
