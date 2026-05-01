'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Transaction } from '@/lib/data/transactions'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  Landmark,
  Link2,
  Loader2,
  Plus,
  ShieldCheck,
  Unlink,
  WalletCards,
  X,
} from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import { RiyalSign } from '@/components/ui/RiyalSign';
import type { AccountBlockers, BankBlockedAccount } from '@/lib/bank-dependencies'
import { Money } from '@/components/ui/RiyalSign'

interface BankSummary {
  bank_id: string
  bank_name: string
  bank_name_ar: string
  bank_code: string
  type: string
  logo_url?: string
  accounts_count?: number
  total_balance?: number
}

interface LinkedAccount {
  account_id: string
  account_type: string
  account_name: string
  iban: string
  full_iban?: string
  balance: number
  currency: string
  is_primary: boolean
  status: string
}

interface LinkedBank {
  bank_id: string
  bank_name_ar: string
  bank_code: string
  type: string
  logo_url?: string
  accounts: LinkedAccount[]
  total_balance: number
  linked_at: string
}

interface ConnectResult {
  name: string
  accounts: LinkedAccount[]
  total_balance: number
}

type WizardStep = 'select' | 'waiting' | 'success' | 'error'

const brandColors: Record<string, { primary: string; dark: string }> = {
  rajhi_bank: { primary: '#1B5E20', dark: '#145218' },
  snb_bank: { primary: '#CC0000', dark: '#a30000' },
  riyad_bank: { primary: '#0D2870', dark: '#091e52' },
  banque_saudi_fransi: { primary: '#003087', dark: '#002065' },
  saib_bank: { primary: '#1B5E20', dark: '#145218' },
  alinma_bank: { primary: '#0055A5', dark: '#003f7a' },
  aljazira_bank: { primary: '#8B4513', dark: '#6b340f' },
  sabb_bank: { primary: '#990000', dark: '#750000' },
  anb_bank: { primary: '#003366', dark: '#00264d' },
  albilad_bank: { primary: '#2E7D32', dark: '#1b5e20' },
}

const accountTypeAr: Record<string, string> = {
  salary: 'حساب راتب',
  savings: 'حساب ادخار',
  current: 'حساب جاري',
  investment: 'حساب استثمار',
}

const categoryAr: Record<string, string> = {
  restaurants: 'مطاعم',
  transport: 'مواصلات',
  groceries: 'بقالة',
  shopping: 'تسوق',
  salary: 'راتب',
  rent: 'إيجار',
  transfer: 'تحويل',
  utilities: 'خدمات',
}

function formatTxDate(timestamp: string): string {
  const date = new Date(timestamp)
  const day = date.getDate()
  const month = date.toLocaleDateString('ar-SA', { month: 'long' })
  return `${day} ${month}`
}

function formatMoney(amount: number) {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function bankBrand(bankId: string) {
  return brandColors[bankId] ?? { primary: '#1A2B3C', dark: '#0A2235' }
}

function BankLogo({ bank }: { bank: Pick<BankSummary, 'bank_id' | 'bank_code' | 'logo_url'> }) {
  const [failed, setFailed] = useState(false)
  const color = bankBrand(bank.bank_id).primary

  if (bank.logo_url && !failed) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-xs)]">
        <Image
          src={bank.logo_url}
          alt={bank.bank_code}
          width={42}
          height={42}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-[var(--shadow-xs)]"
      style={{ background: color }}
    >
      {bank.bank_code}
    </div>
  )
}

function BankCard({
  bank,
  onDisconnectBank,
  onDisconnectAccount,
}: {
  bank: LinkedBank
  onDisconnectBank: (bankId: string) => void
  onDisconnectAccount: (bankId: string, accountId: string, accountName: string) => void
}) {
  const brand = bankBrand(bank.bank_id)
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="bank-card overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-md)]">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: brand.primary }} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: `radial-gradient(ellipse at 80% 0%, ${brand.primary}18 0%, transparent 70%)` }}
      />

      {/* Header row */}
      <div className="relative flex items-start justify-between gap-3">
        <BankLogo bank={bank} />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success-light)] px-2 py-1 text-[11px] font-bold text-[var(--color-success)]">
            <BadgeCheck size={13} />
            نشط
          </span>
          <button
            type="button"
            onClick={() => onDisconnectBank(bank.bank_id)}
            title="إلغاء ربط البنك"
            className="flex size-7 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] transition hover:border-[var(--color-danger)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)]"
          >
            <Unlink size={13} />
          </button>
        </div>
      </div>

      {/* Bank name */}
      <div className="relative min-w-0">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">{bank.bank_name_ar}</h3>
        <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
          {bank.accounts.length} {bank.accounts.length === 1 ? 'حساب مربوط' : 'حسابات مربوطة'}
        </p>
      </div>

      {/* Balance */}
      <div className="relative rounded-sm bg-[var(--color-primary-50)] p-3">
        <p className="text-[12px] text-[var(--color-text-muted)]">الرصيد المتاح</p>
        <p className="mt-1 text-right font-[var(--font-numbers)] text-[20px] font-bold text-[var(--color-primary-500)] [direction:ltr]">
          <Money amount={bank.total_balance} />
        </p>
      </div>

      {/* Accounts list — collapsed shows first 2, expanded shows all with disconnect */}
      <div className="relative mt-auto space-y-2">
        {(expanded ? bank.accounts : bank.accounts.slice(0, 2)).map((account) => (
          <div key={account.account_id} className="flex items-center justify-between gap-2 rounded-sm border border-[var(--color-border)] bg-white px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                {accountTypeAr[account.account_type] ?? account.account_name}
              </p>
              <p className="mt-0.5 text-right font-[var(--font-numbers)] text-[11px] text-[var(--color-text-muted)] [direction:ltr]">
                {account.iban}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {account.is_primary && (
                <span className="rounded-full bg-[var(--color-primary-50)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary-500)]">
                  رئيسي
                </span>
              )}
              {expanded && (
                <button
                  type="button"
                  onClick={() => onDisconnectAccount(bank.bank_id, account.account_id, account.account_name)}
                  title="إلغاء ربط الحساب"
                  className="flex size-6 items-center justify-center rounded border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] transition hover:border-[var(--color-danger)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)]"
                >
                  <Unlink size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Expand / collapse toggle */}
      {bank.accounts.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="relative mt-2 flex w-full items-center justify-center gap-1 rounded-sm py-1.5 text-[11px] font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text-secondary)]"
        >
          {expanded ? (
            <><ChevronUp size={13} /> إخفاء الحسابات</>
          ) : (
            <><ChevronDown size={13} /> إدارة الحسابات ({bank.accounts.length})</>
          )}
        </button>
      )}
    </article>
  )
}

function AddBankCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[230px] rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border-strong)] bg-transparent p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-primary-400)] hover:bg-[var(--color-primary-50)]"
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-full border-2 border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-[var(--color-primary-400)]">
        <Plus size={24} />
      </span>
      <span className="mt-4 block text-[14px] font-bold text-[var(--color-primary-500)]">إضافة حساب جديد</span>
      <span className="mx-auto mt-2 block max-w-[18ch] text-[12px] leading-6 text-[var(--color-text-muted)]">
        اربط حساباتك البنكية لمتابعة رصيدك من مكان واحد
      </span>
    </button>
  )
}

// ── Blocker dialog — shown when disconnect is blocked by active module usage ──

const blockerModuleLabels: Record<keyof AccountBlockers, string> = {
  marasi: 'المراسي (أهداف الادخار)',
  recurring_expenses: 'النفقات المتكررة',
  pending_payments: 'مدفوعات معلّقة',
}

function BlockerDialog({
  open,
  onClose,
  // single-account blocker
  accountName,
  blockers,
  // bank-level blocker
  blockedAccounts,
}: {
  open: boolean
  onClose: () => void
  accountName?: string
  blockers?: AccountBlockers
  blockedAccounts?: BankBlockedAccount[]
}) {
  const isBankLevel = !!blockedAccounts

  return (
    <Dialog open={open} onClose={onClose} title="لا يمكن إلغاء الربط" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '4px', paddingBottom: '4px' }}>
        <div className="flex items-start gap-3 rounded-md border border-[rgba(229,57,53,0.25)] bg-[var(--color-danger-light)] p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
          <p className="text-[13px] leading-6 text-[var(--color-danger)]">
            {isBankLevel
              ? 'بعض الحسابات تحت هذا البنك مستخدمة في وحدات أخرى. يرجى إيقافها أو إعادة تعيينها أولاً.'
              : `الحساب "${accountName}" مستخدم في وحدات أخرى. يرجى إيقافها أو إعادة تعيينها أولاً.`}
          </p>
        </div>

        {/* Single account blockers */}
        {!isBankLevel && blockers && (
          <ul className="space-y-2">
            {(Object.keys(blockers) as (keyof AccountBlockers)[])
              .filter((k) => blockers[k] > 0)
              .map((k) => (
                <li key={k} className="flex items-center justify-between rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px]">
                  <span className="font-semibold text-[var(--color-text-primary)]">{blockerModuleLabels[k]}</span>
                  <span className="rounded-full bg-[var(--color-danger-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-danger)]">
                    {blockers[k]} {blockers[k] === 1 ? 'سجل' : 'سجلات'}
                  </span>
                </li>
              ))}
          </ul>
        )}

        {/* Bank-level: list each blocked account and its blockers */}
        {isBankLevel && blockedAccounts && (
          <ul className="space-y-3">
            {blockedAccounts.map((ba) => (
              <li key={ba.account_id} className="rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                <p className="mb-1.5 text-[12px] font-bold text-[var(--color-text-primary)]">{ba.account_name}</p>
                <ul className="space-y-1">
                  {(Object.keys(ba.blockers) as (keyof AccountBlockers)[])
                    .filter((k) => ba.blockers[k] > 0)
                    .map((k) => (
                      <li key={k} className="flex items-center justify-between text-[12px]">
                        <span className="text-[var(--color-text-secondary)]">{blockerModuleLabels[k]}</span>
                        <span className="font-bold text-[var(--color-danger)]">{ba.blockers[k]}</span>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full rounded-md bg-[var(--color-surface)] py-2.5 text-[13px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-border)]"
        >
          حسناً، سأعالج ذلك
        </button>
      </div>
    </Dialog>
  )
}

function StepDots({ current, count }: { current: number; count: number }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-1.5">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="h-2 rounded-full transition-all duration-200"
          style={{
            width: index === current ? 28 : 8,
            background: index <= current ? 'var(--color-primary-400)' : 'rgba(255,255,255,0.28)',
          }}
        />
      ))}
    </div>
  )
}

function BankWizard({
  banks,
  linkedBankIds,
  open,
  onClose,
  onSuccess,
}: {
  banks: BankSummary[]
  linkedBankIds: string[]
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<WizardStep>('select')
  const [bankId, setBankId] = useState<string | null>(null)
  const [result, setResult] = useState<ConnectResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [tabClosed, setTabClosed] = useState(false)
  const tabRef = useRef<Window | null>(null)

  const bank = banks.find((item) => item.bank_id === bankId) ?? null
  const brand = bankId ? bankBrand(bankId) : bankBrand('')
  const unconnectedBanks = banks.filter((item) => !linkedBankIds.includes(item.bank_id))
  const currentDot = step === 'select' ? 0 : step === 'success' ? 2 : 1

  const reset = useCallback(() => {
    setStep('select')
    setBankId(null)
    setResult(null)
    setErrorMsg('')
    setTabClosed(false)
    tabRef.current = null
  }, [])

  const close = useCallback(() => {
    if (tabRef.current && !tabRef.current.closed) tabRef.current.close()
    onClose()
    window.setTimeout(reset, 180)
  }, [onClose, reset])

  // Reset immediately when the wizard reopens to prevent stale-step flash
  // if the user triggers it again within the 180ms close-animation window.
  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  function openConnectTab(id: string) {
    const tab = window.open(`/bank-connect/${id}`, '_blank')
    tabRef.current = tab
    setTabClosed(false)
    setBankId(id)
    setStep('waiting')
  }

  useEffect(() => {
    if (step !== 'waiting') return

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'BANK_CONNECT_SUCCESS') {
        setResult(event.data.payload as ConnectResult)
        setStep('success')
      } else if (event.data?.type === 'BANK_CONNECT_ERROR') {
        setErrorMsg(event.data.payload as string)
        setStep('error')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [step])

  useEffect(() => {
    if (step !== 'waiting') return
    const id = window.setInterval(() => {
      if (tabRef.current?.closed) setTabClosed(true)
    }, 600)
    return () => window.clearInterval(id)
  }, [step])

  return (
    <Dialog
      open={open}
      onClose={close}
      size={step === 'select' ? 'xl' : 'md'}
      showCloseButton={false}
      closeOnOverlayClick={step !== 'waiting'}
      closeOnEscape={step !== 'waiting'}
      contentClassName="px-0 py-0"
      className="overflow-hidden"
    >
      {step === 'select' && (
        <div>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
            <div>
              <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">ربط حساب مصرفي</h2>
              <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">اختر البنك الذي تريد ربطه بمنار</p>
            </div>
            <IconButton icon={<X size={18} />} ariaLabel="إغلاق" variant="ghost" size="sm" onClick={close} />
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {unconnectedBanks.length === 0 ? (
              <div className="col-span-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-[13px] text-[var(--color-text-muted)]">
                جميع البنوك المدعومة مربوطة بالفعل
              </div>
            ) : (
              unconnectedBanks.map((item) => {
                const color = bankBrand(item.bank_id).primary
                return (
                  <button
                    key={item.bank_id}
                    type="button"
                    onClick={() => openConnectTab(item.bank_id)}
                    className="group relative min-h-[150px] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-right transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[var(--shadow-md)]"
                    style={{ borderTop: `3px solid ${color}` }}
                  >
                    <BankLogo bank={item} />
                    <div className="mt-4">
                      <p className="text-[14px] font-bold text-[var(--color-text-primary)]">{item.bank_name_ar}</p>
                      <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                        {item.type === 'Islamic' ? 'إسلامي' : 'تجاري'}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-[var(--color-primary-500)]">
                      <Link2 size={13} />
                      ربط
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {step === 'waiting' && bank && (
        <div>
          <div
            className="flex items-center gap-4 px-6 py-5 text-white"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.dark})` }}
          >
            <BankLogo bank={bank} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold">{bank.bank_name_ar}</p>
              <StepDots current={currentDot} count={3} />
            </div>
            <button type="button" onClick={close} className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-white/15 transition hover:bg-white/25" aria-label="إغلاق">
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center px-6 py-10 text-center">
            {tabClosed ? (
              <>
                <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-warning-light)] text-[var(--color-warning)]">
                  <ExternalLink size={26} />
                </div>
                <p className="mt-4 text-[15px] font-bold text-[var(--color-text-primary)]">أُغلقت نافذة تسجيل الدخول</p>
                <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">لم تكتمل العملية بعد. يمكنك إعادة فتح نافذة التسجيل</p>
                <Button className="mt-5" onClick={() => openConnectTab(bank.bank_id)} startIcon={<ExternalLink size={15} />}>
                  إعادة فتح نافذة التسجيل
                </Button>
              </>
            ) : (
              <>
                <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-500)]">
                  <Loader2 size={28} className="animate-spin" />
                </div>
                <p className="mt-4 text-[15px] font-bold text-[var(--color-text-primary)]">في انتظار تسجيل الدخول</p>
                <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">أكمل تسجيل الدخول في النافذة المفتوحة</p>
              </>
            )}
          </div>
        </div>
      )}

      {step === 'error' && bank && (
        <div>
          <div
            className="flex items-center gap-4 px-6 py-5 text-white"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.dark})` }}
          >
            <BankLogo bank={bank} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold">{bank.bank_name_ar}</p>
              <StepDots current={currentDot} count={3} />
            </div>
            <button type="button" onClick={close} className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-white/15 transition hover:bg-white/25" aria-label="إغلاق">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-8">
            <div className="rounded-sm border border-[rgba(229,57,53,0.25)] bg-[var(--color-danger-light)] p-3 text-[13px] font-semibold text-[var(--color-danger)]">
              {errorMsg}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button variant="ghost" fullWidth onClick={() => { setStep('select'); setBankId(null) }}>رجوع</Button>
              <Button fullWidth onClick={() => openConnectTab(bank.bank_id)} startIcon={<ExternalLink size={15} />}>
                إعادة المحاولة
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && result && bank && (
        <div className="p-6">
          <div className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] shadow-[0_0_0_10px_var(--color-success-light)]">
              <Check size={30} />
            </div>
            <h3 className="mt-5 text-[18px] font-bold text-[var(--color-text-primary)]">تم ربط الحساب بنجاح!</h3>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              مرحبا {result.name}، تم إضافة {result.accounts.length} {result.accounts.length === 1 ? 'حساب' : 'حسابات'}
            </p>
          </div>

          <div className="mt-6 space-y-2">
            {result.accounts.map((account) => (
              <div key={account.account_id} className="flex items-center justify-between gap-3 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-[var(--color-text-primary)]">
                    {accountTypeAr[account.account_type] ?? account.account_name}
                    {account.is_primary && <span className="mr-2 rounded-full bg-[var(--color-primary-50)] px-2 py-0.5 text-[10px] text-[var(--color-primary-500)]">رئيسي</span>}
                  </p>
                  <p className="mt-1 text-right font-[var(--font-numbers)] text-[12px] text-[var(--color-text-muted)] [direction:ltr]">{account.iban}</p>
                </div>
                <p className="shrink-0 font-[var(--font-numbers)] text-[14px] font-bold text-[var(--color-primary-500)] [direction:ltr]">
                  <Money amount={account.balance} />
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-sm border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] p-4">
            <span className="text-[13px] font-bold text-[var(--color-primary-600)]">إجمالي الرصيد</span>
            <span className="font-[var(--font-numbers)] text-[18px] font-bold text-[var(--color-primary-500)] [direction:ltr]">
              <Money amount={result.total_balance} />
            </span>
          </div>

          <Button
            className="mt-5"
            fullWidth
            startIcon={<Check size={16} />}
            onClick={() => {
              onSuccess()
              close()
            }}
          >
            تم، العودة للوحة التحكم
          </Button>
        </div>
      )}
    </Dialog>
  )
}

export default function DashboardPage() {
  const [allBanks, setAllBanks] = useState<BankSummary[]>([])
  const [banksLoading, setBanksLoading] = useState(true)
  const [banksError, setBanksError] = useState('')
  const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>([])
  const [wizardOpen, setWizardOpen] = useState(false)

  // Disconnect state
  const [disconnectBankId, setDisconnectBankId] = useState<string | null>(null)
  const [disconnectAccount, setDisconnectAccount] = useState<{
    bankId: string
    accountId: string
    accountName: string
  } | null>(null)
  const [blockerState, setBlockerState] = useState<{
    accountName?: string
    blockers?: AccountBlockers
    blockedAccounts?: BankBlockedAccount[]
  } | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const loadLinkedBanks = useCallback(async () => {
    try {
      const res = await fetch('/api/banks/linked/linked')
      if (!res.ok) throw new Error()
      const data: unknown = await res.json()
      setLinkedBanks(Array.isArray(data) ? (data as LinkedBank[]) : [])
    } catch {
      // keep current state on error
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadBanks() {
      setBanksLoading(true)
      setBanksError('')

      try {
        const response = await fetch('/api/banks')
        const data: unknown = await response.json()

        if (!response.ok || !Array.isArray(data)) {
          throw new Error('Invalid banks response')
        }

        if (!cancelled) setAllBanks(data as BankSummary[])
      } catch {
        if (!cancelled) setBanksError('تعذّر تحميل قائمة البنوك المدعومة')
      } finally {
        if (!cancelled) setBanksLoading(false)
      }
    }

    loadBanks()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    loadLinkedBanks()
  }, [loadLinkedBanks])

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAllTxns, setShowAllTxns] = useState(false)

  useEffect(() => {
    fetch('/api/bank_transactions?limit=10')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setTransactions(data as Transaction[])
      })
      .catch(() => {})
  }, [])

  const visibleTxns = showAllTxns ? transactions : transactions.slice(0, 4)

  const totalBalance = useMemo(
    () => linkedBanks.reduce((sum, bank) => sum + bank.total_balance, 0),
    [linkedBanks],
  )

  const totalAccounts = useMemo(
    () => linkedBanks.reduce((sum, bank) => sum + bank.accounts.length, 0),
    [linkedBanks],
  )

  const onWizardSuccess = useCallback(() => {
    loadLinkedBanks()
  }, [loadLinkedBanks])

  const handleConfirmDisconnectBank = useCallback(async () => {
    if (!disconnectBankId) return
    setDisconnecting(true)
    try {
      const res = await fetch(`/api/banks/${disconnectBankId}`, { method: 'PATCH' })
      const data = await res.json()
      if (data.blocked) {
        setBlockerState({ blockedAccounts: data.blockedAccounts })
      } else if (data.success) {
        toast.success('تم إلغاء ربط البنك')
        loadLinkedBanks()
      } else {
        toast.error('فشل إلغاء الربط', data.error)
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setDisconnecting(false)
      setDisconnectBankId(null)
    }
  }, [disconnectBankId, loadLinkedBanks])

  const handleConfirmDisconnectAccount = useCallback(async () => {
    if (!disconnectAccount) return
    setDisconnecting(true)
    try {
      const { bankId, accountId, accountName } = disconnectAccount
      const res = await fetch(`/api/banks/${bankId}/accounts/${accountId}`, { method: 'PATCH' })
      const data = await res.json()
      if (data.blocked) {
        setBlockerState({ accountName, blockers: data.blockers })
      } else if (data.success) {
        toast.success(
          data.bankAlsoDisconnected
            ? 'تم إلغاء ربط الحساب والبنك (لا توجد حسابات نشطة)'
            : 'تم إلغاء ربط الحساب',
        )
        loadLinkedBanks()
      } else {
        toast.error('فشل إلغاء الربط', data.error)
      }
    } catch {
      toast.error('خطأ في الاتصال')
    } finally {
      setDisconnecting(false)
      setDisconnectAccount(null)
    }
  }, [disconnectAccount, loadLinkedBanks])

  return (
    <main className="min-h-[calc(100vh-var(--navbar-height))] bg-[var(--color-page-bg)] px-5 py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[var(--content-max-width)] flex-col gap-6">
        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="hero-banner min-h-[190px] rounded-md">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold text-[var(--color-primary-100)]">
                <Landmark size={14} />
                نموذج البنوك التجريبي
              </span>
              <h1 className="mt-4 text-[28px] font-bold leading-tight text-white">لوحة الحسابات المصرفية</h1>
              <p className="mt-3 max-w-[62ch] text-[14px] leading-7 text-white/75">
                اربط حسابات أحمد التجريبية في الراجحي أو الأهلي السعودي، ثم احفظها محليا في المتصفح بنفس عقود واجهة البرمجة المستخدمة في مشروع منار الأصلي.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="stat-card justify-between">
              <div>
                <p className="text-[12px] text-[var(--color-text-muted)]">إجمالي الأرصدة</p>
                <p className="mt-1 font-[var(--font-numbers)] text-[21px] font-bold text-[var(--color-text-primary)] [direction:ltr]">
                  <Money amount={totalBalance} />
                </p>
              </div>
              <WalletCards className="text-[var(--color-primary-500)]" size={26} />
            </div>
            <div className="stat-card justify-between">
              <div>
                <p className="text-[12px] text-[var(--color-text-muted)]">البنوك المربوطة</p>
                <p className="mt-1 font-[var(--font-numbers)] text-[21px] font-bold text-[var(--color-text-primary)]">{linkedBanks.length}</p>
              </div>
              <Building2 className="text-[var(--color-info)]" size={26} />
            </div>
            <div className="stat-card justify-between">
              <div>
                <p className="text-[12px] text-[var(--color-text-muted)]">الحسابات النشطة</p>
                <p className="mt-1 font-[var(--font-numbers)] text-[21px] font-bold text-[var(--color-text-primary)]">{totalAccounts}</p>
              </div>
              <CreditCard className="text-[var(--color-warning)]" size={26} />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">البنوك والحسابات المصرفية</h2>
              <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">اربط حساباتك البنكية لمتابعة رصيدك من مكان واحد</p>
            </div>
            <Button startIcon={<Link2 size={16} />} onClick={() => setWizardOpen(true)}>
              ربط حساب مصرفي جديد
            </Button>
          </div>

          {banksError && (
            <div className="mb-4 rounded-sm border border-[rgba(229,57,53,0.25)] bg-[var(--color-danger-light)] p-3 text-[13px] font-semibold text-[var(--color-danger)]">
              {banksError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {linkedBanks.map((bank) => {
              const freshLogo = allBanks.find((b) => b.bank_id === bank.bank_id)?.logo_url
              return (
                <BankCard
                  key={bank.bank_id}
                  bank={{ ...bank, logo_url: freshLogo ?? bank.logo_url }}
                  onDisconnectBank={(id) => setDisconnectBankId(id)}
                  onDisconnectAccount={(bankId, accountId, accountName) =>
                    setDisconnectAccount({ bankId, accountId, accountName })
                  }
                />
              )
            })}
            <AddBankCard onClick={() => setWizardOpen(true)} />
          </div>
        </section>

        <section className="w-fill">
          <div className="table-wrapper">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">آخر المعاملات</h2>
              {transactions.length > 4 && (
                <Button
                  variant="link"
                  size="sm"
                  endIcon={<ArrowLeft size={14} />}
                  onClick={() => setShowAllTxns((prev) => !prev)}
                >
                  {showAllTxns ? 'عرض أقل' : 'عرض الكل'}
                </Button>
              )}
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {visibleTxns.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">لا توجد معاملات</p>
              ) : (
                visibleTxns.map((txn) => {
                  const isCredit = txn.type === 'credit'
                  return (
                    <div key={txn.transaction_id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-sm text-[18px] font-bold ${isCredit ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'}`}>
                          {isCredit ? '+' : '-'}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-[var(--color-text-primary)]">{txn.merchant}</p>
                          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                            {categoryAr[txn.category] ?? txn.category} · {formatTxDate(txn.timestamp)}
                          </p>
                        </div>
                      </div>
                      <p className={`font-[var(--font-numbers)] text-[14px] font-bold [direction:ltr] ${isCredit ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                            <RiyalSign /> {isCredit ? '+' : '-'}{txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </section>
      </div>

      <BankWizard
        banks={allBanks}
        linkedBankIds={linkedBanks.map((bank) => bank.bank_id)}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={onWizardSuccess}
      />

      {banksLoading && (
        <div className="fixed bottom-4 left-4 z-[var(--z-index-toast)] flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-[12px] font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-md)]">
          <Loader2 size={14} className="animate-spin text-[var(--color-primary-500)]" />
          تحميل البنوك
        </div>
      )}

      {/* Confirm: disconnect entire bank */}
      <ConfirmDialog
        open={!!disconnectBankId}
        onClose={() => setDisconnectBankId(null)}
        onConfirm={handleConfirmDisconnectBank}
        title="إلغاء ربط البنك"
        description="سيتم إخفاء هذا البنك وجميع حساباته من التطبيق. بياناتك التاريخية تبقى محفوظة ويمكنك إعادة الربط في أي وقت."
        confirmLabel="نعم، إلغاء الربط"
        variant="danger"
      />

      {/* Confirm: disconnect single account */}
      <ConfirmDialog
        open={!!disconnectAccount}
        onClose={() => setDisconnectAccount(null)}
        onConfirm={handleConfirmDisconnectAccount}
        title="إلغاء ربط الحساب"
        description={`سيتم إخفاء حساب "${disconnectAccount?.accountName ?? ''}" من التطبيق. بياناتك التاريخية تبقى محفوظة ويمكنك إعادة الربط عبر ربط البنك من جديد.`}
        confirmLabel="نعم، إلغاء الربط"
        variant="danger"
      />

      {/* Blocker dialog — dependency conflict */}
      <BlockerDialog
        open={!!blockerState}
        onClose={() => setBlockerState(null)}
        accountName={blockerState?.accountName}
        blockers={blockerState?.blockers}
        blockedAccounts={blockerState?.blockedAccounts}
      />
    </main>
  )
}