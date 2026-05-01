/**
 * Bank API client — public surface.
 *
 * Today: reads/writes the JSON files in `dummy data/`.
 * Later: same signatures, real HTTP calls to the bank.
 *
 * Consumers (API routes, the cron orchestrator) only see the functions below.
 */

import { nowClientTimestamptz } from '../datetime';
import { readBanks, readTransactions, withBankStore } from './store';
import type {
  BankApiAccount,
  BankApiBank,
  BankApiCustomer,
  BankApiTransaction,
  ChargeResult,
} from './types';

export type {
  BankApiAccount,
  BankApiBank,
  BankApiCustomer,
  BankApiTransaction,
  ChargeResult,
};

// ─── Reads ───────────────────────────────────────────────────

/** All banks the bank-network knows about (whether or not the user linked them). */
export async function listBanks(): Promise<BankApiBank[]> {
  const file = await readBanks();
  return file.banks;
}

/** The customer record from a specific bank (if that bank knows them). */
export async function getCustomerAtBank(
  bankId: string,
  customerId: string,
): Promise<BankApiCustomer | null> {
  const banks = await listBanks();
  const bank = banks.find((b) => b.bank_id === bankId);
  if (!bank) return null;
  return bank.customers.find((c) => c.customer_id === customerId) ?? null;
}

/**
 * Every bank+account combination this customer has across the network.
 * Used by `/api/banks/linked` to enrich our DB rows with live balances + names.
 */
export async function getCustomerAccounts(
  customerId: string,
): Promise<Array<{ bank: BankApiBank; account: BankApiAccount }>> {
  const banks = await listBanks();
  const out: Array<{ bank: BankApiBank; account: BankApiAccount }> = [];
  for (const bank of banks) {
    const customer = bank.customers.find((c) => c.customer_id === customerId);
    if (!customer) continue;
    for (const account of customer.accounts) {
      out.push({ bank, account });
    }
  }
  return out;
}

/** Look up one specific account by its bank+account ids. */
export async function getAccount(
  bankId: string,
  accountId: string,
): Promise<{ bank: BankApiBank; account: BankApiAccount } | null> {
  const banks = await listBanks();
  const bank = banks.find((b) => b.bank_id === bankId);
  if (!bank) return null;
  for (const customer of bank.customers) {
    const account = customer.accounts.find((a) => a.account_id === accountId);
    if (account) return { bank, account };
  }
  return null;
}

/**
 * Look up live data for a specific list of (bankId, accountId) pairs in a
 * single bank-API read. Returns a Map keyed by `${bankId}:${accountId}`.
 *
 * Use this when you already know exactly which accounts you want (typically
 * from your own DB's linked rows). Cheaper and clearer than calling
 * `getAccount` in a loop.
 */
export async function getAccountsLive(
  pairs: Array<{ bankId: string; accountId: string }>,
): Promise<Map<string, BankApiAccount>> {
  if (pairs.length === 0) return new Map();
  const banks = await listBanks();
  const map = new Map<string, BankApiAccount>();
  for (const { bankId, accountId } of pairs) {
    const bank = banks.find((b) => b.bank_id === bankId);
    if (!bank) continue;
    for (const customer of bank.customers) {
      const account = customer.accounts.find((a) => a.account_id === accountId);
      if (account) {
        map.set(`${bankId}:${accountId}`, account);
        break;
      }
    }
  }
  return map;
}

/** Transaction history for one account, newest first. */
export async function getAccountTransactions(
  accountId: string,
  options: { limit?: number } = {},
): Promise<BankApiTransaction[]> {
  const file = await readTransactions();
  const filtered = file.transactions.filter((t) => t.account_id === accountId);
  filtered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return options.limit ? filtered.slice(0, options.limit) : filtered;
}

// ─── Writes ──────────────────────────────────────────────────

const genTransactionId = (existing: BankApiTransaction[]): string => {
  // Find the highest TXN#### number in the existing rows and increment.
  let max = 0;
  for (const tx of existing) {
    const match = /^TXN(\d+)$/.exec(tx.transaction_id);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return `TXN${String(max + 1).padStart(4, '0')}`;
};

/**
 * Charge an account: append a debit row to transactions, decrement the
 * balance + available_balance on the account in banks, return the new
 * transaction id (the bank reference) plus balance-after.
 *
 * Throws if the account isn't found or has insufficient available balance.
 */
export async function chargeAccount(input: {
  bankId: string;
  accountId: string;
  amount: number;
  merchant: string;
  category?: string;
  description?: string;
}): Promise<ChargeResult> {
  return withBankStore(async ({ banks, txs }) => {
    // Find the account inside the banks file
    const bank = banks.banks.find((b) => b.bank_id === input.bankId);
    if (!bank) throw new Error(`Bank ${input.bankId} not found`);

    let account: BankApiAccount | undefined;
    let customerId: string | undefined;
    for (const customer of bank.customers) {
      const acc = customer.accounts.find((a) => a.account_id === input.accountId);
      if (acc) {
        account = acc;
        customerId = customer.customer_id;
        break;
      }
    }
    if (!account || !customerId) {
      throw new Error(`Account ${input.accountId} not found at ${input.bankId}`);
    }

    if (account.available_balance < input.amount) {
      throw new Error('insufficient_funds');
    }

    // Decrement
    const newBalance = +(account.balance - input.amount).toFixed(2);
    const newAvailable = +(account.available_balance - input.amount).toFixed(2);
    account.balance = newBalance;
    account.available_balance = newAvailable;

    // Append transaction
    const transactionId = genTransactionId(txs.transactions);
    const timestamp = nowClientTimestamptz();
    const date = timestamp.slice(0, 10); // YYYY-MM-DD

    const tx: BankApiTransaction = {
      transaction_id: transactionId,
      account_id: input.accountId,
      customer_id: customerId,
      bank_id: input.bankId,
      date,
      timestamp,
      type: 'debit',
      category: input.category ?? 'recurring',
      merchant: input.merchant,
      amount: input.amount,
      currency: account.currency,
      balance_after: newBalance,
      status: 'completed',
      description: input.description ?? input.merchant,
    };

    txs.transactions.push(tx);

    return {
      result: { bankRef: transactionId, balanceAfter: newBalance, timestamp },
      banks,
      txs,
    };
  });
}

/**
 * Credit an account: append a credit row to transactions, increment the
 * balance + available_balance on the account in banks, return the new
 * transaction id plus balance-after.
 *
 * Used by the marasi module when releasing a goal's segregated balance back
 * to a chosen bank account (after `reached`, or as part of `cancel`).
 *
 * Throws if the account isn't found.
 */
export async function creditAccount(input: {
  bankId: string;
  accountId: string;
  amount: number;
  /** Source label, shown in the user's bank statement. e.g. the goal's title. */
  merchant: string;
  category?: string;
  description?: string;
}): Promise<ChargeResult> {
  return withBankStore(async ({ banks, txs }) => {
    const bank = banks.banks.find((b) => b.bank_id === input.bankId);
    if (!bank) throw new Error(`Bank ${input.bankId} not found`);

    let account: BankApiAccount | undefined;
    let customerId: string | undefined;
    for (const customer of bank.customers) {
      const acc = customer.accounts.find((a) => a.account_id === input.accountId);
      if (acc) {
        account = acc;
        customerId = customer.customer_id;
        break;
      }
    }
    if (!account || !customerId) {
      throw new Error(`Account ${input.accountId} not found at ${input.bankId}`);
    }

    const newBalance = +(account.balance + input.amount).toFixed(2);
    const newAvailable = +(account.available_balance + input.amount).toFixed(2);
    account.balance = newBalance;
    account.available_balance = newAvailable;

    const transactionId = genTransactionId(txs.transactions);
    const timestamp = nowClientTimestamptz();
    const date = timestamp.slice(0, 10);

    const tx: BankApiTransaction = {
      transaction_id: transactionId,
      account_id: input.accountId,
      customer_id: customerId,
      bank_id: input.bankId,
      date,
      timestamp,
      type: 'credit',
      category: input.category ?? 'savings',
      merchant: input.merchant,
      amount: input.amount,
      currency: account.currency,
      balance_after: newBalance,
      status: 'completed',
      description: input.description ?? input.merchant,
    };

    txs.transactions.push(tx);

    return {
      result: { bankRef: transactionId, balanceAfter: newBalance, timestamp },
      banks,
      txs,
    };
  });
}
