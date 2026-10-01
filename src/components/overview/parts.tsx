import React from 'react';
import { clsx } from 'clsx';
import { ArrowDownRight, ArrowUpRight, Minus, Info } from 'lucide-react';
import { signedPct } from '../../utils/overviewFormat';

/** % change chip. `inverse` = an increase is bad (costs, refunds, discounts). */
export const ChangeChip: React.FC<{ pct: number | null | undefined; inverse?: boolean; className?: string }> = ({
  pct, inverse, className,
}) => {
  if (pct == null || !Number.isFinite(pct)) {
    return <span className={clsx('text-[11px] text-status-neutral', className)} title="No comparable previous period">vs prev: —</span>;
  }
  const flat = Math.abs(pct) < 0.05;
  const good = inverse ? pct < 0 : pct > 0;
  const tone = flat ? 'text-status-neutral bg-muted' : good ? 'text-[#179B73] bg-[#E7F7F2]' : 'text-[#D63B4D] bg-[#FDECEE]';
  const Icon = flat ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={clsx('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold', tone, className)}
      title="Change versus the previous period of the same length">
      <Icon className="h-3 w-3" />
      {signedPct(pct)}
    </span>
  );
};

export const SectionCard: React.FC<{
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className }) => (
  <section className={clsx('rounded-xl border bg-card shadow-sm', className)}>
    <header className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-ink sm:text-base">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-status-neutral">{subtitle}</p>}
      </div>
      {action}
    </header>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

export const KpiTile: React.FC<{
  label: string;
  value: string;
  pct?: number | null;
  inverse?: boolean;
  hint?: string;
  tone?: 'default' | 'good' | 'bad';
  placeholder?: string;
}> = ({ label, value, pct, inverse, hint, tone = 'default', placeholder }) => (
  <div className="rounded-xl border bg-card p-4 shadow-sm">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-status-neutral">{label}</div>
    <div className={clsx('mt-1.5 text-xl font-bold tracking-tight sm:text-2xl',
      tone === 'good' && 'text-[#179B73]', tone === 'bad' && 'text-[#D63B4D]', tone === 'default' && 'text-ink')}>
      {value}
    </div>
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      {placeholder ? <span className="text-[11px] text-status-neutral">{placeholder}</span> : pct !== undefined ? <ChangeChip pct={pct} inverse={inverse} /> : null}
      {hint && <span className="text-[11px] text-status-neutral">{hint}</span>}
    </div>
  </div>
);

export const NotTracked: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-xs text-status-neutral">
    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
    <span>{children}</span>
  </div>
);

export const EmptyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-status-neutral">{children}</div>
);

export const SectionError: React.FC<{ show: boolean }> = ({ show }) =>
  show ? <NotTracked>This section could not be loaded just now. The rest of the page is unaffected; it will retry automatically.</NotTracked> : null;

/** Mobile-safe horizontal scroll wrapper for compact tables. */
export const TableScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">{children}</div>
);

export const th = 'whitespace-nowrap px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-status-neutral';
export const td = 'whitespace-nowrap px-2 py-2.5 text-sm text-ink';
