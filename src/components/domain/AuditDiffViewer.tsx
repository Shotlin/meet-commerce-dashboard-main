import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';

interface DiffItem {
  field: string;
  oldValue: string;
  newValue: string;
}

interface AuditDiffViewerProps {
  actor: string;
  action: string;
  timestamp: string;
  changes?: DiffItem[];
}

export const AuditDiffViewer: React.FC<AuditDiffViewerProps> = ({
  actor = 'Sanjay Kumar (Warehouse Manager)',
  action = 'QC_RECEIPT_ACCEPTED',
  timestamp = '2026-08-07 08:30:12',
  changes = [
    { field: 'qcStatus', oldValue: 'Pending QC', newValue: 'Accepted' },
    { field: 'lotCreated', oldValue: 'null', newValue: 'LOT-MEAT-4921' },
    { field: 'measuredQtyKg', oldValue: '0.00', newValue: '448.20' }
  ]
}) => {
  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 shadow-card font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-berry" />
          <div>
            <h3 className="text-sm font-bold text-ink">System Audit Trail Entry</h3>
            <p className="text-xs text-status-neutral">{actor} • <span className="font-mono-num">{timestamp}</span></p>
          </div>
        </div>
        <span className="font-mono-num text-xs font-bold text-brand-berry bg-rose-100 px-2 py-0.5 rounded-full border border-brand-berry/20">
          {action}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-ink mb-1">State Mutation Diff:</p>
        {changes.map((diff, idx) => (
          <div key={idx} className="p-2.5 bg-rose-50 border border-border rounded-[12px] flex items-center justify-between font-mono-num text-xs">
            <span className="font-semibold text-ink">{diff.field}:</span>
            <div className="flex items-center gap-2">
              <span className="bg-status-danger/10 text-status-danger px-2 py-0.5 rounded line-through">
                {diff.oldValue}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-status-neutral shrink-0" />
              <span className="bg-status-success/10 text-status-success px-2 py-0.5 rounded font-bold">
                {diff.newValue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
