'use client';

import { useState, useEffect } from 'react';
import { Building2, Check } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface Receiver {
  id: string;
  label: string;
  iban: string;
  accountName: string;
  bankName?: string;
  isCharity: boolean;
}

interface Account {
  account_id: string;
  account_name: string;
  balance: number;
  bank_name: string;
}

interface PayZakatModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zakatAmount: number;
  calculationId: string;
  accounts: Account[];
}

export function PayZakatModal({
  open,
  onClose,
  onSuccess,
  zakatAmount,
  calculationId,
  accounts,
}: PayZakatModalProps) {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [selectedReceiverId, setSelectedReceiverId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>('form');

  useEffect(() => {
    if (!open) return;
    setPhase('form');
    fetchReceivers();
  }, [open]);

  const fetchReceivers = async () => {
    try {
      const res = await fetch('/api/zakat/receivers');
      const data = await res.json();
      if (data.success) {
        setReceivers(data.data);
        const def = data.data.find((r: any) => r.isDefault);
        if (def) setSelectedReceiverId(def.id);
      }
    } catch {
      // silent
    }
  };

  const selectedAccount = accounts.find((a) => a.account_id === selectedAccountId);
  const hasEnough = selectedAccount ? selectedAccount.balance >= zakatAmount : false;
  const canPay = selectedReceiverId && selectedAccountId && hasEnough;

  const handlePay = async () => {
    if (!canPay) return;
    setLoading(true);
    setPhase('processing');

    try {
      const res = await fetch('/api/zakat/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculationId,
          amount: zakatAmount,
          fromAccountId: selectedAccountId,
          receiverId: selectedReceiverId,
          notes,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error('فشل الدفع', data.error);
        setPhase('form');
        return;
      }

      // Slight delay for UX
      await new Promise((r) => setTimeout(r, 800));
      setPhase('success');

      setTimeout(() => {
        onSuccess();
        onClose();
        toast.success('تم دفع الزكاة بنجاح', 'جزاك الله خيراً');
      }, 1500);
    } catch {
      toast.error('خطأ في الاتصال');
      setPhase('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={phase === 'form' ? onClose : () => {}}
      title={phase === 'form' ? 'دفع الزكاة' : undefined}
      size="md"
      closeOnOverlayClick={phase === 'form'}
      closeOnEscape={phase === 'form'}
      showCloseButton={phase === 'form'}
    >
      {phase === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px', paddingBottom: '8px' }}>

          {/* Amount banner */}
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px',
              background: 'var(--color-success-light)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(0,196,140,0.3)',
            }}
          >
            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
              مبلغ الزكاة الواجب
            </span>
            <span
              style={{
                fontSize: '22px', fontWeight: 700,
                color: 'var(--color-success)',
                direction: 'ltr',
                fontFamily: 'var(--font-numbers, Inter)',
              }}
            >
              {zakatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
            </span>
          </div>

          {/* Source account */}
          <div>
            <label
              style={{
                display: 'block', fontSize: 'var(--text-body-sm)',
                fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px',
              }}
            >
              الدفع من حساب
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {accounts.map((acc) => {
                const active = selectedAccountId === acc.account_id;
                const enough = acc.balance >= zakatAmount;
                return (
                  <button
                    key={acc.account_id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.account_id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${active ? 'var(--color-primary-400)' : 'var(--color-border)'}`,
                      background: active ? 'var(--color-primary-50)' : 'var(--color-card-bg)',
                      cursor: 'pointer',
                      textAlign: 'right',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building2 size={16} style={{ color: active ? 'var(--color-primary-400)' : 'var(--color-text-muted)' }} />
                      <div>
                        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {acc.account_name}
                        </div>
                        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                          {acc.bank_name}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div
                        style={{
                          fontSize: 'var(--text-body)', fontWeight: 700,
                          direction: 'ltr',
                          color: enough ? 'var(--color-text-primary)' : 'var(--color-danger)',
                        }}
                      >
                        {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '10px', color: enough ? 'var(--color-text-muted)' : 'var(--color-danger)' }}>
                        {enough ? 'رصيد كافٍ' : 'رصيد غير كافٍ'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receiver */}
          <div>
            <label
              style={{
                display: 'block', fontSize: 'var(--text-body-sm)',
                fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px',
              }}
            >
              إرسال إلى
            </label>
            {receivers.length === 0 ? (
              <div
                style={{
                  padding: '14px', textAlign: 'center',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-body-sm)',
                }}
              >
                لا توجد جهات استلام. أضف جهة استلام أولاً.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {receivers.map((r) => {
                  const active = selectedReceiverId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReceiverId(r.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${active ? 'var(--color-primary-400)' : 'var(--color-border)'}`,
                        background: active ? 'var(--color-primary-50)' : 'var(--color-card-bg)',
                        cursor: 'pointer', textAlign: 'right',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right' }}>
                          {r.iban}
                        </div>
                      </div>
                      {r.isCharity && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-success-light)',
                            color: 'var(--color-success)',
                            fontSize: '10px', fontWeight: 600,
                          }}
                        >
                          جمعية خيرية
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              ملاحظات (اختياري)
            </label>
            <input
              type="text"
              placeholder="مثال: زكاة مال 1446 هـ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-body)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-arabic)',
                background: 'var(--color-card-bg)',
                outline: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <Button variant="ghost" size="md" onClick={onClose}>إلغاء</Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handlePay}
              disabled={!canPay}
              loading={loading}
            >
              تأكيد الدفع
            </Button>
          </div>
        </div>
      )}

      {phase === 'processing' && (
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', textAlign: 'center', gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px', height: '56px',
              borderRadius: '50%',
              border: '3px solid var(--color-primary-400)',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: 'var(--text-body-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            جارٍ معالجة الدفع...
          </p>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
            يرجى الانتظار
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {phase === 'success' && (
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', textAlign: 'center', gap: '12px',
          }}
        >
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--color-success-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Check size={32} strokeWidth={2.5} style={{ color: 'var(--color-success)' }} />
          </div>
          <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            تم الدفع بنجاح
          </p>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
            جزاك الله خيراً
          </p>
        </div>
      )}
    </Dialog>
  );
}