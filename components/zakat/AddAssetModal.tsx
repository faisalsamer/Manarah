'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

const ASSET_TYPES = [
  { value: 'GOLD_SAVINGS',    label: 'ذهب (مدخر)' },
  { value: 'SILVER_SAVINGS',  label: 'فضة (مدخرة)' },
  { value: 'STOCKS',          label: 'أسهم ومحافظ' },
  { value: 'CONFIRMED_DEBTS', label: 'ديون مضمونة الرجوع' },
  { value: 'TRADE_GOODS',     label: 'بضاعة تجارية' },
  { value: 'CASH',            label: 'نقد خارج البنك' },
  { value: 'CUSTOM',          label: 'أصل مخصص' },
];

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAssetModal({ open, onClose, onSuccess }: AddAssetModalProps) {
  const [form, setForm] = useState({
    customLabel: '',
    assetType: '',
    amount: '',
    ownedSince: '',
    weightGrams: '',
    karat: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isGold = form.assetType === 'GOLD_SAVINGS';
  const isSilver = form.assetType === 'SILVER_SAVINGS';
  const isCustom = form.assetType === 'CUSTOM';

  const validate = () => {
    const e: Record<string, string> = {};
    if (isCustom && !form.customLabel.trim()) e.customLabel = 'اسم الأصل مطلوب';
    if (!form.assetType) e.assetType = 'الفئة مطلوبة';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'القيمة يجب أن تكون أكبر من صفر';
    if (!form.ownedSince) e.ownedSince = 'تاريخ الاستلام مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        assetType: form.assetType,
        customLabel: isCustom ? form.customLabel : undefined,
        amount: parseFloat(form.amount),
        ownedSince: form.ownedSince,
      };

      if ((isGold || isSilver) && form.weightGrams) {
        body.weightGrams = parseFloat(form.weightGrams);
      }
      if (isGold && form.karat) {
        body.karat = parseInt(form.karat);
      }

      const res = await fetch('/api/zakat/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error('خطأ في الإضافة', data.error);
        return;
      }

      toast.success('تمت الإضافة', 'تم إضافة الأصل بنجاح');
      setForm({ customLabel: '', assetType: '', amount: '', ownedSince: '', weightGrams: '', karat: '' });
      onSuccess();
      onClose();
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (error?: string): React.CSSProperties => ({
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-arabic)',
    background: 'var(--color-card-bg)',
    outline: 'none',
    direction: 'rtl',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--text-body-sm)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginBottom: '6px',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 'var(--text-caption)',
    color: 'var(--color-danger)',
    marginTop: '3px',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="إضافة أصول غير متتبعة"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px', paddingBottom: '8px' }}>

        {/* Asset name */}
        <div>
          <label style={labelStyle}>
            اسم الأصل <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="مثال: عوائد إيجار عمارة الخير"
            value={form.customLabel}
            onChange={(e) => setForm({ ...form, customLabel: e.target.value })}
            style={inputStyle(errors.customLabel)}
          />
          {errors.customLabel && <p style={errorStyle}>{errors.customLabel}</p>}
        </div>

        {/* Asset type */}
        <div>
          <label style={labelStyle}>
            فئة الأصل <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={form.assetType}
              onChange={(e) => setForm({ ...form, assetType: e.target.value })}
              style={{
                ...inputStyle(errors.assetType),
                appearance: 'none',
                cursor: 'pointer',
                paddingLeft: '36px',
              }}
            >
              <option value="">اختر الفئة...</option>
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '12px',
              }}
            >
              ▼
            </span>
          </div>
          {errors.assetType && <p style={errorStyle}>{errors.assetType}</p>}
        </div>

        {/* Gold-specific fields */}
        {(isGold || isSilver) && (
          <div style={{ display: 'grid', gridTemplateColumns: isGold ? '1fr 1fr' : '1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>الوزن بالغرام</label>
              <input
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={form.weightGrams}
                onChange={(e) => setForm({ ...form, weightGrams: e.target.value })}
                style={{ ...inputStyle(), direction: 'ltr' }}
              />
            </div>
            {isGold && (
              <div>
                <label style={labelStyle}>العيار</label>
                <select
                  value={form.karat}
                  onChange={(e) => setForm({ ...form, karat: e.target.value })}
                  style={{ ...inputStyle(), appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">اختر العيار</option>
                  {[24, 22, 21, 18, 14, 12, 10, 9].map((k) => (
                    <option key={k} value={k}>{k} عيار</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <label style={labelStyle}>
            قيمة الأصل <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${errors.amount ? 'var(--color-danger)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-card-bg)',
              overflow: 'hidden',
            }}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{
                flex: 1, padding: '11px 14px',
                border: 'none', outline: 'none',
                fontSize: 'var(--text-body)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-arabic)',
                background: 'transparent',
                direction: 'ltr', textAlign: 'right',
              }}
            />
            <span
              style={{
                padding: '0 14px',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-text-muted)',
                borderRight: '1px solid var(--color-border)',
                height: '100%', display: 'flex', alignItems: 'center',
              }}
            >
              ر.س
            </span>
          </div>
          {errors.amount && <p style={errorStyle}>{errors.amount}</p>}
        </div>

        {/* Owned since date */}
        <div>
          <label style={labelStyle}>
            تاريخ الاستلام <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            type="date"
            value={form.ownedSince}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setForm({ ...form, ownedSince: e.target.value })}
            style={{ ...inputStyle(errors.ownedSince), direction: 'ltr', cursor: 'pointer' }}
          />
          {errors.ownedSince && <p style={errorStyle}>{errors.ownedSince}</p>}
        </div>

        {/* Info notice */}
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '10px 12px',
            background: 'var(--color-info-light)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Info size={14} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-normal)' }}>
            سيتم إضافة هذا المبلغ إلى وعاء السيولة النقدية لديك واحتساب الزكاة عليه بنسبة 2.5% بنهاية الحول.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        slot="footer"
        style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}
      >
        <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <Button variant="primary" size="md" onClick={handleSubmit} loading={loading} fullWidth>
          إضافة الأصل
        </Button>
      </div>
    </Dialog>
  );
}
