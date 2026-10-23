'use client';

import React from 'react';

interface CustomerPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Phân trang động có dấu "..." — dùng lại bộ class `.pagination-bar` của sàn */
export const CustomerPagination: React.FC<CustomerPaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
  }

  const go = (p: number) => {
    if (p >= 1 && p <= totalPages && p !== currentPage) onPageChange(p);
  };

  return (
    <nav className="pagination-bar" aria-label="Phân trang sản phẩm">
      <button
        className="pagination-btn pagination-prev"
        type="button"
        disabled={currentPage <= 1}
        onClick={() => go(currentPage - 1)}
        style={{ opacity: currentPage <= 1 ? 0.35 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
      >
        &larr; Trước
      </button>

      <div className="pagination-numbers">
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="page-dots">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              className={`page-num ${p === currentPage ? 'active' : ''}`}
              aria-label={`Trang ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
              style={{ border: 'none', outline: 'none' }}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        className="pagination-btn pagination-next"
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => go(currentPage + 1)}
        style={{ opacity: currentPage >= totalPages ? 0.35 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
      >
        Sau &rarr;
      </button>
    </nav>
  );
};
