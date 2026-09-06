import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Tabs } from '../components/common/Tabs';
import { CouponsPanel } from '../components/domain/CouponsPanel';
import { NotificationCampaignsPanel } from '../components/domain/NotificationCampaignsPanel';
import { CustomerSegmentsPanel } from '../components/domain/CustomerSegmentsPanel';
import { Megaphone } from 'lucide-react';

type MarketingTab = 'coupons' | 'campaigns' | 'segments';

export const MarketingPage: React.FC = () => {
  const [tab, setTab] = useState<MarketingTab>('coupons');

  return (
    <div>
      <PageHeader
        title="Marketing & Campaign Guardrails"
        subtitle="Coupon rule builder, notification campaigns, and customer segments."
        badge={<Badge variant="brand" icon={<Megaphone className="w-3.5 h-3.5" />}>Live API</Badge>}
      />

      <Tabs
        tabs={[
          { id: 'coupons', label: 'Coupons' },
          { id: 'campaigns', label: 'Campaigns' },
          { id: 'segments', label: 'Segments' },
        ]}
        activeTab={tab}
        onChange={(id) => setTab(id as MarketingTab)}
      />

      {tab === 'coupons' && <CouponsPanel />}
      {tab === 'campaigns' && <NotificationCampaignsPanel />}
      {tab === 'segments' && <CustomerSegmentsPanel />}
    </div>
  );
};
