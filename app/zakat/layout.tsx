'use client';

import Sidebar from '@/components/Sidebar';

export default function ZakatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-page-bg)',
        direction: 'rtl',
      }}
    >
      <Sidebar />
      <main
        style={{
          marginRight: 'var(--sidebar-width)',
          flex: 1,
          padding: '24px',
          minHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
}
