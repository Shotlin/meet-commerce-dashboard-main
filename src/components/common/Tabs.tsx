import React from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  badge?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={clsx('border-b border-border mb-4 flex overflow-x-auto no-scrollbar', className)}>
      <nav className="-mb-px flex space-x-6">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs md:text-sm transition-colors duration-150 flex items-center gap-2 cursor-pointer',
                isActive
                  ? 'border-brand-raspberry text-brand-raspberry'
                  : 'border-transparent text-status-neutral hover:text-ink hover:border-border'
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded-full text-[11px] font-mono-num font-semibold',
                    isActive ? 'bg-rose-100 text-brand-berry' : 'bg-rose-50 text-status-neutral'
                  )}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
