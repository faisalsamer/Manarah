'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  RefreshCw, Plus, Eye, Pencil, Trash2,
  TrendingUp, History, Settings,
  WalletCards, CheckCircle2, Clock3,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import { HawlRing } from '@/components/zakat/HawlRing'
import { AddAssetModal } from '@/components/zakat/AddAssetModal'
import { PayZakatModal } from '@/components/zakat/PayZakatModal'
import { AssetDetailModal } from '@/components/zakat/AssetDetailModal'
import { LiabilitiesSection } from '@/components/zakat/LiabilitiesSection'
import { ZakatDashboardSkeleton } from '@/components/zakat/ZakatSkeleton'


// ─── Types ────────────────────────────────────────────────────

interface HawlState {
  isActive: boolean
  isComplete: boolean
  startDate: string | null
  expectedEndDate: string | null
  daysPassed: number
  daysRemaining: number
  status: string
  message: string
}

interface Asset {
  id: string
  assetType: string
  customLabel: string | null
  description: string | null
  amount: number
  status: 'ACTIVE' | 'ZAKAT_PAID' | 'DELETED'
  ownedSince: string
}

interface CalcSummary {
  netWorth: number
  nisabValueSAR: number
  isAboveNisab: boolean
  zakatDue: boolean
  zakatAmount: number | null
  hawlDaysPassed: number
  hawlDaysRemaining: number
  nisabStandard: string
  bankBalanceTotal?: number
  manualAssetsTotal?: number
  liabilitiesTotal?: number
  zakatRate?: number
  goldPricePerGram?: number
  silverPricePerGram?: number
}

interface NisabPrices {
  gold: { pricePerGramSAR: number }
  silver: { pricePerGramSAR: number }
  goldNisabValueSAR: number
  silverNisabValueSAR: number
}

interface ComparisonSummary {
  checkedDays: number
  daysAboveNisab: number
  daysBelowNisab: number
  lastCheckedDate: string | null
  lastNetWorth: number | null
  lastNisabValueSAR: number | null
  currentlyAboveNisab: boolean
  hawlStartDate: string | null
  expectedEndDate: string | null
  daysPassed: number
  daysRemaining: number | null
  status: string
}

interface ChartEvent {
  type: 'hawl_start' | 'hawl_break' | 'latest_check'
  label: string
  detail: string
}

interface ChartPoint {
  date: string
  balance: number
  nisab: number
  isAboveNisab: boolean
  events?: ChartEvent[]
}

interface Account {
  account_id: string
  account_name: string
  balance: number
  bank_name: string
}

const ASSET_LABELS: Record<string, string> = {
  GOLD_SAVINGS:    'ذهب (مدخر)',
  SILVER_SAVINGS:  'فضة (مدخرة)',
  STOCKS:          'أسهم ومحافظ',
  CONFIRMED_DEBTS: 'ديون مضمونة',
  TRADE_GOODS:     'بضاعة تجارية',
  CASH:            'نقد خارج البنك',
  CUSTOM:          'أصل مخصص',
}

function formatMoney(value: number, digits = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatCompactMoney(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const HIJRI_AXIS_DAYS = {
  month: 30,
  '6months': 177,
  year: 354,
} as const

const HIJRI_MONTH_LABEL_LIMIT = {
  month: 2,
  '6months': 6,
  year: 12,
} as const

function parseChartDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00Z`)
}

function toChartDateString(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatArabicMonth(dateStr: string): string {
  return parseChartDate(dateStr).toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
    month: 'short',
  })
}

function formatArabicHijriYear(dateStr: string): string {
  return parseChartDate(dateStr).toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
    year: 'numeric',
  })
}

function formatArabicDateShort(dateStr: string): string {
  return parseChartDate(dateStr).toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getHijriMonthKey(dateStr: string): string {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(parseChartDate(dateStr))
  const year = parts.find((part) => part.type === 'year')?.value ?? ''
  const month = parts.find((part) => part.type === 'month')?.value ?? ''

  return `${year}-${month}`
}

function buildHijriMonthTicks(startDate: string, endDate: string, maxTicks: number) {
  const ticks: { date: string; key: string }[] = []
  const cursor = parseChartDate(startDate)
  const end = parseChartDate(endDate)
  let lastKey = ''

  while (cursor <= end) {
    const date = toChartDateString(cursor)
    const key = getHijriMonthKey(date)

    if (key !== lastKey) {
      ticks.push({ date, key })
      lastKey = key
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return ticks.slice(-maxTicks)
}

function NisabTrendChart({
  data,
  nisabLine,
  rangeStartDate,
  rangeEndDate,
  nisabStandard,
  maxMonthLabels,
}: {
  data: ChartPoint[]
  nisabLine: number
  rangeStartDate: string
  rangeEndDate: string
  nisabStandard: string
  maxMonthLabels: number
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: ChartPoint
    x: number
    y: number
  } | null>(null)
  const width = 1040
  const height = 430
  const padding = { top: 30, right: 158, bottom: 62, left: 82 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const values = data.flatMap((point) => [point.balance, point.nisab, nisabLine])
  const rawMinValue = Math.min(...values, 0)
  const rawMaxValue = Math.max(...values, 1)
  const verticalBuffer = Math.max((rawMaxValue - rawMinValue) * 0.08, rawMaxValue * 0.03, 1000)
  const minValue = Math.max(0, rawMinValue - verticalBuffer)
  const maxValue = rawMaxValue + verticalBuffer
  const range = Math.max(maxValue - minValue, 1)
  const startMs = parseChartDate(rangeStartDate).getTime()
  const endMs = Math.max(parseChartDate(rangeEndDate).getTime(), startMs + 1)
  const timeRange = endMs - startMs

  const getX = (date: string) => {
    const ratio = (parseChartDate(date).getTime() - startMs) / timeRange
    return padding.left + Math.min(1, Math.max(0, ratio)) * plotWidth
  }
  const getY = (value: number) =>
    padding.top + plotHeight - ((value - minValue) / range) * plotHeight

  const points = data.map((point) => `${getX(point.date)},${getY(point.balance)}`).join(' ')
  const nisabPoints = data.map((point) => `${getX(point.date)},${getY(point.nisab)}`).join(' ')
  const firstPointX = data[0] ? getX(data[0].date) : padding.left
  const lastPointX = data.at(-1) ? getX(data.at(-1)!.date) : padding.left + plotWidth
  const areaPoints = `${firstPointX},${padding.top + plotHeight} ${points} ${lastPointX},${padding.top + plotHeight}`
  const latestNisab = data.at(-1)?.nisab ?? nisabLine
  const latestBalance = data.at(-1)?.balance ?? 0
  const latestNisabY = getY(latestNisab)
  const latestBalanceY = getY(latestBalance)
  const ticks = buildHijriMonthTicks(rangeStartDate, rangeEndDate, maxMonthLabels)
  const nisabGramWeight = nisabStandard === 'GOLD' ? 85 : 595
  const yAxisTicks = Array.from({ length: 5 }, (_, index) => minValue + (range * index) / 4).reverse()
  const eventPoints = data
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.events?.length)
  const tooltipHeight = hoveredPoint
    ? 104 + Math.min(hoveredPoint.point.events?.length ?? 0, 2) * 18
    : 0
  const tooltipX = hoveredPoint
    ? hoveredPoint.x > width - 260 ? hoveredPoint.x - 238 : hoveredPoint.x + 14
    : 0
  const tooltipY = hoveredPoint
    ? Math.max(12, Math.min(hoveredPoint.y - 54, height - tooltipHeight - 12))
    : 0

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="تحليل مسار النصاب"
      onMouseLeave={() => setHoveredPoint(null)}
    >
      <defs>
        <linearGradient id="zakatBalanceArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00C48C" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#00C48C" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yAxisTicks.map((value) => {
        const y = getY(value)
        return (
          <g key={value}>
            <line
              x1={padding.left}
              x2={padding.left + plotWidth}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeDasharray="3 5"
            />
            <text
              x={padding.left - 12}
              y={y + 4}
              fill="var(--color-text-muted)"
              fontSize="11"
              fontWeight="700"
              textAnchor="end"
            >
              {formatCompactMoney(value)} ر.س
            </text>
          </g>
        )
      })}
      <line
        x1={padding.left}
        x2={padding.left}
        y1={padding.top}
        y2={padding.top + plotHeight}
        stroke="var(--color-border)"
        strokeWidth="1.2"
      />

      <polygon points={areaPoints} fill="url(#zakatBalanceArea)" />
      <polyline points={nisabPoints} fill="none" stroke="var(--color-danger)" strokeWidth="1.8" strokeOpacity="0.55" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 7" />
      <line
        x1={padding.left}
        x2={padding.left + plotWidth}
        y1={latestNisabY}
        y2={latestNisabY}
        stroke="var(--color-danger)"
        strokeWidth="2.6"
        strokeDasharray="9 7"
        strokeLinecap="round"
      />
      <polyline points={points} fill="none" stroke="#00A87A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <line
        x1={padding.left + plotWidth - 4}
        x2={padding.left + plotWidth + 6}
        y1={latestNisabY}
        y2={latestNisabY}
        stroke="var(--color-danger)"
        strokeWidth="2"
      />
      <text
        x={padding.left + plotWidth + 8}
        y={Math.min(height - padding.bottom - 4, Math.max(padding.top + 12, latestNisabY + 4))}
        fill="var(--color-danger)"
        fontSize="12"
        fontWeight="700"
        textAnchor="start"
      >
        {formatCompactMoney(latestNisab)} ر.س
      </text>
      <text
        x={padding.left + plotWidth + 8}
        y={Math.min(height - padding.bottom + 12, Math.max(padding.top + 28, latestNisabY + 20))}
        fill="var(--color-text-muted)"
        fontSize="10"
        textAnchor="start"
      >
        حد النصاب
      </text>
      <line
        x1={padding.left + plotWidth - 4}
        x2={padding.left + plotWidth + 6}
        y1={latestBalanceY}
        y2={latestBalanceY}
        stroke="#00A87A"
        strokeWidth="2.5"
      />
      <text
        x={padding.left + plotWidth + 8}
        y={Math.min(height - padding.bottom - 24, Math.max(padding.top + 12, latestBalanceY + 4))}
        fill="#00A87A"
        fontSize="12"
        fontWeight="800"
        textAnchor="start"
      >
        {formatCompactMoney(latestBalance)} ر.س
      </text>
      <text
        x={padding.left + plotWidth + 8}
        y={Math.min(height - padding.bottom - 8, Math.max(padding.top + 28, latestBalanceY + 20))}
        fill="var(--color-text-muted)"
        fontSize="10"
        textAnchor="start"
      >
        رصيدك
      </text>

      {data.map((point, index) => {
        const x = getX(point.date)
        const y = getY(point.balance)
        return (
          <g key={point.date}>
            <circle
              cx={x}
              cy={y}
              r={point.isAboveNisab ? 3 : 4}
              fill={point.isAboveNisab ? '#00C48C' : 'var(--color-danger)'}
              stroke="white"
              strokeWidth="1.5"
            />
            <circle
              cx={x}
              cy={y}
              r="11"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint({ point, x, y })}
              onMouseMove={() => setHoveredPoint({ point, x, y })}
            >
              <title>
                {`${formatArabicDateShort(point.date)} - صافي الثروة ${formatMoney(point.balance)} ر.س - النصاب ${formatMoney(point.nisab)} ر.س`}
              </title>
            </circle>
          </g>
        )
      })}

      {eventPoints.map(({ point, index }) => (
        <g
          key={`${point.date}-event`}
          transform={`translate(${getX(point.date)},${getY(point.balance)})`}
          onMouseEnter={() => setHoveredPoint({ point, x: getX(point.date), y: getY(point.balance) })}
          style={{ cursor: 'pointer' }}
        >
          <circle r="8" fill="white" stroke={point.events?.some((event) => event.type === 'hawl_break') ? 'var(--color-danger)' : '#00A87A'} strokeWidth="2" />
          <circle r="3" fill={point.events?.some((event) => event.type === 'hawl_break') ? 'var(--color-danger)' : '#00A87A'} />
        </g>
      ))}

      {ticks.map((point) => {
        return (
          <text
            key={point.date}
            x={getX(point.date)}
            y={height - 24}
            fill="var(--color-text-muted)"
            fontSize="10"
            fontWeight="700"
            textAnchor="middle"
          >
            <tspan x={getX(point.date)}>{formatArabicMonth(point.date)}</tspan>
            <tspan x={getX(point.date)} dy="14" fontSize="9" fontWeight="600">
              {formatArabicHijriYear(point.date)}
            </tspan>
          </text>
        )
      })}

      {hoveredPoint && (
        <g transform={`translate(${tooltipX},${tooltipY})`} pointerEvents="none">
          <rect
            width="224"
            height={tooltipHeight}
            rx="8"
            fill="var(--color-card-bg)"
            stroke="var(--color-border)"
            filter="drop-shadow(0 10px 22px rgba(15,23,42,0.14))"
          />
          <text x="204" y="22" textAnchor="end" fill="var(--color-text-primary)" fontSize="12" fontWeight="800">
            {formatArabicDateShort(hoveredPoint.point.date)}
          </text>
          <text x="204" y="42" textAnchor="end" fill={hoveredPoint.point.isAboveNisab ? '#00A87A' : 'var(--color-danger)'} fontSize="11" fontWeight="700">
            {hoveredPoint.point.isAboveNisab ? 'فوق النصاب' : 'تحت النصاب'}
          </text>
          <text x="204" y="60" textAnchor="end" fill="var(--color-text-secondary)" fontSize="11">
            صافي الثروة: {formatMoney(hoveredPoint.point.balance)} ر.س
          </text>
          <text x="204" y="78" textAnchor="end" fill="var(--color-text-secondary)" fontSize="11">
            نصاب اليوم: {formatMoney(hoveredPoint.point.nisab)} ر.س
          </text>
          <text x="204" y="96" textAnchor="end" fill="var(--color-text-secondary)" fontSize="11">
            سعر الغرام: {formatMoney(hoveredPoint.point.nisab / nisabGramWeight)} ر.س
          </text>
          {(hoveredPoint.point.events ?? []).slice(0, 2).map((event, index) => (
            <text
              key={`${event.type}-${index}`}
              x="204"
              y={116 + index * 18}
              textAnchor="end"
              fill={event.type === 'hawl_break' ? 'var(--color-danger)' : '#00A87A'}
              fontSize="11"
              fontWeight="700"
            >
              {event.label}
            </text>
          ))}
        </g>
      )}
    </svg>
  )
}

function MetalPriceTile({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: number
  accent: 'gold' | 'silver'
  hint?: string
}) {
  return (
    <div
      style={{
        padding: '14px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        minHeight: '86px',
      }}
    >
      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-primary)', fontWeight: 800, direction: 'ltr', textAlign: 'right' }}>
        {formatMoney(value)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <span style={{ fontSize: 'var(--text-caption)', color: accent === 'gold' ? 'var(--color-success)' : 'var(--color-primary-500)', fontWeight: 700 }}>
          مباشر من API
        </span>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
          ر.س / غم
        </span>
      </div>
      {hint && (
        <div style={{ marginTop: '8px', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', lineHeight: 'var(--leading-normal)' }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function ZakatStatusCard({
  summary,
  hawlState,
  prices,
  comparisonSummary,
  onPayClick,
  onHistoryClick,
}: {
  summary: CalcSummary | null
  hawlState: HawlState | null
  prices: NisabPrices | null
  comparisonSummary: ComparisonSummary | null
  onPayClick: () => void
  onHistoryClick: () => void
}) {
  const zakatAmount = summary?.zakatDue ? (summary.zakatAmount ?? 0) : 0
  const zakatRate = summary?.zakatRate ?? 0.025
  const zakatRatePercent = (zakatRate * 100).toFixed(1)
  const aboveNisab = comparisonSummary?.currentlyAboveNisab ?? summary?.isAboveNisab ?? false
  const isDue = zakatAmount > 0
  const hasActiveHawl = hawlState?.status === 'ACTIVE' || hawlState?.status === 'COMPLETED'
  const completionPercent = hasActiveHawl
    ? Math.min(100, Math.round(((hawlState?.daysPassed ?? 0) / 354) * 100))
    : 0
  const daysRemaining = hawlState?.status === 'ACTIVE'
    ? hawlState.daysRemaining
    : comparisonSummary?.daysRemaining ?? null

  if (isDue) {
    return (
      <div className="card" style={{ padding: '22px', borderTop: '3px solid var(--color-success)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '22px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: 'var(--radius-full)', background: 'var(--color-success-light)', color: 'var(--color-success)', fontSize: 'var(--text-caption)', fontWeight: 800 }}>
            <CheckCircle2 size={14} />
            تم بلوغ النصاب
          </span>
          <button
            onClick={onHistoryClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-caption)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}
          >
            <History size={13} />
            سجل الزكاة
          </button>
          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
            <WalletCards size={18} />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-caption)', fontWeight: 800 }}>
              مستحق اليوم
            </span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)', fontWeight: 800 }}>
              مبلغ الزكاة المستحق
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-start', gap: '8px', direction: 'ltr' }}>
            <span style={{ fontSize: '44px', lineHeight: 1, fontWeight: 900, color: 'var(--color-text-primary)', fontFamily: 'var(--font-numbers, Inter)' }}>
              {formatMoney(zakatAmount)}
            </span>
            <span style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-secondary)', fontWeight: 800 }}>
              ر.س
            </span>
          </div>
          <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-caption)', lineHeight: 'var(--leading-normal)' }}>
            محسوب تلقائياً: صافي الثروة {formatMoney(summary?.netWorth ?? 0)} ر.س × {zakatRatePercent}%.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <MetalPriceTile
            label="سعر الذهب لكل غرام (24 قيراط)"
            value={prices?.gold.pricePerGramSAR ?? summary?.goldPricePerGram ?? 0}
            accent="gold"
            hint={`نصاب الذهب 85 غ = ${formatMoney(prices?.goldNisabValueSAR ?? 0, 0)} ر.س`}
          />
          <MetalPriceTile
            label="سعر الفضة لكل غرام"
            value={prices?.silver.pricePerGramSAR ?? summary?.silverPricePerGram ?? 0}
            accent="silver"
            hint={`نصاب الفضة 595 غ = ${formatMoney(prices?.silverNisabValueSAR ?? 0, 0)} ر.س`}
          />
        </div>

        <Button variant="primary" size="md" fullWidth onClick={onPayClick}>
          دفع الزكاة الآن
        </Button>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '22px', borderTop: '3px solid var(--color-primary-500)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-h4)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            حالة الزكاة
          </h2>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
            مقارنة معاملاتك مع نصاب يومها
          </p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 11px', borderRadius: 'var(--radius-full)', background: aboveNisab ? 'var(--color-success-light)' : 'var(--color-surface)', color: aboveNisab ? 'var(--color-success)' : 'var(--color-text-secondary)', border: aboveNisab ? 'none' : '1px solid var(--color-border)', fontSize: 'var(--text-caption)', fontWeight: 800 }}>
          {aboveNisab ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
          {aboveNisab ? 'فوق النصاب' : 'تحت النصاب'}
        </span>
      </div>

      {hawlState && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <HawlRing
            daysPassed={hawlState.daysPassed}
            daysRemaining={hawlState.daysRemaining}
            status={hawlState.status}
          />
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <div style={{ fontSize: 'var(--text-body)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          {daysRemaining !== null
            ? `متبقي ${daysRemaining} يوم لاكتمال الحول`
            : hawlState?.status === 'BROKEN'
            ? 'انقطع الحول حسب سجل المعاملات'
            : 'لم يبدأ الحول بعد'}
        </div>
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', lineHeight: 'var(--leading-normal)' }}>
          {hawlState?.expectedEndDate
            ? `اكتمال الحول بنسبة ${completionPercent}% - تاريخ الاستحقاق المتوقع: ${hawlState.expectedEndDate}`
            : 'سيظهر العد التنازلي بعد أول يوم تكون فيه المحفظة فوق النصاب.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>
            سعر الفضة لكل غرام
          </div>
          <div style={{ fontSize: 'var(--text-body)', fontWeight: 800, color: 'var(--color-text-primary)', direction: 'ltr' }}>
            {prices?.silver.pricePerGramSAR.toFixed(2) ?? '0.00'} ر.س
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>
            سعر الذهب لكل غرام (24 قيراط)
          </div>
          <div style={{ fontSize: 'var(--text-body)', fontWeight: 800, color: 'var(--color-text-primary)', direction: 'ltr' }}>
            {prices?.gold.pricePerGramSAR.toFixed(2) ?? '0.00'} ر.س
          </div>
        </div>
      </div>
      {prices && (
        <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
          <div>نصاب الفضة: {formatMoney(prices.silverNisabValueSAR, 0)} ر.س</div>
          <div>نصاب الذهب: {formatMoney(prices.goldNisabValueSAR, 0)} ر.س</div>
        </div>
      )}

      {comparisonSummary && (
        <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-normal)' }}>
          فوق النصاب في {comparisonSummary.daysAboveNisab} من {comparisonSummary.checkedDays} نقاط مقارنة سابقة.
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function ZakatPage() {
  const router = useRouter()

  const [pageLoading, setPageLoading]     = useState(true)
  const [hawlState, setHawlState]         = useState<HawlState | null>(null)
  const [assets, setAssets]               = useState<Asset[]>([])
  const [summary, setSummary]             = useState<CalcSummary | null>(null)
  const [prices, setPrices]               = useState<NisabPrices | null>(null)
  const [chartData, setChartData]         = useState<ChartPoint[]>([])
  const [comparisonSummary, setComparisonSummary] = useState<ComparisonSummary | null>(null)
  const [calculationId, setCalculationId] = useState<string>('')
  const [chartRange, setChartRange]       = useState<'month' | '6months' | 'year'>('year')
  const [liabilitiesTotal, setLiabilitiesTotal] = useState(0)
  const [accounts, setAccounts] = useState<Account[]>([])

  const [showAddAsset, setShowAddAsset]   = useState(false)
  const [showPayModal, setShowPayModal]   = useState(false)
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null)
  const [detailAsset, setDetailAsset]     = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [loadingCalc, setLoadingCalc]     = useState(false)

  // ── Data fetchers ─────────────────────────────────────────

  const fetchHawl = useCallback(async () => {
    const res = await fetch('/api/zakat/hawl', {
      headers: { 'x-user-id': 'CUST001' },
      cache: 'no-store',
    })
    const data = await res.json()
    if (data.success) {
      setHawlState(data.data.hawlState)
      setChartData(data.data.chartData ?? [])
      setComparisonSummary(data.data.comparisonSummary ?? null)
    }
  }, [])

  const fetchAssets = useCallback(async () => {
    const res = await fetch('/api/zakat/assets', { headers: { 'x-user-id': 'CUST001' } })
    const data = await res.json()
    if (data.success) setAssets(data.data)
  }, [])

  const fetchPrices = useCallback(async () => {
    const res = await fetch(`/api/zakat/prices?refresh=${Date.now()}`, {
      headers: { 'x-user-id': 'CUST001' },
      cache: 'no-store',
    })
    const data = await res.json()
    if (data.success) setPrices(data.data)
  }, [])

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/banks/linked')
    const data = await res.json()
    if (Array.isArray(data)) {
      setAccounts(data.flatMap((bank) =>
        bank.accounts.map((account: any) => ({
          account_id: account.account_id,
          account_name: account.account_name || account.account_type,
          balance: Number(account.balance),
          bank_name: bank.bank_name_ar || bank.bank_name,
        }))
      ))
    }
  }, [])

  const runCalculation = useCallback(async (silent = false) => {
    if (!silent) setLoadingCalc(true)
    try {
      const res = await fetch('/api/zakat/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'CUST001' },
      })
      const data = await res.json()
      if (data.success) {
        setSummary(data.data.summary)
        setCalculationId(data.data.calculationId)
        setHawlState(data.data.hawlState)
      }
    } catch {
      if (!silent) toast.error('خطأ في الحساب')
    } finally {
      if (!silent) setLoadingCalc(false)
    }
  }, [])

  // ── Initial load ──────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        // Check setup first
        const res = await fetch('/api/zakat/setup', { headers: { 'x-user-id': 'CUST001' } })
        const data = await res.json()
        if (!data.data?.isSetupComplete) {
          router.replace('/zakat/setup')
          return
        }

        await Promise.all([fetchHawl(), fetchAssets(), fetchPrices(), fetchAccounts()])
        await runCalculation(true)
      } catch {
        // silent
      } finally {
        setPageLoading(false)
      }
    }
    init()
  }, [fetchHawl, fetchAssets, fetchPrices, fetchAccounts, runCalculation, router])

  // ── Delete asset ──────────────────────────────────────────

  const handleDeleteAsset = async () => {
    if (!deleteAssetId) return
    try {
      const res = await fetch(`/api/zakat/assets/${deleteAssetId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'CUST001' },
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم الحذف')
        fetchAssets()
        runCalculation(true)
      } else {
        toast.error('فشل الحذف', data.error)
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setDeleteAssetId(null)
    }
  }

  // ── Chart filter ──────────────────────────────────────────

  const sortedChartData = [...chartData].sort((a, b) => a.date.localeCompare(b.date))
  const chartWindow = (() => {
    const endDate = sortedChartData.at(-1)?.date ?? toChartDateString(new Date())
    const start = parseChartDate(endDate)
    start.setUTCDate(start.getUTCDate() - HIJRI_AXIS_DAYS[chartRange])

    return {
      startDate: toChartDateString(start),
      endDate,
    }
  })()

  const filteredChart = (() => {
    if (!sortedChartData.length) return []
    return sortedChartData.filter((d) =>
      parseChartDate(d.date) >= parseChartDate(chartWindow.startDate) &&
      parseChartDate(d.date) <= parseChartDate(chartWindow.endDate)
    )
  })()

  const nisabLine = filteredChart.length > 0
    ? filteredChart[filteredChart.length - 1].nisab
    : summary?.nisabValueSAR ?? 0

  const activeAssets    = assets.filter((a) => a.status === 'ACTIVE')
  const zakatPaidAssets = assets.filter((a) => a.status === 'ZAKAT_PAID')

  if (pageLoading) return <ZakatDashboardSkeleton />

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', maxWidth: '1520px', width: '100%', margin: '0 auto' }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-h1)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            لوحة تحكم الزكاة
          </h1>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
            راجع حالة تزكية مالك وتقدمك المالي لعام 1446 هـ
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="ghost"
            size="sm"
            startIcon={<Settings size={14} />}
            onClick={() => router.push('/zakat/receivers')}
          >
            جهات الاستلام
          </Button>
          <Button
            variant="ghost"
            size="sm"
            startIcon={<History size={14} />}
            onClick={() => router.push('/zakat/history')}
          >
            سجل الزكاة
          </Button>
          <Button
            variant="ghost"
            size="sm"
            startIcon={<RefreshCw size={14} className={loadingCalc ? 'animate-spin' : ''} />}
            onClick={() => runCalculation()}
            loading={loadingCalc}
          >
            محدّث الآن
          </Button>
        </div>
      </div>

      {/* ── Main two-column grid ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(340px, 360px)', gap: '24px', alignItems: 'start' }}>

        {/* ── Left column ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          {/* Chart */}
          <div className="card" style={{ padding: '24px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <TrendingUp size={16} style={{ color: 'var(--color-primary-400)' }} />
                  <h2 style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    تحليل مسار النصاب (آخر 12 شهر هجري)
                  </h2>
                </div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                  تتبع أداء الأصول مقابل حدود النصاب الشرعي
                </p>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', padding: '3px', border: '1px solid var(--color-border)' }}>
                {([{ key: 'month', label: 'شهر' }, { key: '6months', label: '6 أشهر' }, { key: 'year', label: '12 شهر هجري' }] as const).map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setChartRange(r.key)}
                    style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-xs)', border: 'none',
                      fontSize: 'var(--text-caption)', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-arabic)',
                      background: chartRange === r.key ? 'var(--color-card-bg)' : 'transparent',
                      color: chartRange === r.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      boxShadow: chartRange === r.key ? 'var(--shadow-xs)' : 'none',
                      transition: 'all 150ms ease',
                    }}
                  >{r.label}</button>
                ))}
              </div>
            </div>

            <div style={{ height: '430px' }}>
              {filteredChart.length > 0 ? (
                <NisabTrendChart
                  data={filteredChart}
                  nisabLine={nisabLine}
                  rangeStartDate={chartWindow.startDate}
                  rangeEndDate={chartWindow.endDate}
                  nisabStandard={summary?.nisabStandard ?? 'SILVER'}
                  maxMonthLabels={HIJRI_MONTH_LABEL_LIMIT[chartRange]}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
                  لا توجد بيانات كافية لعرض الرسم البياني
                </div>
              )}
            </div>
          </div>

          {/* AI tip */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                  🤖
                </div>
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  محرك الزكاة الذكي
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => runCalculation()} loading={loadingCalc}>
                محدث الآن
              </Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary-100)' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                {summary?.zakatDue
                  ? `الزكاة واجبة عليك الآن. مبلغها ${summary.zakatAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} ريال. يُنصح بالدفع في أقرب وقت.`
                  : summary?.isAboveNisab
                  ? `رصيدك فوق النصاب. تبقّى ${summary.hawlDaysRemaining} يوماً لاكتمال الحول. استمر في المتابعة.`
                  : 'ضع في اعتبارك دوران مخزونك التجاري لإجراء حسابات أكثر دقة للنصاب المعتمد على الفضة هذا الشهر.'}
              </p>
            </div>
          </div>

          {/* Untracked assets table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                الأصول غير المتتبعة
              </h2>
              <Button variant="primary" size="sm" startIcon={<Plus size={14} />} onClick={() => setShowAddAsset(true)}>
                إضافة أصل
              </Button>
            </div>

            {activeAssets.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
                لا توجد أصول مضافة — أضف ذهبك أو أسهمك أو ديونك المضمونة
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم الأصل</th>
                    <th>الفئة</th>
                    <th>القيمة</th>
                    <th>تم دفع الزكاة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 600 }}>
                        {asset.customLabel || ASSET_LABELS[asset.assetType] || asset.assetType}
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
                          {ASSET_LABELS[asset.assetType] || asset.assetType}
                        </span>
                      </td>
                      <td style={{ direction: 'ltr', textAlign: 'right', fontWeight: 600 }}>
                        {Number(asset.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-caption)', fontWeight: 600, background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                          لا
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button onClick={() => setDetailAsset({ id: asset.id, mode: 'view' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', borderRadius: '4px' }} title="عرض"><Eye size={14} /></button>
                          <button onClick={() => setDetailAsset({ id: asset.id, mode: 'edit' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', borderRadius: '4px' }} title="تعديل"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteAssetId(asset.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px', borderRadius: '4px' }} title="حذف"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {zakatPaidAssets.length > 0 && (
              <>
                <div style={{ padding: '8px 20px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  أصول تم دفع زكاتها
                </div>
                <table className="data-table">
                  <tbody>
                    {zakatPaidAssets.map((asset) => (
                      <tr key={asset.id} style={{ opacity: 0.65 }}>
                        <td style={{ fontWeight: 600 }}>{asset.customLabel || ASSET_LABELS[asset.assetType]}</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>{ASSET_LABELS[asset.assetType] || asset.assetType}</span></td>
                        <td style={{ direction: 'ltr', textAlign: 'right', fontWeight: 600 }}>{Number(asset.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-caption)', fontWeight: 600, background: 'var(--color-success-light)', color: 'var(--color-success)' }}>نعم</span></td>
                        <td><button onClick={() => setDetailAsset({ id: asset.id, mode: 'view' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', borderRadius: '4px' }}><Eye size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Liabilities section */}
          <LiabilitiesSection onTotalChange={setLiabilitiesTotal} />
        </div>

        {/* ── Right column ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <ZakatStatusCard
            summary={summary}
            hawlState={hawlState}
            prices={prices}
            comparisonSummary={comparisonSummary}
            onPayClick={() => setShowPayModal(true)}
            onHistoryClick={() => router.push('/zakat/history')}
          />

          {/* Prices card */}
          {!summary?.zakatDue && prices && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                أسعار المعادن اليوم
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'الذهب (24 قيراط)', value: `${prices.gold.pricePerGramSAR.toFixed(2)} ر.س/غم` },
                  { label: 'نصاب الذهب', value: `${prices.goldNisabValueSAR.toLocaleString('en-US', { maximumFractionDigits: 0 })} ر.س` },
                  { label: 'الفضة', value: `${prices.silver.pricePerGramSAR.toFixed(2)} ر.س/غم` },
                  { label: 'نصاب الفضة', value: `${prices.silverNisabValueSAR.toLocaleString('en-US', { maximumFractionDigits: 0 })} ر.س` },
                ].map((item, i) => (
                  <div key={item.label}>
                    {i === 2 && <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--color-text-primary)', direction: 'ltr' }}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Net worth summary */}
          {summary && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                ملخص الحساب
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'صافي الثروة', value: `${summary.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`, highlight: true },
                  { label: 'الديون المخصومة', value: liabilitiesTotal > 0 ? `− ${liabilitiesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س` : '—' },
                  { label: 'النصاب الحالي', value: `${summary.nisabValueSAR.toLocaleString('en-US', { maximumFractionDigits: 0 })} ر.س` },
                  { label: 'المعيار المستخدم', value: summary.nisabStandard === 'SILVER' ? 'الفضة' : 'الذهب' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: item.highlight ? 'var(--text-body)' : 'var(--text-caption)', fontWeight: item.highlight ? 700 : 600, color: item.highlight ? 'var(--color-primary-500)' : 'var(--color-text-primary)', direction: 'ltr' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      <AddAssetModal
        open={showAddAsset}
        onClose={() => setShowAddAsset(false)}
        onSuccess={() => { fetchAssets(); runCalculation(true) }}
      />

      {summary?.zakatAmount && (
        <PayZakatModal
          open={showPayModal}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => { fetchAssets(); fetchHawl(); fetchAccounts(); runCalculation(true) }}
          zakatAmount={summary.zakatAmount}
          calculationId={calculationId}
          accounts={accounts}
        />
      )}

      <AssetDetailModal
        assetId={detailAsset?.id ?? null}
        mode={detailAsset?.mode ?? 'view'}
        onClose={() => setDetailAsset(null)}
        onSuccess={() => { fetchAssets(); runCalculation(true) }}
      />

      <ConfirmDialog
        open={!!deleteAssetId}
        onClose={() => setDeleteAssetId(null)}
        onConfirm={handleDeleteAsset}
        title="حذف الأصل"
        description="هل أنت متأكد من حذف هذا الأصل؟ لن يتم تضمينه في حسابات الزكاة."
        confirmLabel="نعم، احذفه"
        variant="danger"
      />
    </div>
  )
}
