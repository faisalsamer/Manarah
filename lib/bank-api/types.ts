/**
 * Wire shapes for the bank API.
 *
 * Today these mirror the JSON dummy files exactly. When we swap to a real
 * bank integration the shapes might change — only the implementation in
 * `lib/bank-api/index.ts` moves; consumers stay on these types.
 */

export interface BankApiAccount {
  account_id: string;
  account_number: string;
  iban: string;
  account_type: string;
  account_name: string;
  currency: string;
  balance: number;
  available_balance: number;
  status: string;
  opened_date: string;
  is_primary: boolean;
}

export interface BankApiCustomer {
  customer_id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  national_id: string;
  status: string;
  customer_since: string;
  accounts: BankApiAccount[];
  total_balance: number;
}

export interface BankApiBank {
  bank_id: string;
  bank_name: string;
  bank_name_ar: string;
  bank_code: string;
  swift_code: string;
  country: string;
  type: string;
  founded: string;
  website: string;
  logo_url: string;
  customers: BankApiCustomer[];
}

export interface BankApiTransaction {
  transaction_id: string;
  account_id: string;
  customer_id: string;
  bank_id: string;
  date: string;
  timestamp: string;
  type: 'debit' | 'credit';
  category: string;
  merchant: string;
  amount: number;
  currency: string;
  balance_after: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

/** Result of a successful charge. */
export interface ChargeResult {
  bankRef: string;
  balanceAfter: number;
  timestamp: string;
}
