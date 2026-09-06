import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { MerchandisingRulesPanel } from '../components/domain/MerchandisingRulesPanel';
import { Sliders } from 'lucide-react';

export const MerchandisingPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Merchandising Rules & Product Caps"
        subtitle="Cart milestones, maximum purchase weight caps per order, first-time buyer incentives, and cross-sell rules."
        badge={<Badge variant="brand" icon={<Sliders className="w-3.5 h-3.5" />}>Rules Active</Badge>}
      />

      <div className="grid grid-cols-1 gap-4">
        <Card title="Cart Weight Cap Guardrails">
          <p className="text-xs text-status-neutral">Maximum 5.0 kg per individual customer order for fresh goat mutton.</p>
          <div className="mt-3 font-mono-num text-xs font-bold text-brand-berry">
            Prevents B2B Hoarding / Protects Cold Chain Dispatch
          </div>
        </Card>

        <MerchandisingRulesPanel />
      </div>
    </div>
  );
};
