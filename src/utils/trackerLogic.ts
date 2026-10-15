export type MilestoneId = 'fx_approval' | 'insurance' | 'bank_permit';

export interface Milestone {
  id: MilestoneId;
  name: string;
  isCompleted: boolean;
  completedDate: string | null; // YYYY-MM-DD
  referenceNo?: string; // Policy No, FX ID, Permit No
  notes?: string;
}

export interface ImportItem {
  id: string;
  item: string;
  quantity: string;
  totalAmount: number;
  currency: string; // USD, EUR, GBP, CNY, etc.
  supplier: string;
  termOfDelivery: string; // FOB, CIF, CFR, EXW, FCA, CPT, CIP, DAP, DDP
  termOfPayment: string; // LC at Sight, Usance LC, CAD, Advance TT, Open Account
  bank: string;
  voyageFrom: string;
  voyageTo: string;
  piNo: string;
  piDate: string; // YYYY-MM-DD
  milestones: {
    fx_approval: Milestone;
    insurance: Milestone;
    bank_permit: Milestone;
  };
  overallStatus?: string;
  createdAt: string;
}

export const DEFAULT_MILESTONES: Record<MilestoneId, { name: string }> = {
  fx_approval: { name: 'Foreign currency approval' },
  insurance: { name: 'Insurance' },
  bank_permit: { name: 'Bank Permit' },
};

/**
 * Returns today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Creates a brand new import row with the three mandatory milestone stages
 * pre-populated (Foreign currency approval, Insurance, Bank Permit)
 */
export function createNewImportItem(
  overrides?: Partial<Omit<ImportItem, 'id' | 'milestones' | 'createdAt'>> & {
    milestones?: Partial<ImportItem['milestones']>;
  }
): ImportItem {
  const today = getTodayDateString();
  const id = 'imp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

  const fxMilestone: Milestone = {
    id: 'fx_approval',
    name: 'Foreign currency approval',
    isCompleted: overrides?.milestones?.fx_approval?.isCompleted ?? false,
    completedDate: overrides?.milestones?.fx_approval?.completedDate ?? null,
    referenceNo: overrides?.milestones?.fx_approval?.referenceNo ?? '',
    notes: overrides?.milestones?.fx_approval?.notes ?? '',
  };

  const insuranceMilestone: Milestone = {
    id: 'insurance',
    name: 'Insurance',
    isCompleted: overrides?.milestones?.insurance?.isCompleted ?? false,
    completedDate: overrides?.milestones?.insurance?.completedDate ?? null,
    referenceNo: overrides?.milestones?.insurance?.referenceNo ?? '',
    notes: overrides?.milestones?.insurance?.notes ?? '',
  };

  const bankPermitMilestone: Milestone = {
    id: 'bank_permit',
    name: 'Bank Permit',
    isCompleted: overrides?.milestones?.bank_permit?.isCompleted ?? false,
    completedDate: overrides?.milestones?.bank_permit?.completedDate ?? null,
    referenceNo: overrides?.milestones?.bank_permit?.referenceNo ?? '',
    notes: overrides?.milestones?.bank_permit?.notes ?? '',
  };

  const item: ImportItem = {
    id,
    item: overrides?.item ?? '',
    quantity: overrides?.quantity ?? '',
    totalAmount: overrides?.totalAmount ?? 0,
    currency: overrides?.currency ?? 'USD',
    supplier: overrides?.supplier ?? '',
    termOfDelivery: overrides?.termOfDelivery ?? 'FOB',
    termOfPayment: overrides?.termOfPayment ?? 'LC at Sight',
    bank: overrides?.bank ?? 'Commercial Bank of Ethiopia',
    voyageFrom: overrides?.voyageFrom ?? '',
    voyageTo: overrides?.voyageTo ?? 'Djibouti Port',
    piNo: overrides?.piNo ?? '',
    piDate: overrides?.piDate ?? today,
    milestones: {
      fx_approval: fxMilestone,
      insurance: insuranceMilestone,
      bank_permit: bankPermitMilestone,
    },
    createdAt: new Date().toISOString(),
  };

  item.overallStatus = calculateOverallStatus(item.milestones);
  return item;
}

/**
 * Toggles or updates milestone completion and timestamps the date finished
 */
export function updateMilestone(
  item: ImportItem,
  milestoneId: MilestoneId,
  isCompleted: boolean,
  completedDate?: string | null,
  referenceNo?: string,
  notes?: string
): ImportItem {
  const current = item.milestones[milestoneId];
  const finalDate = isCompleted
    ? completedDate || current.completedDate || getTodayDateString()
    : null;

  const updatedMilestone: Milestone = {
    ...current,
    isCompleted,
    completedDate: finalDate,
    referenceNo: referenceNo !== undefined ? referenceNo : current.referenceNo,
    notes: notes !== undefined ? notes : current.notes,
  };

  const updatedMilestones = {
    ...item.milestones,
    [milestoneId]: updatedMilestone,
  };

  return {
    ...item,
    milestones: updatedMilestones,
    overallStatus: calculateOverallStatus(updatedMilestones),
  };
}

/**
 * Derives overall stage status from the three milestone statuses
 */
export function calculateOverallStatus(milestones: ImportItem['milestones']): string {
  const { fx_approval, insurance, bank_permit } = milestones;

  if (fx_approval.isCompleted && insurance.isCompleted && bank_permit.isCompleted) {
    return 'Permit Approved';
  }

  if (fx_approval.isCompleted && insurance.isCompleted && !bank_permit.isCompleted) {
    return 'Bank Permit Pending';
  }

  if (fx_approval.isCompleted && !insurance.isCompleted) {
    return 'Insurance Pending';
  }

  if (!fx_approval.isCompleted) {
    return 'FX Approval Pending';
  }

  return 'In Progress';
}

/**
 * Computes summary KPIs
 */
export interface SummaryStats {
  totalItems: number;
  totalAmountsByCurrency: Record<string, number>;
  pendingFxCount: number;
  pendingInsuranceCount: number;
  pendingBankPermitCount: number;
  fullyApprovedCount: number;
}

export function calculateSummaryStats(items: ImportItem[]): SummaryStats {
  const stats: SummaryStats = {
    totalItems: items.length,
    totalAmountsByCurrency: {},
    pendingFxCount: 0,
    pendingInsuranceCount: 0,
    pendingBankPermitCount: 0,
    fullyApprovedCount: 0,
  };

  for (const item of items) {
    const curr = item.currency || 'USD';
    stats.totalAmountsByCurrency[curr] = (stats.totalAmountsByCurrency[curr] || 0) + (Number(item.totalAmount) || 0);

    const fxDone = item.milestones.fx_approval.isCompleted;
    const insDone = item.milestones.insurance.isCompleted;
    const bpDone = item.milestones.bank_permit.isCompleted;

    if (!fxDone) stats.pendingFxCount++;
    if (!insDone) stats.pendingInsuranceCount++;
    if (!bpDone) stats.pendingBankPermitCount++;
    if (fxDone && insDone && bpDone) stats.fullyApprovedCount++;
  }

  return stats;
}

/**
 * Format milestone column value in spreadsheet representation
 */
export function formatMilestoneStatusCell(milestone: Milestone): string {
  if (milestone.isCompleted) {
    return `[COMPLETED] ${milestone.completedDate || ''}`;
  }
  return '[PENDING]';
}

/**
 * Export data to standard CSV
 */
export function exportToCSV(items: ImportItem[]): string {
  const headers = [
    'Item',
    'Quantity',
    'Total Amount',
    'Currency',
    'Supplier',
    'Term of Delivery',
    'Term of Payment',
    'Bank',
    'Voyage From',
    'Voyage To',
    'Overall Status',
    'Foreign Currency Approval',
    'FX Date Finished',
    'Insurance',
    'Insurance Date Finished',
    'Bank Permit',
    'Bank Permit Date Finished',
    'PI No',
    'PI Date',
  ];

  const rows = items.map((i) => [
    `"${(i.item || '').replace(/"/g, '""')}"`,
    `"${(i.quantity || '').replace(/"/g, '""')}"`,
    i.totalAmount,
    `"${i.currency}"`,
    `"${(i.supplier || '').replace(/"/g, '""')}"`,
    `"${i.termOfDelivery}"`,
    `"${i.termOfPayment}"`,
    `"${(i.bank || '').replace(/"/g, '""')}"`,
    `"${(i.voyageFrom || '').replace(/"/g, '""')}"`,
    `"${(i.voyageTo || '').replace(/"/g, '""')}"`,
    `"${i.overallStatus || ''}"`,
    i.milestones.fx_approval.isCompleted ? '"Done"' : '"Pending"',
    `"${i.milestones.fx_approval.completedDate || ''}"`,
    i.milestones.insurance.isCompleted ? '"Done"' : '"Pending"',
    `"${i.milestones.insurance.completedDate || ''}"`,
    i.milestones.bank_permit.isCompleted ? '"Done"' : '"Pending"',
    `"${i.milestones.bank_permit.completedDate || ''}"`,
    `"${(i.piNo || '').replace(/"/g, '""')}"`,
    `"${i.piDate || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Export data to Google Sheets formatted Tab-Separated Values (TSV)
 * for instant 1-click clipboard paste directly into Google Sheets!
 */
export function exportToGoogleSheetsTSV(items: ImportItem[]): string {
  const headers = [
    'Item',
    'Quantity',
    'Total Amount',
    'Currency',
    'Supplier',
    'Term of Delivery',
    'Term of Payment',
    'Bank',
    'Voyage From',
    'Voyage To',
    'Overall Status',
    'Foreign currency approval',
    'FX Date',
    'Insurance',
    'Insurance Date',
    'Bank Permit',
    'Bank Permit Date',
    'PI No',
    'PI Date',
  ];

  const rows = items.map((i) => [
    i.item || '',
    i.quantity || '',
    i.totalAmount || 0,
    i.currency || 'USD',
    i.supplier || '',
    i.termOfDelivery || '',
    i.termOfPayment || '',
    i.bank || '',
    i.voyageFrom || '',
    i.voyageTo || '',
    i.overallStatus || '',
    i.milestones.fx_approval.isCompleted ? 'TRUE' : 'FALSE',
    i.milestones.fx_approval.completedDate || '',
    i.milestones.insurance.isCompleted ? 'TRUE' : 'FALSE',
    i.milestones.insurance.completedDate || '',
    i.milestones.bank_permit.isCompleted ? 'TRUE' : 'FALSE',
    i.milestones.bank_permit.completedDate || '',
    i.piNo || '',
    i.piDate || '',
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}
