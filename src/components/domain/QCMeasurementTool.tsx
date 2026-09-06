import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface QCMeasurementToolProps {
  targetReceiptNumber?: string;
  initialDeclaredKg?: number;
  initialMeasuredKg?: number;
  onDecision?: (measuredKg: number, status: 'Accepted' | 'Quarantined' | 'Rejected', declaredKg: number) => void;
}

export const QCMeasurementTool: React.FC<QCMeasurementToolProps> = ({
  targetReceiptNumber = 'QCR-2026-0912',
  initialDeclaredKg = 450.00,
  initialMeasuredKg = 448.20,
  onDecision,
}) => {
  const [declaredKg, setDeclaredKg] = useState<number>(initialDeclaredKg);
  const [measuredKg, setMeasuredKg] = useState<number>(initialMeasuredKg);

  useEffect(() => {
    setDeclaredKg(initialDeclaredKg);
    setMeasuredKg(initialMeasuredKg);
  }, [initialDeclaredKg, initialMeasuredKg, targetReceiptNumber]);

  const varianceKg = measuredKg - declaredKg;
  const variancePct = declaredKg > 0 ? (varianceKg / declaredKg) * 100 : 0;
  const isWithinTolerance = Math.abs(variancePct) <= 2.0;

  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 shadow-card">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-brand-berry" />
          <div>
            <h3 className="text-sm font-bold text-ink">Inbound Weight & Quantity Inspector</h3>
            <span className="text-[11px] font-mono-num font-semibold text-brand-berry">
              Active Scale Target: {targetReceiptNumber}
            </span>
          </div>
        </div>
        <Badge variant={isWithinTolerance ? 'success' : 'warning'}>
          {isWithinTolerance ? 'Within ±2% Tolerance' : 'High Variance Warning'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Declared Input */}
        <div className="p-3.5 bg-rose-50/50 border border-border rounded-[12px]">
          <label className="text-xs font-bold text-ink block mb-1">Declared Weight (Manifest):</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={declaredKg}
              onChange={(e) => setDeclaredKg(parseFloat(e.target.value) || 0)}
              className="w-full font-mono-num text-base font-bold text-ink px-3 py-1.5 bg-white border border-border rounded-[12px] focus:outline-none focus:border-brand-raspberry"
            />
            <span className="font-mono-num text-xs font-bold text-status-neutral">kg</span>
          </div>
        </div>

        {/* Measured Input */}
        <div className="p-3.5 bg-rose-50/50 border border-border rounded-[12px]">
          <label className="text-xs font-bold text-ink block mb-1">Measured Weight (Scale Reading):</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={measuredKg}
              onChange={(e) => setMeasuredKg(parseFloat(e.target.value) || 0)}
              className="w-full font-mono-num text-base font-bold text-brand-raspberry px-3 py-1.5 bg-white border border-border rounded-[12px] focus:outline-none focus:border-brand-raspberry"
            />
            <span className="font-mono-num text-xs font-bold text-status-neutral">kg</span>
          </div>
        </div>
      </div>

      {/* Calculated Diff Box */}
      <div className="p-4 bg-rose-100/50 border border-brand-berry/20 rounded-[12px] flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-status-neutral">Net Weight Variance:</span>
          <p className="font-mono-num text-base font-bold text-brand-berry">
            {varianceKg >= 0 ? `+${varianceKg.toFixed(2)} kg` : `${varianceKg.toFixed(2)} kg`} ({variancePct.toFixed(2)}%)
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-status-neutral">Settlement Basis:</span>
          <p className="text-xs font-bold text-ink">Actual Measured Weight</p>
        </div>
      </div>

      {/* Decision Trigger Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <Button variant="danger" size="sm" onClick={() => onDecision && onDecision(measuredKg, 'Rejected', declaredKg)}>
          Reject Batch
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onDecision && onDecision(measuredKg, 'Quarantined', declaredKg)}>
          Hold for Quarantine
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => onDecision && onDecision(measuredKg, 'Accepted', declaredKg)}
        >
          Accept & Create Lot
        </Button>
      </div>
    </div>
  );
};
