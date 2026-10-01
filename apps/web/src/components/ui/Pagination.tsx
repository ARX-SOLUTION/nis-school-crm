import React from 'react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  className = '',
}: PaginationProps): React.ReactElement | null {
  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate numbered pages with smart truncation
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (page >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-surface text-sm ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Range and limit selector */}
      <div className="flex items-center gap-3 text-neutral-500 text-xs sm:text-sm">
        <span>
          Jami <strong className="font-semibold text-tertiary">{total}</strong> tadan{' '}
          <span className="font-mono tabular-nums font-medium text-tertiary">
            {startItem}-{endItem}
          </span>{' '}
          ko'rsatilmoqda
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <label htmlFor="pagination-limit-select" className="sr-only">
              Sahifadagi qatorlar soni
            </label>
            <select
              id="pagination-limit-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="min-h-[44px] rounded-xl border border-border bg-surface px-2 text-xs font-medium text-tertiary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / sahifa
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page controls */}
      <nav aria-label="Sahifalar" className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Oldingi sahifa"
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 rounded-xl border border-border text-xs font-medium text-tertiary bg-surface hover:bg-muted-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden xs:inline">Oldingi</span>
        </button>

        {/* Page buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-neutral-400 text-xs select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isCurrent = pageNum === page;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`${pageNum}-sahifa`}
                className={`min-h-[44px] min-w-[44px] rounded-xl text-xs font-semibold font-mono tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isCurrent
                    ? 'bg-primary text-tertiary shadow-xs'
                    : 'bg-surface text-tertiary border border-border hover:bg-muted-surface'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Mobile current page indicator */}
        <span className="sm:hidden px-2 text-xs font-mono tabular-nums text-tertiary">
          {page} / {totalPages}
        </span>

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Keyingi sahifa"
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 rounded-xl border border-border text-xs font-medium text-tertiary bg-surface hover:bg-muted-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="hidden xs:inline">Keyingi</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  );
}
