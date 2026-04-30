/**
 * Single source of Arabic UI strings for the expenses module.
 * Components must import from here — never hardcode Arabic strings inline.
 */

import type {
  AmountType,
  DayOfWeekId,
  PaymentMode,
  ScheduleUnit,
  TransactionStatus,
} from './types';

// ─── Page chrome ─────────────────────────────────────────────
export const pageLabels = {
  eyebrow: 'المصروفات',
  title: 'دفتر المصروفات',
  subtitle: 'قواعدك، سجلك، وقائمة ما يحتاج انتباهك — في مكان واحد.',
  newExpense: 'إضافة مصروف جديد',
} as const;

// ─── Tabs ────────────────────────────────────────────────────
export const tabLabels = {
  recurring: 'متكررة',
  history: 'السجل',
  action: 'تحتاج إجراء',
} as const;

// ─── Status pills ────────────────────────────────────────────
export const statusLabels: Record<TransactionStatus, string> = {
  scheduled: 'مجدول',
  awaiting_confirmation: 'بانتظار التأكيد',
  processing: 'قيد المعالجة',
  retrying: 'إعادة المحاولة',
  succeeded: 'تم بنجاح',
  failed: 'فشل',
  skipped: 'تم التخطي',
};

// ─── Amount types ────────────────────────────────────────────
export const amountTypeLabels: Record<AmountType, string> = {
  fixed: 'ثابت',
  variable: 'متغير',
};

// ─── Payment modes ───────────────────────────────────────────
export const paymentModeLabels: Record<PaymentMode, string> = {
  auto: 'تلقائي',
  manual: 'يدوي',
};

// ─── Schedule units (singular / dual / plural Arabic forms) ──
export const scheduleUnitLabels: Record<ScheduleUnit, { one: string; two: string; many: string }> = {
  day: { one: 'يوم', two: 'يومين', many: 'أيام' },
  week: { one: 'أسبوع', two: 'أسبوعين', many: 'أسابيع' },
  month: { one: 'شهر', two: 'شهرين', many: 'أشهر' },
};

// ─── Days of the week ────────────────────────────────────────
export const dayOfWeekLabels: Record<DayOfWeekId, { full: string; short: string }> = {
  sat: { full: 'السبت', short: 'س' },
  sun: { full: 'الأحد', short: 'ح' },
  mon: { full: 'الاثنين', short: 'ن' },
  tue: { full: 'الثلاثاء', short: 'ث' },
  wed: { full: 'الأربعاء', short: 'ر' },
  thu: { full: 'الخميس', short: 'خ' },
  fri: { full: 'الجمعة', short: 'ج' },
};

export const orderedDaysOfWeek: DayOfWeekId[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

// ─── Recurring view ──────────────────────────────────────────
export const recurringLabels = {
  statActiveLabel: 'النشطة',
  statActiveSuffix: 'قاعدة متكررة',
  statFixedLabel: 'الثابت الشهري',
  statFixedSuffix: 'مُلتزم به',
  statVariableLabel: 'المتغيرة',
  statVariableSuffix: 'بانتظار تحديد المبلغ',
  sectionTitle: 'مدفوعاتك المجدولة',
  sectionHint: 'انقر على أي بطاقة لعرض السجل الكامل',
  perCycle: 'لكل دورة',
  variableTbd: 'يُحدد عند الدفع',
  emptyTitle: 'لا توجد مدفوعات مجدولة',
  emptyDescription: 'أضف مصروفك المتكرر الأول للبدء.',
  delete: 'حذف',
  cardLastRun: 'آخر تنفيذ',
} as const;

// ─── History view ────────────────────────────────────────────
export const historyLabels = {
  statPaidLabel: 'إجمالي المدفوع',
  statPaidSuffix: 'منذ البداية',
  statSucceededLabel: 'الناجحة',
  statSucceededSuffix: 'عملية',
  statFailedLabel: 'الفاشلة',
  statFailedSuffix: 'احتاجت معالجة',
  sectionTitle: 'سجل العمليات',
  filterLabel: 'الحالة',
  filterAll: 'كل الحالات',
  emptyFiltered: 'لا توجد عمليات تطابق هذا الفلتر.',
  colDate: 'التاريخ',
  colExpense: 'المصروف',
  colStatus: 'الحالة',
  colReference: 'المرجع',
  colAmount: 'المبلغ',
  pendingAmount: 'بانتظار التحديد',
} as const;

// ─── Action view ─────────────────────────────────────────────
export const actionLabels = {
  bannerTitleOne: 'عملية واحدة تحتاج انتباهك',
  bannerTitleMany: (n: number) => `${n} عمليات تحتاج انتباهك`,
  bannerBody:
    'العمليات الفاشلة تحتاج معالجة يدوية. الوضع اليدوي والمصروفات المتغيرة تتطلب تأكيدك قبل الخصم.',
  emptyTitle: 'كل شيء على ما يرام',
  emptyDescription: 'لا توجد مدفوعات تحتاج انتباهك حالياً.',
  failedReasonLabel: 'سبب الفشل',
  retriesLabel: 'المحاولات',
  retriesValue: (n: number) => `${n} من 3 (كل 3 ساعات)`,
  sourceLabel: 'المصدر',
  notifiedLabel: 'تم الإبلاغ',
  failedHint: 'اختر حساباً مختلفاً عند الحاجة وادفع عبر النظام.',
  skipCycle: 'تخطي هذه الدورة',
  resolve: 'تسوية',
  variableHelper: 'أدخل المبلغ الذي تريد خصمه',
  manualHelper: 'اخترت تأكيد كل دورة قبل الخصم',
  variableLabel: 'مبلغ متغير',
  manualModeLabel: 'وضع يدوي',
  awaitingLabel: 'بانتظار التأكيد',
  amountToDebit: 'المبلغ المراد خصمه',
  confirmAndDebit: 'تأكيد وخصم',
  approveAndDebit: 'موافقة وخصم',
  approveHint: (amount: string) => `وافق لخصم ${amount}، أو تخطّى هذه الدورة.`,
} as const;

// ─── Drill sheet ─────────────────────────────────────────────
export const drillLabels = {
  eyebrow: 'مصروف متكرر',
  statSource: 'المصدر',
  statCadence: 'التكرار',
  statTotalPaid: 'إجمالي المدفوع',
  statTotalPaidSuffix: (n: number) => `عبر ${n} عمليات`,
  statSuccessRate: 'نسبة النجاح',
  statSuccessRateSuffix: 'من العمليات المنفذة',
  timelineTitle: 'الخط الزمني للمدفوعات',
  attemptsTitle: 'سجل الدفع',
  attemptsCount: (n: number) => `${n} ${n === 1 ? 'حدث' : 'أحداث'}`,
  showDetails: 'عرض التفاصيل',
  hideDetails: 'إخفاء التفاصيل',
  refLabel: 'المرجع',
  pendingAmount: 'بانتظار التحديد',
} as const;

// ─── Resolve modal ───────────────────────────────────────────
export const resolveLabels = {
  eyebrow: 'تسوية دفعة فاشلة',
  amountDue: 'المبلغ المستحق',
  scheduledFor: 'كانت مجدولة في',
  payFromLabel: 'الدفع من',
  accountLabel: 'الحساب',
  linkedTag: 'مرتبط',
  balanceLabel: 'الرصيد',
  insufficientLabel: 'غير كافٍ',
  insufficientWarning: (current: string, owed: string) =>
    `هذا الحساب يحتوي على ${current} فقط، وهو أقل من ${owed} المستحق. اختر حساباً آخر.`,
  setAsLinkedTitle: 'اعتمد هذا الحساب كحساب مرتبط بهذا المصروف',
  setAsLinkedBody: (expenseTitle: string, bank: string, account: string) =>
    `الدورات القادمة من «${expenseTitle}» ستُسحب من ${bank} · ${account} بدلاً من الحساب الأصلي.`,
  cancel: 'إلغاء',
  payNow: 'ادفع الآن',
  processingTitle: 'جارٍ معالجة الدفع',
  processingBody: (amount: string, bank: string, account: string) =>
    `جارٍ تفويض ${amount} عبر ${bank} · ${account}…`,
  successTitle: 'تم الدفع.',
  successBody: (amount: string, bank: string, account: string) =>
    `تم خصم ${amount} بنجاح من ${bank} · ${account}.`,
  successLinkedNote: 'الدورات القادمة ستستخدم هذا الحساب.',
} as const;

// ─── Wizard ──────────────────────────────────────────────────
export const wizardLabels = {
  stepOf: (current: number, total: number) => `الخطوة ${current} من ${total}`,
  steps: {
    details: 'التفاصيل',
    source: 'المصدر',
    amount: 'المبلغ',
    schedule: 'الجدولة',
    mode: 'الوضع',
    confirm: 'المراجعة',
  },
  back: 'رجوع',
  next: 'متابعة',
  submit: 'تأكيد الجدولة',
  // Step 1
  detailsHeading: 'ما هذا المصروف؟',
  detailsHelper: 'أعطه اسماً تتعرف عليه في كشف الحساب.',
  titleLabel: 'العنوان',
  titlePlaceholder: 'مثال: اشتراك Netflix',
  descriptionLabel: 'الوصف',
  descriptionHint: 'اختياري',
  descriptionPlaceholder: 'أضف ملاحظة لنفسك المستقبلية…',
  // Step 2
  sourceHeading: 'من أين سيُدفع؟',
  sourceHelper: 'اختر بنكاً ثم الحساب المحدد.',
  bankLabel: 'البنك',
  accountLabel: 'الحساب',
  // Step 3
  amountHeading: 'مبلغ ثابت أم متغير؟',
  amountHelper: 'بعض الفواتير ثابتة كل دورة. أخرى — كالكهرباء — ليست كذلك.',
  fixedTitle: 'ثابت',
  fixedSubtitle: 'نفس المبلغ في كل مرة',
  fixedExample: 'إيجار · اشتراكات · تأمين',
  variableTitle: 'متغير',
  variableSubtitle: 'المبلغ يتغير كل دورة',
  variableExample: 'مرافق · بقالة · وقود',
  amountLabel: 'المبلغ',
  variableInfo: 'سنُشعرك قبل كل دورة لتأكيد المبلغ قبل الخصم.',
  // Step 4
  scheduleHeading: 'كم مرة؟',
  scheduleHelper: 'حدد التكرار وسنتولى الباقي.',
  unitLabel: 'وحدة التكرار',
  intervalLabel: (unit: ScheduleUnit) =>
    unit === 'day' ? 'كل كم يوم؟' : unit === 'week' ? 'كل كم أسبوع؟' : 'كل كم شهر؟',
  dayOfWeekLabel: 'في أي يوم؟',
  dayOfMonthLabel: 'في أي يوم من الشهر؟',
  dayOfMonthHint:
    'إذا اخترت يوماً غير موجود في الشهر — مثلاً يوم 31 في إبريل (30 يوماً)، أو 29–31 في فبراير (28 أو 29 يوماً) — سيُنفَّذ الدفع تلقائياً في آخر يوم من ذلك الشهر.',
  timeLabel: 'الساعة',
  retryNoteTitle: 'في حال فشل الدفع',
  retryNoteBody:
    'سنعيد المحاولة تلقائياً حتى 3 مرات، كل 3 ساعات. إذا فشلت كل المحاولات، سنُشعرك وعليك معالجتها يدوياً.',
  // Step 5
  modeHeading: 'تلقائي أم يدوي؟',
  modeHelper: 'حدّد إن كنا نخصم تلقائياً أم نُشعرك كل دورة لأخذ موافقتك.',
  autoTitle: 'تلقائي',
  autoSubtitle: 'اخصم في الموعد دون تدخل',
  autoExample: 'الأنسب للفواتير الثابتة. اضبط وانسَ.',
  manualTitle: 'تأكيد يدوي',
  manualSubtitle: 'أشعرني كل دورة للموافقة أو التخطي',
  manualExample: 'تحكم أكبر. الأنسب للالتزامات المرنة.',
  manualInfoTitle: 'كيف يعمل الوضع اليدوي',
  manualInfoBody:
    'في كل تاريخ دفع ستصلك إشعار. وافق للخصم، أو تخطَّ الدورة كاملة. إن لم تستجب، لن تُنفَّذ الدفعة وستُعتبر متخطاة بعد 24 ساعة.',
  variableAutoNote:
    'تنبيه: حتى في الوضع التلقائي، المصروفات المتغيرة تحتاج تأكيد المبلغ لأننا لا نعرف القيمة المراد خصمها.',
  // Step 6
  confirmHeading: 'هل كل شيء صحيح؟',
  confirmHelper: 'راجع التفاصيل. يمكنك تعديل أي شيء بالعودة للخطوات السابقة.',
  summaryTitle: 'العنوان',
  summaryDescription: 'الوصف',
  summarySource: 'المصدر',
  summaryAmount: 'المبلغ',
  summarySchedule: 'الجدولة',
  summaryMode: 'وضع الدفع',
  summaryAutoMode: 'تلقائي — اخصم في الموعد',
  summaryManualMode: 'يدوي — أشعرني كل دورة',
  summaryVariableAmount: 'متغير — أؤكد كل دورة',
} as const;

// ─── Misc ────────────────────────────────────────────────────
export const commonLabels = {
  currency: 'ر.س',
  delete: 'حذف',
  close: 'إغلاق',
  approve: 'موافقة',
  skip: 'تخطي',
} as const;
