'use client';

import { Bell, Search } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="navbar">
      {/* Search */}
      <label className="search-input" style={{ width: '260px', cursor: 'text' }}>
        <Search size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="بحث في حسابك..."
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--color-text-primary)',
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
      </label>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button style={{
          position: 'relative',
          padding: '7px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: '5px', left: '5px',
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: 'var(--color-danger)',
            border: '1.5px solid white',
          }} />
        </button>

        <div style={{ width: '1px', height: '28px', background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              أحمد الفارسي
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              عميل مميز
            </div>
          </div>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '15px', fontWeight: '700', color: 'white', flexShrink: 0,
          }}>
            أ
          </div>
        </div>
      </div>
    </header>
  );
}
