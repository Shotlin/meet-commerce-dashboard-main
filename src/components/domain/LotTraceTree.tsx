import React from 'react';
import { GitCommit, ArrowRight, ShieldCheck, Warehouse, Factory, Truck, ShoppingBag } from 'lucide-react';
import { Badge } from '../common/Badge';

interface LineageNode {
  stage: string;
  id: string;
  name: string;
  date: string;
  icon: React.ReactNode;
}

interface LotTraceTreeProps {
  orderNumber?: string;
  lotId?: string;
}

export const LotTraceTree: React.FC<LotTraceTreeProps> = ({
  orderNumber = 'MC-2026-8841',
  lotId = 'LOT-MEAT-4921',
}) => {
  const nodes: LineageNode[] = [
    { stage: 'Farm Origin', id: 'VEN-101', name: 'Satara Organic Farms, MH', date: '04 Aug 2026', icon: <Factory className="w-4 h-4 text-brand-berry" /> },
    { stage: 'Supply Batch', id: 'SB-8821', name: 'Batch #2026-88 (Mutton)', date: '06 Aug 2026', icon: <Truck className="w-4 h-4 text-brand-berry" /> },
    { stage: 'QC Receipt', id: 'QCR-2026-0912', name: 'Passed Receiving QC (2.4°C)', date: '07 Aug 2026 08:30', icon: <ShieldCheck className="w-4 h-4 text-status-success" /> },
    { stage: 'Warehouse Lot', id: lotId, name: 'South Mumbai FC Cold Bay 3', date: '07 Aug 2026 09:00', icon: <Warehouse className="w-4 h-4 text-brand-berry" /> },
    { stage: 'Customer Order', id: orderNumber, name: 'Aarav Patel (Paid)', date: '07 Aug 2026 18:24', icon: <ShoppingBag className="w-4 h-4 text-brand-raspberry" /> },
  ];

  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 shadow-card">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-brand-berry" />
          <h3 className="text-sm font-bold text-ink">5-Tier Lineage & Traceability Audit</h3>
        </div>
        <Badge variant="success">Fully Traceable Chain</Badge>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-raspberry/30">
        {nodes.map((node, idx) => (
          <div key={idx} className="relative flex items-start gap-3 group">
            {/* Node Dot */}
            <div className="absolute -left-[30px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-brand-raspberry flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              {node.icon}
            </div>

            {/* Node Content */}
            <div className="flex-1 p-3 bg-rose-50/60 border border-border rounded-[12px] group-hover:border-brand-raspberry/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-berry uppercase tracking-wider">{node.stage}</span>
                <span className="font-mono-num text-[11px] text-status-neutral">{node.date}</span>
              </div>
              <p className="text-xs font-bold text-ink mt-0.5">{node.name}</p>
              <p className="font-mono-num text-xs font-semibold text-brand-raspberry mt-1">{node.id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
