'use client';

import type { CSSProperties } from 'react';
import { formatAmount } from '@/lib/format';

const ARIA = 'ريال سعودي';

export interface RiyalSignProps {
  /**
   * Visual height. Defaults to `1em` so the glyph scales with the surrounding
   * font-size automatically.
   */
  size?: number | string;
  /** Extra classes for the wrapper span. */
  className?: string;
  /** Override the inline svg style (e.g. opacity). */
  style?: CSSProperties;
}

// Inlining the SAMA glyph (instead of <img src="/banks/Riyal.png">) so it
// inherits color via `currentColor` — same icon renders dark on light bg
// and white on the sidebar's dark bg without per-call variants.
export function RiyalSign({ size = '1em', className = '', style }: RiyalSignProps) {
  return (
    <span
      role="img"
      aria-label={ARIA}
      className={[
        'inline-flex items-center justify-center align-baseline',
        'shrink-0',
        className,
      ].join(' ')}
      style={{
        height: typeof size === 'number' ? `${size}px` : size,
        width: typeof size === 'number' ? `${size}px` : size,
        verticalAlign: '-0.1em',
      }}
    >
      <svg
        viewBox="0 0 1124.14 1256.39"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        focusable="false"
        style={{ height: '100%', width: 'auto', fill: 'currentColor', ...style }}
      >
        <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
        <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
      </svg>
    </span>
  );
}

export interface MoneyProps {
  /** Numeric or stringified amount. Always rendered with 2 decimals. */
  amount: string | number | null | undefined;
  /** Extra classes for the wrapper span (use `font-numbers` if needed). */
  className?: string;
  /** Visual size of the riyal sign. Defaults to `1em`. */
  signSize?: number | string;
}

/**
 * Renders `{formatted amount} {RiyalSign}` together as one unbreakable
 * inline group. Use this anywhere you'd otherwise template
 * `${formatAmount(x)} ${currency}` — it keeps the number and sign on the
 * same line and ensures consistent spacing.
 */
export function Money({ amount, className = '', signSize }: MoneyProps) {
  return (
    <span className={['inline-flex items-baseline gap-1 whitespace-nowrap', className].join(' ')}>
      <span className="font-numbers">{formatAmount(amount)}</span>
      <RiyalSign size={signSize} />
    </span>
  );
}
