'use client';

import { useMemo, useState } from 'react';

interface Options {
  pageSize?: number;
  initialPage?: number;
}

/**
 * Client-side pagination over an in-memory array.
 *
 * Returns a slice for the current page plus navigation helpers. The hook
 * clamps the rendered page if `items` shrinks below the current page —
 * no useEffect needed.
 *
 * If you change a filter / sort upstream, call `reset()` so the user lands
 * back on page 1 of the new list.
 */
export function usePagination<T>(items: T[], options: Options = {}) {
  const { pageSize = 20, initialPage = 1 } = options;
  const [page, setPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Clamp on read so the rendered page is always in range, even before the
  // caller has had a chance to react to a shrinking list.
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const setPageClamped = (next: number) => {
    setPage(Math.max(1, Math.min(totalPages, next)));
  };

  return {
    pageItems,
    page: safePage,
    totalPages,
    total: items.length,
    pageSize,
    setPage: setPageClamped,
    prev: () => setPageClamped(safePage - 1),
    next: () => setPageClamped(safePage + 1),
    reset: () => setPage(1),
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}
