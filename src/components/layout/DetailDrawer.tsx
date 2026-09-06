import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../common/Button';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full ${widthClasses[width]} bg-surface border-l border-border shadow-overlay h-full flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-rose-50/40 shrink-0">
          <div>
            <h3 className="text-base font-bold text-ink tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-status-neutral mt-0.5">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 text-status-neutral hover:text-ink">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 py-3 border-t border-border bg-rose-50/30 flex justify-end gap-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
};
