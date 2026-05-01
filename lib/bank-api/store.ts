/**
 * Internal: read/write the JSON files that stand in for the bank's database.
 *
 * Concurrency: this module serializes writes through a single in-memory promise
 * chain (`writeQueue`). It's enough for a dev/local setup. When we move to a
 * real bank API, this whole file goes away — only the surface in `index.ts`
 * stays.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { BankApiBank, BankApiTransaction } from './types';

const BANKS_FILE = join(process.cwd(), 'dummy data', 'banks_data.json');
const TX_FILE = join(process.cwd(), 'dummy data', 'transactions_data.json');

interface BanksFile {
  banks: BankApiBank[];
  metadata?: Record<string, unknown>;
}

interface TransactionsFile {
  transactions: BankApiTransaction[];
}

let writeQueue: Promise<unknown> = Promise.resolve();

const readJson = async <T>(path: string): Promise<T> => {
  const raw = await fs.readFile(path, 'utf-8');
  return JSON.parse(raw) as T;
};

const writeJson = async (path: string, value: unknown): Promise<void> => {
  await fs.writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf-8');
};

/** Run `mutator` exclusively against the banks + transactions files. */
export async function withBankStore<T>(
  mutator: (state: {
    banks: BanksFile;
    txs: TransactionsFile;
  }) => Promise<{ result: T; banks: BanksFile; txs: TransactionsFile } | T>,
): Promise<T> {
  const next = writeQueue.then(async () => {
    const [banks, txs] = await Promise.all([
      readJson<BanksFile>(BANKS_FILE),
      readJson<TransactionsFile>(TX_FILE),
    ]);
    const ret = await mutator({ banks, txs });
    if (ret && typeof ret === 'object' && 'result' in ret) {
      const { result, banks: nextBanks, txs: nextTxs } = ret as {
        result: T;
        banks: BanksFile;
        txs: TransactionsFile;
      };
      await Promise.all([writeJson(BANKS_FILE, nextBanks), writeJson(TX_FILE, nextTxs)]);
      return result;
    }
    return ret as T;
  });
  writeQueue = next.catch(() => {}); // keep the chain alive even if a step fails
  return next;
}

export async function readBanks(): Promise<BanksFile> {
  return readJson<BanksFile>(BANKS_FILE);
}

export async function readTransactions(): Promise<TransactionsFile> {
  return readJson<TransactionsFile>(TX_FILE);
}
