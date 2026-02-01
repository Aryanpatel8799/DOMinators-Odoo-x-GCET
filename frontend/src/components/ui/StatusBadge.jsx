/**
 * Status Badge Component
 * Displays status with appropriate colors
 */

import { STATUS_COLORS, STATUS_LABELS } from '@/constants';

export function StatusBadge({ status, className = '' }) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}
