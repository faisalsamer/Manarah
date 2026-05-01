import {
  AlertCircle,
  Clock,
  Sparkles,
  Trophy,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Money } from '@/components/ui/RiyalSign';
import type { MarsaTransactionVM, MarsaVM } from '../types';
import { marsaProgress } from '../utils';
import type { MarsaNotificationType, MarsaNotificationVM } from './types';

export type NotificationTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

interface VisualConfig {
  icon: LucideIcon;
  tone: NotificationTone;
}

export const marsaNotificationVisuals: Record<MarsaNotificationType, VisualConfig> = {
  deposit_failed:        { icon: AlertCircle, tone: 'danger'  },
  all_retries_exhausted: { icon: XCircle,     tone: 'danger'  },
  goal_reached:          { icon: Trophy,      tone: 'success' },
  milestone_reached:     { icon: Sparkles,    tone: 'info'    },
  upcoming_deposit:      { icon: Clock,       tone: 'warning' },
};

export interface NotificationDisplay {
  title: string;
  /**
   * Body is a ReactNode (not a string) so we can embed the SAR riyal logo
   * inline via <Money />. NotificationItem renders this directly inside <p>.
   */
  body: ReactNode;
}

/**
 * Build the Arabic title/body for a marasi notification given the linked
 * Marsa + transaction.
 */
export function buildMarsaNotificationDisplay(
  notif: MarsaNotificationVM,
  marsa: MarsaVM | undefined,
  tx: MarsaTransactionVM | undefined,
): NotificationDisplay {
  const goalTitle = marsa?.title ?? 'مدخر';
  const txAmount = tx?.amount ?? marsa?.periodicAmount ?? null;

  switch (notif.type) {
    case 'deposit_failed':
      return {
        title: `فشل إيداع ${goalTitle}`,
        body: tx?.failureReason
          ? `السبب: ${tx.failureReason}. سنُعيد المحاولة تلقائياً.`
          : 'سنُعيد المحاولة تلقائياً خلال الساعات القادمة.',
      };
    case 'all_retries_exhausted':
      return {
        title: `فشلت كل محاولات ${goalTitle}`,
        body: 'استنفذنا المحاولات. افتح المدخر لإعادة المحاولة يدوياً.',
      };
    case 'goal_reached':
      return {
        title: `${goalTitle} اكتمل`,
        body: marsa ? (
          <>بلغ رصيدك <Money amount={marsa.targetAmount} />. يمكنك تحويله إلى أي حساب.</>
        ) : (
          'تهانينا! بلغت هدفك.'
        ),
      };
    case 'milestone_reached': {
      const pct = marsa ? Math.floor(marsaProgress(marsa) / 25) * 25 : null;
      return {
        title: `${goalTitle} تجاوز ${pct ?? 25}%`,
        body: 'الادخار يسير في الموعد — تابع كما أنت.',
      };
    }
    case 'upcoming_deposit':
      return {
        title: `${goalTitle} — دفعة قريباً`,
        body: txAmount ? (
          <>سنخصم <Money amount={txAmount} /> خلال 24 ساعة. تأكد من توفر الرصيد.</>
        ) : (
          'الدورة القادمة خلال 24 ساعة.'
        ),
      };
  }
}
