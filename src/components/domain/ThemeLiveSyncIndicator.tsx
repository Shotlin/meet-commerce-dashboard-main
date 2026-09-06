import React, { useEffect, useState } from 'react';
import { Radio, RadioTower } from 'lucide-react';
import { useThemeLiveSync } from '../../hooks/useThemeLiveSync';

export const ThemeLiveSyncIndicator: React.FC = () => {
  const { connected, lastUpdate } = useThemeLiveSync();
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!lastUpdate) return;
    setToastVisible(true);
    const timer = setTimeout(() => setToastVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [lastUpdate]);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {toastVisible && lastUpdate && (
        <div className="flex items-center gap-2 bg-ink text-white text-xs font-semibold px-3 py-2 rounded-[10px] shadow-card animate-in fade-in">
          <RadioTower className="w-3.5 h-3.5 text-status-success" />
          Live update: sections changed on tab "{lastUpdate.tab_key}"
        </div>
      )}
      <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${connected ? 'text-status-success border-status-success/30 bg-status-success/10' : 'text-status-neutral border-border bg-surface'}`}>
        <Radio className="w-3 h-3" />
        {connected ? 'Live' : 'Offline'}
      </div>
    </div>
  );
};
