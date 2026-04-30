import fs from 'node:fs'
import path from 'node:path'

export interface Transaction {
  transaction_id: string
  account_id: string
  customer_id: string
  bank_id: string
  date: string
  timestamp: string
  type: 'credit' | 'debit'
  category: string
  merchant: string
  amount: number
  currency: string
  balance_after: number
  status: string
  description: string
}

export function getAllTransactions(): Transaction[] {
  const raw = fs.readFileSync(path.join(process.cwd(), 'transactions_data.json'), 'utf8')
  const data = JSON.parse(raw) as { transactions: Transaction[] }
  return data.transactions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}
