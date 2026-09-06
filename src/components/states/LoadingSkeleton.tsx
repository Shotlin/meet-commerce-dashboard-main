import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="space-y-4 p-6 bg-surface border border-border rounded-[12px]">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-rose-100/70 rounded animate-pulse w-1/4" />
        <div className="h-8 bg-rose-100/70 rounded animate-pulse w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-24 bg-rose-50 border border-border rounded-[12px] p-4 space-y-2 animate-pulse">
            <div className="h-4 bg-rose-100/80 rounded w-1/2" />
            <div className="h-7 bg-rose-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
};
