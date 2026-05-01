/**
 * Seed data for developing the Marāsi module against — replaces the API call
 * during the first scaffold. Delete this file once the data layer is wired in
 * and update the page to fetch real rows.
 *
 * Banks are reused from the expenses mock so the modules look like one app.
 */

import { MOCK_BANKS as EXPENSES_BANKS } from '@/lib/expenses/mock-data';
import type { BankVM, MarsaTransactionVM, MarsaVM } from './types';

export const MOCK_BANKS: BankVM[] = EXPENSES_BANKS;

export const MOCK_MARASI: MarsaVM[] = [
  // ─── Active goal — long-term, smooth progress
  {
    id: 'mr-1',
    title: 'رحلة الحج',
    bankId: 'rajhi',
    accountId: 'rajhi-1',
    targetAmount: '25000.00',
    currentBalance: '8400.00',
    periodicAmount: '1383.00',
    frequency: 'monthly',
    targetDate: '2027-06-01',
    status: 'active',
    withdrawn: false,
    failedAttempts: 0,
    nextDepositAt: '2026-05-01T09:00:00+03:00',
    reachedAt: null,
    cancelledAt: null,
    withdrawnAt: null,
    releaseBankId: null,
    releaseAccountId: null,
    createdAt: '2026-01-15T08:00:00+03:00',
  },
  // ─── Active goal — failing right now
  {
    id: 'mr-2',
    title: 'رحلة طوكيو الربيعية',
    bankId: 'snb',
    accountId: 'snb-1',
    targetAmount: '8000.00',
    currentBalance: '3200.00',
    periodicAmount: '200.00',
    frequency: 'weekly',
    targetDate: '2026-10-15',
    status: 'active',
    withdrawn: false,
    failedAttempts: 2,
    nextDepositAt: '2026-05-06T09:00:00+03:00',
    reachedAt: null,
    cancelledAt: null,
    withdrawnAt: null,
    releaseBankId: null,
    releaseAccountId: null,
    createdAt: '2026-02-01T08:00:00+03:00',
  },
  // ─── Reached but not yet withdrawn — money sitting in jar
  {
    id: 'mr-3',
    title: 'صندوق الطوارئ',
    bankId: 'rajhi',
    accountId: 'rajhi-1',
    targetAmount: '15000.00',
    currentBalance: '15000.00',
    periodicAmount: '750.00',
    frequency: 'monthly',
    targetDate: '2026-08-01',
    status: 'reached',
    withdrawn: false,
    failedAttempts: 0,
    nextDepositAt: null,
    reachedAt: '2026-04-15T09:00:00+03:00',
    cancelledAt: null,
    withdrawnAt: null,
    releaseBankId: null,
    releaseAccountId: null,
    createdAt: '2025-08-01T08:00:00+03:00',
  },
  // ─── Reached AND withdrawn — fully closed success
  {
    id: 'mr-4',
    title: 'كاميرا التصوير',
    bankId: 'riyad',
    accountId: 'riyad-1',
    targetAmount: '6500.00',
    currentBalance: '0.00',
    periodicAmount: '500.00',
    frequency: 'biweekly',
    targetDate: '2026-03-30',
    status: 'reached',
    withdrawn: true,
    failedAttempts: 0,
    nextDepositAt: null,
    reachedAt: '2026-03-12T09:00:00+03:00',
    cancelledAt: null,
    withdrawnAt: '2026-03-18T14:22:00+03:00',
    releaseBankId: 'rajhi',
    releaseAccountId: 'rajhi-2',
    createdAt: '2025-09-15T08:00:00+03:00',
  },
  // ─── Cancelled (terminated early) — funds returned
  {
    id: 'mr-5',
    title: 'هاتف جديد',
    bankId: 'anb',
    accountId: 'anb-1',
    targetAmount: '4500.00',
    currentBalance: '0.00',
    periodicAmount: '300.00',
    frequency: 'biweekly',
    targetDate: '2026-09-01',
    status: 'cancelled',
    withdrawn: true,
    failedAttempts: 0,
    nextDepositAt: null,
    reachedAt: null,
    cancelledAt: '2026-04-10T11:30:00+03:00',
    withdrawnAt: '2026-04-10T11:30:00+03:00',
    releaseBankId: 'anb',
    releaseAccountId: 'anb-1',
    createdAt: '2026-01-05T08:00:00+03:00',
  },
];

export const MOCK_MARASI_TRANSACTIONS: MarsaTransactionVM[] = [
  // ─── mr-1 (Hajj) — 6 successful auto-debits + 1 topup
  {
    id: 'mt-1', marsaId: 'mr-1', type: 'auto_debit', amount: '1383.00',
    scheduledFor: '2026-04-01T09:00:00+03:00', executedAt: '2026-04-01T09:00:14+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026040100142',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-1-a1', at: '2026-04-01T09:00:14+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من مصرف الراجحي · المرجع RJH-2026040100142' },
    ],
  },
  {
    id: 'mt-2', marsaId: 'mr-1', type: 'manual_topup', amount: '500.00',
    scheduledFor: '2026-03-15T14:32:00+03:00', executedAt: '2026-03-15T14:32:09+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026031514329',
    failureReason: null, note: 'مكافأة شهر مارس',
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-2-a1', at: '2026-03-15T14:32:09+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع اليدوي من مصرف الراجحي · المرجع RJH-2026031514329' },
    ],
  },
  {
    id: 'mt-3', marsaId: 'mr-1', type: 'auto_debit', amount: '1383.00',
    scheduledFor: '2026-03-01T09:00:00+03:00', executedAt: '2026-03-01T09:00:08+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026030100088',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-3-a1', at: '2026-03-01T09:00:08+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من مصرف الراجحي · المرجع RJH-2026030100088' },
    ],
  },
  {
    id: 'mt-4', marsaId: 'mr-1', type: 'auto_debit', amount: '1383.00',
    scheduledFor: '2026-02-01T09:00:00+03:00', executedAt: '2026-02-01T09:00:11+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026020100111',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-4-a1', at: '2026-02-01T09:00:11+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من مصرف الراجحي · المرجع RJH-2026020100111' },
    ],
  },
  {
    id: 'mt-5', marsaId: 'mr-1', type: 'auto_debit', amount: '1383.00',
    scheduledFor: '2026-01-15T09:00:00+03:00', executedAt: '2026-01-15T09:00:09+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026011500099',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-5-a1', at: '2026-01-15T09:00:09+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من مصرف الراجحي · المرجع RJH-2026011500099' },
    ],
  },
  {
    id: 'mt-6', marsaId: 'mr-1', type: 'auto_debit', amount: '1383.00',
    scheduledFor: '2026-05-01T09:00:00+03:00', executedAt: null,
    status: 'scheduled', retryCount: 0, bankRef: null,
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null, attempts: [],
  },

  // ─── mr-2 (Tokyo) — failing right now, 2 failed attempts
  {
    id: 'mt-10', marsaId: 'mr-2', type: 'auto_debit', amount: '200.00',
    scheduledFor: '2026-04-29T09:00:00+03:00', executedAt: null,
    status: 'failed', retryCount: 2, bankRef: null,
    failureReason: 'الرصيد غير كافٍ في الحساب المصدر.',
    note: 'فشلت محاولتان متتاليتان — يحتاج إعادة محاولة',
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-10-a1', at: '2026-04-29T09:00:18+03:00', status: 'failed',
        message: 'رفض من البنك الأهلي السعودي: الرصيد غير كافٍ.' },
      { id: 'mt-10-a2', at: '2026-04-29T12:00:22+03:00', status: 'failed',
        message: 'إعادة محاولة 1/3 — رفض: الرصيد غير كافٍ.' },
    ],
  },
  {
    id: 'mt-11', marsaId: 'mr-2', type: 'auto_debit', amount: '200.00',
    scheduledFor: '2026-04-22T09:00:00+03:00', executedAt: '2026-04-22T09:00:14+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'SNB-2026042200143',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-11-a1', at: '2026-04-22T09:00:14+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026042200143' },
    ],
  },
  {
    id: 'mt-12', marsaId: 'mr-2', type: 'auto_debit', amount: '200.00',
    scheduledFor: '2026-04-15T09:00:00+03:00', executedAt: '2026-04-15T09:00:11+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'SNB-2026041500111',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-12-a1', at: '2026-04-15T09:00:11+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026041500111' },
    ],
  },
  {
    id: 'mt-13', marsaId: 'mr-2', type: 'manual_topup', amount: '600.00',
    scheduledFor: '2026-03-20T18:11:00+03:00', executedAt: '2026-03-20T18:11:08+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'SNB-2026032018111',
    failureReason: null, note: 'دفعة إضافية لتسريع الهدف',
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-13-a1', at: '2026-03-20T18:11:08+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع اليدوي من البنك الأهلي · المرجع SNB-2026032018111' },
    ],
  },

  // ─── mr-3 (Emergency reserve) — reached, money still in jar
  {
    id: 'mt-20', marsaId: 'mr-3', type: 'auto_debit', amount: '750.00',
    scheduledFor: '2026-04-15T09:00:00+03:00', executedAt: '2026-04-15T09:00:09+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026041500099',
    failureReason: null, note: 'الدفعة التي بلغ بها الهدف!',
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-20-a1', at: '2026-04-15T09:00:09+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من مصرف الراجحي · المرجع RJH-2026041500099' },
    ],
  },
  {
    id: 'mt-21', marsaId: 'mr-3', type: 'auto_debit', amount: '750.00',
    scheduledFor: '2026-03-15T09:00:00+03:00', executedAt: '2026-03-15T09:00:12+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026031500122',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-21-a1', at: '2026-03-15T09:00:12+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من مصرف الراجحي · المرجع RJH-2026031500122' },
    ],
  },
  {
    id: 'mt-22', marsaId: 'mr-3', type: 'auto_debit', amount: '750.00',
    scheduledFor: '2026-02-15T09:00:00+03:00', executedAt: '2026-02-15T09:00:18+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026021500188',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-22-a1', at: '2026-02-15T09:00:18+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من مصرف الراجحي · المرجع RJH-2026021500188' },
    ],
  },

  // ─── mr-4 (Camera) — reached AND released
  {
    id: 'mt-30', marsaId: 'mr-4', type: 'release', amount: '6500.00',
    scheduledFor: '2026-03-18T14:22:00+03:00', executedAt: '2026-03-18T14:22:08+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RJH-2026031814228',
    failureReason: null, note: 'تم سحب الرصيد بعد بلوغ الهدف.',
    destinationBankId: 'rajhi', destinationAccountId: 'rajhi-2',
    attempts: [
      { id: 'mt-30-a1', at: '2026-03-18T14:22:08+03:00', status: 'succeeded',
        message: 'تم تحويل المبلغ إلى مصرف الراجحي · حساب جاري · المرجع RJH-2026031814228' },
    ],
  },
  {
    id: 'mt-31', marsaId: 'mr-4', type: 'auto_debit', amount: '500.00',
    scheduledFor: '2026-03-12T09:00:00+03:00', executedAt: '2026-03-12T09:00:07+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'RIY-2026031200077',
    failureReason: null, note: 'الدفعة التي بلغ بها الهدف!',
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-31-a1', at: '2026-03-12T09:00:07+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من بنك الرياض · المرجع RIY-2026031200077' },
    ],
  },

  // ─── mr-5 (Phone, cancelled) — release on cancel
  {
    id: 'mt-40', marsaId: 'mr-5', type: 'release', amount: '900.00',
    scheduledFor: '2026-04-10T11:30:00+03:00', executedAt: '2026-04-10T11:30:11+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'ANB-2026041011300',
    failureReason: null, note: 'إنهاء المرسى وتحويل الرصيد المتبقي.',
    destinationBankId: 'anb', destinationAccountId: 'anb-1',
    attempts: [
      { id: 'mt-40-a1', at: '2026-04-10T11:30:11+03:00', status: 'succeeded',
        message: 'تم تحويل الرصيد إلى البنك العربي الوطني · حساب جاري · المرجع ANB-2026041011300' },
    ],
  },
  {
    id: 'mt-41', marsaId: 'mr-5', type: 'auto_debit', amount: '300.00',
    scheduledFor: '2026-03-22T09:00:00+03:00', executedAt: '2026-03-22T09:00:09+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'ANB-2026032200099',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-41-a1', at: '2026-03-22T09:00:09+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من البنك العربي · المرجع ANB-2026032200099' },
    ],
  },
  {
    id: 'mt-42', marsaId: 'mr-5', type: 'auto_debit', amount: '300.00',
    scheduledFor: '2026-03-08T09:00:00+03:00', executedAt: '2026-03-08T09:00:08+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'ANB-2026030800088',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-42-a1', at: '2026-03-08T09:00:08+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من البنك العربي · المرجع ANB-2026030800088' },
    ],
  },
  {
    id: 'mt-43', marsaId: 'mr-5', type: 'auto_debit', amount: '300.00',
    scheduledFor: '2026-02-22T09:00:00+03:00', executedAt: '2026-02-22T09:00:14+03:00',
    status: 'succeeded', retryCount: 0, bankRef: 'ANB-2026022200144',
    failureReason: null, note: null,
    destinationBankId: null, destinationAccountId: null,
    attempts: [
      { id: 'mt-43-a1', at: '2026-02-22T09:00:14+03:00', status: 'succeeded',
        message: 'تم تفويض الإيداع من البنك العربي · المرجع ANB-2026022200144' },
    ],
  },
];
