import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNewImportItem,
  updateMilestone,
  calculateOverallStatus,
  calculateSummaryStats,
  exportToCSV,
  exportToGoogleSheetsTSV,
} from './trackerLogic.ts';

test('createNewImportItem populates mandatory 3 milestone stages automatically', () => {
  const item = createNewImportItem({
    item: 'Centrifugal Water Pumps',
    supplier: 'Apex Heavy Machinery Ltd',
    totalAmount: 48500,
    currency: 'USD',
  });

  assert.equal(item.item, 'Centrifugal Water Pumps');
  assert.equal(item.supplier, 'Apex Heavy Machinery Ltd');
  assert.equal(item.totalAmount, 48500);

  // Check the 3 mandatory milestone stages requested by user
  assert.ok(item.milestones.fx_approval, 'FX approval milestone must exist');
  assert.equal(item.milestones.fx_approval.name, 'Foreign currency approval');
  assert.equal(item.milestones.fx_approval.isCompleted, false);
  assert.equal(item.milestones.fx_approval.completedDate, null);

  assert.ok(item.milestones.insurance, 'Insurance milestone must exist');
  assert.equal(item.milestones.insurance.name, 'Insurance');
  assert.equal(item.milestones.insurance.isCompleted, false);
  assert.equal(item.milestones.insurance.completedDate, null);

  assert.ok(item.milestones.bank_permit, 'Bank Permit milestone must exist');
  assert.equal(item.milestones.bank_permit.name, 'Bank Permit');
  assert.equal(item.milestones.bank_permit.isCompleted, false);
  assert.equal(item.milestones.bank_permit.completedDate, null);

  assert.equal(item.overallStatus, 'FX Approval Pending');
});

test('updateMilestone finishes Insurance and sets completion date', () => {
  const initialItem = createNewImportItem({
    item: 'Agricultural Tractors',
    totalAmount: 120000,
  });

  // Finish insurance on 2026-10-15
  const updatedItem = updateMilestone(
    initialItem,
    'insurance',
    true,
    '2026-10-15',
    'POL-992384-MAR',
    'Marine all risks policy issued'
  );

  assert.equal(updatedItem.milestones.insurance.isCompleted, true);
  assert.equal(updatedItem.milestones.insurance.completedDate, '2026-10-15');
  assert.equal(updatedItem.milestones.insurance.referenceNo, 'POL-992384-MAR');

  // If unmarking milestone, completedDate resets to null
  const resetItem = updateMilestone(updatedItem, 'insurance', false);
  assert.equal(resetItem.milestones.insurance.isCompleted, false);
  assert.equal(resetItem.milestones.insurance.completedDate, null);
});

test('calculateOverallStatus reflects correct milestone progression', () => {
  const item = createNewImportItem();

  // 1. Initial state
  assert.equal(calculateOverallStatus(item.milestones), 'FX Approval Pending');

  // 2. FX Approved
  const step1 = updateMilestone(item, 'fx_approval', true, '2026-10-10');
  assert.equal(step1.overallStatus, 'Insurance Pending');

  // 3. Insurance done
  const step2 = updateMilestone(step1, 'insurance', true, '2026-10-12');
  assert.equal(step2.overallStatus, 'Bank Permit Pending');

  // 4. Bank permit issued
  const step3 = updateMilestone(step2, 'bank_permit', true, '2026-10-14');
  assert.equal(step3.overallStatus, 'Permit Approved');
});

test('calculateSummaryStats correctly tallies pending and approved counts', () => {
  const item1 = createNewImportItem({ totalAmount: 10000, currency: 'USD' });
  let item2 = createNewImportItem({ totalAmount: 25000, currency: 'USD' });
  item2 = updateMilestone(item2, 'fx_approval', true, '2026-10-01');
  item2 = updateMilestone(item2, 'insurance', true, '2026-10-02');
  item2 = updateMilestone(item2, 'bank_permit', true, '2026-10-03');

  const stats = calculateSummaryStats([item1, item2]);

  assert.equal(stats.totalItems, 2);
  assert.equal(stats.totalAmountsByCurrency['USD'], 35000);
  assert.equal(stats.pendingFxCount, 1); // item1
  assert.equal(stats.pendingInsuranceCount, 1); // item1
  assert.equal(stats.pendingBankPermitCount, 1); // item1
  assert.equal(stats.fullyApprovedCount, 1); // item2
});

test('exportToCSV and exportToGoogleSheetsTSV format rows with milestone data', () => {
  const item = createNewImportItem({
    item: 'Steel Rebars',
    quantity: '500 MT',
    totalAmount: 340000,
    currency: 'USD',
    supplier: 'Tangshan Iron & Steel Co',
    piNo: 'PI-2026-778',
  });
  const updated = updateMilestone(item, 'insurance', true, '2026-10-15');

  const csv = exportToCSV([updated]);
  assert.ok(csv.includes('Steel Rebars'));
  assert.ok(csv.includes('PI-2026-778'));
  assert.ok(csv.includes('2026-10-15'));

  const tsv = exportToGoogleSheetsTSV([updated]);
  assert.ok(tsv.includes('Steel Rebars'));
  assert.ok(tsv.includes('TRUE')); // Insurance completed
  assert.ok(tsv.includes('FALSE')); // Bank Permit still pending
});
