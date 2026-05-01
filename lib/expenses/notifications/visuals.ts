import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  SkipForward,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { commonLabels } from '../labels';
import { formatAmount } from '../../format';
import type { ExpenseVM, TransactionVM } from '../types';
import type { ExpenseNotificationType, ExpenseNotificationVM } from './types';

export type NotificationTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

interface VisualConfig {
  icon: LucideIcon;
  tone: NotificationTone;
}

export const notificationVisuals: Record<ExpenseNotificationType, VisualConfig> = {
  payment_failed: { icon: AlertCircle, tone: 'danger' },
  all_retries_exhausted: { icon: XCircle, tone: 'danger' },
  awaiting_confirmation: { icon: HelpCircle, tone: 'info' },
  auto_skipped: { icon: SkipForward, tone: 'neutral' },
  payment_succeeded: { icon: CheckCircle2, tone: 'success' },
  upcoming_payment: { icon: Clock, tone: 'warning' },
};

export interface NotificationDisplay {
  title: string;
  body: string;
}

/**
 * Build the Arabic title/body for a notification.
 * Prefers the joined `notif.context` (set by the API), falls back to the
 * passed-in expense + transaction (used by the cross-module bell that
 * resolves them client-side).
 */
export function buildNotificationDisplay(
  notif: ExpenseNotificationVM,
  expense?: ExpenseVM,
  tx?: TransactionVM,
): NotificationDisplay {
  const expenseTitle = notif.context?.expenseTitle ?? expense?.title ?? 'مصروف';
  const amountType = notif.context?.expenseAmountType ?? expense?.amountType;
  const amount = notif.context?.txAmount ?? tx?.amount ?? null;
  const failureReason = notif.context?.txFailureReason ?? tx?.failureReason ?? null;
  const amountStr = amount ? `${formatAmount(amount)} ${commonLabels.currency}` : '';

  switch (notif.type) {
    case 'payment_failed':
      return {
        title: `فشلت محاولة دفع ${expenseTitle}`,
        body: failureReason
          ? `السبب: ${failureReason}. سنُعيد المحاولة تلقائياً.`
          : 'سنُعيد المحاولة تلقائياً خلال 3 ساعات.',
      };
    case 'all_retries_exhausted':
      return {
        title: `فشلت كل محاولات ${expenseTitle}`,
        body: 'تحتاج إلى تسوية يدوية. اضغط لفتح صفحة الإجراء.',
      };
    case 'awaiting_confirmation':
      if (amountType === 'variable') {
        return {
          title: `أدخل مبلغ ${expenseTitle}`,
          body: 'الدورة بدأت — أدخل المبلغ قبل أن نخصمه.',
        };
      }
      return {
        title: `وافق على دفع ${expenseTitle}`,
        body: amountStr
          ? `بانتظار موافقتك على خصم ${amountStr}.`
          : 'بانتظار موافقتك قبل الخصم.',
      };
    case 'auto_skipped':
      return {
        title: `تم تخطي ${expenseTitle} تلقائياً`,
        body: 'لم يصلنا تأكيد منك خلال 24 ساعة، فتُخطّيت الدورة.',
      };
    case 'payment_succeeded':
      return {
        title: `تم دفع ${expenseTitle}`,
        body: amountStr ? `خُصم ${amountStr} بنجاح.` : 'تم الخصم بنجاح.',
      };
    case 'upcoming_payment':
      return {
        title: `${expenseTitle} مجدول قريباً`,
        body:
          amountType === 'variable'
            ? 'الدورة خلال 24 ساعة — حضّر المبلغ.'
            : amountStr
              ? `سيُخصم ${amountStr} خلال 24 ساعة.`
              : 'الدورة خلال 24 ساعة.',
      };
  }
}
