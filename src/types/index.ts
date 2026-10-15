import { ImportItem, Milestone, MilestoneId } from '../utils/trackerLogic';

export type { ImportItem, Milestone, MilestoneId };

export type ViewMode = 'spreadsheet' | 'cards' | 'kanban';

export type StatusFilter = 'all' | 'fx_pending' | 'insurance_pending' | 'bank_permit_pending' | 'completed';

export interface FilterOptions {
  searchQuery: string;
  statusFilter: StatusFilter;
  bankFilter: string;
  supplierFilter: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'item_asc';
}

export const COMMON_BANKS = [
  'Commercial Bank of Ethiopia (CBE)',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Nib International Bank',
  'Zemen Bank',
  'Cooperative Bank of Oromia',
  'United Bank (Hibret Bank)',
  'Lion International Bank',
  'Wegagen Bank',
  'Other Commercial Bank',
];

export const COMMON_DELIVERY_TERMS = [
  'FOB (Free On Board)',
  'CFR (Cost and Freight)',
  'CIF (Cost, Insurance & Freight)',
  'EXW (Ex Works)',
  'FCA (Free Carrier)',
  'CPT (Carriage Paid To)',
  'CIP (Carriage & Insurance Paid)',
  'DAP (Delivered at Place)',
  'DDP (Delivered Duty Paid)',
];

export const COMMON_PAYMENT_TERMS = [
  'LC at Sight',
  'CAD (Cash Against Documents)',
  'Usance LC (30/60/90 Days)',
  'Advance TT',
  'Revolving LC',
  'Open Account',
];

export const COMMON_PORTS = [
  'Djibouti Port',
  'Modjo Dry Port',
  'Kality Customs (Addis Ababa)',
  'Semera Dry Port',
  'Berbera Port',
  'Mombasa Port',
  'Port Sudan',
];

export const COMMON_ORIGINS = [
  'Shanghai, China',
  'Ningbo, China',
  'Qingdao, China',
  'Mumbai / Nhava Sheva, India',
  'Hamburg, Germany',
  'Istanbul, Turkey',
  'Jebel Ali / Dubai, UAE',
  'Antwerp, Belgium',
  'Busan, South Korea',
];
