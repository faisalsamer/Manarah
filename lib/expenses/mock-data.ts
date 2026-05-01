/**
 * Seed data for developing the expenses module against — replaces the API call
 * during the first scaffold. Delete this file once the data layer is wired in
 * and update the page to fetch real rows.
 */

import type { BankVM, ExpenseVM, TransactionVM } from './types';

export const MOCK_BANKS: BankVM[] = [
  {
    id: 'rajhi',
    name: 'مصرف الراجحي',
    accounts: [
      { id: 'rajhi-1', bankId: 'rajhi', label: 'حساب التوفير', accountNumber: '•••• 7821', balance: '12450.30', currency: 'SAR' },
      { id: 'rajhi-2', bankId: 'rajhi', label: 'حساب جاري', accountNumber: '•••• 4302', balance: '3820.55', currency: 'SAR' },
    ],
  },
  {
    id: 'snb',
    name: 'البنك الأهلي السعودي',
    accounts: [
      { id: 'snb-1', bankId: 'snb', label: 'حساب التوفير', accountNumber: '•••• 1109', balance: '7234.10', currency: 'SAR' },
    ],
  },
  {
    id: 'riyad',
    name: 'بنك الرياض',
    accounts: [
      { id: 'riyad-1', bankId: 'riyad', label: 'حساب التوفير', accountNumber: '•••• 6634', balance: '892.40', currency: 'SAR' },
      { id: 'riyad-2', bankId: 'riyad', label: 'حساب الأعمال', accountNumber: '•••• 8870', balance: '18650.00', currency: 'SAR' },
    ],
  },
  {
    id: 'anb',
    name: 'البنك العربي الوطني',
    accounts: [
      { id: 'anb-1', bankId: 'anb', label: 'حساب جاري', accountNumber: '•••• 2255', balance: '5430.75', currency: 'SAR' },
    ],
  },
];

export const MOCK_EXPENSES: ExpenseVM[] = [
  {
    id: 'exp-1',
    title: 'اشتراك Netflix',
    description: 'باقة العائلة',
    bankId: 'rajhi',
    accountId: 'rajhi-1',
    amountType: 'fixed',
    amount: '55.90',
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 5,
    timeOfDay: '09:00',
    paymentMode: 'auto',
    status: 'active',
    createdAt: '2025-10-01T08:00:00+03:00',
    latestTransaction: null,
  },
  {
    id: 'exp-2',
    title: 'إيجار المكتب',
    description: 'رسوم مساحة العمل المشتركة الشهرية',
    bankId: 'riyad',
    accountId: 'riyad-2',
    amountType: 'fixed',
    amount: '1200.00',
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 1,
    timeOfDay: '08:00',
    paymentMode: 'auto',
    status: 'active',
    createdAt: '2025-09-15T08:00:00+03:00',
    latestTransaction: null,
  },
  {
    id: 'exp-3',
    title: 'فاتورة الكهرباء',
    description: 'تختلف حسب الاستهلاك',
    bankId: 'snb',
    accountId: 'snb-1',
    amountType: 'variable',
    amount: null,
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 28,
    timeOfDay: '10:30',
    paymentMode: 'auto',
    status: 'active',
    createdAt: '2025-08-20T08:00:00+03:00',
    latestTransaction: null,
  },
  {
    id: 'exp-4',
    title: 'اشتراك Spotify',
    description: 'باقة فردية',
    bankId: 'rajhi',
    accountId: 'rajhi-1',
    amountType: 'fixed',
    amount: '14.90',
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 12,
    timeOfDay: '09:00',
    paymentMode: 'auto',
    status: 'active',
    createdAt: '2025-11-12T08:00:00+03:00',
    latestTransaction: null,
  },
  {
    id: 'exp-5',
    title: 'راتب المستقل',
    description: 'تأكيد قبل كل دفعة',
    bankId: 'anb',
    accountId: 'anb-1',
    amountType: 'fixed',
    amount: '2500.00',
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 15,
    timeOfDay: '11:00',
    paymentMode: 'manual',
    status: 'active',
    createdAt: '2025-07-10T08:00:00+03:00',
    latestTransaction: null,
  },
];

export const MOCK_TRANSACTIONS: TransactionVM[] = [
  // ─── Netflix history
  {
    id: 't1', expenseId: 'exp-1',
    scheduledFor: '2026-04-05T09:00:00+03:00',
    executedAt: '2026-04-05T09:00:14+03:00',
    amount: '55.90', status: 'succeeded', retryCount: 0,
    bankRef: 'RJH-2026040500142', failureReason: null, note: null, resolvedManually: false,
    attempts: [
      { id: 'a1-1', at: '2026-04-05T09:00:14+03:00', status: 'succeeded', message: 'تم تفويض الدفع من مصرف الراجحي · المرجع RJH-2026040500142' },
    ],
  },
  {
    id: 't2', expenseId: 'exp-1',
    scheduledFor: '2026-03-05T09:00:00+03:00',
    executedAt: '2026-03-05T09:00:08+03:00',
    amount: '55.90', status: 'succeeded', retryCount: 0,
    bankRef: 'RJH-2026030500088', failureReason: null, note: null, resolvedManually: false,
    attempts: [
      { id: 'a2-1', at: '2026-03-05T09:00:08+03:00', status: 'succeeded', message: 'تم تفويض الدفع من مصرف الراجحي · المرجع RJH-2026030500088' },
    ],
  },
  {
    id: 't3', expenseId: 'exp-1',
    scheduledFor: '2026-02-05T09:00:00+03:00',
    executedAt: '2026-02-05T12:01:22+03:00',
    amount: '55.90', status: 'succeeded', retryCount: 1,
    bankRef: 'RJH-2026020512122', failureReason: null,
    note: 'نجح في المحاولة الثانية', resolvedManually: false,
    attempts: [
      { id: 'a3-1', at: '2026-02-05T09:00:31+03:00', status: 'failed', message: 'انتهت مهلة بوابة البنك — لا استجابة خلال 30 ثانية' },
      { id: 'a3-2', at: '2026-02-05T12:01:22+03:00', status: 'succeeded', message: 'إعادة محاولة 1/3 — تم تفويض الدفع · المرجع RJH-2026020512122' },
    ],
  },
  // ─── Office rent history (with one failed)
  {
    id: 't5', expenseId: 'exp-2',
    scheduledFor: '2026-04-01T08:00:00+03:00',
    executedAt: '2026-04-01T08:00:33+03:00',
    amount: '1200.00', status: 'succeeded', retryCount: 0,
    bankRef: 'RIY-2026040100333', failureReason: null, note: null, resolvedManually: false,
    attempts: [
      { id: 'a5-1', at: '2026-04-01T08:00:33+03:00', status: 'succeeded', message: 'تم تفويض الدفع من بنك الرياض · المرجع RIY-2026040100333' },
    ],
  },
  {
    id: 't6', expenseId: 'exp-2',
    scheduledFor: '2026-03-01T08:00:00+03:00',
    executedAt: null,
    amount: '1200.00', status: 'failed', retryCount: 3,
    bankRef: null, failureReason: 'الرصيد غير كافٍ',
    note: 'فشلت كل المحاولات الثلاث — يحتاج معالجة يدوية', resolvedManually: false,
    attempts: [
      { id: 'a6-1', at: '2026-03-01T08:00:18+03:00', status: 'failed', message: 'رفض من بنك الرياض: الرصيد غير كافٍ (الرصيد 540.00 ر.س)' },
      { id: 'a6-2', at: '2026-03-01T11:00:22+03:00', status: 'failed', message: 'إعادة محاولة 1/3 — رفض: الرصيد غير كافٍ' },
      { id: 'a6-3', at: '2026-03-01T14:00:19+03:00', status: 'failed', message: 'إعادة محاولة 2/3 — رفض: الرصيد غير كافٍ' },
      { id: 'a6-4', at: '2026-03-01T17:00:25+03:00', status: 'failed', message: 'إعادة محاولة 3/3 — رفض: الرصيد غير كافٍ. تم إرسال إشعار.' },
    ],
  },
  {
    id: 't7', expenseId: 'exp-2',
    scheduledFor: '2026-02-01T08:00:00+03:00',
    executedAt: '2026-02-01T08:00:09+03:00',
    amount: '1200.00', status: 'succeeded', retryCount: 0,
    bankRef: 'RIY-2026020100099', failureReason: null, note: null, resolvedManually: false,
    attempts: [
      { id: 'a7-1', at: '2026-02-01T08:00:09+03:00', status: 'succeeded', message: 'تم تفويض الدفع من بنك الرياض · المرجع RIY-2026020100099' },
    ],
  },
  // ─── Electricity (variable, awaiting amount)
  {
    id: 't9', expenseId: 'exp-3',
    scheduledFor: '2026-04-28T10:30:00+03:00',
    executedAt: null,
    amount: null, status: 'awaiting_confirmation', retryCount: 0,
    bankRef: null, failureReason: null,
    note: 'مبلغ متغير — يحتاج تأكيد قبل الخصم', resolvedManually: false,
    attempts: [
      { id: 'a9-1', at: '2026-04-28T10:30:00+03:00', status: 'info', message: 'بدأت الدورة — بانتظار إدخال المبلغ من المستخدم' },
    ],
  },
  {
    id: 't10', expenseId: 'exp-3',
    scheduledFor: '2026-03-28T10:30:00+03:00',
    executedAt: '2026-03-28T10:30:21+03:00',
    amount: '187.45', status: 'succeeded', retryCount: 0,
    bankRef: 'SNB-2026032810212', failureReason: null, note: null, resolvedManually: false,
    attempts: [
      { id: 'a10-1', at: '2026-03-28T09:15:00+03:00', status: 'info', message: 'أدخل المستخدم المبلغ: 187.45 ر.س' },
      { id: 'a10-2', at: '2026-03-28T10:30:21+03:00', status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026032810212' },
    ],
  },
  {
    id: 't11', expenseId: 'exp-3',
    scheduledFor: '2026-02-28T10:30:00+03:00',
    executedAt: null,
    amount: null, status: 'skipped', retryCount: 0,
    bankRef: null, failureReason: null,
    note: 'تم التخطي هذه الدورة — تم الدفع مباشرة عبر المزود', resolvedManually: false,
    attempts: [
      { id: 'a11-1', at: '2026-02-28T08:42:11+03:00', status: 'info', message: 'تخطى المستخدم هذه الدورة' },
    ],
  },
  // ─── Spotify (one retrying)
  {
    id: 't13', expenseId: 'exp-4',
    scheduledFor: '2026-04-12T09:00:00+03:00',
    executedAt: null,
    amount: '14.90', status: 'retrying', retryCount: 1,
    bankRef: null, failureReason: 'انتهت مهلة البنك',
    note: 'إعادة المحاولة 2 من 3 مجدولة الساعة 15:00', resolvedManually: false,
    attempts: [
      { id: 'a13-1', at: '2026-04-12T09:00:31+03:00', status: 'failed', message: 'رفض من مصرف الراجحي: انتهت مهلة البوابة' },
      { id: 'a13-2', at: '2026-04-12T12:00:18+03:00', status: 'failed', message: 'إعادة محاولة 1/3 — رفض: انتهت المهلة. الإعادة التالية الساعة 15:00.' },
    ],
  },
  {
    id: 't14', expenseId: 'exp-4',
    scheduledFor: '2026-03-12T09:00:00+03:00',
    executedAt: '2026-03-12T09:00:07+03:00',
    amount: '14.90', status: 'succeeded', retryCount: 0,
    bankRef: 'RJH-2026031200077', failureReason: null, note: null, resolvedManually: false,
    attempts: [
      { id: 'a14-1', at: '2026-03-12T09:00:07+03:00', status: 'succeeded', message: 'تم تفويض الدفع من مصرف الراجحي · المرجع RJH-2026031200077' },
    ],
  },
  // ─── Future scheduled
  {
    id: 't16', expenseId: 'exp-1',
    scheduledFor: '2026-05-05T09:00:00+03:00',
    executedAt: null, amount: '55.90', status: 'scheduled', retryCount: 0,
    bankRef: null, failureReason: null, note: null, resolvedManually: false, attempts: [],
  },
  {
    id: 't17', expenseId: 'exp-2',
    scheduledFor: '2026-05-01T08:00:00+03:00',
    executedAt: null, amount: '1200.00', status: 'scheduled', retryCount: 0,
    bankRef: null, failureReason: null, note: null, resolvedManually: false, attempts: [],
  },
  {
    id: 't18', expenseId: 'exp-4',
    scheduledFor: '2026-05-12T09:00:00+03:00',
    executedAt: null, amount: '14.90', status: 'scheduled', retryCount: 0,
    bankRef: null, failureReason: null, note: null, resolvedManually: false, attempts: [],
  },
  // ─── Manual mode awaiting approval
  {
    id: 't19', expenseId: 'exp-5',
    scheduledFor: '2026-04-15T11:00:00+03:00',
    executedAt: null, amount: '2500.00', status: 'awaiting_confirmation', retryCount: 0,
    bankRef: null, failureReason: null,
    note: 'وضع يدوي — تحتاج موافقتك', resolvedManually: false,
    attempts: [
      { id: 'a19-1', at: '2026-04-15T11:00:00+03:00', status: 'info', message: 'بدأت الدورة — بانتظار موافقة المستخدم' },
    ],
  },
  {
    id: 't20', expenseId: 'exp-5',
    scheduledFor: '2026-03-15T11:00:00+03:00',
    executedAt: '2026-03-15T14:22:01+03:00',
    amount: '2500.00', status: 'succeeded', retryCount: 0,
    bankRef: 'ANB-2026031514220', failureReason: null,
    note: 'تمت الموافقة يدوياً', resolvedManually: false,
    attempts: [
      { id: 'a20-1', at: '2026-03-15T11:00:00+03:00', status: 'info', message: 'بدأت الدورة — بانتظار موافقة المستخدم' },
      { id: 'a20-2', at: '2026-03-15T14:22:01+03:00', status: 'succeeded', message: 'وافق المستخدم · تم تفويض الدفع من البنك العربي · المرجع ANB-2026031514220' },
    ],
  },
];
