import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';

export type BadgeVariant = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  icon,
  size = 'md',
  className,
}) => {
  const variantStyles = {
    success: 'bg-[#E7F7F2] text-[#179B73] border-[#A8E2D1]',
    info: 'bg-[#EBF2FC] text-[#2769D7] border-[#ADC8F7]',
    warning: 'bg-[#FFF7E6] text-[#D98900] border-[#FFDF99]',
    danger: 'bg-[#FDECEE] text-[#D63B4D] border-[#F8B6BE]',
    neutral: 'bg-[#F2F4F7] text-[#667085] border-[#D0D5DD]',
    brand: 'bg-rose-100 text-brand-berry border-brand-berry/30',
  };

  const defaultIcons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
    info: <Info className="w-3.5 h-3.5 shrink-0" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
    danger: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
    neutral: <Clock className="w-3.5 h-3.5 shrink-0" />,
    brand: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full border shadow-2xs transition-colors duration-150',
          variantStyles[variant],
          sizes[size],
          className
        )
      )}
    >
      {icon !== undefined ? icon : defaultIcons[variant]}
      <span>{children}</span>
    </span>
  );
};
