'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const labels = {
  prev: 'السابق',
  next: 'التالي',
  ariaNav: 'ترقيم الصفحات',
  /**
   * إظهار 1–15 من 42 — for the optional summary line. The component constructs
   * this string from `total` + `pageSize` + `page`.
   */
  summary: (start: number, end: number, total: number) =>
    `إظهار ${start}–${end} من ${total}`,
} as const;

const PAGES_AROUND_CURRENT = 1;

/**
 * Build the visible page list with ellipses for long ranges.
 *  totalPages ≤ 7  → show all
 *  current near start → 1 2 3 4 5 … 20
 *  current in middle  → 1 … 7 [8] 9 … 20
 *  current near end   → 1 … 16 17 18 19 20
 */
function buildPageList(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [];
  pages.push(1);
  const start = Math.max(2, current - PAGES_AROUND_CURRENT);
  const end = Math.min(totalPages - 1, current + PAGES_AROUND_CURRENT);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Show "إظهار 1–15 من 42" beside the buttons. Requires `total` + `pageSize`. */
  showSummary?: boolean;
  total?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  showSummary = false,
  total,
  pageSize,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageList = buildPageList(page, totalPages);
  const goPrev = () => onChange(Math.max(1, page - 1));
  const goNext = () => onChange(Math.min(totalPages, page + 1));

  const summaryText =
    showSummary && total !== undefined && pageSize !== undefined
      ? labels.summary(
          (page - 1) * pageSize + 1,
          Math.min(page * pageSize, total),
          total,
        )
      : null;

  return (
    <div
      className={[
        'flex items-center justify-between gap-3 mt-4 font-arabic',
        className,
      ].join(' ')}
    >
      {summaryText ? (
        <span className="text-caption text-text-muted font-numbers">
          {summaryText}
        </span>
      ) : (
        <span aria-hidden />
      )}
      <nav
        className="flex items-center gap-1"
        aria-label={labels.ariaNav}
      >
        {/*
          In RTL, the "previous" button visually sits on the right (where
          page 1 lives) and its arrow points right (ChevronRight). "Next"
          sits on the left and points left.
        */}
        <button
          type="button"
          onClick={goPrev}
          disabled={page <= 1}
          aria-label={labels.prev}
          className={pageBtnCls(false)}
        >
          <ChevronRight size={14} />
        </button>

        {pageList.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`e-${i}`}
              aria-hidden
              className="inline-flex items-center justify-center min-w-9 h-9 text-text-muted"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={pageBtnCls(p === page)}
            >
              <span className="font-numbers">{p}</span>
            </button>
          ),
        )}

        <button
          type="button"
          onClick={goNext}
          disabled={page >= totalPages}
          aria-label={labels.next}
          className={pageBtnCls(false)}
        >
          <ChevronLeft size={14} />
        </button>
      </nav>
    </div>
  );
}

function pageBtnCls(active: boolean): string {
  return [
    'inline-flex items-center justify-center min-w-9 h-9 px-2.5 rounded-sm border',
    'text-body-sm font-semibold transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card-bg disabled:hover:text-text-secondary disabled:hover:border-border',
    active
      ? 'bg-primary-400 text-white border-primary-400'
      : 'bg-card-bg text-text-secondary border-border hover:border-border-strong hover:text-text-primary',
  ].join(' ');
}
