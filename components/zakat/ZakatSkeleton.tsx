'use client'

function SkeletonBox({
  width = '100%',
  height = '16px',
  radius = '6px',
  style = {},
}: {
  width?: string
  height?: string
  radius?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #E8EDF4 25%, #F0F4F8 50%, #E8EDF4 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

export function ZakatDashboardSkeleton() {
  return (
    <div style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBox width="200px" height="28px" />
          <SkeletonBox width="320px" height="16px" />
        </div>
        <SkeletonBox width="100px" height="36px" radius="20px" />
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Chart card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SkeletonBox width="220px" height="18px" />
                <SkeletonBox width="300px" height="13px" />
              </div>
              <SkeletonBox width="120px" height="32px" radius="8px" />
            </div>
            <SkeletonBox width="100%" height="260px" radius="8px" />
          </div>

          {/* Tip card */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SkeletonBox width="32px" height="32px" radius="50%" />
                <SkeletonBox width="120px" height="16px" />
              </div>
              <SkeletonBox width="80px" height="32px" radius="20px" />
            </div>
            <SkeletonBox width="100%" height="52px" radius="8px" />
          </div>

          {/* Assets table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <SkeletonBox width="140px" height="18px" />
              <SkeletonBox width="100px" height="32px" radius="20px" />
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <SkeletonBox width="140px" height="14px" />
                  <SkeletonBox width="80px" height="22px" radius="20px" />
                  <SkeletonBox width="100px" height="14px" />
                  <SkeletonBox width="40px" height="22px" radius="20px" />
                  <SkeletonBox width="60px" height="14px" style={{ marginRight: 'auto' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Hawl card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <SkeletonBox width="100px" height="18px" />
              <SkeletonBox width="70px" height="22px" radius="20px" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <SkeletonBox width="160px" height="160px" radius="50%" />
            </div>
            <SkeletonBox width="100%" height="36px" radius="8px" />
          </div>

          {/* Prices card */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <SkeletonBox width="140px" height="16px" style={{ marginBottom: '12px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <SkeletonBox width="100px" height="13px" />
                  <SkeletonBox width="80px" height="13px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}