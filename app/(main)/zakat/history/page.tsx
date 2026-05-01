'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Clock, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
  bankReference: string | null
  isAutomated: boolean
  notes: string | null
  receiver: {
    label: string
    iban: string
    isCharity: boolean
  } | null
  calculation: {
    zakatAmount: number | null
    netWorth: number
    nisabStandard: string
    calculatedAt: string
  } | null
}

export default function ZakatHistoryPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zakat/pay', {
        headers: { 'x-user-id': 'CUST001' },
      })
      const data = await res.json()
      if (data.success) setPayments(data.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const totalPaid = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Button
          variant="ghost"
          size="sm"
          startIcon={<ArrowRight size={14} />}
          onClick={() => router.push('/zakat')}
        >
          رجوع
        </Button>
        <div>
          <h1 style={{ fontSize: 'var(--text-h1)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
            سجل الزكاة
          </h1>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
            جميع مدفوعات الزكاة السابقة
          </p>
        </div>
      </div>

      {/* Summary stat */}
      {payments.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {[
            {
              label: 'إجمالي الزكاة المدفوعة',
              value: `${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`,
              color: 'var(--color-success)',
            },
            {
              label: 'عدد المدفوعات',
              value: payments.filter((p) => p.status === 'COMPLETED').length,
              color: 'var(--color-text-primary)',
            },
            {
              label: 'آخر دفعة',
              value: payments[0]?.paidAt
                ? new Date(payments[0].paidAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
                : '—',
              color: 'var(--color-text-primary)',
            },
          ].map((stat) => (
            <div key={stat.label} className="card" style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: 'var(--text-h3)', fontWeight: 700, color: stat.color, direction: 'ltr', textAlign: 'right' }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Payments list */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          جارٍ التحميل...
        </div>
      ) : payments.length === 0 ? (
        <div
          className="card"
          style={{ padding: '48px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🕌</div>
          <p style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            لا توجد مدفوعات بعد
          </p>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
            ستظهر هنا سجلات الزكاة بعد أول دفعة
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="card"
              style={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px', height: '36px',
                      borderRadius: '50%',
                      background: payment.status === 'COMPLETED' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {payment.status === 'COMPLETED'
                      ? <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                      : <Clock size={18} style={{ color: 'var(--color-warning)' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      دفعة زكاة
                      {payment.isAutomated && (
                        <span style={{ fontSize: 'var(--text-caption)', fontWeight: 400, color: 'var(--color-text-muted)', marginRight: '6px' }}>
                          (تلقائية)
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString('ar-SA', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <p
                    style={{
                      fontSize: '20px', fontWeight: 700,
                      color: 'var(--color-success)',
                      direction: 'ltr',
                      fontFamily: 'var(--font-numbers, Inter)',
                    }}
                  >
                    {payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: 600,
                      background: payment.status === 'COMPLETED' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                      color: payment.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-warning)',
                    }}
                  >
                    {payment.status === 'COMPLETED' ? 'مكتمل' : 'معلّق'}
                  </span>
                </div>
              </div>

              {/* Details row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {payment.receiver && (
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>إرسال إلى</p>
                    <p style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {payment.receiver.label}
                    </p>
                  </div>
                )}

                {payment.bankReference && (
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>المرجع البنكي</p>
                    <p style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-text-primary)', direction: 'ltr', textAlign: 'right' }}>
                      {payment.bankReference}
                    </p>
                  </div>
                )}

                {payment.calculation && (
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                      معيار النصاب
                    </p>
                    <p style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {payment.calculation.nisabStandard === 'SILVER' ? 'الفضة' : 'الذهب'}
                    </p>
                  </div>
                )}
              </div>

              {payment.notes && (
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '10px' }}>
                  {payment.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}