// Mock bank data layer.
// Reads from banks_data.json at the project root. Swap these functions for
// real Prisma/Supabase calls later while preserving the same public contracts.

import fs from 'node:fs'
import path from 'node:path'

export type AccountType = 'salary' | 'savings' | 'current' | 'investment'
export type BankType = 'Islamic' | 'Commercial'

export interface BankAccount {
  account_id: string
  account_number: string
  iban: string
  account_type: AccountType
  account_name: string
  currency: string
  balance: number
  available_balance: number
  status: 'active' | 'inactive'
  opened_date: string
  is_primary: boolean
  monthly_limit?: number
  daily_limit?: number
  interest_rate?: number
}

export interface Customer {
  customer_id: string
  full_name: string
  username: string
  email: string
  phone: string
  national_id: string
  status: string
  customer_since: string
  accounts: BankAccount[]
  total_balance: number
}

export interface Bank {
  bank_id: string
  bank_name: string
  bank_name_ar: string
  bank_code: string
  swift_code: string
  country: string
  type: BankType
  founded: string
  website: string
  logo_url?: string
  customers: Customer[]
}

interface BanksDataFile {
  banks: Bank[]
  metadata: {
    total_banks: number
    total_accounts: number
    last_updated: string
    country: string
    currency: string
  }
}

function readData(): BanksDataFile {
  const raw = fs.readFileSync(path.join(process.cwd(), 'dummy data', 'banks_data.json'), 'utf8')
  return JSON.parse(raw) as BanksDataFile
}

export function getAllBanks(): Bank[] {
  return readData().banks
}

export function getBankById(bankId: string): Bank | undefined {
  return readData().banks.find((bank) => bank.bank_id === bankId)
}

export function getMaskedIban(iban: string): string {
  const first = iban.slice(0, 4)
  const last = iban.slice(-4)
  const middleGroups = Math.ceil((iban.length - 8) / 4)
  const masked = Array.from({ length: middleGroups }, () => '****').join(' ')
  return `${first} ${masked} ${last}`
}

export function verifyCredentials(
  bankId: string,
  username: string,
  password: string,
): Customer | null {
  void password

  const bank = getBankById(bankId)
  if (!bank) return null

  return bank.customers.find((customer) => customer.username === username) ?? null
}