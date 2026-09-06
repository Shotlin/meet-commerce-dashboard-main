import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

interface ErrorCardProps {
  title?: string;
  errorMessage?: string;
  errorCode?: string;
  onRetry?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = 'Failed to Load Module Data',
  errorMessage = 'An unexpected API error occurred while connecting to the Meet Commerce backend service.',
  errorCode = 'ERR_API_FETCH_500',
  onRetry,
}) => {
  return (
    <div className="p-6 bg-status-danger/5 border border-status-danger/30 rounded-[12px] my-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-status-danger/10 text-status-danger rounded-full shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-status-danger">{title}</h4>
          <p className="text-xs text-ink/80 mt-1 leading-relaxed">{errorMessage}</p>
          {errorCode && (
            <p className="text-[11px] font-mono-num text-status-danger/80 mt-2">
              Error Diagnostic Code: <span className="font-semibold">{errorCode}</span>
            </p>
          )}
          {onRetry && (
            <div className="mt-4">
              <Button variant="danger" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
                Retry Operation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
