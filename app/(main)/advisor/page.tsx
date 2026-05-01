'use client';

import { useEffect, useState } from 'react';
import { getAdvisorInsights, getNextRecommendation, applyRecommendation } from '@/lib/api';
import type { FinancialSummary, Investment, Recommendation } from '@/lib/api';
import InvestmentCard from '@/components/advisor/InvestmentCard';
import TabSwitch from '@/components/advisor/TabSwitch';
import MetricsView from '@/components/advisor/MetricsView';
import TransactionsView from '@/components/advisor/TransactionsView';
import { RefreshCw } from 'lucide-react';

export default function AdvisorPage() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'recommendations' | 'transactions'>('recommendations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [appliedHistory, setAppliedHistory] = useState<Recommendation[]>([]);
  const [newCardId, setNewCardId] = useState<string | null>(null);
  const [visibleInvestments, setVisibleInvestments] = useState<Investment[]>([]);
  const [investmentQueue, setInvestmentQueue] = useState<Investment[]>([]);
  const [allInvestments, setAllInvestments] = useState<Investment[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setNewCardId(null);
    setAppliedHistory([]);
    try {
      const result = await getAdvisorInsights(process.env.NEXT_PUBLIC_USER_ID || 'CUST001');
      const { recommendations, investments } = result.data;
      setRecs(recommendations.slice(0, 3));
      const invs = investments.length > 0 ? investments.slice(0, 6) : []; // Limit to 6 investments max
      setAllInvestments(invs);
      setVisibleInvestments(invs);
      setInvestmentQueue([]);
    } catch {
      setError('فشل الاتصال بالخادم. تأكد من تشغيل Flask API على المنفذ 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApplyRecommendation = async (recommendationId: string, accountId: string): Promise<boolean> => {
    const result = await applyRecommendation(
      recommendationId,
      process.env.NEXT_PUBLIC_USER_ID || 'CUST001',
      accountId
    );
    const msg = result.message || (result as any).error || '';
    if (result.success || msg.includes('مسبقاً')) return true;
    if (msg.includes('غير موجودة') || !msg) { fetchData(); return false; }
    return false;
  };

  const handleApplyDone = async (rec: Recommendation) => {
    setAppliedHistory(prev => [rec, ...prev]);
    setRecs(prev => prev.filter(r => r.id !== rec.id));
    setNewCardId(null);
    try {
      const remaining = recs.filter(r => r.id !== rec.id).map(r => r.id);
      const newRec = await getNextRecommendation(
        process.env.NEXT_PUBLIC_USER_ID || 'CUST001',
        remaining
      );
      setRecs(prev => [...prev, newRec]);
      setNewCardId(newRec.id);
      setTimeout(() => setNewCardId(null), 1000);
    } catch (e) {
      console.warn('Could not fetch replacement recommendation', e);
    }
  };

  const handleInvestDone = (investmentName: string) => {
    setVisibleInvestments(prev => {
      const remaining = prev.filter(inv => inv.name !== investmentName);
      if (investmentQueue.length > 0) {
        const next = investmentQueue[0];
        setInvestmentQueue(q => q.slice(1));
        return [...remaining, next];
      }
      const visibleNames = new Set(remaining.map(i => i.name));
      const cycled = allInvestments.find(i => !visibleNames.has(i.name));
      return cycled ? [...remaining, cycled] : remaining;
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #00D9A5',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '15px', color: '#64748B', fontWeight: '600' }}>جاري التحميل...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #FEE2E2',
          padding: '48px 40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#FEE2E2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '40px',
          }}></div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1F2937', marginBottom: '12px' }}>
            خطأ في الاتصال
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px', lineHeight: 1.6 }}>
            {error}
          </p>
          <button onClick={() => fetchData()} style={{
            padding: '12px 32px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00D9A5, #00C494)',
            color: 'white',
            border: 'none',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 217, 165, 0.3)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <RefreshCw size={16} /> إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const grouped = {
    high: recs.filter(r => r.priority === 'high'),
    medium: recs.filter(r => r.priority === 'medium'),
    low: recs.filter(r => r.priority === 'low'),
  };

  return (
    <>
      {/* Header - Friendly & Welcoming */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center',
        padding: '20px 0',
      }}>
        {/* Friendly Greeting Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          padding: '6px 16px',
          background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
          borderRadius: '999px',
        }}>
          <span style={{ fontSize: '20px' }}></span>
          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#065F46',
          }}>
            مرحباً بك
          </span>
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: '800',
          color: '#1A2B3C',
          marginBottom: '8px',
          letterSpacing: '-0.5px',
        }}>
          مستشارك المالي الذكي
        </h1>
        
        <p style={{
          fontSize: '14px',
          color: '#64748B',
          fontWeight: '500',
          maxWidth: '500px',
          margin: '0 auto',
        }}>
          نساعدك على تحسين وضعك المالي بتوصيات مخصصة لك
        </p>
      </div>

      {/* Tab Switcher - Centered */}
      <TabSwitch activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content based on active tab */}
      {activeTab === 'metrics' ? (
        <MetricsView userId={process.env.NEXT_PUBLIC_USER_ID || 'CUST001'} />
      ) : activeTab === 'transactions' ? (
        <TransactionsView userId={process.env.NEXT_PUBLIC_USER_ID || 'CUST001'} />
      ) : (
        <div style={{
          animation: 'fadeSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <style>{`
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Investments Only */}
          <section>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '0 4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00D9A5, #00C494)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}></div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A2B3C', marginBottom: '2px' }}>
                    فرص استثمارية
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748B' }}>
                    {visibleInvestments.length} فرص متاحة
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                background: '#D1FAE5',
                color: '#065F46',
                padding: '6px 14px',
                borderRadius: '999px',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)',
              }}>
                ✓ معتمد شرعياً
              </span>
            </div>
            {visibleInvestments.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '16px' 
              }}>
                {visibleInvestments.map((inv, i) => (
                  <InvestmentCard key={inv.name} investment={inv} onInvestDone={handleInvestDone} index={i} />
                ))}
              </div>
            ) : (
              <div style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: '#F9FAFB',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '32px',
                }}></div>
                <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                  لا توجد فرص استثمارية متاحة حالياً
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}