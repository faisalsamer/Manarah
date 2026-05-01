'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'

interface Receiver {
  id: string
  label: string
  iban: string
  accountName: string
  bankName: string | null
  isCharity: boolean
  isDefault: boolean
}

const SAUDI_IBAN_REGEX = /^SA\d{22}$/

export default function ReceiversPage() {
  const router = useRouter()
  const [receivers, setReceivers] = useState<Receiver[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    label: '',
    iban: '',
    accountName: '',
    bankName: '',
    isCharity: true,
    isDefault: false,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchReceivers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zakat/receivers', {
        headers: { 'x-user-id': 'CUST001' },
      })
      const data = await res.json()
      if (data.success) setReceivers(data.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReceivers()
  }, [fetchReceivers])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.label.trim()) e.label = 'الاسم مطلوب'
    if (!form.iban.trim()) e.iban = 'رقم الآيبان مطلوب'
    else if (!SAUDI_IBAN_REGEX.test(form.iban.trim())) e.iban = 'الآيبان غير صحيح — يجب أن يبدأ بـ SA ويكون 24 حرفاً'
    if (!form.accountName.trim()) e.accountName = 'اسم صاحب الحساب مطلوب'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch('/api/zakat/receivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'CUST001' },
        body: JSON.stringify({
          label: form.label,
          iban: form.iban.trim().toUpperCase(),
          accountName: form.accountName,
          bankName: form.bankName || undefined,
          isCharity: form.isCharity,
          isDefault: form.isDefault,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error('فشل الإضافة', data.error)
        return
      }
      toast.success('تمت الإضافة')
      setForm({ label: '', iban: '', accountName: '', bankName: '', isCharity: true, isDefault: false })
      setShowAdd(false)
      fetchReceivers()
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/zakat/receivers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'CUST001' },
        body: JSON.stringify({ isDefault: true }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تعيين جهة الاستلام الافتراضية')
        fetchReceivers()
      }
    } catch {
      toast.error('خطأ في الاتصال')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/zakat/receivers/${deleteId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'CUST001' },
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم الحذف')
        fetchReceivers()
      } else {
        toast.error('فشل الحذف', data.error)
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setDeleteId(null)
    }
  }

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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--text-body-sm)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginBottom: '6px',
  }

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', maxWidth: '800px' }}>

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
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--text-h1)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
            جهات استلام الزكاة
          </h1>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
            أضف حسابات الجمعيات الخيرية أو الأفراد لدفع الزكاة إليهم
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          startIcon={<Plus size={14} />}
          onClick={() => setShowAdd(true)}
        >
          إضافة جهة
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          جارٍ التحميل...
        </div>
      ) : receivers.length === 0 ? (
        <div
          className="card"
          style={{ padding: '48px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏛️</div>
          <p style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            لا توجد جهات استلام
          </p>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            أضف جمعية خيرية أو حساباً لاستقبال زكاتك
          </p>
          <Button variant="primary" size="md" startIcon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
            إضافة أول جهة
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {receivers.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{
                padding: '16px 20px',
                border: r.isDefault ? '1.5px solid var(--color-primary-400)' : '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: r.isCharity ? 'var(--color-success-light)' : 'var(--color-info-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', flexShrink: 0,
                    }}
                  >
                    {r.isCharity ? '🕌' : '🏦'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <p style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {r.label}
                      </p>
                      {r.isDefault && (
                        <span
                          style={{
                            padding: '1px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-primary-50)',
                            color: 'var(--color-primary-500)',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid var(--color-primary-200)',
                          }}
                        >
                          افتراضي
                        </span>
                      )}
                      {r.isCharity && (
                        <span
                          style={{
                            padding: '1px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-success-light)',
                            color: 'var(--color-success)',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          جمعية خيرية
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right' }}>
                      {r.iban}
                    </p>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
                      {r.accountName} {r.bankName ? `· ${r.bankName}` : ''}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {!r.isDefault && (
                    <button
                      onClick={() => handleSetDefault(r.id)}
                      title="تعيين كافتراضي"
                      style={{
                        background: 'none', border: 'none',
                        cursor: 'pointer', padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <Star size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(r.id)}
                    title="حذف"
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-danger)',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="إضافة جهة استلام" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px', paddingBottom: '8px' }}>

          <div>
            <label style={labelStyle}>الاسم <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="text"
              placeholder="مثال: جمعية إنسان"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              style={{ ...inputStyle, border: `1px solid ${formErrors.label ? 'var(--color-danger)' : 'var(--color-border)'}` }}
            />
            {formErrors.label && <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-danger)', marginTop: '3px' }}>{formErrors.label}</p>}
          </div>

          <div>
            <label style={labelStyle}>رقم الآيبان <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="text"
              placeholder="SA..."
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase() })}
              style={{
                ...inputStyle,
                direction: 'ltr',
                letterSpacing: '1px',
                border: `1px solid ${formErrors.iban ? 'var(--color-danger)' : 'var(--color-border)'}`,
              }}
            />
            {formErrors.iban && <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-danger)', marginTop: '3px' }}>{formErrors.iban}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>اسم صاحب الحساب <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="text"
                placeholder="الاسم الكامل"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                style={{ ...inputStyle, border: `1px solid ${formErrors.accountName ? 'var(--color-danger)' : 'var(--color-border)'}` }}
              />
              {formErrors.accountName && <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-danger)', marginTop: '3px' }}>{formErrors.accountName}</p>}
            </div>
            <div>
              <label style={labelStyle}>اسم البنك</label>
              <input
                type="text"
                placeholder="اختياري"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'isCharity', label: 'جمعية خيرية معتمدة' },
              { key: 'isDefault', label: 'تعيين كجهة افتراضية للدفع' },
            ].map((toggle) => (
              <label
                key={toggle.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form[toggle.key as keyof typeof form] as boolean}
                  onChange={(e) => setForm({ ...form, [toggle.key]: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-400)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)' }}>
                  {toggle.label}
                </span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <Button variant="ghost" size="md" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button variant="primary" size="md" fullWidth onClick={handleAdd} loading={saving}>
              إضافة جهة الاستلام
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف جهة الاستلام"
        description="هل أنت متأكد من حذف هذه الجهة؟ لن تتمكن من الدفع إليها بعد الحذف."
        confirmLabel="نعم، احذفها"
        variant="danger"
      />
    </div>
  )
}