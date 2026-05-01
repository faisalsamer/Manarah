'use client';

import { useState } from 'react';
import { type Recommendation } from '@/lib/api';
import { CheckCircle2, Loader2 } from 'lucide-react';
import BankAccountSelector from './BankAccountSelector';

export default function RecommendationCard({
  recommendation,
  onApply,
  onApplyDone,
  isNew = false,
  index = 0,
}: {
  recommendation: Recommendation;
  onApply: (accountId: string) => Promise<boolean>;
  onApplyDone: () => void;
  isNew?: boolean;
  index?: number;
}) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(recommendation.is_applied || false);
  const [flipping, setFlipping] = useState(false);
  const [showBankSelector, setShowBankSelector] = useState(false);

  const playSuccessSound = () => {
    // iOS-style success sound (clean double beep like Apple Pay)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First beep
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 1000;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.1);
    
    // Second beep (slightly higher pitch)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 1200;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
    osc2.start(audioContext.currentTime + 0.1);
    osc2.stop(audioContext.currentTime + 0.25);
  };

  const handleButtonClick = () => {
    // Open bank selector modal
    setShowBankSelector(true);
  };

  const handleAccountSelected = async (accountId: string) => {
    setApplying(true);
    
    try {
      const success = await onApply(accountId);
      if (success) {
        // Start flip animation
        setFlipping(true);
        
        // Play success sound
        playSuccessSound();
        
        // After flip completes, show "applied" state
        setTimeout(() => {
          setApplied(true);
          setFlipping(false);
          setApplying(false);
          
          // Wait a bit, then slide out to the LEFT
          setTimeout(() => {
            onApplyDone();
          }, 1200);
        }, 600); // Match flip animation duration
        
      } else {
        setApplying(false);
      }
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      setApplying(false);
    }
  };

  const priorityColors = {
    high: { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626' },
    medium: { bg: '#FFFBEB', border: '#F59E0B', text: '#D97706' },
    low: { bg: '#F0FDF4', border: '#10B981', text: '#059669' },
  };

  const colors = priorityColors[recommendation.priority as keyof typeof priorityColors] || priorityColors.medium;

  return (
    <>
      <div
        style={{
          background: applied ? '#F0FDF4' : colors.bg,
          borderRadius: '14px',
          border: `1px solid ${applied ? '#10B981' : colors.border}`,
          borderRightWidth: '4px',
          borderRightColor: applied ? '#10B981' : colors.border,
          padding: '18px 20px',
          display: 'flex',
          gap: '14px',
          boxShadow: applied ? '0 4px 12px rgba(16,185,129,0.15)' : '0 1px 4px rgba(10,34,53,0.05)',
          animation: applied 
            ? 'slideOutLeft 0.8s cubic-bezier(0.4, 0, 1, 1) 0.4s forwards'
            : isNew 
            ? `slideInLeft 0.5s ease-out` 
            : flipping 
            ? 'flipCard 0.6s ease-in-out'
            : `slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 80}ms backwards`,
          transition: 'all 0.3s ease',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: applied ? '#10B981' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.3s ease',
          }}
        >
          {applied ? (
            <CheckCircle2 size={24} color="white" />
          ) : (
            <span style={{ fontSize: '20px' }}>💡</span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', color: '#1F2937', lineHeight: 1.6, marginBottom: '12px' }}>
            {recommendation.message}
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleButtonClick}
              disabled={applying || applied}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                background: applied 
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #00D9A5, #00C494)',
                color: 'white',
                border: 'none',
                fontSize: '13px',
                fontWeight: '600',
                cursor: applying || applied ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: applying || applied ? 0.85 : 1,
                transition: 'all 0.2s',
                boxShadow: applied 
                  ? '0 4px 12px rgba(16,185,129,0.3)'
                  : '0 4px 12px rgba(0,217,165,0.25)',
              }}
            >
              {applying ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  جاري التطبيق...
                </>
              ) : applied ? (
                <>
                  <CheckCircle2 size={14} />
                  تم التطبيق ✓
                </>
              ) : (
                'تطبيق الآن'
              )}
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideOutLeft {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(-100px);
            }
          }
          
          @keyframes flipCard {
            0% {
              transform: rotateY(0deg);
            }
            50% {
              transform: rotateY(90deg);
            }
            100% {
              transform: rotateY(0deg);
            }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Bank Account Selector Modal */}
      <BankAccountSelector
        userId={process.env.NEXT_PUBLIC_USER_ID || 'CUST001'}
        isOpen={showBankSelector}
        onClose={() => setShowBankSelector(false)}
        onSelect={handleAccountSelected}
        title="اختر الحساب للتطبيق"
      />
    </>
  );
}