import React from 'react';
import { clsx } from 'clsx';

interface BrandLogoProps {
  /** Tailwind height class — width follows the logo's own aspect ratio. */
  className?: string;
}

/** The real FreshCuts "FC" mark (public/freshcuts-logo.png). Single source for every in-app logo. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-8' }) => (
  <img src="/freshcuts-logo.png" alt="FreshCuts" className={clsx('w-auto shrink-0 select-none', className)} draggable={false} />
);
