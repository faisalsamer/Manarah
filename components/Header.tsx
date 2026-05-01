'use client';

import { Search } from 'lucide-react';
import { NotificationBell } from './notifications/NotificationBell';
import type { CurrentUser } from '@/lib/user';

export interface HeaderProps {
  user: CurrentUser;
}

export default function Navbar({ user }: HeaderProps) {
  const initial = user.name.trim().charAt(0) || '?';

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
        <NotificationBell />

        <div style={{ width: '1px', height: '28px', background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              {user.name}
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
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
