import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  padding = 'md',
  className,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface border border-border rounded-[12px] shadow-card transition-shadow duration-200',
          className
        )
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-base font-bold text-ink tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-status-neutral mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
};
