'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'

interface Liability {
  id: string
  label: string
  amount: number
  currency: string
  dueDate: string | null
  notes: string | null
  isSettled: boolean
}

interface LiabilitiesSectionProps {
  onTotalChange: (total: number) => void
}

export function LiabilitiesSection({ onTotalChange }: LiabilitiesSectionProps) {
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [settleId, setSettleId] = useState<string | null>(null)

  const [form, setForm] = useState({
    label: '',
    amount: '',
    dueDate: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchLiabilities = useCallback(async () => {
    try {
      const res = await fetch('/api/zakat/liabilities')
      const data = await res.json()
      if (data.success) {
        setLiabilities(data.data)
        onTotalChange(data.meta.total)
      }
    } catch {
      // silent
    }
  }, [onTotalChange])

  useEffect(() => {
    fetchLiabilities()
  }, [fetchLiabilities])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.label.trim()) e.label = 'الوصف مطلوب'
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'المبلغ يجب أن يكون أكبر من صفر'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch('/api/zakat/liabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label,
          amount: parseFloat(form.amount),
          dueDate: form.dueDate || undefined,
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error('فشل الإضافة', data.error)
        return
      }
      toast.success('تمت الإضافة')
      setForm({ label: '', amount: '', dueDate: '', notes: '' })
      setShowAdd(false)
      fetchLiabilities()
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/zakat/liabilities/${deleteId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم الحذف')
        fetchLiabilities()
      } else {
        toast.error('فشل الحذف', data.error)
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setDeleteId(null)
    }
  }

  const handleSettle = async () => {
    if (!settleId) return
    try {
      const res = await fetch(`/api/zakat/liabilities/${settleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSettled: true }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تحديد الدين كمسدَّد')
        fetchLiabilities()
      } else {
        toast.error('فشل التحديث', data.error)
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setSettleId(null)
    }
  }

  const total = liabilities.reduce((sum, l) => sum + l.amount, 0)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-arabic)',
    background: 'var(--color-card-bg)',
    outline: 'none',
  }

  return (
    <>
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
              الديون والالتزامات
            </h2>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
              تُخصم من صافي الثروة قبل حساب الزكاة
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {total > 0 && (
              <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--color-danger)', direction: 'ltr' }}>
                − {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              startIcon={<Plus size={14} />}
              onClick={() => setShowAdd(true)}
            >
              إضافة دين
            </Button>
          </div>
        </div>

        {liabilities.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
            لا توجد ديون مضافة
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الوصف</th>
                <th>المبلغ</th>
                <th>تاريخ الاستحقاق</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {liabilities.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.label}</td>
                  <td style={{ direction: 'ltr', textAlign: 'right', color: 'var(--color-danger)', fontWeight: 600 }}>
                    {l.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>
                    {l.dueDate
                      ? new Date(l.dueDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setSettleId(l.id)}
                        title="تحديد كمسدَّد"
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: '4px',
                          color: 'var(--color-success)',
                        }}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(l.id)}
                        title="حذف"
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: '4px',
                          color: 'var(--color-danger)',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add liability modal */}
      <Dialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="إضافة دين أو التزام"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px', paddingBottom: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              الوصف <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: قرض السيارة"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              style={{ ...inputStyle, border: `1px solid ${formErrors.label ? 'var(--color-danger)' : 'var(--color-border)'}` }}
            />
            {formErrors.label && <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-danger)', marginTop: '3px' }}>{formErrors.label}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              المبلغ <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${formErrors.amount ? 'var(--color-danger)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{ ...inputStyle, border: 'none', flex: 1, direction: 'ltr', textAlign: 'right' }}
              />
              <span style={{ padding: '0 14px', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)', borderRight: '1px solid var(--color-border)' }}>
                ر.س
              </span>
            </div>
            {formErrors.amount && <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-danger)', marginTop: '3px' }}>{formErrors.amount}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              تاريخ الاستحقاق (اختياري)
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              style={{ ...inputStyle, direction: 'ltr', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              ملاحظات (اختياري)
            </label>
            <input
              type="text"
              placeholder="أي تفاصيل إضافية"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <Button variant="ghost" size="md" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button variant="primary" size="md" fullWidth onClick={handleAdd} loading={saving}>
              إضافة الدين
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف الدين"
        description="هل أنت متأكد من حذف هذا الدين؟"
        confirmLabel="نعم، احذفه"
        variant="danger"
      />

      <ConfirmDialog
        open={!!settleId}
        onClose={() => setSettleId(null)}
        onConfirm={handleSettle}
        title="تحديد الدين كمسدَّد"
        description="سيتم إزالة هذا الدين من حسابات الزكاة. هل تأكدت من سداده؟"
        confirmLabel="نعم، تم السداد"
        variant="success"
      />
    </>
  )
}