'use client';

import { HIJRI_YEAR_DAYS } from '@/lib/zakat/constants';

interface HawlRingProps {
  daysPassed: number;
  daysRemaining: number;
  status: string;
}

export function HawlRing({ daysPassed, daysRemaining, status }: HawlRingProps) {
  const total = HIJRI_YEAR_DAYS; // 354
  const hasActiveCountdown = status === 'ACTIVE' || status === 'COMPLETED';
  const progress = hasActiveCountdown ? Math.min(1, daysPassed / total) : 0;
  const percent = Math.round(progress * 100);

  // SVG circle math
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const color =
    status === 'COMPLETED'
      ? '#00C48C'
      : status === 'BROKEN'
      ? '#E53935'
      : '#00C48C';

  const trackColor =
    status === 'BROKEN' ? 'rgba(229,57,53,0.15)' : 'rgba(0,196,140,0.15)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 600ms ease' }}
          />
        </svg>

        {/* Center content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {status === 'COMPLETED' ? (
            <>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#00C48C' }}>مكتمل</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>الحول</span>
            </>
          ) : status === 'BROKEN' ? (
            <>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#E53935' }}>انقطع</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>الحول</span>
            </>
          ) : status === 'PENDING' ? (
            <>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>لم يبدأ</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>الحول</span>
            </>
          ) : (
            <>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                  fontFamily: 'var(--font-numbers, Inter)',
                  direction: 'ltr',
                }}
              >
                {daysRemaining}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                يوم متبقي
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress text */}
      <p
        style={{
          fontSize: 'var(--text-caption)',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
        }}
      >
        {status === 'COMPLETED'
          ? 'الزكاة واجبة الآن'
          : status === 'BROKEN'
          ? 'انقطع الحول — في انتظار عودة الرصيد'
          : status === 'PENDING'
          ? 'في انتظار بلوغ النصاب'
          : `اكتمال الحول بنسبة ${percent}%`}
      </p>
    </div>
  );
}
