'use client';

import { useState } from 'react';
import { type Investment, trackInvestment } from '@/lib/api';
import BankAccountSelector from './BankAccountSelector';

export default function InvestmentCard({
  investment,
  onInvestDone,
  index = 0,
}: {
  investment: Investment;
  onInvestDone: (name: string) => void;
  index?: number;
}) {
  const [investing, setInvesting] = useState(false);
  const [invested, setInvested] = useState(false);
  const [showBankSelector, setShowBankSelector] = useState(false);

  const handleButtonClick = () => {
    setShowBankSelector(true);
  };

  const handleAccountSelected = async (accountId: string) => {
    console.log('✅ Selected account for investment:', accountId);
    
    setInvesting(true);
    
    // Track investment in database
    await trackInvestment(
      process.env.NEXT_PUBLIC_USER_ID || 'CUST001',
      investment.name,
      investment,
      accountId
    );
    
    // Play success sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    setTimeout(() => {
      setInvesting(false);
      setInvested(true);
      
      // Slide out to the RIGHT and remove
      setTimeout(() => {
        onInvestDone(investment.name);
      }, 800);
    }, 1500);
  };

  const riskColors = {
    low: { bg: '#D1FAE5', text: '#065F46', icon: '🟢' },
    medium: { bg: '#FEF3C7', text: '#92400E', icon: '🟡' },
    high: { bg: '#FEE2E2', text: '#991B1B', icon: '🔴' },
  };

  const risk = riskColors[investment.risk_level as keyof typeof riskColors] || riskColors.medium;

  return (
    <>
      <div
        style={{
          background: invested ? '#F0FDF4' : 'white',
          borderRadius: '14px',
          border: invested ? '1px solid #10B981' : '1px solid #E5E7EB',
          padding: '18px 20px',
          boxShadow: invested ? '0 4px 12px rgba(16,185,129,0.2)' : '0 1px 4px rgba(10,34,53,0.06)',
          animation: invested 
            ? 'slideOutRight 0.8s cubic-bezier(0.4, 0, 1, 1) forwards'
            : `slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 80}ms backwards`,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '16px' }}>{invested ? '✅' : risk.icon}</span>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: invested ? '#065F46' : risk.text,
              background: invested ? '#D1FAE5' : risk.bg,
              padding: '4px 10px',
              borderRadius: '999px',
            }}>
              {invested ? 'تم الاستثمار' : `مخاطر ${investment.risk_level === 'low' ? 'منخفضة' : investment.risk_level === 'medium' ? 'متوسطة' : 'عالية'}`}
            </span>
          </div>
          
          <span style={{
            fontSize: '10px',
            fontWeight: '700',
            background: '#D1FAE5',
            color: '#065F46',
            padding: '4px 8px',
            borderRadius: '4px',
          }}>
            حلال ✓
          </span>
        </div>

        {/* Investment Name */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
          {investment.name_ar || investment.name}
        </h3>

        {/* Details Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px',
          marginBottom: '12px',
          padding: '12px',
          background: '#F9FAFB',
          borderRadius: '10px',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px' }}>الحد الأدنى</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>
              {investment.min_investment} <span style={{ fontSize: '12px' }}>ر.س</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px' }}>العائد سنوياً</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#10B981' }}>
              {investment.expected_return}
            </div>
          </div>
        </div>

        {/* Reason */}
        {investment.reason && (
          <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6, marginBottom: '12px' }}>
            {investment.reason}
          </p>
        )}

        {/* Action Button */}
        <button
          onClick={handleButtonClick}
          disabled={investing || invested}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '999px',
            background: invested 
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'linear-gradient(135deg, #00D9A5, #00C494)',
            color: 'white',
            border: 'none',
            fontSize: '14px',
            fontWeight: '700',
            cursor: (investing || invested) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: invested 
              ? '0 4px 14px rgba(16,185,129,0.4)'
              : '0 4px 14px rgba(0,217,165,0.35)',
            transition: 'all 0.2s',
            opacity: (investing || invested) ? 0.8 : 1,
          }}
        >
          {investing ? ' جاري الاستثمار...' : invested ? '✓ تم بنجاح' : 'استثمر الآن'}
        </button>

        <style jsx>{`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideOutRight {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(100px);
            }
          }
        `}</style>
      </div>

      {/* Bank Account Selector Modal */}
      <BankAccountSelector
        userId={process.env.NEXT_PUBLIC_USER_ID || 'CUST001'}
        isOpen={showBankSelector}
        onClose={() => setShowBankSelector(false)}
        onSelect={handleAccountSelected}
        title="اختر الحساب للاستثمار"
      />
    </>
  );
}