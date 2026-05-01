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

  const linkedBanks = data.banks.filter((b) =>
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
    bankExternalId: 'rajhi_bank',
    accountExternalId: 'ACC001',
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
        bankRef: 'RJH-2026020500088',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من مصرف الراجحي · المرجع RJH-2026020500088', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 3, 5, '09:00'),
        executedAt: at(Y, 3, 5, '12:01'),
        amount: '55.90',
        status: 'succeeded',
        retryCount: 1,
        bankRef: 'RJH-2026030512012',
        failureReason: null,
        note: 'نجح في المحاولة الثانية',
        resolvedManually: false,
        attempts: [
          { status: 'failed', message: 'انتهت مهلة بوابة البنك — لا استجابة خلال 30 ثانية', offsetMinutes: 0 },
          { status: 'succeeded', message: 'إعادة محاولة 1/3 — تم تفويض الدفع · المرجع RJH-2026030512012', offsetMinutes: 181 },
        ],
      },
      {
        scheduledFor: at(Y, 4, 5, '09:00'),
        executedAt: at(Y, 4, 5, '09:00'),
        amount: '55.90',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'RJH-2026040500142',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من مصرف الراجحي · المرجع RJH-2026040500142', offsetMinutes: 0 },
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
    bankExternalId: 'rajhi_bank',
    accountExternalId: 'ACC001',
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
        bankRef: 'RJH-2026021200122',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من مصرف الراجحي · المرجع RJH-2026021200122', offsetMinutes: 0 },
        ],
      },
      {
        scheduledFor: at(Y, 3, 12, '09:00'),
        executedAt: at(Y, 3, 12, '09:00'),
        amount: '14.90',
        status: 'succeeded',
        retryCount: 0,
        bankRef: 'RJH-2026031200077',
        failureReason: null,
        note: null,
        resolvedManually: false,
        attempts: [
          { status: 'succeeded', message: 'تم تفويض الدفع من مصرف الراجحي · المرجع RJH-2026031200077', offsetMinutes: 0 },
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
          { status: 'failed', message: 'رفض من مصرف الراجحي: انتهت مهلة البوابة', offsetMinutes: 0 },
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
    bankExternalId: 'rajhi_bank',
    accountExternalId: 'ACC001',
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
        bankRef: 'RJH-2026031514220',
        failureReason: null,
        note: 'تمت الموافقة يدوياً',
        resolvedManually: false,
        attempts: [
          { status: 'info', message: 'بدأت الدورة — بانتظار موافقة المستخدم', offsetMinutes: 0 },
          { status: 'succeeded', message: 'وافق المستخدم · تم تفويض الدفع من مصرف الراجحي · المرجع RJH-2026031514220', offsetMinutes: 202 },
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
    console.log('Clean complete.');
    return;
  }

  const { userId, accountUuidByExternal } = await seedUserAndBanks();
  await seedExpenseFixtures(userId, accountUuidByExternal);
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
