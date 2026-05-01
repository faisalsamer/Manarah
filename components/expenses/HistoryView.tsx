'use client';

import { Filter } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Field, Select } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Pagination';
import { Money } from '@/components/ui/RiyalSign';
import { Spinner } from '@/components/ui/Spinner';
import { Stat, StatGrid } from '@/components/ui/Stat';
import {
  useTransactionsPage,
  useTransactionsStats,
} from '@/hooks/expenses/useTransactions';
import { historyLabels, statusLabels } from '@/lib/expenses/labels';
import type { ExpenseVM, TransactionStatus } from '@/lib/expenses/types';
import { HistoryTable } from './HistoryTable';

type StatusFilter = TransactionStatus | 'all';

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

const VALID_STATUSES: ReadonlySet<string> = new Set([
  'all',
  'scheduled',
  'awaiting_confirmation',
  'processing',
  'retrying',
  'succeeded',
  'failed',
  'skipped',
]);

const isStatusFilter = (v: string | null): v is StatusFilter =>
  v !== null && VALID_STATUSES.has(v);

export interface HistoryViewProps {
  /** Used by the table to map `tx.expenseId` → display title. */
  expenses: ExpenseVM[];
}

export function HistoryView({ expenses }: HistoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── URL-driven state ─────────────────────────────────────
  const statusFilter: StatusFilter = (() => {
    const raw = searchParams.get('status');
    return isStatusFilter(raw) ? raw : 'all';
  })();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = (() => {
    const n = parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10);
    return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])
      ? (n as number)
      : DEFAULT_PAGE_SIZE;
  })();

  const writeParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleFilterChange = (next: StatusFilter) => {
    writeParams({ status: next === 'all' ? null : next, page: null });
  };
  const handlePageSizeChange = (next: number) => {
    writeParams({ pageSize: String(next), page: null });
  };
  const handlePageChange = (next: number) => {
    writeParams({ page: next === 1 ? null : String(next) });
  };

  // ── Stats (server-aggregated) ───────────────────────────
  const stats = useTransactionsStats();

  // ── Server-paginated table data ──────────────────────────
  const txPage = useTransactionsPage({ page, pageSize, status: statusFilter });
  const totalPages = Math.max(1, Math.ceil(txPage.total / pageSize));

  // Show a full-area spinner only on the initial load. For subsequent
  // refetches (page change, filter change), keep the previous data visible
  // and overlay a thin loading indicator so the table doesn't flash empty.
  const isInitialLoading = txPage.loading && txPage.data.length === 0;
  const isRefreshing = txPage.loading && txPage.data.length > 0;

  return (
    <div>
      <StatGrid columns={3} className="mb-8">
        <Stat
          label={historyLabels.statPaidLabel}
          value={<Money amount={stats.data.totalPaid} />}
          suffix={historyLabels.statPaidSuffix}
        />
        <Stat
          label={historyLabels.statSucceededLabel}
          value={stats.data.succeededCount}
          suffix={historyLabels.statSucceededSuffix}
        />
        <Stat
          label={historyLabels.statFailedLabel}
          value={stats.data.failedCount}
          suffix={historyLabels.statFailedSuffix}
        />
      </StatGrid>

      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <h2 className="text-h3 font-bold text-text-primary">
          {historyLabels.sectionTitle}
        </h2>
        <div className="flex items-end gap-3">
          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <Filter size={14} />
                {historyLabels.filterLabel}
              </span>
            }
          >
            <Select
              inputSize="sm"
              fullWidth={false}
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value as StatusFilter)}
            >
              <option value="all">{historyLabels.filterAll}</option>
              <option value="succeeded">{statusLabels.succeeded}</option>
              <option value="failed">{statusLabels.failed}</option>
              <option value="retrying">{statusLabels.retrying}</option>
              <option value="awaiting_confirmation">{statusLabels.awaiting_confirmation}</option>
              <option value="scheduled">{statusLabels.scheduled}</option>
              <option value="skipped">{statusLabels.skipped}</option>
            </Select>
          </Field>
          <Field label={historyLabels.pageSizeLabel}>
            <Select
              inputSize="sm"
              fullWidth={false}
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="relative">
        {isInitialLoading ? (
          <div className="bg-card-bg border border-border rounded-md py-16">
            <Spinner fullArea size="lg" label="جارٍ تحميل العمليات…" />
          </div>
        ) : (
          <>
            <HistoryTable transactions={txPage.data} expenses={expenses} />
            {isRefreshing && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-card-bg/40 backdrop-blur-[1px] flex items-start justify-center pt-6"
              >
                <Spinner size="md" />
              </div>
            )}
          </>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={handlePageChange}
        showSummary
        total={txPage.total}
        pageSize={pageSize}
      />
    </div>
  );
}
