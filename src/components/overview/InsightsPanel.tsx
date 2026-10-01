import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Boxes, Database, MapPin, Package, Search, Store, Tag, TrendingDown, TrendingUp, Users,
} from 'lucide-react';
import type { InsightKind, OverviewInsight, OverviewInsights } from '../../types/overview.types';
import { inr } from '../../utils/overviewFormat';
import { EmptyNote, IconChip, Pill, ProductThumb, SectionCard, SoftTabs, type Tone } from './parts';

const CATEGORY: Record<string, { icon: React.ReactNode; label: string }> = {
  product: { icon: <Package className="h-5 w-5" />, label: 'Product' },
  area: { icon: <MapPin className="h-5 w-5" />, label: 'Area' },
  vendor: { icon: <Store className="h-5 w-5" />, label: 'Vendor' },
  discount: { icon: <Tag className="h-5 w-5" />, label: 'Discounts' },
  customer: { icon: <Users className="h-5 w-5" />, label: 'Customers' },
  inventory: { icon: <Boxes className="h-5 w-5" />, label: 'Stock' },
  data: { icon: <Database className="h-5 w-5" />, label: 'Missing information' },
};

const SEVERITY: Record<string, { tone: Tone; label: string }> = {
  high: { tone: 'red', label: 'Big problem' },
  medium: { tone: 'amber', label: 'Medium' },
  low: { tone: 'slate', label: 'Small' },
  info: { tone: 'blue', label: 'Good to know' },
};

const Row: React.FC<{ i: OverviewInsight }> = ({ i }) => {
  const cat = CATEGORY[i.category];
  const leak = i.kind === 'leakage';
  const tone: Tone = i.kind === 'opportunity' ? 'green' : i.kind === 'data' ? 'blue' : SEVERITY[i.severity].tone === 'slate' ? 'amber' : SEVERITY[i.severity].tone;
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-[#EEF0F5] p-4 transition hover:border-[#D9DEE7] hover:bg-[#FAFBFD] sm:flex-row sm:items-center">
      {i.entity?.type === 'product'
        ? <ProductThumb src={i.entity.image} name={i.entity.name} size={56} />
        : <IconChip icon={cat.icon} tone={tone} size="lg" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">{cat.label}</span>
          {i.kind !== 'opportunity' && <Pill tone={SEVERITY[i.severity].tone}>{SEVERITY[i.severity].label}</Pill>}
        </div>
        <div className="mt-1 text-base font-bold leading-snug text-[#1B2437]">{i.title}</div>
        <p className="mt-1 text-sm leading-relaxed text-[#667085]">{i.detail}</p>
      </div>
      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
        {i.impact_inr != null && (
          <div className="text-right">
            <div className="text-xs font-medium text-[#98A2B3]">{leak ? 'You may lose' : 'You could gain'}</div>
            <div className="text-xl font-extrabold" style={{ color: leak ? '#C93036' : '#0B8A57' }}>{inr(i.impact_inr, { compact: true })}</div>
          </div>
        )}
        {i.link && (
          <Link to={i.link} className="inline-flex items-center gap-1 rounded-lg bg-[#EAF1FF] px-3 py-1.5 text-sm font-semibold text-[#2457D6] hover:bg-[#DCE8FF]">
            Look into it <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
};

export const InsightsPanel: React.FC<{ insights: OverviewInsights }> = ({ insights }) => {
  const [tab, setTab] = useState<InsightKind>('leakage');
  const items = insights.items.filter((i) => i.kind === tab);
  return (
    <SectionCard className="mb-5" icon={<Search className="h-6 w-6" />} tone="red" title="Money leaks & growth chances"
      subtitle="We checked your orders, refunds, deliveries and vendors and found these. ₹ numbers are estimates."
      action={
        <SoftTabs label="Type" value={tab} onChange={setTab} tabs={[
          { key: 'leakage', label: 'Money leaks', icon: <TrendingDown className="h-4 w-4" />, count: insights.totals.leakage_count },
          { key: 'opportunity', label: 'Growth chances', icon: <TrendingUp className="h-4 w-4" />, count: insights.totals.opportunity_count },
          { key: 'data', label: 'Missing info', icon: <Database className="h-4 w-4" />, count: insights.items.filter((i) => i.kind === 'data').length },
        ]} />
      }>
      {items.length === 0 ? (
        <EmptyNote>{tab === 'leakage' ? 'No money leaks found for this period. 🎉' : tab === 'opportunity' ? 'Nothing is growing fast yet for this period.' : 'Nothing is missing.'}</EmptyNote>
      ) : (
        <ul className="space-y-3">{items.map((i) => <Row key={i.id} i={i} />)}</ul>
      )}
    </SectionCard>
  );
};
