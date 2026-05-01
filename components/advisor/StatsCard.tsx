'use client';

import { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  title: string;
  value: number;
  unit?: string;
  decimals?: number;
  icon: LucideIcon;
  trend?: number;
  trendPositiveIsGood?: boolean;
  color: 'green' | 'blue' | 'purple' | 'orange';
  sparkData?: number[];
  delay?: number;
}

const cfg = {
  green:  { bg: '#E6FAF4', icon: '#00A876', stroke: '#00D9A5', glow: 'rgba(0,217,165,0.18)' },
  blue:   { bg: '#E8F0FF', icon: '#2979FF', stroke: '#5B9CF6', glow: 'rgba(41,121,255,0.15)' },
  purple: { bg: '#F3E8FF', icon: '#9333EA', stroke: '#A855F7', glow: 'rgba(147,51,234,0.15)' },
  orange: { bg: '#FFF3E0', icon: '#E65100', stroke: '#FF9800', glow: 'rgba(255,152,0,0.15)' },
};

function useCountUp(target: number, decimals = 0, delay = 0) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      started.current = true;
      const start = Date.now();
      const dur = 1100;
      const tick = setInterval(() => {
        const p = Math.min((Date.now() - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(parseFloat((target * eased).toFixed(decimals)));
        if (p >= 1) clearInterval(tick);
      }, 16);
      return () => clearInterval(tick);
    }, delay + 200);
    return () => clearTimeout(t);
  }, [target, decimals, delay]);
  return val;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 72, H = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const firstX = '0', lastX = W.toFixed(1);
  const firstY = (() => {
    const v = data[0];
    return (H - ((v - min) / range) * (H - 6) - 3).toFixed(1);
  })();
  const lastY = (() => {
    const v = data[data.length - 1];
    return (H - ((v - min) / range) * (H - 6) - 3).toFixed(1);
  })();

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${firstX},${firstY} ${pts} ${lastX},${H} ${firstX},${H}`}
        fill={`url(#sg-${color.replace('#', '')})`}
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

export default function StatsCard({
  title, value, unit, decimals = 0, icon: Icon, trend, trendPositiveIsGood = true, color, sparkData, delay = 0,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const animated = useCountUp(value, decimals, delay);
  const c = cfg[color];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay + 50);
    return () => clearTimeout(t);
  }, [delay]);

  const isGoodTrend = trend !== undefined
    ? trendPositiveIsGood ? trend >= 0 : trend <= 0
    : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: '14px',
        border: '1px solid #F0F4F8',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        boxShadow: hovered
          ? `0 8px 28px ${c.glow}, 0 2px 8px rgba(10,34,53,0.07)`
          : '0 1px 4px rgba(10,34,53,0.06)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.25s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '11px',
          background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.2s ease',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
        }}>
          <Icon size={20} style={{ color: c.icon }} />
        </div>
        {sparkData && <Sparkline data={sparkData} color={c.stroke} />}
      </div>

      <div>
        <div style={{ fontSize: '11px', color: '#9EAAB6', marginBottom: '4px', fontWeight: '500' }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
          <span style={{
            fontSize: '26px', fontWeight: '800',
            color: '#1A2B3C', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString('ar-SA')}
          </span>
          {unit && (
            <span style={{ fontSize: '13px', color: '#9EAAB6', fontWeight: '500' }}>{unit}</span>
          )}
        </div>
      </div>

      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            fontSize: '12px', fontWeight: '700',
            color: isGoodTrend ? '#00A876' : '#E53935',
            background: isGoodTrend ? '#E6FAF4' : '#FFEBEE',
            padding: '2px 7px', borderRadius: '999px',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
          <span style={{ fontSize: '11px', color: '#9EAAB6' }}>عن الشهر الماضي</span>
        </div>
      )}
    </div>
  );
}
