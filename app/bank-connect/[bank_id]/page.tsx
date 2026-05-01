'use client'

import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from 'lucide-react'

interface BankInfo {
  bank_id: string
  bank_name: string
  bank_name_ar: string
  bank_code: string
  type: string
  logo_url?: string
}

interface ConnectResult {
  name: string
  accounts: Array<{
    account_id: string
    account_type: string
    account_name: string
    iban: string
    balance: number
    currency: string
    is_primary: boolean
    status: string
  }>
  total_balance: number
}

interface BankTheme {
  primary: string
  dark: string
  accent: string
  panelFrom: string
  panelTo: string
  tagline: string
  taglineEn: string
}

const themes: Record<string, BankTheme> = {
  rajhi_bank: {
    primary: '#1B5E20',
    dark: '#0a3d12',
    accent: '#4CAF50',
    panelFrom: '#1B5E20',
    panelTo: '#0a3d12',
    tagline: 'مصرف الراجحي',
    taglineEn: 'Al Rajhi Bank',
  },
  snb_bank: {
    primary: '#CC0000',
    dark: '#8B0000',
    accent: '#FF6B6B',
    panelFrom: '#CC0000',
    panelTo: '#7a0000',
    tagline: 'البنك الأهلي السعودي',
    taglineEn: 'Saudi National Bank',
  },
  riyad_bank: {
    primary: '#0D2870',
    dark: '#071a4f',
    accent: '#4A90D9',
    panelFrom: '#0D2870',
    panelTo: '#071340',
    tagline: 'بنك الرياض',
    taglineEn: 'Riyad Bank',
  },
  banque_saudi_fransi: {
    primary: '#003087',
    dark: '#001a4d',
    accent: '#4A7FD4',
    panelFrom: '#003087',
    panelTo: '#001a4d',
    tagline: 'البنك السعودي الفرنسي',
    taglineEn: 'Banque Saudi Fransi',
  },
  saib_bank: {
    primary: '#006633',
    dark: '#003d1f',
    accent: '#33CC66',
    panelFrom: '#006633',
    panelTo: '#003d1f',
    tagline: 'البنك السعودي للاستثمار',
    taglineEn: 'Saudi Investment Bank',
  },
  alinma_bank: {
    primary: '#0055A5',
    dark: '#003570',
    accent: '#3399FF',
    panelFrom: '#0055A5',
    panelTo: '#002a5c',
    tagline: 'مصرف الإنماء',
    taglineEn: 'Alinma Bank',
  },
  aljazira_bank: {
    primary: '#8B4513',
    dark: '#5c2d0c',
    accent: '#D4874A',
    panelFrom: '#8B4513',
    panelTo: '#4a1f08',
    tagline: 'بنك الجزيرة',
    taglineEn: 'Bank AlJazira',
  },
  sabb_bank: {
    primary: '#CC0000',
    dark: '#7a0000',
    accent: '#FF4444',
    panelFrom: '#990000',
    panelTo: '#550000',
    tagline: 'البنك السعودي البريطاني',
    taglineEn: 'Saudi British Bank',
  },
  anb_bank: {
    primary: '#003366',
    dark: '#001a33',
    accent: '#336699',
    panelFrom: '#003366',
    panelTo: '#001122',
    tagline: 'البنك العربي الوطني',
    taglineEn: 'Arab National Bank',
  },
  albilad_bank: {
    primary: '#2E7D32',
    dark: '#1a4d1d',
    accent: '#66BB6A',
    panelFrom: '#2E7D32',
    panelTo: '#1a3d1c',
    tagline: 'بنك البلاد',
    taglineEn: 'Bank AlBilad',
  },
}

const defaultTheme: BankTheme = {
  primary: '#1A2B3C',
  dark: '#0A1520',
  accent: '#4A90D9',
  panelFrom: '#1A2B3C',
  panelTo: '#0A1520',
  tagline: 'الخدمات المصرفية',
  taglineEn: 'Internet Banking',
}

type PageStep = 'form' | 'loading' | 'success' | 'error'

export default function BankConnectPage() {
  const { bank_id } = useParams<{ bank_id: string }>()
  const [bank, setBank] = useState<BankInfo | null>(null)
  const [bankError, setBankError] = useState(false)
  const [step, setStep] = useState<PageStep>('form')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasOpener, setHasOpener] = useState(true)

  const theme = themes[bank_id] ?? defaultTheme

  useEffect(() => {
    setHasOpener(!!window.opener)
  }, [])

  useEffect(() => {
    async function loadBank() {
      try {
        const res = await fetch(`/api/banks/${bank_id}`)
        if (!res.ok) { setBankError(true); return }
        setBank(await res.json())
      } catch {
        setBankError(true)
      }
    }
    loadBank()
  }, [bank_id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStep('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/banks/${bank_id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data: { error?: string; customer?: ConnectResult } = await res.json()

      if (!res.ok || !data.customer) {
        setErrorMsg(data.error ?? 'حدث خطأ، يرجى المحاولة مجدداً')
        setStep('error')
        return
      }

      setStep('success')
      if (window.opener) {
        window.opener.postMessage(
          { type: 'BANK_CONNECT_SUCCESS', payload: data.customer },
          window.location.origin,
        )
        window.setTimeout(() => window.close(), 2000)
      }
    } catch {
      setErrorMsg('تعذّر الاتصال بالخادم، يرجى المحاولة لاحقاً')
      setStep('error')
    }
  }

  /* ── Not opened from the app ─────────────────────────────────── */
  if (!hasOpener) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6 text-center"
        style={{ background: theme.panelFrom, direction: 'rtl' }}
      >
        <div className="rounded-2xl bg-white p-10 shadow-2xl">
          <Lock size={36} className="mx-auto mb-4" style={{ color: theme.primary }} />
          <p className="text-[16px] font-bold text-gray-800">يجب فتح هذه الصفحة من التطبيق</p>
          <p className="mt-2 text-[13px] text-gray-500">أغلق هذه النافذة وحاول مرة أخرى</p>
        </div>
      </div>
    )
  }

  /* ── Bank not found ──────────────────────────────────────────── */
  if (bankError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center" dir="rtl">
        <p className="text-[14px] text-red-600">البنك غير موجود أو حدث خطأ في التحميل</p>
      </div>
    )
  }

  /* ── Loading bank info ───────────────────────────────────────── */
  if (!bank) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: theme.panelFrom }}
      >
        <Loader2 size={32} className="animate-spin text-white/70" />
      </div>
    )
  }

  /* ── Success ─────────────────────────────────────────────────── */
  if (step === 'success') {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, ${theme.panelFrom}, ${theme.panelTo})`, direction: 'rtl' }}
      >
        <div className="w-full max-w-sm rounded-2xl bg-white p-10 text-center shadow-2xl">
          {bank.logo_url && (
            <Image src={bank.logo_url} alt={bank.bank_code} width={64} height={64} className="mx-auto mb-4 object-contain" />
          )}
          <div
            className="mx-auto flex size-16 items-center justify-center rounded-full"
            style={{ background: `${theme.primary}20`, color: theme.primary }}
          >
            <Check size={32} />
          </div>
          <h2 className="mt-4 text-[20px] font-bold text-gray-900">تم تسجيل الدخول بنجاح</h2>
          <p className="mt-2 text-[13px] text-gray-500">ستُغلق هذه النافذة تلقائياً</p>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-gray-400">
            <Loader2 size={12} className="animate-spin" />
            جارٍ إغلاق النافذة...
          </div>
        </div>
      </div>
    )
  }

  /* ── Main login page ─────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen" dir="rtl">

      {/* ── Bank branding panel (right side in RTL = left visually) ── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[45%]"
        style={{ background: `linear-gradient(160deg, ${theme.panelFrom} 0%, ${theme.panelTo} 100%)` }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full opacity-10" style={{ background: theme.accent }} />
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full opacity-10" style={{ background: theme.accent }} />
        <div className="pointer-events-none absolute top-1/2 left-1/4 size-48 -translate-y-1/2 rounded-full opacity-5" style={{ background: 'white' }} />

        {/* Top: Bank logo + name */}
        <div className="relative z-10 flex items-center gap-4">
          {bank.logo_url ? (
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg">
              <Image src={bank.logo_url} alt={bank.bank_code} width={48} height={48} className="object-contain" />
            </div>
          ) : (
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {bank.bank_code}
            </div>
          )}
          <div>
            <p className="text-[20px] font-bold leading-tight text-white">{theme.tagline}</p>
            <p className="text-[12px] tracking-widest text-white/60">{theme.taglineEn.toUpperCase()}</p>
          </div>
        </div>

        {/* Middle: Welcome message */}
        <div className="relative z-10 text-white">
          <h1 className="text-[32px] font-bold leading-snug">
            الخدمات<br />المصرفية<br />الإلكترونية
          </h1>
          <p className="mt-4 text-[14px] leading-8 text-white/70">
            سجّل دخولك للوصول إلى حساباتك وإدارة<br />
            أموالك بكل أمان وسهولة
          </p>
        </div>

        {/* Bottom: Security badges */}
        <div className="relative z-10 flex flex-wrap gap-3">
          {[
            { icon: <ShieldCheck size={14} />, label: 'اتصال مشفر SSL' },
            { icon: <Lock size={14} />, label: 'حماية ثنائية' },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {icon}
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Login form panel ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-gray-50">

        {/* Mobile-only top bar */}
        <div
          className="flex items-center gap-3 px-5 py-4 lg:hidden"
          style={{ background: `linear-gradient(90deg, ${theme.panelFrom}, ${theme.panelTo})` }}
        >
          {bank.logo_url ? (
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              <Image src={bank.logo_url} alt={bank.bank_code} width={32} height={32} className="object-contain" />
            </div>
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-[11px] font-bold text-white">
              {bank.bank_code}
            </div>
          )}
          <span className="text-[16px] font-bold text-white">{theme.tagline}</span>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">

            {/* Heading */}
            <h2 className="text-[24px] font-bold text-gray-900">تسجيل الدخول</h2>
            <p className="mt-1 text-[14px] text-gray-500">أدخل بيانات حسابك المصرفي</p>

            {/* Demo hint */}
            <div className="mt-5 flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5 text-[12px] leading-6 text-blue-700">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-blue-500" />
              <p>
                <strong>وضع تجريبي:</strong> اسم المستخدم{' '}
                <code className="rounded-md bg-blue-100 px-1.5 py-0.5 font-mono text-[11px] text-blue-800">tareq.elouzah</code>
                {' '}مع أي كلمة مرور
              </p>
            </div>

            {/* Error message */}
            {step === 'error' && errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[13px] font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">

              {/* Username */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    type="text"
                    autoComplete="username"
                    placeholder="أدخل اسم المستخدم"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-4 text-[14px] text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-transparent focus:ring-2"
                    style={{ '--tw-ring-color': `${theme.primary}40` } as React.CSSProperties}
                    onFocus={(e) => { e.target.style.boxShadow = `0 0 0 3px ${theme.primary}25`; e.target.style.borderColor = theme.primary }}
                    onBlur={(e) => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#e5e7eb' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-gray-700">كلمة المرور</label>
                  <button type="button" className="text-[12px] font-semibold" style={{ color: theme.primary }}>
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="أدخل كلمة المرور"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-10 text-[14px] text-gray-900 outline-none placeholder:text-gray-400 transition"
                    onFocus={(e) => { e.target.style.boxShadow = `0 0 0 3px ${theme.primary}25`; e.target.style.borderColor = theme.primary }}
                    onBlur={(e) => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#e5e7eb' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={step === 'loading'}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: step === 'loading'
                    ? '#9ca3af'
                    : `linear-gradient(135deg, ${theme.primary}, ${theme.dark})`,
                  boxShadow: step === 'loading' ? 'none' : `0 4px 20px ${theme.primary}50`,
                }}
              >
                {step === 'loading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    جارٍ التحقق...
                  </>
                ) : 'تسجيل الدخول'}
              </button>

            </form>

            {/* Footer note */}
            <p className="mt-6 text-center text-[11px] leading-6 text-gray-400">
              محمي بتشفير 256-bit SSL • {theme.taglineEn} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}