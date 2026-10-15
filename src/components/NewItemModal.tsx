import React, { useState } from 'react';
import {
  ImportItem,
  COMMON_BANKS,
  COMMON_DELIVERY_TERMS,
  COMMON_PAYMENT_TERMS,
  COMMON_PORTS,
  COMMON_ORIGINS,
} from '../types';
import { createNewImportItem, getTodayDateString } from '../utils/trackerLogic';
import { X, Plus, ShieldCheck, DollarSign, Landmark, Check } from 'lucide-react';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: ImportItem) => void;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const today = getTodayDateString();

  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    totalAmount: '',
    currency: 'USD',
    supplier: '',
    termOfDelivery: 'FOB',
    termOfPayment: 'LC at Sight',
    bank: COMMON_BANKS[0],
    voyageFrom: COMMON_ORIGINS[0],
    voyageTo: COMMON_PORTS[0],
    piNo: '',
    piDate: today,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.item.trim()) newErrors.item = 'Item description is required';
    if (!formData.supplier.trim()) newErrors.supplier = 'Supplier name is required';
    if (!formData.totalAmount || isNaN(Number(formData.totalAmount))) {
      newErrors.totalAmount = 'Valid total amount is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newItem = createNewImportItem({
      item: formData.item.trim(),
      quantity: formData.quantity.trim() || '1 Lot',
      totalAmount: parseFloat(formData.totalAmount) || 0,
      currency: formData.currency,
      supplier: formData.supplier.trim(),
      termOfDelivery: formData.termOfDelivery,
      termOfPayment: formData.termOfPayment,
      bank: formData.bank,
      voyageFrom: formData.voyageFrom,
      voyageTo: formData.voyageTo,
      piNo: formData.piNo.trim() || `PI-${Date.now().toString().slice(-6)}`,
      piDate: formData.piDate || today,
    });

    onAddItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Add New Import Operation
            </h3>
            <p className="text-xs text-slate-500">
              Enter Proforma Invoice (PI) details. Foreign currency approval, Insurance, and Bank Permit are automatically generated.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Item Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Item Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Industrial Centrifugal Water Pumps 7.5kW"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg outline-none text-xs ${
                errors.item ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
              }`}
            />
            {errors.item && <p className="text-rose-600 text-[11px] mt-0.5">{errors.item}</p>}
          </div>

          {/* Quantity & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="text"
                placeholder="e.g. 500 MT or 120 Units"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Total Amount <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 48500"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg outline-none text-xs font-mono ${
                  errors.totalAmount ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                }`}
              />
              {errors.totalAmount && <p className="text-rose-600 text-[11px] mt-0.5">{errors.totalAmount}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs bg-white focus:border-emerald-500 font-mono"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="AED">AED</option>
              </select>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supplier / Manufacturer <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Zhejiang Leo Pump Industry Co., Ltd"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg outline-none text-xs ${
                errors.supplier ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
              }`}
            />
            {errors.supplier && <p className="text-rose-600 text-[11px] mt-0.5">{errors.supplier}</p>}
          </div>

          {/* Delivery & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Term of Delivery (Incoterm)</label>
              <select
                value={formData.termOfDelivery}
                onChange={(e) => setFormData({ ...formData, termOfDelivery: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs bg-white focus:border-emerald-500"
              >
                {COMMON_DELIVERY_TERMS.map((term) => (
                  <option key={term} value={term.split(' ')[0]}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Term of Payment</label>
              <select
                value={formData.termOfPayment}
                onChange={(e) => setFormData({ ...formData, termOfPayment: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs bg-white focus:border-emerald-500"
              >
                {COMMON_PAYMENT_TERMS.map((pay) => (
                  <option key={pay} value={pay}>
                    {pay}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bank */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Commercial Bank</label>
            <select
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs bg-white focus:border-emerald-500"
            >
              {COMMON_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Voyage From & To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Voyage From (Origin Port)</label>
              <input
                type="text"
                list="origin-options"
                placeholder="e.g. Ningbo, China"
                value={formData.voyageFrom}
                onChange={(e) => setFormData({ ...formData, voyageFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs focus:border-emerald-500"
              />
              <datalist id="origin-options">
                {COMMON_ORIGINS.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Voyage To (Destination)</label>
              <input
                type="text"
                list="port-options"
                placeholder="e.g. Djibouti Port"
                value={formData.voyageTo}
                onChange={(e) => setFormData({ ...formData, voyageTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs focus:border-emerald-500"
              />
              <datalist id="port-options">
                {COMMON_PORTS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* PI No & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Proforma Invoice (PI) No</label>
              <input
                type="text"
                placeholder="e.g. PI-2026-884"
                value={formData.piNo}
                onChange={(e) => setFormData({ ...formData, piNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs font-mono focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">PI Date</label>
              <input
                type="date"
                value={formData.piDate}
                onChange={(e) => setFormData({ ...formData, piDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs font-mono focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Automated Milestones Info Preview */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <span className="font-semibold text-emerald-950 block mb-1">
              Automated Milestones Ready:
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-1.5 bg-white border border-blue-200 rounded text-blue-900 font-medium">
                1. Foreign Currency Approval
              </div>
              <div className="p-1.5 bg-white border border-amber-200 rounded text-amber-900 font-medium">
                2. Marine Insurance
              </div>
              <div className="p-1.5 bg-white border border-purple-200 rounded text-purple-900 font-medium">
                3. Bank Permit
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
            >
              Insert Item & Create Milestones
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
