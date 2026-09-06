import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
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
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Backdrop - Dims background only */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container - Fully opaque, sharp & readable */}
      <div
        className={`relative z-10 w-full ${widthClasses[maxWidth]} bg-surface rounded-[12px] border border-border shadow-overlay overflow-hidden flex flex-col max-h-[90vh] text-ink animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-rose-50/60 shrink-0">
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
        {footer && <div className="px-6 py-3 border-t border-border bg-rose-50/40 flex justify-end gap-3 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
