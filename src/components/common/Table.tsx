import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  isMono?: boolean;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyText?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyText = 'No records found',
  className,
}: TableProps<T>) {
  return (
    <div className={twMerge('w-full overflow-x-auto border border-border rounded-[12px] bg-surface', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-rose-50/70 border-b border-border text-xs font-bold text-ink uppercase tracking-wider sticky top-0 z-10">
            {columns.map((col, idx) => (
              <th key={idx} className={clsx('px-4 py-3 min-h-[44px]', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-sm">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={rIdx} className="h-[48px]">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-4 py-3">
                    <div className="h-4 bg-rose-100/60 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-status-neutral text-sm">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={clsx(
                  'h-[48px] transition-colors duration-150',
                  onRowClick ? 'cursor-pointer hover:bg-rose-50/80 active:bg-rose-100/60' : 'hover:bg-rose-50/40'
                )}
              >
                {columns.map((col, cIdx) => {
                  const val = col.accessorKey ? row[col.accessorKey] : null;
                  return (
                    <td
                      key={cIdx}
                      className={clsx(
                        'px-4 py-3 text-ink text-xs md:text-sm',
                        col.isMono && 'font-mono-num font-medium text-brand-berry',
                        col.className
                      )}
                    >
                      {col.cell ? col.cell(row) : (val as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
