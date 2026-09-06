import React from 'react';
import { Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

interface TemperatureLoggerProps {
  currentTempCelsius?: number;
  minTempThreshold?: number;
  maxTempThreshold?: number;
  locationName?: string;
}

export const TemperatureLogger: React.FC<TemperatureLoggerProps> = ({
  currentTempCelsius = 2.4,
  minTempThreshold = 0.0,
  maxTempThreshold = 4.0,
  locationName = 'South Mumbai FC Cold Bay 3',
}) => {
  const isOptimal = currentTempCelsius >= minTempThreshold && currentTempCelsius <= maxTempThreshold;
  const isWarning = currentTempCelsius > maxTempThreshold && currentTempCelsius <= 6.0;

  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 shadow-card">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-brand-berry" />
          <div>
            <h3 className="text-sm font-bold text-ink">Cold Chain IoT Sensor Log</h3>
            <p className="text-xs text-status-neutral">{locationName}</p>
          </div>
        </div>
        <Badge variant={isOptimal ? 'success' : isWarning ? 'warning' : 'danger'}>
          {isOptimal ? 'Optimal Cold Range' : isWarning ? 'Temperature Warning' : 'Critical Excursion'}
        </Badge>
      </div>

      <div className="flex items-center justify-between my-3 p-3 bg-rose-50 border border-border rounded-[12px]">
        <div>
          <span className="text-xs text-status-neutral">Live Sensor Reading:</span>
          <p className="font-mono-num text-2xl font-bold text-ink mt-0.5">
            {currentTempCelsius.toFixed(1)} <span className="text-sm font-normal text-status-neutral">°C</span>
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-status-neutral">SLA Target Range:</span>
          <p className="font-mono-num text-sm font-semibold text-brand-berry">
            {minTempThreshold.toFixed(1)}°C — {maxTempThreshold.toFixed(1)}°C
          </p>
        </div>
      </div>

      {/* Temperature Bar Visualizer */}
      <div className="w-full bg-border/50 h-3 rounded-full overflow-hidden relative my-2">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isOptimal ? 'bg-status-success' : isWarning ? 'bg-status-warning' : 'bg-status-danger'
          }`}
          style={{ width: `${Math.min(100, (currentTempCelsius / 10) * 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] font-mono-num text-status-neutral mt-1">
        <span>0°C (Freezing)</span>
        <span>4°C (Target Max)</span>
        <span>10°C (Critical)</span>
      </div>
    </div>
  );
};
