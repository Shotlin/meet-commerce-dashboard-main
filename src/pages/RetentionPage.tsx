import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { AbandonedCartsPanel } from '../components/domain/AbandonedCartsPanel';
import { Send } from 'lucide-react';

export const RetentionPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Retention & Communications Platform"
        subtitle="Abandoned cart recovery campaigns, review moderation queue, and push notification scheduler."
        badge={<Badge variant="brand" icon={<Send className="w-3.5 h-3.5" />}>Cart Rescue Active</Badge>}
      />

      <div className="grid grid-cols-1 gap-4">
        <AbandonedCartsPanel />

        <Card title="Product Review Moderation Queue">
          <p className="text-xs text-status-neutral">12 Verified Buyer Reviews Pending Moderation</p>
          <div className="mt-3 font-mono-num text-xs font-bold text-brand-berry">
            4.8 Avg Rating Across Mutton & Seafood
          </div>
        </Card>
      </div>
    </div>
  );
};
