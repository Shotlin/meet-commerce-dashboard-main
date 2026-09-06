import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Tabs } from '../components/common/Tabs';
import { queryKeys } from '../services/queryKeys';
import { themeTabService } from '../services/themeTabService';
import { ThemeTabManagerPanel } from '../components/domain/ThemeTabManagerPanel';
import { SectionCanvasPanel } from '../components/domain/SectionCanvasPanel';
import { ThemeLivePreview } from '../components/domain/ThemeLivePreview';
import { SectionVersionsPanel } from '../components/domain/SectionVersionsPanel';
import { ThemeLiveSyncIndicator } from '../components/domain/ThemeLiveSyncIndicator';
import { AppBrandingPanel } from '../components/domain/AppBrandingPanel';
import { LayoutTemplate } from 'lucide-react';

type ThemesView = 'layout' | 'branding';

export const ThemesPage: React.FC = () => {
  const { data: tabs = [], isLoading, error } = useQuery({
    queryKey: queryKeys.themeTabs.list({ status: 'active' }),
    queryFn: () => themeTabService.list({ status: 'active' }),
  });

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const selectedTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0] ?? null;
  const [view, setView] = useState<ThemesView>('layout');

  return (
    <div>
      <PageHeader
        title="Theme Builder"
        subtitle="Manage store tabs and the section layout each one renders — reorder, edit, preview, version, and schedule changes."
        badge={<Badge variant="brand" icon={<LayoutTemplate className="w-3.5 h-3.5" />}>{tabs.length} Tabs</Badge>}
      />

      <Tabs
        tabs={[{ id: 'layout', label: 'Layout Builder' }, { id: 'branding', label: 'Branding' }]}
        activeTab={view}
        onChange={(id) => setView(id as ThemesView)}
      />

      {view === 'branding' ? (
        <AppBrandingPanel />
      ) : error ? (
        <p className="text-xs text-status-danger p-3">{(error as Error).message}</p>
      ) : isLoading ? (
        <p className="text-xs text-status-neutral p-3">Loading theme tabs…</p>
      ) : tabs.length === 0 ? (
        <Card>
          <p className="text-xs text-status-neutral">No theme tabs found for store "zepto".</p>
        </Card>
      ) : (
        <>
          <Tabs
            tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
            activeTab={selectedTab?.id ?? ''}
            onChange={setActiveTabId}
          />

          {selectedTab && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
              <div className="space-y-4">
                <SectionCanvasPanel tab={selectedTab} />
                <SectionVersionsPanel tabId={selectedTab.id} />
              </div>
              <ThemeLivePreview tabId={selectedTab.id} tabLabel={selectedTab.label} />
            </div>
          )}
        </>
      )}

      {view === 'layout' && (
        <div className="mt-6">
          <ThemeTabManagerPanel />
        </div>
      )}

      <ThemeLiveSyncIndicator />
    </div>
  );
};
