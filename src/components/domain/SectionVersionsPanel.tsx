import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, History, RotateCcw, XCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge, BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { queryKeys } from '../../services/queryKeys';
import { sectionService, VersionStatus } from '../../services/sectionService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';

const STATUS_BADGE: Record<VersionStatus, BadgeVariant> = {
  scheduled: 'warning',
  applied: 'success',
  expired: 'neutral',
};

export const SectionVersionsPanel: React.FC<{ tabId: string }> = ({ tabId }) => {
  const queryClient = useQueryClient();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: versions = [], isLoading, error } = useQuery({
    queryKey: queryKeys.sections.versions(tabId),
    queryFn: () => sectionService.getVersions(tabId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sections.versions(tabId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sections.byTab(tabId) });
  };

  const scheduleMutation = useMutation({
    mutationFn: (isoDate: string) => sectionService.schedule(tabId, isoDate),
    onSuccess: () => { invalidate(); setScheduleOpen(false); setScheduledAt(''); },
  });

  const cancelMutation = useMutation({
    mutationFn: () => sectionService.cancelSchedule(tabId),
    onSuccess: invalidate,
  });

  const rollbackMutation = useMutation({
    mutationFn: (versionId: string) => sectionService.rollback(tabId, versionId),
    onSuccess: invalidate,
  });

  const pendingSchedule = versions.find((v) => v.status === 'scheduled');

  return (
    <Card
      title="Version History & Scheduling"
      subtitle="Layout versions are created only when you schedule a change — editing sections directly doesn't create a version."
      action={
        <div className="flex items-center gap-2">
          {pendingSchedule && (
            <Button variant="outline" size="sm" icon={<XCircle className="w-3.5 h-3.5" />} onClick={() => cancelMutation.mutate()} isLoading={cancelMutation.isPending}>
              Cancel Scheduled Change
            </Button>
          )}
          <Button variant="primary" size="sm" icon={<CalendarClock className="w-3.5 h-3.5" />} onClick={() => setScheduleOpen(true)}>
            Schedule Layout Change
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load version history: {(error as Error).message}</p>
      ) : isLoading ? (
        <p className="text-xs text-status-neutral p-3">Loading versions…</p>
      ) : versions.length === 0 ? (
        <p className="text-xs text-status-neutral text-center py-6 flex flex-col items-center gap-1.5">
          <History className="w-5 h-5 text-status-neutral/60" />
          No versions yet — schedule a layout change to create the first one.
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 p-2.5 border border-border rounded-[10px] bg-rose-50/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono-num font-bold text-ink text-xs">v{v.version}</span>
                <Badge variant={STATUS_BADGE[v.status]} size="sm">{v.status}</Badge>
                <span className="text-[10px] text-status-neutral">AB {v.ab_variant} · {v.ab_split_percent}%</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[10px] text-status-neutral">
                {v.scheduled_at && <span>Scheduled {new Date(v.scheduled_at).toLocaleString('en-IN')}</span>}
                <span>Created {new Date(v.created_at).toLocaleString('en-IN')}</span>
                <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => rollbackMutation.mutate(v.id)} isLoading={rollbackMutation.isPending}>
                  Rollback
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Layout Change"
        subtitle="Snapshots the current section order/config to apply automatically at this time. Scheduling again replaces any pending schedule."
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!scheduledAt}
              isLoading={scheduleMutation.isPending}
              onClick={() => scheduleMutation.mutate(new Date(scheduledAt).toISOString())}
            >
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {scheduleMutation.error && (
            <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
              {(scheduleMutation.error as Error).message}
            </p>
          )}
          <div>
            <label className="block text-[11px] font-bold text-ink mb-1">Apply At</label>
            <input type="datetime-local" className={inputClass} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
        </div>
      </Modal>
    </Card>
  );
};
