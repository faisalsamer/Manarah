'use client';

import { useEffect, useState } from 'react';
import { getUserTransactions, type Transaction } from '@/lib/api';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TransactionsViewProps {
  userId: string;
}

export default function TransactionsView({ userId }: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const data = await getUserTransactions(userId);
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, [userId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>جاري التحميل...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '60px 40px',
        textAlign: 'center',
        border: '1px solid #E5E7EB',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
          لا توجد معاملات بعد
        </h3>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          ستظهر هنا جميع التوصيات والاستثمارات التي قمت بتطبيقها
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return { bg: '#D1FAE5', text: '#065F46', icon: CheckCircle2 };
      case 'pending': return { bg: '#FEF3C7', text: '#92400E', icon: Clock };
      case 'active': return { bg: '#DBEAFE', text: '#1E40AF', icon: CheckCircle2 };
      default: return { bg: '#F3F4F6', text: '#6B7280', icon: AlertCircle };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      animation: 'fadeSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header Stats - 4 Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #00D9A5, #00C494)',
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0, 217, 165, 0.25)',
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>إجمالي المعاملات</div>
          <div style={{ fontSize: '28px', fontWeight: '800' }}>{transactions.length}</div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}>
          <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>التوصيات المطبقة</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1F2937' }}>
            {transactions.filter(t => t.type === 'recommendation').length}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}>
          <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>الاستثمارات</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#00D9A5' }}>
            {transactions.filter(t => t.type === 'investment').length}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}>
          <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>الأهداف المنشأة</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1F2937' }}>
            {transactions.filter(t => t.type === 'savings_goal').length}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1F2937', marginBottom: '24px' }}>
          السجل الزمني
        </h3>

        <div style={{ position: 'relative' }}>
          {/* Timeline Line */}
          <div style={{
            position: 'absolute',
            right: '21px',
            top: '0',
            bottom: '0',
            width: '2px',
            background: '#E5E7EB',
          }} />

          {/* Transactions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {transactions.map((transaction, index) => {
              const statusColor = getStatusColor(transaction.status);
              const StatusIcon = statusColor.icon;

              return (
                <div
                  key={transaction.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    position: 'relative',
                    animation: `slideIn 0.4s ease-out ${index * 50}ms backwards`,
                  }}
                >
                  <style>{`
                    @keyframes slideIn {
                      from {
                        opacity: 0;
                        transform: translateX(-20px);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(0);
                      }
                    }
                  `}</style>

                  {/* Icon Dot */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'white',
                    border: '3px solid #00D9A5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {transaction.icon}
                  </div>

                  {/* Content Card */}
                  <div style={{
                    flex: 1,
                    background: '#F9FAFB',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #E5E7EB',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1F2937', marginBottom: '4px' }}>
                          {transaction.title}
                        </h4>
                        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
                          {transaction.description}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: statusColor.bg,
                        color: statusColor.text,
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        flexShrink: 0,
                      }}>
                        <StatusIcon size={14} />
                        {transaction.status === 'completed' ? 'مكتمل' : transaction.status === 'active' ? 'نشط' : 'قيد الانتظار'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {formatDate(transaction.created_at)}
                      </span>

                      {transaction.amount && (
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#00D9A5' }}>
                          {transaction.amount.toLocaleString()} ر.س
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}