import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { StoreOperationsPanel } from '../components/domain/StoreOperationsPanel';
import { Settings } from 'lucide-react';

export const PlatformPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Platform Operations & Feature Flags"
        subtitle="App version rollout manager, store status toggle, delivery slot manager, and feature flags."
        badge={<Badge variant="brand" icon={<Settings className="w-3.5 h-3.5" />}>v2.4.1 Production</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Card title="Feature Flag Controls">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-rose-50 rounded border border-border">
              <span className="font-bold text-ink">Cutting Evidence Video Upload Mandate</span>
              <Badge variant="success">ENABLED</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-rose-50 rounded border border-border">
              <span className="font-bold text-ink">Variable Weight Pre-Auth Payment</span>
              <Badge variant="success">ENABLED</Badge>
            </div>
          </div>
        </Card>

        <StoreOperationsPanel />
      </div>
    </div>
  );
};
