import React, { useState } from 'react';
import { ImportItem, exportToCSV, exportToGoogleSheetsTSV } from '../utils/trackerLogic';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Sparkles,
  Info,
  X,
} from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ImportItem[];
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  // 1. Download as XLSX (Google Sheets & Excel native format)
  const handleDownloadXLSX = () => {
    const formattedData = items.map((i, idx) => ({
      'Row #': idx + 1,
      'Item Description': i.item,
      'Quantity': i.quantity,
      'Total Amount': i.totalAmount,
      'Currency': i.currency,
      'Supplier': i.supplier,
      'Term of Delivery': i.termOfDelivery,
      'Term of Payment': i.termOfPayment,
      'Bank': i.bank,
      'Voyage From': i.voyageFrom,
      'Voyage To': i.voyageTo,
      'FX Approval Status': i.milestones.fx_approval.isCompleted ? 'APPROVED' : 'PENDING',
      'FX Approval Date': i.milestones.fx_approval.completedDate || '',
      'FX Reference / Notes': i.milestones.fx_approval.referenceNo || i.milestones.fx_approval.notes || '',
      'Insurance Status': i.milestones.insurance.isCompleted ? 'POLICY ISSUED' : 'PENDING',
      'Insurance Date Finished': i.milestones.insurance.completedDate || '',
      'Insurance Policy #': i.milestones.insurance.referenceNo || '',
      'Bank Permit Status': i.milestones.bank_permit.isCompleted ? 'PERMIT ISSUED' : 'PENDING',
      'Bank Permit Date Finished': i.milestones.bank_permit.completedDate || '',
      'Bank Permit # / LC Ref': i.milestones.bank_permit.referenceNo || '',
      'Overall Status': i.overallStatus,
      'PI Number': i.piNo,
      'PI Date': i.piDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Set custom column widths for readability
    worksheet['!cols'] = [
      { wch: 6 },  // Row #
      { wch: 32 }, // Item
      { wch: 14 }, // Quantity
      { wch: 15 }, // Total Amount
      { wch: 10 }, // Currency
      { wch: 28 }, // Supplier
      { wch: 16 }, // Delivery
      { wch: 18 }, // Payment
      { wch: 26 }, // Bank
      { wch: 18 }, // Voyage From
      { wch: 18 }, // Voyage To
      { wch: 18 }, // FX Status
      { wch: 16 }, // FX Date
      { wch: 22 }, // FX Ref
      { wch: 18 }, // Insurance Status
      { wch: 16 }, // Insurance Date
      { wch: 20 }, // Insurance Policy
      { wch: 18 }, // Bank Permit Status
      { wch: 16 }, // Bank Permit Date
      { wch: 20 }, // Bank Permit Ref
      { wch: 20 }, // Overall Status
      { wch: 16 }, // PI No
      { wch: 14 }, // PI Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Follow-Up');

    XLSX.writeFile(workbook, `Import_Operation_FollowUp_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // 2. Download CSV
  const handleDownloadCSV = () => {
    const csvContent = exportToCSV(items);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Import_FollowUp_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Copy Google Sheets TSV directly to clipboard
  const handleCopyTSV = () => {
    const tsvContent = exportToGoogleSheetsTSV(items);
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2500);
    });
  };

  const googleAppsScriptCode = `/**
 * Google Apps Script for Auto-Timestamping & Milestone Auto-Fill
 * Paste this in Extensions > Apps Script in your Google Sheet!
 */
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();

  // If user edits column A (Item), automatically set default milestone stages if empty
  if (col === 1 && row > 1) {
    var itemVal = range.getValue();
    if (itemVal !== "") {
      // Set default milestones in Columns L, N, P if blank
      if (sheet.getRange(row, 12).getValue() === "") sheet.getRange(row, 12).setValue("Foreign currency approval");
      if (sheet.getRange(row, 14).getValue() === "") sheet.getRange(row, 14).setValue("Insurance");
      if (sheet.getRange(row, 16).getValue() === "") sheet.getRange(row, 16).setValue("Bank Permit");
    }
  }

  // When marking Foreign Currency Approval (Col 12 checkmark)
  if (col === 12 && row > 1 && range.getValue() === true) {
    sheet.getRange(row, 13).setValue(new Date()); // Column M gets timestamp
  }
  // When marking Insurance (Col 14 checkmark)
  if (col === 14 && row > 1 && range.getValue() === true) {
    sheet.getRange(row, 15).setValue(new Date()); // Column O gets timestamp
  }
  // When marking Bank Permit (Col 16 checkmark)
  if (col === 16 && row > 1 && range.getValue() === true) {
    sheet.getRange(row, 17).setValue(new Date()); // Column Q gets timestamp
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Google Sheets Export & Automation
              </h3>
              <p className="text-xs text-slate-500">
                Turn your tracker into a live Google Sheet or download formatted Excel spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Action 1: Instant Download & Copy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Download XLSX */}
            <button
              onClick={handleDownloadXLSX}
              className="flex flex-col items-center justify-center p-4 border-2 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/50 rounded-xl transition-all text-center group"
            >
              <Download className="w-6 h-6 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-emerald-950">Download .XLSX</span>
              <span className="text-[11px] text-emerald-800 mt-0.5">
                Opens directly in Google Sheets & Excel with all columns
              </span>
            </button>

            {/* Copy TSV for Google Sheets */}
            <button
              onClick={handleCopyTSV}
              className="flex flex-col items-center justify-center p-4 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-center group"
            >
              {copiedTsv ? (
                <Check className="w-6 h-6 text-emerald-600 mb-2" />
              ) : (
                <Copy className="w-6 h-6 text-slate-700 mb-2 group-hover:scale-110 transition-transform" />
              )}
              <span className="font-bold text-xs text-slate-900">
                {copiedTsv ? 'Copied to Clipboard!' : '1-Click Paste for Sheets'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Copy tab-delimited data to paste into docs.google.com
              </span>
            </button>

            {/* Download CSV */}
            <button
              onClick={handleDownloadCSV}
              className="flex flex-col items-center justify-center p-4 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-center group"
            >
              <FileSpreadsheet className="w-6 h-6 text-slate-700 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-slate-900">Download .CSV</span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Universal raw data table for any spreadsheet app
              </span>
            </button>
          </div>

          {/* Quick link to Google Sheets */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-emerald-950">
                How to open in Google Sheets:
              </h4>
              <p className="text-xs text-emerald-900/80 mt-0.5">
                1. Click "Download .XLSX" above. <br />
                2. Open Google Drive (drive.google.com) and click <strong>New &gt; File upload</strong>. <br />
                3. Double-click to open as a full Google Sheet with all milestone columns preserved!
              </p>
            </div>
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shrink-0 whitespace-nowrap shadow-xs ml-4"
            >
              <span>Open blank sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* User request: "and also when i enter a new item down the row the sheet by it self shoulde write the Foreign currency approval, Insurance, Bank Permit down as i enter an item" */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600" />
                Native Google Sheet Formulas & Apps Script (Optional)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(googleAppsScriptCode);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
              >
                {copiedScript ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedScript ? 'Script Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Inside Google Sheets, you can also use simple formulas so when you type an Item in Column A, the sheet automatically writes the 3 milestones:
            </p>
            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[11px] font-mono select-all overflow-x-auto mb-2">
              =IF(ISBLANK(A2), "", "Foreign currency approval")
            </div>
            <p className="text-[11px] text-slate-500">
              Or paste the provided Apps Script into <strong>Extensions &gt; Apps Script</strong> in your Google Sheet for automatic real-time timestamps whenever you tick the Insurance or Bank Permit checkboxes!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
