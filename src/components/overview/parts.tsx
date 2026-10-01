import React from 'react';
import { clsx } from 'clsx';
import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react';

/**
 * Design system for the Business Overview.
 * Soft colours, coloured icon chips, plain words. Colour always means the same
 * thing: green = good, red = problem, amber = watch out, blue = information.
 */
export type Tone = 'blue' | 'green' | 'red' | 'amber' | 'violet' | 'teal' | 'slate';

export const TONES: Record<Tone, { fg: string; bg: string; solid: string; soft: string; border: string }> = {
  blue:   { fg: '#2457D6', bg: '#EAF1FF', solid: '#2F6BFF', soft: '#C9DBFF', border: '#CFE0FF' },
  green:  { fg: '#0B8A57', bg: '#E4F6EC', solid: '#12A66B', soft: '#BFE8D3', border: '#C5EBD8' },
  red:    { fg: '#C93036', bg: '#FDECEC', solid: '#E5484D', soft: '#F8C9CB', border: '#F8D2D4' },
  amber:  { fg: '#B26A00', bg: '#FFF3D6', solid: '#F59E0B', soft: '#FDE2A3', border: '#FBE3AE' },
  violet: { fg: '#5B3FD0', bg: '#EFEAFF', solid: '#7C5CFC', soft: '#D8CEFF', border: '#DDD4FF' },
  teal:   { fg: '#0B7C80', bg: '#E1F5F5', solid: '#0EA5A5', soft: '#B5E6E6', border: '#BEE9E9' },
  slate:  { fg: '#475467', bg: '#F1F3F7', solid: '#667085', soft: '#D9DEE7', border: '#E1E5EC' },
};

export const surface =
  'rounded-2xl border border-[#E6E9F2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_16px_-6px_rgba(16,24,40,0.06)]';

export const IconChip: React.FC<{ icon: React.ReactNode; tone: Tone; size?: 'sm' | 'md' | 'lg' }> = ({ icon, tone, size = 'md' }) => (
  <span
    className={clsx('inline-flex shrink-0 items-center justify-center rounded-xl',
      size === 'sm' && 'h-8 w-8', size === 'md' && 'h-10 w-10', size === 'lg' && 'h-12 w-12')}
    style={{ background: TONES[tone].bg, color: TONES[tone].fg }}
    aria-hidden
  >
    {icon}
  </span>
);

export const Pill: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({ tone, children, className }) => (
  <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}
    style={{ background: TONES[tone].bg, color: TONES[tone].fg }}>
    {children}
  </span>
);

/** "↑ 6% more" / "↓ 40% less". `inverse` = more is bad (costs, refunds, discounts). */
export const ChangeChip: React.FC<{ pct: number | null | undefined; inverse?: boolean; className?: string }> = ({ pct, inverse, className }) => {
  if (pct == null || !Number.isFinite(pct)) {
    return <span className={clsx('text-xs text-[#98A2B3]', className)} title="There is no earlier period to compare with">no earlier data</span>;
  }
  const flat = Math.abs(pct) < 0.5;
  const good = inverse ? pct < 0 : pct > 0;
  const tone: Tone = flat ? 'slate' : good ? 'green' : 'red';
  const Icon = flat ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  const abs = Math.abs(pct);
  const text = flat ? 'No change' : `${abs >= 1000 ? Math.round(abs).toLocaleString('en-IN') : abs >= 10 ? Math.round(abs) : abs.toFixed(1)}% ${pct > 0 ? 'more' : 'less'}`;
  return (
    <Pill tone={tone} className={className}>
      <Icon className="h-3 w-3" />
      {text}
    </Pill>
  );
};

/** Section wrapper with a coloured icon, a clear title and a one-line plain explanation. */
export const SectionCard: React.FC<{
  icon: React.ReactNode;
  tone: Tone;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, tone, title, subtitle, action, children, className }) => (
  <section className={clsx(surface, 'p-4 sm:p-6', className)}>
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <IconChip icon={icon} tone={tone} size="lg" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-[#1B2437] sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-sm leading-snug text-[#667085]">{subtitle}</p>
        </div>
      </div>
      {action}
    </header>
    {children}
  </section>
);

/** One metric: coloured icon, friendly name, big number, plain-language meaning. */
export const KpiTile: React.FC<{
  icon: React.ReactNode;
  tone: Tone;
  label: string;
  value: string;
  help: string;
  pct?: number | null;
  inverse?: boolean;
  valueTone?: Tone;
  extra?: React.ReactNode;
  placeholder?: string;
}> = ({ icon, tone, label, value, help, pct, inverse, valueTone, extra, placeholder }) => (
  <div className={clsx(surface, 'flex flex-col p-4')}>
    <div className="flex items-center gap-2.5">
      <IconChip icon={icon} tone={tone} size="sm" />
      <span className="text-sm font-semibold text-[#344054]">{label}</span>
    </div>
    <div className="mt-3 text-[1.65rem] font-extrabold leading-none tracking-tight sm:text-3xl"
      style={{ color: valueTone ? TONES[valueTone].fg : '#1B2437' }}>
      {value}
    </div>
    <p className="mt-2 text-xs leading-snug text-[#667085]">{help}</p>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {placeholder ? <Pill tone="slate">{placeholder}</Pill> : pct !== undefined ? <ChangeChip pct={pct} inverse={inverse} /> : null}
      {extra}
    </div>
  </div>
);

export const NotTracked: React.FC<{ children: React.ReactNode; tone?: Tone }> = ({ children, tone = 'blue' }) => (
  <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm leading-snug"
    style={{ background: TONES[tone].bg, color: TONES[tone].fg }}>
    <Info className="mt-0.5 h-4 w-4 shrink-0" />
    <span>{children}</span>
  </div>
);

export const EmptyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-dashed border-[#D9DEE7] bg-[#FAFBFD] px-4 py-8 text-center text-sm text-[#667085]">{children}</div>
);

export const SectionError: React.FC<{ show: boolean }> = ({ show }) =>
  show ? <NotTracked tone="amber">This part could not load just now. The rest of the page is fine, and it will try again by itself.</NotTracked> : null;

/** Soft segmented tabs (no black fill). */
export function SoftTabs<T extends string>({ tabs, value, onChange, label }: {
  tabs: { key: T; label: string; icon?: React.ReactNode; count?: number }[];
  value: T;
  onChange: (k: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#F1F3F9] p-1">
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button key={t.key} role="tab" aria-selected={on} onClick={() => onChange(t.key)}
            className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-all',
              on ? 'bg-white text-[#2457D6] shadow-[0_1px_3px_rgba(16,24,40,0.12)]' : 'text-[#667085] hover:text-[#1B2437]')}>
            {t.icon}{t.label}{t.count != null && <span className={clsx('rounded-full px-1.5 text-xs', on ? 'bg-[#EAF1FF]' : 'bg-white/70')}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A horizontal bar showing `value` relative to `max`. */
export const MiniBar: React.FC<{ value: number; max: number; tone: Tone }> = ({ value, max, tone }) => (
  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: TONES[tone].bg }}>
    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(3, Math.min(100, (value / (max || 1)) * 100))}%`, background: TONES[tone].solid }} />
  </div>
);

/** Circular progress (e.g. on-time rate). */
export const Ring: React.FC<{ value: number; tone: Tone; label: string; size?: number }> = ({ value, tone, label, size = 96 }) => {
  const r = 38;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 96 96" width={size} height={size} className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke={TONES[tone].bg} strokeWidth="10" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={TONES[tone].solid} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-[#1B2437]">{label}</div>
    </div>
  );
};

export const Avatar: React.FC<{ name: string | null; tone?: Tone }> = ({ name, tone = 'blue' }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
    style={{ background: TONES[tone].bg, color: TONES[tone].fg }}>
    {(name || '?').trim().charAt(0).toUpperCase()}
  </span>
);

export const rankBadge = (n: number) => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F1F3F9] text-xs font-bold text-[#475467]">{n}</span>
);
