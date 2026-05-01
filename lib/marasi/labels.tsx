/**
 * Single source of Arabic UI strings for the Mudkharāt (savings) module.
 * Components must import from here — never hardcode Arabic strings inline.
 *
 * NOTE: Internal naming (folder, types, route) still uses "marasi" to stay
 * aligned with the Prisma schema; only user-facing text says "مدخرات".
 *
 * Some labels embed the SAR currency. Those callbacks return ReactNode (not
 * string) so we can render the official Saudi Riyal logo inline via <Money />
 * instead of a textual symbol — that's why this file is `.tsx`.
 */

import type { ReactNode } from 'react';
import { Money } from '@/components/ui/RiyalSign';
import type {
  MarsaFrequency,
  MarsaStatus,
  MarsaTxStatus,
  MarsaTxType,
} from './types';

// ─── Page chrome ─────────────────────────────────────────────
export const pageLabels = {
  eyebrow: 'المدخرات',
  title: 'مدخراتك',
  subtitle: 'اختر هدفاً، حدد المبلغ والموعد، ودَع كل دورة تُقرّبك منه.',
  newMarsa: 'مدخر جديد',
} as const;

// ─── Tabs ────────────────────────────────────────────────────
export const tabLabels = {
  active: 'النشطة',
  reached: 'مكتملة',
  cancelled: 'مُنهاة',
} as const;

// ─── Goal status pills ───────────────────────────────────────
export const goalStatusLabels: Record<MarsaStatus, string> = {
  active: 'قيد الادخار',
  reached: 'اكتمل',
  cancelled: 'مُنهى',
};

/** Used when `failedAttempts > 0` on an active goal to flag it visually. */
export const goalActionRequiredLabel = 'تحتاج معالجة';
export const goalWithdrawnTag = 'تم السحب';
export const goalReadyToWithdrawTag = 'جاهز للسحب';

// ─── Frequency ───────────────────────────────────────────────
export const frequencyLabels: Record<MarsaFrequency, string> = {
  weekly: 'أسبوعياً',
  biweekly: 'كل أسبوعين',
  monthly: 'شهرياً',
};

/** "every X" cycle word, used in plan summaries. */
export const frequencyEveryLabels: Record<MarsaFrequency, string> = {
  weekly: 'كل أسبوع',
  biweekly: 'كل أسبوعين',
  monthly: 'كل شهر',
};

/** Singular cycle name — "1 cycle / 5 cycles". */
export const cycleWord = (n: number): string => {
  if (n === 1) return 'دورة واحدة';
  if (n === 2) return 'دورتين';
  if (n >= 3 && n <= 10) return `${n} دورات`;
  return `${n} دورة`;
};

// ─── Transaction types ───────────────────────────────────────
export const txTypeLabels: Record<MarsaTxType, string> = {
  auto_debit: 'خصم تلقائي',
  manual_topup: 'إيداع يدوي',
  release: 'سحب الرصيد',
};

export const txStatusLabels: Record<MarsaTxStatus, string> = {
  scheduled: 'مجدولة',
  processing: 'قيد المعالجة',
  retrying: 'إعادة المحاولة',
  succeeded: 'تمت',
  failed: 'فشلت',
  cancelled: 'أُلغيت',
};

// ─── Hero stats ──────────────────────────────────────────────
export const heroLabels = {
  activeLabel: 'مدخرات نشطة',
  activeSuffix: 'قيد الادخار',
  totalSavedLabel: 'إجمالي المدخرات',
  totalSavedSuffix: 'في كل المدخرات',
  monthlyCommitLabel: 'الالتزام الشهري',
  monthlyCommitSuffix: 'مجموع الدورات',
} as const;

// ─── Card ────────────────────────────────────────────────────
export const cardLabels = {
  progressOf: 'من',
  remaining: 'متبقٍ',
  perCycleLabel: 'لكل دورة',
  nextDepositLabel: 'الدفعة القادمة',
  reachedAtLabel: 'اكتمل في',
  cancelledAtLabel: 'أُنهي في',
  withdrawnNote: 'تم تحويل الرصيد إلى حسابك.',
  awaitingWithdrawal: 'الرصيد جاهز — يمكنك تحويله إلى أي حساب.',
  failedAttemptsOne: 'محاولة فاشلة واحدة — يحتاج مراجعة',
  failedAttemptsMany: (n: number) => `${n} محاولات فاشلة — يحتاج مراجعة`,
} as const;

// ─── Active view ─────────────────────────────────────────────
export const activeViewLabels = {
  sectionTitle: 'مدخراتك النشطة',
  sectionHint: 'انقر على أي مدخر لمراجعة السجل واتخاذ إجراء',
  emptyTitle: 'لم تُنشئ مدخراً بعد',
  emptyDescription:
    'كل هدف ادخار له رصيده المستقل. أنشئ أول مدخر وستبدأ الدفعات بالحركة في موعدها.',
} as const;

export const reachedViewLabels = {
  sectionTitle: 'مدخرات اكتملت',
  sectionHint: 'حوّل الرصيد إلى أي حساب، أو احتفظ به متى شئت.',
  emptyTitle: 'لا توجد مدخرات مكتملة',
  emptyDescription: 'مدخراتك المُنجزة ستظهر هنا — جاهزة للسحب متى شئت.',
} as const;

export const cancelledViewLabels = {
  sectionTitle: 'سجل المدخرات المُنهاة',
  sectionHint: 'هذه المدخرات أُنهيت قبل بلوغ الهدف وتم تحويل أرصدتها.',
  emptyTitle: 'لا توجد مدخرات مُنهاة',
  emptyDescription: 'كل مدخر أنهيته سيُحفظ هنا للرجوع إليه.',
} as const;

// ─── Drill sheet ─────────────────────────────────────────────
export const drillLabels = {
  eyebrow: 'تفاصيل المدخر',
  statSource: 'مصدر التمويل',
  statCadence: 'التكرار',
  statTarget: 'الهدف',
  statRemaining: 'المتبقي',
  statPerCycle: 'لكل دورة',
  statNextDeposit: 'الدفعة القادمة',
  statReachedOn: 'اكتمل في',
  statCancelledOn: 'أُنهي في',
  statTotalIn: 'مجموع الإيداعات',
  statTotalInSuffix: (n: number) =>
    n === 0 ? 'لا إيداعات بعد' : n === 1 ? 'عبر إيداع واحد' : `عبر ${n} إيداعات`,
  ledgerTitle: 'سجل الحركات',
  ledgerEmpty: 'لا توجد حركات بعد. أول دفعة ستُسجَّل هنا.',
  ledgerEntries: (n: number) =>
    n === 1 ? 'حركة واحدة' : n === 2 ? 'حركتان' : `${n} حركات`,
  showAttempts: 'عرض المحاولات',
  hideAttempts: 'إخفاء المحاولات',
  refLabel: 'مرجع البنك',
  retryLabel: (n: number) => `المحاولة ${n + 1}`,
  releaseDestination: 'وُجّه إلى',
  // Action buttons
  actionTopUp: 'إيداع يدوي',
  actionReleaseReached: 'تحويل الرصيد',
  actionCancel: 'إنهاء المدخر',
  actionRetry: 'إعادة المحاولة الآن',
  actionRetryHint: 'سنحاول الخصم مجدداً من الحساب المرتبط.',
  actionChangeSource: 'تغيير حساب التمويل',
  // Failure banner
  failureBannerTitle: (n: number) =>
    n === 1 ? 'محاولة فاشلة واحدة' : `${n} محاولات فاشلة`,
  failureBannerBody:
    'سنعيد المحاولة تلقائياً خلال الساعات القادمة. يمكنك إعادة المحاولة الآن.',
  // Withdrawn banner
  withdrawnBannerTitle: 'تم تحويل الرصيد',
  /** `amount` is the raw value (string|number); the riyal logo renders inline. */
  withdrawnBannerBody: (amount: string | number, bank: string, account: string): ReactNode => (
    <>حُوِّل <Money amount={amount} /> إلى {bank} · {account}.</>
  ),
  readyBannerTitle: 'اكتمل الهدف',
  readyBannerBody: 'الرصيد محفوظ. يمكنك تحويله إلى أي من حساباتك متى شئت.',
} as const;

// ─── Top-up modal ────────────────────────────────────────────
export const topUpLabels = {
  eyebrow: 'إيداع يدوي',
  heading: 'كم تريد أن تُضيف الآن؟',
  helper:
    'سنخصم المبلغ من الحساب المرتبط بهذا المدخر ونُضيفه فوراً إلى رصيدك.',
  amountLabel: 'المبلغ',
  fromLabel: 'الخصم من',
  cancel: 'إلغاء',
  confirm: 'تأكيد الإيداع',
  /** `current` and `owed` are raw amounts; the riyal logo renders inline. */
  insufficientWarning: (current: string | number, owed: string | number): ReactNode => (
    <>الحساب يحتوي على <Money amount={current} /> فقط — أقل من <Money amount={owed} /> المطلوب.</>
  ),
} as const;

// ─── Change-source modal ─────────────────────────────────────
export const changeSourceLabels = {
  eyebrow: 'تغيير حساب التمويل',
  heading: 'من أي حساب نخصم في الدفعات القادمة؟',
  helper:
    'الدفعات التلقائية المُجدولة (التي لم تُنفَّذ بعد) ستُحوَّل لتُسحب من الحساب الجديد.',
  currentSourceLabel: 'الحساب الحالي',
  destinationLabel: 'الحساب الجديد',
  cancel: 'تراجع',
  confirm: 'تحديث الحساب',
  /** Disable the confirm button when the user re-picks the same account. */
  sameAccountHint: 'هذا هو الحساب الحالي بالفعل.',
} as const;

// ─── Release / cancel modal ──────────────────────────────────
export const releaseLabels = {
  // Two flows share this modal — driven by `mode`:
  //   "release"  → goal is `reached`, withdraw funds and mark withdrawn
  //   "cancel"   → goal is `active`, terminate AND withdraw funds
  releaseEyebrow: 'تحويل رصيد المدخر',
  cancelEyebrow: 'إنهاء المدخر',
  releaseHeading: 'إلى أي حساب نُحوّل المبلغ؟',
  cancelHeading: 'سننهي هذا المدخر ونحوّل رصيده.',
  releaseHelper:
    'يمكنك اختيار أي حساب من بنوكك المرتبطة — ليس بالضرورة المصدر الأصلي.',
  cancelHelper:
    'هذا الإجراء يوقف الدفعات التلقائية ويُنهي المدخر. سنحوّل ما تجمّع إلى الحساب الذي تختاره.',
  amountLabel: 'الرصيد المراد تحويله',
  cancelImpactTitle: 'بإنهائك للمدخر:',
  cancelImpact1: 'تتوقف الدفعات التلقائية فوراً.',
  cancelImpact2: 'يُحوَّل الرصيد كاملاً إلى الحساب الذي تختاره أدناه.',
  cancelImpact3: 'يُحفظ المدخر في سجل المُنهاة ولا يمكن استئنافه.',
  destinationLabel: 'الحساب الوجهة',
  cancel: 'تراجع',
  releaseSubmit: 'تحويل الآن',
  cancelSubmit: 'إنهاء وتحويل',
  processingTitle: 'جارٍ التحويل…',
  /** `amount` is the raw value; the riyal logo renders inline. */
  processingBody: (amount: string | number, bank: string, account: string): ReactNode => (
    <>جارٍ تحويل <Money amount={amount} /> إلى {bank} · {account}.</>
  ),
  successReleaseTitle: 'تم التحويل.',
  successCancelTitle: 'تم إنهاء المدخر.',
  successBody: (amount: string | number, bank: string, account: string): ReactNode => (
    <>حُوِّل <Money amount={amount} /> بنجاح إلى {bank} · {account}.</>
  ),
} as const;

// ─── Wizard ──────────────────────────────────────────────────
export const wizardLabels = {
  stepOf: (current: number, total: number) => `الخطوة ${current} من ${total}`,
  steps: {
    goal: 'الهدف',
    target: 'المبلغ والموعد',
    frequency: 'التكرار',
    source: 'المصدر',
    confirm: 'المراجعة',
  },
  back: 'رجوع',
  next: 'متابعة',
  submit: 'أنشئ المدخر',
  // Step 1 — goal
  goalHeading: 'ما هذا المدخر؟',
  goalHelper: 'أعطه اسماً تتذكره به.',
  titleLabel: 'عنوان الهدف',
  titlePlaceholder: 'مثال: رحلة الحج، كاميرا جديدة',
  // Step 2 — target
  targetHeading: 'كم تحتاج، ومتى؟',
  targetHelper: 'سنحسب لك الدفعة المناسبة بناءً على الموعد والتكرار.',
  targetAmountLabel: 'المبلغ المستهدف',
  targetDateLabel: 'تاريخ الوصول',
  targetDateHint: 'لا يقل عن أسبوع من اليوم.',
  // Step 3 — frequency
  frequencyHeading: 'كم مرة نخصم؟',
  frequencyHelper: 'كلما زاد التكرار، صغرت الدفعة الواحدة.',
  /** Error Callout shown when the picked frequency can't reach target in time. */
  frequencyTooSoonTitle: 'هذا التكرار لن يصل في الموعد',
  frequencyTooSoonBody: (frequency: MarsaFrequency, days: number) =>
    `التكرار "${frequencyLabels[frequency]}" يحتاج ${days} يوماً على الأقل بين اليوم وتاريخ الوصول. اختر تكراراً أقصر، أو عُد للخطوة السابقة وعدّل تاريخ الوصول.`,
  /** Live "first deposit" note shown once a valid frequency is picked. */
  firstDepositLabel: 'أول دفعة في',
  weeklyTitle: 'أسبوعياً',
  weeklySubtitle: 'دفعات أكثر، أصغر في القيمة',
  weeklyExample: 'الأنسب للأهداف القصيرة',
  biweeklyTitle: 'كل أسبوعين',
  biweeklySubtitle: 'توازن بين التكرار وحجم الدفعة',
  biweeklyExample: 'يتوافق مع كثير من الرواتب',
  monthlyTitle: 'شهرياً',
  monthlySubtitle: 'دفعة واحدة في الشهر',
  monthlyExample: 'الأنسب للأهداف بعيدة المدى',
  planTitle: 'الخطة المقترحة',
  /** `amount` is the raw per-cycle value; the riyal logo renders inline. */
  planSummary: (amount: string | number, every: string, cycles: string): ReactNode => (
    <>سنحوّل <Money amount={amount} /> {every} لمدة {cycles} حتى تصل إلى هدفك.</>
  ),
  planMissingDetails: 'أكمل المبلغ والتاريخ لرؤية الخطة.',
  // Step 4 — source
  sourceHeading: 'من أي حساب نخصم؟',
  sourceHelper: 'هذا الحساب سيُستخدم للدفعات التلقائية والإيداعات اليدوية.',
  bankLabel: 'البنك',
  accountLabel: 'الحساب',
  // Step 5 — confirm
  confirmHeading: 'هل كل شيء صحيح؟',
  confirmHelper: 'راجع التفاصيل، يمكنك التعديل بالعودة لأي خطوة سابقة.',
  summaryGoal: 'الهدف',
  summarySource: 'المصدر',
  summaryTarget: 'المبلغ المستهدف',
  summaryDeadline: 'تاريخ الوصول',
  summaryFrequency: 'التكرار',
  summaryPerCycle: 'دفعة كل دورة',
  summaryFirstDeposit: 'أول دفعة',
  retryNoteTitle: 'في حال فشل الدفعة',
  retryNoteBody:
    'سنعيد المحاولة تلقائياً حتى 3 مرات. إذا فشلت كل المحاولات، سنُشعرك لتعالجها يدوياً.',
} as const;

// ─── Misc ────────────────────────────────────────────────────
export const commonLabels = {
  close: 'إغلاق',
  saveTo: 'إلى',
  from: 'من',
} as const;
