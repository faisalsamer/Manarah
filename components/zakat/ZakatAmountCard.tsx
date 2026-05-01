'use client';

import { Clock, TrendingUp, TrendingDown, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ZakatAmountCardProps {
  zakatAmount: number;
  daysRemaining?: number;
  goldPrice: number;
  goldChange?: number;
  silverPrice: number;
  silverChange?: number;
  onPayClick: () => void;
  onHistoryClick: () => void;
}

export function ZakatAmountCard({
  zakatAmount,
  daysRemaining,
  goldPrice,
  goldChange = 1.2,
  silverPrice,
  silverChange = -0.5,
  onPayClick,
  onHistoryClick,
}: ZakatAmountCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-card-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: '20px',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={onHistoryClick}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none',
            fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)',
            cursor: 'pointer', padding: '0',
          }}
        >
          <History size={13} />
          سجل الزكاة
        </button>

        {/* Nisab badge */}
        <span
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-success-light)',
            color: 'var(--color-success)',
            fontSize: 'var(--text-caption)',
            fontWeight: 600,
          }}
        >
          ✓ تم بلوغ النصاب
        </span>
      </div>

      {/* Amount */}
      <div style={{ marginBottom: '4px' }}>
        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          مبلغ الزكاة المستحق
        </p>
        <p
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            direction: 'ltr',
            textAlign: 'right',
            lineHeight: 1.1,
            fontFamily: 'var(--font-numbers, Inter)',
          }}
        >
          {zakatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span style={{ fontSize: '16px', fontWeight: 600, marginRight: '6px', color: 'var(--color-text-secondary)' }}>
            ر.س
          </span>
        </p>
      </div>

      {/* Days remaining */}
      {daysRemaining !== undefined && daysRemaining > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            marginBottom: '16px',
          }}
        >
          <Clock size={12} style={{ color: 'var(--color-warning)' }} />
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-warning)', fontWeight: 600 }}>
            متبقي {daysRemaining} يوماً
          </span>
        </div>
      )}

      {/* Metal prices */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px',
          padding: '12px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <PriceItem
          label="الذهب (24 قيراط)"
          value={goldPrice}
          unit="ر.س / غم"
          change={goldChange}
        />
        <PriceItem
          label="الفضة"
          value={silverPrice}
          unit="ر.س / غم"
          change={silverChange}
        />
      </div>

      {/* Pay button */}
      <Button variant="primary" size="md" fullWidth onClick={onPayClick}>
        دفع الزكاة الآن
      </Button>
    </div>
  );
}

function PriceItem({
  label, value, unit, change,
}: {
  label: string;
  value: number;
  unit: string;
  change: number;
}) {
  const isUp = change >= 0;
  return (
    <div>
      <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>{label}</p>
      <p
        style={{
          fontSize: 'var(--text-body)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          direction: 'ltr',
          textAlign: 'right',
        }}
      >
        {value.toFixed(2)}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
        {isUp
          ? <TrendingUp size={11} style={{ color: 'var(--color-success)' }} />
          : <TrendingDown size={11} style={{ color: 'var(--color-danger)' }} />}
        <span
          style={{
            fontSize: '10px',
            color: isUp ? 'var(--color-success)' : 'var(--color-danger)',
            fontWeight: 600,
          }}
        >
          {isUp ? '+' : ''}{change}%
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginRight: '2px' }}>{unit}</span>
      </div>
    </div>
  );
}