import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '../common/Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active items matching your current filters or query.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface border border-border border-dashed rounded-[12px] my-4">
      <div className="w-12 h-12 rounded-full bg-rose-100/60 text-brand-berry flex items-center justify-center mb-3">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-bold text-ink mb-1">{title}</h4>
      <p className="text-xs text-status-neutral max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
