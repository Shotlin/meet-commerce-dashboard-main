import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { LotTraceTree } from '../components/domain/LotTraceTree';
import { GitBranch } from 'lucide-react';

export const TraceabilityPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Traceability & Chain of Custody"
        subtitle="Order item -> Warehouse Lot -> Inbound QC -> Supply Batch -> Vendor Farm lineage report."
        badge={<Badge variant="success" icon={<GitBranch className="w-3.5 h-3.5" />}>Full Lineage Verified</Badge>}
      />

      <LotTraceTree orderNumber="MC-2026-8841" lotId="LOT-MEAT-4921" />
    </div>
  );
};
