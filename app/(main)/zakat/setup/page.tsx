'use client';
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Info, ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';

export default function ZakatSetupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    previousNetBalance: '',
    moneyCollectedDate: '',
    lastZakatPaymentDate: '',
    nisabStandard: 'SILVER' as 'SILVER' | 'GOLD',
  });

  const [showNisabConfirm, setShowNisabConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nisabPrices, setNisabPrices] = useState({
    goldNisabValueSAR: 0,
    silverNisabValueSAR: 0,
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/zakat/prices?refresh=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setNisabPrices({
            goldNisabValueSAR: data.data.goldNisabValueSAR,
            silverNisabValueSAR: data.data.silverNisabValueSAR,
          });
        }
      } catch {
        // Keep zeros; setup can still be submitted if price API is unavailable.
      }
    };

    fetchPrices();
  }, []);

  const nisabGold = nisabPrices.goldNisabValueSAR;
  const nisabSilver = nisabPrices.silverNisabValueSAR;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.moneyCollectedDate) {
      newErrors.moneyCollectedDate = 'تاريخ جمع الأموال مطلوب';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setShowNisabConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/zakat/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'CUST001' },
        body: JSON.stringify({
          previousNetBalance: parseFloat(form.previousNetBalance) || 0,
          moneyCollectedDate: form.moneyCollectedDate,
          lastZakatPaymentDate: form.lastZakatPaymentDate || undefined,
          nisabStandard: form.nisabStandard,
          nisabStandardConfirmed: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error('حدث خطأ', data.error);
        return;
      }

      toast.success('تم الإعداد بنجاح', 'سيتم الآن تحليل بياناتك المالية');
      router.push('/zakat');
    } catch {
      toast.error('خطأ في الاتصال', 'تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
      setShowNisabConfirm(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '8px 0 40px',
        fontFamily: 'var(--font-arabic)',
        direction: 'rtl',
      }}
    >
      {/* Page heading */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: 'var(--text-h1)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '6px',
          }}
        >
          تهيئة حساب الزكاة
        </h1>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-normal)' }}>
          نساعدك على ضبط محرك التتبع المالي الخاص بك بدقة. البيانات التاريخية تسمح لنا بحساب فترات الحول
          وتحديد التزاماتك بدقة شرعية تامة.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

        {/* ── Left: Form card ─────────────────────────────────── */}
        <div className="card" style={{ padding: '28px' }}>
          {/* Step badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                البيانات المالية السابقة
              </h2>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                يرجى إدخال أدق الأرقام الممكنة لضمان صحة الحساب
              </p>
            </div>
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--color-primary-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', fontWeight: 700, color: 'white', flexShrink: 0,
              }}
            >
              1
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Previous balance */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                رصيد سابق (إجمالي الأصول النقية)
              </label>
              <div
                style={{
                  display: 'flex', alignItems: 'center',
                  border: '1px solid var(--color-border)',
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
                  value={form.previousNetBalance}
                  onChange={(e) => setForm({ ...form, previousNetBalance: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    outline: 'none',
                    fontSize: 'var(--text-body)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-arabic)',
                    background: 'transparent',
                    textAlign: 'right',
                    direction: 'ltr',
                  }}
                />
                <span
                  style={{
                    padding: '0 16px',
                    fontSize: 'var(--text-body-sm)',
                    color: 'var(--color-text-muted)',
                    borderRight: '1px solid var(--color-border)',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  SAR
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                أدخل المبلغ النقدي الذي كان متوفراً لديك في نهاية العام الماضي
              </p>
            </div>

            {/* Two date fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Money collected date */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  تاريخ جمع الأموال <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="date"
                  value={form.moneyCollectedDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    setForm({ ...form, moneyCollectedDate: e.target.value });
                    if (errors.moneyCollectedDate) setErrors({ ...errors, moneyCollectedDate: '' });
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${errors.moneyCollectedDate ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-body)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-arabic)',
                    background: 'var(--color-card-bg)',
                    outline: 'none',
                    direction: 'ltr',
                    cursor: 'pointer',
                  }}
                />
                {errors.moneyCollectedDate && (
                  <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.moneyCollectedDate}
                  </p>
                )}
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  متى بلغ مالك النصاب لأول مرة؟
                </p>
              </div>

              {/* Last zakat payment date */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  تاريخ آخر دفع للزكاة
                </label>
                <input
                  type="date"
                  value={form.lastZakatPaymentDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm({ ...form, lastZakatPaymentDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-body)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-arabic)',
                    background: 'var(--color-card-bg)',
                    outline: 'none',
                    direction: 'ltr',
                    cursor: 'pointer',
                  }}
                />
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  اترك الحقل فارغاً إذا كنت ستحسب الزكاة لأول مرة
                </p>
              </div>
            </div>

            {/* Nisab standard selector */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                معيار النصاب
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { value: 'SILVER', label: 'الفضة (595 غرام)', sub: 'الأكثر شيوعاً عند جمهور العلماء', recommended: true },
                  { value: 'GOLD', label: 'الذهب (85 غرام)', sub: 'قيمة أعلى، يطبقه بعض العلماء', recommended: false },
                ].map((opt) => {
                  const active = form.nisabStandard === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, nisabStandard: opt.value as 'SILVER' | 'GOLD' })}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${active ? 'var(--color-primary-400)' : 'var(--color-border)'}`,
                        background: active ? 'var(--color-primary-50)' : 'var(--color-card-bg)',
                        cursor: 'pointer',
                        textAlign: 'right',
                        transition: 'all 200ms ease',
                        position: 'relative',
                      }}
                    >
                      {opt.recommended && (
                        <span
                          style={{
                            position: 'absolute', top: '8px', left: '8px',
                            fontSize: '10px', fontWeight: 600,
                            background: 'var(--color-primary-400)',
                            color: 'white',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                          }}
                        >
                          موصى به
                        </span>
                      )}
                      <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: active ? 'var(--color-primary-600)' : 'var(--color-text-primary)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {opt.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px 16px',
                background: 'var(--color-info-light)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(41, 121, 255, 0.2)',
              }}
            >
              <Info size={16} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                عند إكمال هذه البيانات، سيقوم النظام تلقائياً بإنشاء{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>جدول زمني للحول</strong>{' '}
                وإشعارك قبل موعد الاستحقاق بـ 30 يوماً.
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 'var(--text-body)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '0',
              }}
              onClick={() => router.back()}
            >
              إلغاء
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              loading={loading}
              endIcon={<ChevronLeft size={16} />}
            >
              حفظ ومتابعة
            </Button>
          </div>
        </div>

        {/* ── Right: Info panel ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Why we need this */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-hero-from) 0%, var(--color-hero-to) 100%)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0,196,140,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Shield size={18} style={{ color: 'var(--color-primary-400)' }} />
              </div>
              <h3 style={{ fontSize: 'var(--text-body-lg)', fontWeight: 700 }}>
                لماذا نحتاج هذه البيانات؟
              </h3>
            </div>
            <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-relaxed)', color: 'rgba(255,255,255,0.8)' }}>
              لتحديد بداية الحول (السنة القمرية) وضمان عدم فوات أي استحقاق مالي.
              هذه الخطوة تتم مرة واحدة فقط لضبط النظام.
            </p>
          </div>

          {/* Current nisab indicator */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              مؤشر النصاب الحالي
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
                  الذهب (85 غرام)
                </span>
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text-primary)', direction: 'ltr' }}>
                  SAR {nisabGold.toLocaleString('en-US')}
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'var(--color-progress-track)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: form.nisabStandard === 'GOLD' ? '100%' : '60%',
                    background: 'linear-gradient(to left, var(--color-primary-300), var(--color-primary-500))',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 400ms ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
                  الفضة (595 غرام)
                </span>
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text-primary)', direction: 'ltr' }}>
                  SAR {nisabSilver.toLocaleString('en-US')}
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'var(--color-progress-track)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: form.nisabStandard === 'SILVER' ? '100%' : '40%',
                    background: 'linear-gradient(to left, var(--color-primary-300), var(--color-primary-500))',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 400ms ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nisab standard confirmation dialog */}
      <ConfirmDialog
        open={showNisabConfirm}
        onClose={() => setShowNisabConfirm(false)}
        onConfirm={handleConfirm}
        title="تأكيد معيار النصاب"
        description={`اخترت معيار ${form.nisabStandard === 'SILVER' ? 'الفضة' : 'الذهب'}. لن تتمكن من تغيير هذا الخيار حتى اكتمال الحول الحالي ودفع الزكاة. هل أنت متأكد؟`}
        confirmLabel="نعم، تأكيد الاختيار"
        cancelLabel="مراجعة الاختيار"
        variant="warning"
        loading={loading}
      />
    </div>
  );
}
