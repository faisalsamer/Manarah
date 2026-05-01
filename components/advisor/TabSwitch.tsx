'use client';

interface TabSwitchProps {
  activeTab: 'metrics' | 'recommendations' | 'transactions';
  onTabChange: (tab: 'metrics' | 'recommendations' | 'transactions') => void;
}

export default function TabSwitch({ activeTab, onTabChange }: TabSwitchProps) {
  const tabs = [
    { id: 'metrics' as const, label: 'الاحصائيات', icon: '' },
    { id: 'recommendations' as const, label: 'التوصيات', icon: '' },
    { id: 'transactions' as const, label: 'السجل', icon: '' },
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '32px',
    }}>
      <div style={{
        display: 'inline-flex',
        background: 'white',
        padding: '6px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E5E7EB',
        gap: '4px',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #00D9A5, #00C494)'
                : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748B',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === tab.id
                ? '0 4px 12px rgba(0, 217, 165, 0.3)'
                : 'none',
              transform: activeTab === tab.id ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}