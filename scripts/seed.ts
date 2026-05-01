/**
 * Idempotent seed script.
 *
 * Two modes:
 *   `npx tsx scripts/seed.ts`         → seed Tareq + linked banks/accounts +
 *                                       expense fixtures (skips fixtures if
 *                                       any recurring_expenses already exist).
 *   `npx tsx scripts/seed.ts --clean` → wipe expense fixtures only (deletes
 *                                       every recurring_expense for the user;
 *                                       transactions / attempts / notifications
 *                                       cascade away). Leaves user, banks, and
 *                                       accounts intact.
 *
 * NOTE: `accounts.balance` is NEVER written. Per project convention, balance
 * is fetched live from the bank API; the column stays at default 0.
 */

// Load env vars from `.env` BEFORE the prisma client is imported.
// `import 'dotenv/config'` runs the load as a side effect of the import
// itself, which (per ESM hoisting rules) executes ahead of the prisma
// import below. Doing it via `dotenv.config()` in code wouldn't, because
// imports are hoisted above non-import statements.
import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../lib/prisma';

// ─── CLI args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const isClean = args.includes('--clean');

// ─── Canonical user ──────────────────────────────────────────
const TAREQ = {
  name: 'Tareq Elouzeh',
  email: 'manarah558@gmail.com',
} as const;

// The customer_id in `banks_data.json` that represents Tareq across banks.
const CUSTOMER_ID = 'CUST001';

// Which banks to link to the user. CUST001 exists at multiple banks in the
// dummy data, but the seed only links the subset listed here — keeps the
// demo focused on one bank/account so the picker stays simple.
const LINKED_BANK_IDS = ['snb_bank'] as const;

// ─── JSON shape (only the fields we read) ────────────────────
interface BankFileAccount {
  account_id: string;
  account_number: string;
  iban: string;
  account_type: string;
  account_name: string;
  currency: string;
  is_primary: boolean;
}

interface BankFileCustomer {
  customer_id: string;
  accounts: BankFileAccount[];
}

interface BankFileBank {
  bank_id: string;
  bank_name: string;
  bank_name_ar: string;
  bank_code: string;
  type: string;
  logo_url: string;
  customers: BankFileCustomer[];
}

interface BankFile {
  banks: BankFileBank[];
}

// ─── Helpers ─────────────────────────────────────────────────
const hhmmToDate = (hhmm: string): Date => new Date(`1970-01-01T${hhmm}:00Z`);

const at = (year: number, month: number, day: number, hhmm: string): Date => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(year, month - 1, day, h, m, 0);
};

const offsetMinutes = (base: Date, mins: number): Date =>
  new Date(base.getTime() + mins * 60_000);

// ─── User + linked banks/accounts ────────────────────────────
async function seedUserAndBanks(): Promise<{ userId: string; accountUuidByExternal: Map<string, string> }> {
  const filePath = join(process.cwd(), 'dummy data', 'banks_data.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as BankFile;

  console.log(`Seeding user: ${TAREQ.name} <${TAREQ.email}>`);
  const user = await prisma.users.upsert({
    where: { email: TAREQ.email },
    create: { name: TAREQ.name, email: TAREQ.email },
    update: { name: TAREQ.name },
  });
  console.log(`  user.id = ${user.id}`);

  const linkedBanks = data.banks.filter(
    (b) =>
      LINKED_BANK_IDS.includes(b.bank_id as (typeof LINKED_BANK_IDS)[number]) &&
      b.customers.some((c) => c.customer_id === CUSTOMER_ID),
  );
  if (linkedBanks.length === 0) {
    console.warn(
      `No banks in banks_data.json contain customer_id=${CUSTOMER_ID}. Nothing to link.`,
    );
    return { userId: user.id, accountUuidByExternal: new Map() };
  }
  console.log(
    `Linking ${linkedBanks.length} bank(s): ${linkedBanks.map((b) => b.bank_id).join(', ')}`,
  );

  // (bank_external_id::account_external_id) → our accounts.id (uuid)
  const accountUuidByExternal = new Map<string, string>();
  let accountCount = 0;

  for (const bank of linkedBanks) {
    const bankRow = await prisma.banks.upsert({
      where: { user_id_bank_id: { user_id: user.id, bank_id: bank.bank_id } },
      create: {
        user_id: user.id,
        bank_id: bank.bank_id,
        bank_name: bank.bank_name,
        bank_name_ar: bank.bank_name_ar,
        bank_code: bank.bank_code,
        bank_type: bank.type,
        logo_url: bank.logo_url,
        is_connected: true,
        connected_at: new Date(),
      },
      update: {
        bank_name: bank.bank_name,
        bank_name_ar: bank.bank_name_ar,
        bank_code: bank.bank_code,
        bank_type: bank.type,
        logo_url: bank.logo_url,
        is_connected: true,
      },
    });

    const customer = bank.customers.find((c) => c.customer_id === CUSTOMER_ID);
    if (!customer) continue;

    for (const acc of customer.accounts) {
      const existing = await prisma.accounts.findFirst({
        where: { bank_id: bankRow.id, account_id: acc.account_id },
        select: { id: true },
      });

      const accountData = {
        account_number: acc.account_number,
        iban: acc.iban,
        account_type: acc.account_type,
        account_name: acc.account_name,
        is_primary: acc.is_primary,
        currency: acc.currency,
        // balance: deliberately not written — bank API is the source of truth.
      };

      const accountId = existing
        ? (await prisma.accounts.update({
            where: { id: existing.id },
            data: accountData,
            select: { id: true },
          })).id
        : (await prisma.accounts.create({
            data: { bank_id: bankRow.id, account_id: acc.account_id, ...accountData },
            select: { id: true },
          })).id;

      accountUuidByExternal.set(`${bank.bank_id}:${acc.account_id}`, accountId);
      accountCount++;
    }
  }

  console.log(`Linked ${accountCount} account(s).`);
  return { userId: user.id, accountUuidByExternal };
}

// ─── Expense fixtures ────────────────────────────────────────
type StatusKind =
  | 'scheduled'
  | 'awaiting_confirmation'
  | 'retrying'
  | 'succeeded'
  | 'failed'
  | 'skipped';
type AttemptKind = 'info' | 'succeeded' | 'failed';
type AmountTypeKind = 'fixed' | 'variable';
type UnitKind = 'day' | 'week' | 'month';
type DowKind = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
type PaymentModeKind = 'auto' | 'manual';

interface AttemptFixture {
  status: AttemptKind;
  message: string;
  /** Minutes from `scheduledFor`. Negative = before, positive = after. */
  offsetMinutes: number;
}

interface TransactionFixture {
  scheduledFor: Date;
  executedAt: Date | null;
  amount: string | null;
  status: StatusKind;
  retryCount: number;
  bankRef: string | null;
  failureReason: string | null;
  note: string | null;
  resolvedManually: boolean;
  attempts: AttemptFixture[];
}

interface ExpenseFixture {
  title: string;
  description: string | null;
  bankExternalId: string;
  accountExternalId: string;
  amountType: AmountTypeKind;
  amount: string | null;
  unit: UnitKind;
  interval: number;
  dayOfWeek: DowKind | null;
  dayOfMonth: number | null;
  timeOfDay: string;
  paymentMode: PaymentModeKind;
  transactions: TransactionFixture[];
}

// Fixed reference year/month so dates are deterministic across runs.
// Adjust if you want fresher data; the front end formats relative-feel dates.
const Y = 2026;

const fixtures: ExpenseFixture[] = [
  {
    title: 'اشتراك Netflix',
    description: 'باقة العائلة',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    amountType: 'fixed',
    amount: '55.90',
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 5,
    timeOfDay: '09:00',
    paymentMode: 'auto',
    transactions: [
      {
        scheduledFor: at(Y, 2, 5, '09:00'),
        executedAt: at(Y, 2, 5, '09:00'),
        amount: '55.90',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026020500088',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026020500088', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 3, 5, '09:00'),
        executedAt: at(Y, 3, 5, '12:01'),
        amount: '55.90',
        status: 'succeeded',
        retryCount: 1,
        bankRef: 'SNB-2026030512012',
        failureReason: null,
        note: 'نجح في المحاولة الثانية',
        resolvedManually: false,
        attempts: [
          { status: 'failed', message: 'انتهت مهلة بوابة البنك — لا استجابة خلال 30 ثانية', offsetMinutes: 0 },
          { status: 'succeeded', message: 'إعادة محاولة 1/3 — تم تفويض الدفع · المرجع SNB-2026030512012', offsetMinutes: 181 },
        ],
      },
      {
        scheduledFor: at(Y, 4, 5, '09:00'),
        executedAt: at(Y, 4, 5, '09:00'),
        amount: '55.90',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026040500142',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026040500142', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 5, 5, '09:00'),
        executedAt: null,
        amount: '55.90',
        status: 'scheduled',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [],
      },
    ],
  },
  {
    title: 'إيجار المكتب',
    description: 'مساحة العمل المشتركة',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    amountType: 'fixed',
    amount: '1200.00',
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 1,
    timeOfDay: '08:00',
    paymentMode: 'auto',
    transactions: [
      {
        scheduledFor: at(Y, 2, 1, '08:00'),
        executedAt: at(Y, 2, 1, '08:00'),
        amount: '1200.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026020100099',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026020100099', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 3, 1, '08:00'),
        executedAt: null,
        amount: '1200.00',
        status: 'failed',
        retryCount: 3,
        bankRef: null,
        failureReason: 'الرصيد غير كافٍ',
        note: 'فشلت كل المحاولات الثلاث — يحتاج معالجة يدوية',
        resolvedManually: false,
        attempts: [
          { status: 'failed', message: 'رفض من البنك الأهلي: الرصيد غير كافٍ', offsetMinutes: 0 },
          { status: 'failed', message: 'إعادة محاولة 1/3 — رفض: الرصيد غير كافٍ', offsetMinutes: 180 },
          { status: 'failed', message: 'إعادة محاولة 2/3 — رفض: الرصيد غير كافٍ', offsetMinutes: 360 },
          { status: 'failed', message: 'إعادة محاولة 3/3 — رفض: الرصيد غير كافٍ. تم إرسال إشعار.', offsetMinutes: 540 },
        ],
      },
      {
        scheduledFor: at(Y, 4, 1, '08:00'),
        executedAt: at(Y, 4, 1, '08:00'),
        amount: '1200.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026040100333',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026040100333', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 5, 1, '08:00'),
        executedAt: null,
        amount: '1200.00',
        status: 'scheduled',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [],
      },
    ],
  },
  {
    title: 'فاتورة الكهرباء',
    description: 'تختلف حسب الاستهلاك',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    amountType: 'variable',
    amount: null,
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 28,
    timeOfDay: '10:30',
    paymentMode: 'auto',
    transactions: [
      {
        scheduledFor: at(Y, 1, 28, '10:30'),
        executedAt: at(Y, 1, 28, '10:30'),
        amount: '203.80',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026012810152',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'info', message: 'أدخل المستخدم المبلغ: 203.80 ر.س', offsetMinutes: -890 },
          { status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026012810152', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 2, 28, '10:30'),
        executedAt: null,
        amount: null,
        status: 'skipped',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: 'تم التخطي هذه الدورة — تم الدفع مباشرة عبر المزود',
        resolvedManually: false,
        attempts: [
          { status: 'info', message: 'تخطى المستخدم هذه الدورة', offsetMinutes: -110 },
        ],
      },
      {
        scheduledFor: at(Y, 3, 28, '10:30'),
        executedAt: at(Y, 3, 28, '10:30'),
        amount: '187.45',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026032810212',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'info', message: 'أدخل المستخدم المبلغ: 187.45 ر.س', offsetMinutes: -75 },
          { status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026032810212', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 4, 28, '10:30'),
        executedAt: null,
        amount: null,
        status: 'awaiting_confirmation',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: 'مبلغ متغير — يحتاج تأكيد قبل الخصم',
        resolvedManually: false,
        attempts: [
          { status: 'info', message: 'بدأت الدورة — بانتظار إدخال المبلغ من المستخدم', offsetMinutes: 0 },
        ],
      },
    ],
  },
  {
    title: 'اشتراك Spotify',
    description: 'باقة فردية',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    amountType: 'fixed',
    amount: '14.90',
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 12,
    timeOfDay: '09:00',
    paymentMode: 'auto',
    transactions: [
      {
        scheduledFor: at(Y, 2, 12, '09:00'),
        executedAt: at(Y, 2, 12, '09:00'),
        amount: '14.90',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026021200122',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026021200122', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 3, 12, '09:00'),
        executedAt: at(Y, 3, 12, '09:00'),
        amount: '14.90',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026031200077',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026031200077', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 4, 12, '09:00'),
        executedAt: null,
        amount: '14.90',
        status: 'retrying',
        retryCount: 1,
        bankRef: null,
        failureReason: 'انتهت مهلة البنك',
        note: 'إعادة المحاولة 2 من 3 مجدولة الساعة 15:00',
        resolvedManually: false,
        attempts: [
          { status: 'failed', message: 'رفض من البنك الأهلي: انتهت مهلة البوابة', offsetMinutes: 0 },
          { status: 'failed', message: 'إعادة محاولة 1/3 — رفض: انتهت المهلة. الإعادة التالية الساعة 15:00.', offsetMinutes: 180 },
        ],
      },
      {
        scheduledFor: at(Y, 5, 12, '09:00'),
        executedAt: null,
        amount: '14.90',
        status: 'scheduled',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [],
      },
    ],
  },
  {
    title: 'تبرع شهري للجمعية',
    description: 'تأكيد قبل التحويل',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    amountType: 'fixed',
    amount: '200.00',
    unit: 'month',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: 15,
    timeOfDay: '11:00',
    paymentMode: 'manual',
    transactions: [
      {
        scheduledFor: at(Y, 2, 15, '11:00'),
        executedAt: null,
        amount: null,
        status: 'skipped',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: 'تم التخطي — لم تصل الموافقة',
        resolvedManually: false,
        attempts: [
          { status: 'info', message: 'بدأت الدورة — بانتظار موافقة المستخدم', offsetMinutes: 0 },
          { status: 'info', message: 'تخطى المستخدم هذه الدورة', offsetMinutes: 8 },
        ],
      },
      {
        scheduledFor: at(Y, 3, 15, '11:00'),
        executedAt: at(Y, 3, 15, '14:22'),
        amount: '200.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026031514220',
        failureReason: null,
        note: 'تمت الموافقة يدوياً',
        resolvedManually: false,
        attempts: [
          { status: 'info', message: 'بدأت الدورة — بانتظار موافقة المستخدم', offsetMinutes: 0 },
          { status: 'succeeded', message: 'وافق المستخدم · تم تفويض الدفع من البنك الأهلي · المرجع SNB-2026031514220', offsetMinutes: 202 },
        ],
      },
      {
        scheduledFor: at(Y, 4, 15, '11:00'),
        executedAt: null,
        amount: '200.00',
        status: 'awaiting_confirmation',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: 'وضع يدوي — تحتاج موافقتك',
        resolvedManually: false,
        attempts: [
          { status: 'info', message: 'بدأت الدورة — بانتظار موافقة المستخدم', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 5, 15, '11:00'),
        executedAt: null,
        amount: '200.00',
        status: 'scheduled',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [],
      },
    ],
  },
];

// Notifications anchored to specific (expense title, scheduledFor) pairs so we
// can resolve transaction ids after they're inserted.
interface NotificationFixture {
  expenseTitle: string;
  scheduledFor: Date;
  type:
    | 'payment_failed'
    | 'all_retries_exhausted'
    | 'awaiting_confirmation'
    | 'auto_skipped'
    | 'payment_succeeded'
    | 'upcoming_payment';
  sentAt: Date;
}

const notificationFixtures: NotificationFixture[] = [
  {
    expenseTitle: 'فاتورة الكهرباء',
    scheduledFor: at(Y, 4, 28, '10:30'),
    type: 'awaiting_confirmation',
    sentAt: at(Y, 4, 28, '10:30'),
  },
  {
    expenseTitle: 'تبرع شهري للجمعية',
    scheduledFor: at(Y, 4, 15, '11:00'),
    type: 'awaiting_confirmation',
    sentAt: at(Y, 4, 15, '11:00'),
  },
  {
    expenseTitle: 'إيجار المكتب',
    scheduledFor: at(Y, 3, 1, '08:00'),
    type: 'all_retries_exhausted',
    sentAt: at(Y, 3, 1, '17:00'),
  },
  {
    expenseTitle: 'اشتراك Spotify',
    scheduledFor: at(Y, 4, 12, '09:00'),
    type: 'payment_failed',
    sentAt: at(Y, 4, 12, '12:00'),
  },
  {
    expenseTitle: 'اشتراك Netflix',
    scheduledFor: at(Y, 4, 5, '09:00'),
    type: 'payment_succeeded',
    sentAt: at(Y, 4, 5, '09:00'),
  },
];

// ─── Seed expense fixtures ───────────────────────────────────
async function seedExpenseFixtures(
  userId: string,
  accountUuidByExternal: Map<string, string>,
): Promise<void> {
  const existingCount = await prisma.recurring_expenses.count({
    where: { user_id: userId },
  });
  if (existingCount > 0) {
    console.log(
      `Found ${existingCount} existing recurring_expense(s) for the user — skipping fixtures. Run with --clean to wipe and re-seed.`,
    );
    return;
  }

  console.log(`Seeding ${fixtures.length} expense fixture(s)…`);

  // Track created (expenseTitle::scheduledForISO) → tx uuid for notifications.
  const txByKey = new Map<string, string>();
  let txCount = 0;
  let attemptCount = 0;

  for (const fx of fixtures) {
    const accountId = accountUuidByExternal.get(
      `${fx.bankExternalId}:${fx.accountExternalId}`,
    );
    if (!accountId) {
      console.warn(
        `  Skipping "${fx.title}" — no linked account for ${fx.bankExternalId}/${fx.accountExternalId}`,
      );
      continue;
    }

    const expense = await prisma.recurring_expenses.create({
      data: {
        user_id: userId,
        account_id: accountId,
        title: fx.title,
        description: fx.description,
        amount_type: fx.amountType,
        amount: fx.amount,
        unit: fx.unit,
        interval: fx.interval,
        day_of_week: fx.dayOfWeek,
        day_of_month: fx.dayOfMonth,
        time_of_day: hhmmToDate(fx.timeOfDay),
        payment_mode: fx.paymentMode,
        status: 'active',
      },
    });

    for (const tx of fx.transactions) {
      const created = await prisma.payment_transactions.create({
        data: {
          recurring_expense_id: expense.id,
          user_id: userId,
          account_id: accountId,
          scheduled_for: tx.scheduledFor,
          executed_at: tx.executedAt,
          amount: tx.amount,
          status: tx.status,
          retry_count: tx.retryCount,
          bank_ref: tx.bankRef,
          failure_reason: tx.failureReason,
          note: tx.note,
          resolved_manually: tx.resolvedManually,
        },
      });
      txCount++;
      txByKey.set(`${fx.title}::${tx.scheduledFor.toISOString()}`, created.id);

      for (let i = 0; i < tx.attempts.length; i++) {
        const a = tx.attempts[i];
        await prisma.payment_attempts.create({
          data: {
            transaction_id: created.id,
            attempt_number: i + 1,
            at: offsetMinutes(tx.scheduledFor, a.offsetMinutes),
            status: a.status,
            message: a.message,
          },
        });
        attemptCount++;
      }
    }
  }

  console.log(`  ${txCount} transaction(s), ${attemptCount} attempt(s) seeded.`);

  // Notifications — only those that map to a known transaction.
  let notifCount = 0;
  for (const n of notificationFixtures) {
    const txId = txByKey.get(`${n.expenseTitle}::${n.scheduledFor.toISOString()}`);
    if (!txId) continue;
    await prisma.expense_notifications.create({
      data: {
        user_id: userId,
        transaction_id: txId,
        type: n.type,
        channel: 'in_app',
        sent_at: n.sentAt,
      },
    });
    notifCount++;
  }
  console.log(`  ${notifCount} notification(s) seeded.`);
}

// ═════════════════════════════════════════════════════════════
// MARASI (savings goals) FIXTURES
// ═════════════════════════════════════════════════════════════

type MarsaStatusKind = 'active' | 'reached' | 'cancelled';
type MarsaFreqKind = 'weekly' | 'biweekly' | 'monthly';
type MarsaTxTypeKind = 'auto_debit' | 'manual_topup' | 'release';
type MarsaTxStatusKind =
  | 'scheduled'
  | 'processing'
  | 'retrying'
  | 'succeeded'
  | 'failed'
  | 'cancelled';
type MarsaAttemptKind = 'info' | 'succeeded' | 'failed';
type MarsaNotifKind =
  | 'deposit_failed'
  | 'all_retries_exhausted'
  | 'goal_reached'
  | 'milestone_reached'
  | 'upcoming_deposit';

interface MarsaAttemptFixture {
  status: MarsaAttemptKind;
  message: string;
  /** Minutes from `scheduledFor`. Negative = before, positive = after. */
  offsetMinutes: number;
}

interface MarsaTxFixture {
  type: MarsaTxTypeKind;
  scheduledFor: Date;
  executedAt: Date | null;
  amount: string;
  status: MarsaTxStatusKind;
  retryCount: number;
  bankRef: string | null;
  failureReason: string | null;
  note: string | null;
  /** For `release` rows: destination account (where the money was sent).
   *  For inflows: leave undefined; the goal's source account is used. */
  destinationBankExternalId?: string;
  destinationAccountExternalId?: string;
  attempts: MarsaAttemptFixture[];
}

interface MarsaFixture {
  title: string;
  /** Funding source — auto-debits pull from here, top-ups debit here. */
  bankExternalId: string;
  accountExternalId: string;
  targetAmount: string;
  periodicAmount: string;
  frequency: MarsaFreqKind;
  /** DATE column — only year/month/day matter. */
  targetDate: Date;
  createdAt: Date;
  currentBalance: string;
  status: MarsaStatusKind;
  failedAttempts: number;
  /** Pre-computed timestamp of the next auto-debit. NULL when not active. */
  nextDepositAt: Date | null;
  reachedAt: Date | null;
  cancelledAt: Date | null;
  withdrawn: boolean;
  withdrawnAt: Date | null;
  /** Where the released funds went. Required iff withdrawn=true. */
  releaseBankExternalId: string | null;
  releaseAccountExternalId: string | null;
  transactions: MarsaTxFixture[];
}

interface MarsaNotificationFixture {
  marsaTitle: string;
  /** When set, anchors to a specific tx so we can resolve transaction_id. */
  txScheduledFor?: Date;
  type: MarsaNotifKind;
  sentAt: Date;
  readAt?: Date;
}

const marasiFixtures: MarsaFixture[] = [
  // ─── 1. ACTIVE — Hajj (steady progress) ─────────────────────
  {
    title: 'رحلة الحج',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    targetAmount: '25000.00',
    periodicAmount: '1562.50',
    frequency: 'monthly',
    targetDate: new Date(2027, 5, 1), // 2027-06-01
    createdAt: at(Y, 1, 15, '08:00'),
    currentBalance: '5187.50', // 3 succeeded debits + 1 manual top-up
    status: 'active',
    failedAttempts: 0,
    nextDepositAt: at(Y, 5, 15, '09:00'),
    reachedAt: null,
    cancelledAt: null,
    withdrawn: false,
    withdrawnAt: null,
    releaseBankExternalId: null,
    releaseAccountExternalId: null,
    transactions: [
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 2, 15, '09:00'),
        executedAt: at(Y, 2, 15, '09:00'),
        amount: '1562.50',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026021500099',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026021500099', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 3, 15, '09:00'),
        executedAt: at(Y, 3, 15, '09:00'),
        amount: '1562.50',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026031500142',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026031500142', offsetMinutes: 0 },
        ],
      },
      {
        type: 'manual_topup',
        scheduledFor: at(Y, 3, 28, '14:32'),
        executedAt: at(Y, 3, 28, '14:32'),
        amount: '500.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026032814322',
        failureReason: null,
        note: 'مكافأة شهرية',
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع اليدوي من البنك الأهلي · المرجع SNB-2026032814322', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 4, 15, '09:00'),
        executedAt: at(Y, 4, 15, '09:00'),
        amount: '1562.50',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026041500111',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026041500111', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 5, 15, '09:00'),
        executedAt: null,
        amount: '1562.50',
        status: 'scheduled',
        retryCount: 0,
        bankRef: null,
        failureReason: null,
        note: null,
        attempts: [],
      },
    ],
  },

  // ─── 2. ACTIVE + FAILING — Tokyo (insufficient_funds) ────────
  {
    title: 'رحلة طوكيو الربيعية',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    targetAmount: '8000.00',
    periodicAmount: '200.00',
    frequency: 'weekly',
    targetDate: new Date(2026, 9, 15), // 2026-10-15
    createdAt: at(Y, 2, 1, '08:00'),
    currentBalance: '1600.00',
    status: 'active',
    failedAttempts: 2,
    nextDepositAt: at(Y, 5, 6, '09:00'),
    reachedAt: null,
    cancelledAt: null,
    withdrawn: false,
    withdrawnAt: null,
    releaseBankExternalId: null,
    releaseAccountExternalId: null,
    transactions: [
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 4, 8, '09:00'),
        executedAt: at(Y, 4, 8, '09:00'),
        amount: '200.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026040800099',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026040800099', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 4, 15, '09:00'),
        executedAt: at(Y, 4, 15, '09:00'),
        amount: '200.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026041500111',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026041500111', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 4, 22, '09:00'),
        executedAt: at(Y, 4, 22, '09:00'),
        amount: '200.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026042200143',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026042200143', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 4, 29, '09:00'),
        executedAt: null,
        amount: '200.00',
        status: 'retrying',
        retryCount: 2,
        bankRef: null,
        failureReason: 'الرصيد غير كافٍ في الحساب المصدر.',
        note: 'فشلت محاولتان متتاليتان — يحتاج إعادة محاولة',
        attempts: [
          { status: 'failed', message: 'رفض من البنك الأهلي السعودي: الرصيد غير كافٍ.', offsetMinutes: 18 },
          { status: 'failed', message: 'إعادة محاولة 1/3 — رفض: الرصيد غير كافٍ.', offsetMinutes: 180 },
        ],
      },
    ],
  },

  // ─── 3. REACHED (not yet withdrawn) — Emergency reserve ─────
  {
    title: 'صندوق الطوارئ',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    targetAmount: '15000.00',
    periodicAmount: '1500.00',
    frequency: 'monthly',
    targetDate: new Date(2026, 7, 1), // 2026-08-01
    createdAt: at(2025, 8, 1, '08:00'),
    currentBalance: '15000.00',
    status: 'reached',
    failedAttempts: 0,
    nextDepositAt: null,
    reachedAt: at(Y, 4, 15, '09:00'),
    cancelledAt: null,
    withdrawn: false,
    withdrawnAt: null,
    releaseBankExternalId: null,
    releaseAccountExternalId: null,
    transactions: [
      // Truncated history — show 4 of the 10 cycles for brevity
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 1, 15, '09:00'),
        executedAt: at(Y, 1, 15, '09:00'),
        amount: '1500.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026011500099',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026011500099', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 2, 15, '09:00'),
        executedAt: at(Y, 2, 15, '09:00'),
        amount: '1500.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026021500088',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026021500088', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 3, 15, '09:00'),
        executedAt: at(Y, 3, 15, '09:00'),
        amount: '1500.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026031500122',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026031500122', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 4, 15, '09:00'),
        executedAt: at(Y, 4, 15, '09:00'),
        amount: '1500.00',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026041500099',
        failureReason: null,
        note: 'الدفعة التي بلغ بها الهدف.',
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026041500099', offsetMinutes: 0 },
        ],
      },
    ],
  },

  // ─── 4. CANCELLED + WITHDRAWN — Phone (terminated early) ─────
  {
    title: 'هاتف جديد',
    bankExternalId: 'snb_bank',
    accountExternalId: 'ACC003',
    targetAmount: '4500.00',
    periodicAmount: '281.25',
    frequency: 'biweekly',
    targetDate: new Date(2026, 8, 1), // 2026-09-01
    createdAt: at(Y, 1, 5, '08:00'),
    currentBalance: '0.00',
    status: 'cancelled',
    failedAttempts: 0,
    nextDepositAt: null,
    reachedAt: null,
    cancelledAt: at(Y, 4, 10, '11:30'),
    withdrawn: true,
    withdrawnAt: at(Y, 4, 10, '11:30'),
    releaseBankExternalId: 'snb_bank',
    releaseAccountExternalId: 'ACC003',
    transactions: [
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 2, 19, '09:00'),
        executedAt: at(Y, 2, 19, '09:00'),
        amount: '281.25',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026021900145',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026021900145', offsetMinutes: 0 },
        ],
      },
      {
        type: 'auto_debit',
        scheduledFor: at(Y, 3, 5, '09:00'),
        executedAt: at(Y, 3, 5, '09:00'),
        amount: '281.25',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026030500088',
        failureReason: null,
        note: null,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الإيداع من البنك الأهلي · المرجع SNB-2026030500088', offsetMinutes: 0 },
        ],
      },
      {
        type: 'release',
        scheduledFor: at(Y, 4, 10, '11:30'),
        executedAt: at(Y, 4, 10, '11:30'),
        amount: '562.50',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'SNB-2026041011300',
        failureReason: null,
        note: 'إنهاء المدخر وتحويل الرصيد المتبقي.',
        destinationBankExternalId: 'snb_bank',
        destinationAccountExternalId: 'ACC003',
        attempts: [
          { status: 'succeeded', message: 'تم تحويل الرصيد إلى البنك الأهلي · المرجع SNB-2026041011300', offsetMinutes: 0 },
        ],
      },
    ],
  },
];

const marasiNotificationFixtures: MarsaNotificationFixture[] = [
  // Most recent first — Tokyo's failing retries
  {
    marsaTitle: 'رحلة طوكيو الربيعية',
    txScheduledFor: at(Y, 4, 29, '09:00'),
    type: 'all_retries_exhausted',
    sentAt: at(Y, 4, 29, '14:00'),
  },
  {
    marsaTitle: 'رحلة طوكيو الربيعية',
    txScheduledFor: at(Y, 4, 29, '09:00'),
    type: 'deposit_failed',
    sentAt: at(Y, 4, 29, '09:00'),
    readAt: at(Y, 4, 29, '19:42'),
  },
  // Emergency reserve hit the target
  {
    marsaTitle: 'صندوق الطوارئ',
    txScheduledFor: at(Y, 4, 15, '09:00'),
    type: 'goal_reached',
    sentAt: at(Y, 4, 15, '09:00'),
  },
  // Hajj milestone (after the 4th successful debit)
  {
    marsaTitle: 'رحلة الحج',
    txScheduledFor: at(Y, 4, 15, '09:00'),
    type: 'milestone_reached',
    sentAt: at(Y, 4, 15, '09:01'),
    readAt: at(Y, 4, 15, '20:18'),
  },
  // Hajj — upcoming next deposit (queued ahead of the May 15 cycle)
  {
    marsaTitle: 'رحلة الحج',
    txScheduledFor: at(Y, 5, 15, '09:00'),
    type: 'upcoming_deposit',
    sentAt: at(Y, 4, 30, '09:00'),
  },
];

// ─── Seed marasi fixtures ────────────────────────────────────
async function seedMarasiFixtures(
  userId: string,
  accountUuidByExternal: Map<string, string>,
): Promise<void> {
  const existingCount = await prisma.marasi.count({ where: { user_id: userId } });
  if (existingCount > 0) {
    console.log(
      `Found ${existingCount} existing marasi for the user — skipping fixtures. Run with --clean to wipe and re-seed.`,
    );
    return;
  }

  console.log(`Seeding ${marasiFixtures.length} marasi fixture(s)…`);

  // (marsaTitle::txScheduledForISO) → tx uuid, for notification anchoring.
  const txByKey = new Map<string, string>();
  let txCount = 0;
  let attemptCount = 0;

  for (const fx of marasiFixtures) {
    const sourceAccountId = accountUuidByExternal.get(
      `${fx.bankExternalId}:${fx.accountExternalId}`,
    );
    if (!sourceAccountId) {
      console.warn(
        `  Skipping "${fx.title}" — no linked account for ${fx.bankExternalId}/${fx.accountExternalId}`,
      );
      continue;
    }

    const releaseAccountId =
      fx.releaseBankExternalId && fx.releaseAccountExternalId
        ? accountUuidByExternal.get(
            `${fx.releaseBankExternalId}:${fx.releaseAccountExternalId}`,
          )
        : null;

    const goal = await prisma.marasi.create({
      data: {
        user_id: userId,
        account_id: sourceAccountId,
        title: fx.title,
        target_amount: fx.targetAmount,
        periodic_amount: fx.periodicAmount,
        frequency: fx.frequency,
        target_date: fx.targetDate,
        current_balance: fx.currentBalance,
        status: fx.status,
        failed_attempts: fx.failedAttempts,
        next_deposit_at: fx.nextDepositAt,
        reached_at: fx.reachedAt,
        cancelled_at: fx.cancelledAt,
        withdrawn: fx.withdrawn,
        withdrawn_at: fx.withdrawnAt,
        release_account_id: releaseAccountId ?? null,
        created_at: fx.createdAt,
      },
    });

    for (const tx of fx.transactions) {
      // For releases, account_id IS the destination. For inflows, it's the source.
      const txAccountId =
        tx.type === 'release' && tx.destinationBankExternalId && tx.destinationAccountExternalId
          ? accountUuidByExternal.get(
              `${tx.destinationBankExternalId}:${tx.destinationAccountExternalId}`,
            ) ?? sourceAccountId
          : sourceAccountId;

      const created = await prisma.marasi_transactions.create({
        data: {
          marsa_id: goal.id,
          user_id: userId,
          account_id: txAccountId,
          type: tx.type,
          amount: tx.amount,
          scheduled_for: tx.scheduledFor,
          executed_at: tx.executedAt,
          status: tx.status,
          retry_count: tx.retryCount,
          bank_ref: tx.bankRef,
          failure_reason: tx.failureReason,
          note: tx.note,
        },
      });
      txCount++;
      txByKey.set(`${fx.title}::${tx.scheduledFor.toISOString()}`, created.id);

      for (let i = 0; i < tx.attempts.length; i++) {
        const a = tx.attempts[i];
        await prisma.marasi_attempts.create({
          data: {
            transaction_id: created.id,
            attempt_number: i + 1,
            at: offsetMinutes(tx.scheduledFor, a.offsetMinutes),
            status: a.status,
            message: a.message,
          },
        });
        attemptCount++;
      }
    }
  }

  console.log(`  ${txCount} marasi tx(s), ${attemptCount} attempt(s) seeded.`);

  // Build a marsaTitle → marsa_id lookup for notifications that aren't tx-anchored.
  const marasiRows = await prisma.marasi.findMany({
    where: { user_id: userId },
    select: { id: true, title: true },
  });
  const marsaIdByTitle = new Map(marasiRows.map((m) => [m.title, m.id]));

  let notifCount = 0;
  for (const n of marasiNotificationFixtures) {
    const marsaId = marsaIdByTitle.get(n.marsaTitle);
    if (!marsaId) continue;
    const txId = n.txScheduledFor
      ? txByKey.get(`${n.marsaTitle}::${n.txScheduledFor.toISOString()}`) ?? null
      : null;
    await prisma.marasi_notifications.create({
      data: {
        user_id: userId,
        marsa_id: marsaId,
        transaction_id: txId,
        type: n.type,
        channel: 'in_app',
        sent_at: n.sentAt,
        read_at: n.readAt ?? null,
      },
    });
    notifCount++;
  }
  console.log(`  ${notifCount} marasi notification(s) seeded.`);
}

// ─── Clean ───────────────────────────────────────────────────
async function cleanExpenseFixtures(userId: string): Promise<void> {
  console.log('Cleaning expense data for user…');
  // recurring_expenses delete cascades through payment_transactions
  // → payment_attempts AND expense_notifications.
  const { count: expenseCount } = await prisma.recurring_expenses.deleteMany({
    where: { user_id: userId },
  });
  // Belt-and-suspenders: nuke any orphan notifications (transaction_id is null).
  const { count: orphanNotifs } = await prisma.expense_notifications.deleteMany({
    where: { user_id: userId },
  });
  console.log(
    `  Deleted ${expenseCount} recurring_expense(s) and ${orphanNotifs} orphan notification(s). User, banks, and accounts kept.`,
  );
}

async function cleanMarasiFixtures(userId: string): Promise<void> {
  console.log('Cleaning marasi data for user…');
  // marasi delete cascades through marasi_transactions → marasi_attempts AND marasi_notifications.
  const { count: marasiCount } = await prisma.marasi.deleteMany({
    where: { user_id: userId },
  });
  // Orphan notifications (marsa_id null — possible for upcoming_deposit before any tx exists).
  const { count: orphanNotifs } = await prisma.marasi_notifications.deleteMany({
    where: { user_id: userId },
  });
  console.log(
    `  Deleted ${marasiCount} marasi and ${orphanNotifs} orphan marasi-notification(s).`,
  );
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  if (isClean) {
    // Look up the user without touching banks/accounts.
    const user = await prisma.users.findUnique({
      where: { email: TAREQ.email },
      select: { id: true },
    });
    if (!user) {
      console.warn(`User ${TAREQ.email} not found — nothing to clean.`);
      return;
    }
    await cleanExpenseFixtures(user.id);
    await cleanMarasiFixtures(user.id);
    console.log('Clean complete.');
    return;
  }

  const { userId, accountUuidByExternal } = await seedUserAndBanks();
  await seedExpenseFixtures(userId, accountUuidByExternal);
  await seedMarasiFixtures(userId, accountUuidByExternal);
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
