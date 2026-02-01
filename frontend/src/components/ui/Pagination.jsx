/**
 * Pagination Component
 */

import { Button } from './button';

export function Pagination({ 
  pagination,
  onPageChange,
  className = '' 
}) {
  const { page, totalPages, hasNextPage, hasPrevPage, total } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-white border-t ${className}`}>
      <div className="text-sm text-gray-500">
        Page {page} of {totalPages} ({total} items)
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
