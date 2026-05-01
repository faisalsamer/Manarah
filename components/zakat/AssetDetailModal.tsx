'use client'

import { useState, useEffect } from 'react'
import { Clock, History } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

const ASSET_LABELS: Record<string, string> = {
  GOLD_SAVINGS:    'ذهب (مدخر)',
  SILVER_SAVINGS:  'فضة (مدخرة)',
  STOCKS:          'أسهم ومحافظ',
  CONFIRMED_DEBTS: 'ديون مضمونة',
  TRADE_GOODS:     'بضاعة تجارية',
  CASH:            'نقد خارج البنك',
  CUSTOM:          'أصل مخصص',
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:     { label: 'نشط',          bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  ZAKAT_PAID: { label: 'تم دفع الزكاة', bg: 'var(--color-info-light)',    color: 'var(--color-info)' },
  DELETED:    { label: 'محذوف',         bg: 'var(--color-danger-light)',   color: 'var(--color-danger)' },
}

const ACTION_LABELS: Record<string, string> = {
  CREATED:    'تم الإنشاء',
  UPDATED:    'تم التعديل',
  DELETED:    'تم الحذف',
  ZAKAT_PAID: 'تم دفع الزكاة',
}

interface AssetHistory {
  id: string
  action: string
  actionAt: string
  changeNote: string | null
  snapshot: Record<string, unknown>
}

interface Asset {
  id: string
  assetType: string
  customLabel: string | null
  description: string | null
  amount: number
  status: string
  ownedSince: string
  weightGrams?: number
  karat?: number
  history?: AssetHistory[]
}

interface AssetDetailModalProps {
  assetId: string | null
  mode: 'view' | 'edit'
  onClose: () => void
  onSuccess: () => void
}

export function AssetDetailModal({ assetId, mode, onClose, onSuccess }: AssetDetailModalProps) {
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(mode)
  const [showHistory, setShowHistory] = useState(false)

  const [editForm, setEditForm] = useState({
    amount: '',
    description: '',
    ownedSince: '',
    changeNote: '',
  })

  useEffect(() => {
    if (!assetId) return
    setCurrentMode(mode)
    setShowHistory(false)
    fetchAsset(assetId)
  }, [assetId, mode])

  const fetchAsset = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/zakat/assets/${id}`)
      const data = await res.json()
      if (data.success) {
        setAsset(data.data)
        setEditForm({
          amount: String(data.data.amount),
          description: data.data.description ?? '',
          ownedSince: data.data.ownedSince?.slice(0, 10) ?? '',
          changeNote: '',
        })
      }
    } catch {
      toast.error('خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    if (!assetId) return
    try {
      const res = await fetch(`/api/zakat/assets/${assetId}/history`)
      const data = await res.json()
      if (data.success && asset) {
        setAsset({ ...asset, history: data.data.history })
        setShowHistory(true)
      }
    } catch {
      toast.error('خطأ في تحميل السجل')
    }
  }

  const handleSave = async () => {
    if (!assetId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/zakat/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          description: editForm.description || undefined,
          ownedSince: editForm.ownedSince,
          changeNote: editForm.changeNote || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error('فشل الحفظ', data.error)
        return
      }
      toast.success('تم الحفظ بنجاح')
      onSuccess()
      onClose()
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  const isPaidOrDeleted = asset?.status === 'ZAKAT_PAID' || asset?.status === 'DELETED'

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
    <Dialog
      open={!!assetId}
      onClose={onClose}
      title={currentMode === 'edit' ? 'تعديل الأصل' : 'تفاصيل الأصل'}
      size="md"
    >
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          جارٍ التحميل...
        </div>
      )}

      {!loading && asset && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px', paddingBottom: '8px' }}>

          {/* Status + type row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                background: STATUS_LABELS[asset.status]?.bg,
                color: STATUS_LABELS[asset.status]?.color,
              }}
            >
              {STATUS_LABELS[asset.status]?.label}
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {ASSET_LABELS[asset.assetType] ?? asset.assetType}
            </span>
          </div>

          {/* Paid warning */}
          {isPaidOrDeleted && currentMode === 'edit' && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--color-warning-light)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,152,0,0.3)',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              هذا الأصل لا يمكن تعديله لأن زكاته قد دُفعت أو تم حذفه.
            </div>
          )}

          {currentMode === 'view' ? (
            /* ── VIEW MODE ─────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'اسم الأصل', value: asset.customLabel || ASSET_LABELS[asset.assetType] },
                { label: 'القيمة', value: `${Number(asset.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س` },
                { label: 'تاريخ الامتلاك', value: asset.ownedSince?.slice(0, 10) },
                ...(asset.weightGrams ? [{ label: 'الوزن', value: `${asset.weightGrams} غرام` }] : []),
                ...(asset.karat ? [{ label: 'العيار', value: `${asset.karat} قيراط` }] : []),
                ...(asset.description ? [{ label: 'الوصف', value: asset.description }] : []),
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', direction: 'ltr' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* ── EDIT MODE ─────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', opacity: isPaidOrDeleted ? 0.6 : 1 }}>
              <div>
                <label style={labelStyle}>القيمة</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    disabled={isPaidOrDeleted}
                    style={{ ...inputStyle, border: 'none', flex: 1, direction: 'ltr', textAlign: 'right' }}
                  />
                  <span style={{ padding: '0 14px', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)', borderRight: '1px solid var(--color-border)' }}>
                    ر.س
                  </span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>تاريخ الامتلاك</label>
                <input
                  type="date"
                  value={editForm.ownedSince}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setEditForm({ ...editForm, ownedSince: e.target.value })}
                  disabled={isPaidOrDeleted}
                  style={{ ...inputStyle, direction: 'ltr', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={labelStyle}>الوصف</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={isPaidOrDeleted}
                  style={inputStyle}
                  placeholder="اختياري"
                />
              </div>

              <div>
                <label style={labelStyle}>سبب التعديل</label>
                <input
                  type="text"
                  value={editForm.changeNote}
                  onChange={(e) => setEditForm({ ...editForm, changeNote: e.target.value })}
                  disabled={isPaidOrDeleted}
                  style={inputStyle}
                  placeholder="اختياري — لأغراض السجل"
                />
              </div>
            </div>
          )}

          {/* History section */}
          <div>
            <button
              onClick={showHistory ? () => setShowHistory(false) : fetchHistory}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none',
                fontSize: 'var(--text-body-sm)', color: 'var(--color-primary-500)',
                cursor: 'pointer', padding: '0',
                fontFamily: 'var(--font-arabic)',
              }}
            >
              <History size={14} />
              {showHistory ? 'إخفاء السجل' : 'عرض سجل التعديلات'}
            </button>

            {showHistory && asset.history && (
              <div
                style={{
                  marginTop: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}
              >
                {asset.history.length === 0 ? (
                  <p style={{ padding: '12px 16px', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                    لا يوجد سجل تعديلات
                  </p>
                ) : (
                  asset.history.map((h, idx) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '10px 16px',
                        borderBottom: idx < asset.history!.length - 1 ? '1px solid var(--color-border)' : 'none',
                        background: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-card-bg)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: 'var(--text-caption)', fontWeight: 600,
                            color: h.action === 'DELETED' ? 'var(--color-danger)'
                              : h.action === 'ZAKAT_PAID' ? 'var(--color-success)'
                              : 'var(--color-text-primary)',
                          }}
                        >
                          {ACTION_LABELS[h.action] ?? h.action}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                          <Clock size={11} />
                          {new Date(h.actionAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      {h.changeNote && (
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {h.changeNote}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            {currentMode === 'view' && !isPaidOrDeleted && (
              <Button variant="outline" size="md" onClick={() => setCurrentMode('edit')} fullWidth>
                تعديل
              </Button>
            )}
            {currentMode === 'edit' && (
              <>
                <Button variant="ghost" size="md" onClick={() => setCurrentMode('view')}>
                  رجوع
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleSave}
                  loading={saving}
                  disabled={isPaidOrDeleted}
                >
                  حفظ التعديلات
                </Button>
              </>
            )}
            {(currentMode === 'view' || isPaidOrDeleted) && (
              <Button variant="ghost" size="md" onClick={onClose} fullWidth={currentMode === 'view' && isPaidOrDeleted}>
                إغلاق
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  )
}
