import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Store, Clock, CalendarClock, RefreshCw, Save } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { queryKeys } from '../../services/queryKeys';
import {
  storeOpsService, WeeklyHours, DayHours, TemplateRow, CalendarDay,
} from '../../services/storeOpsService';

const inputClass =
  'w-full px-2.5 py-1.5 text-xs rounded-[8px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';

const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultDayHours: DayHours = { open: '09:00', close: '22:00', closed: false };

// The backend returns DATE columns as an IST-midnight instant serialized to
// UTC (e.g. calendar date 2026-09-03 comes back as "2026-09-02T18:30:00Z").
// `.toISOString().slice(0,10)` on that string yields the WRONG calendar day.
// Always extract the date using local Date getters (matching how the day
// cards' `toLocaleDateString` label is computed) so what's displayed and
// what's sent back to the API always agree.
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function todayIso() {
  return toDateKey(new Date());
}
function plusDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export const StoreOperationsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [weeklyForm, setWeeklyForm] = useState<WeeklyHours | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<'AUTO' | 'OPEN' | 'CLOSED'>('AUTO');
  const [overrideNote, setOverrideNote] = useState('');
  const [templateForm, setTemplateForm] = useState<TemplateRow[] | null>(null);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: queryKeys.storeOps.status(),
    queryFn: storeOpsService.getStatus,
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: queryKeys.storeOps.deliveryTemplate(),
    queryFn: storeOpsService.getTemplate,
  });

  const { data: days = [] } = useQuery({
    queryKey: queryKeys.storeOps.deliveryDays({ from: todayIso(), to: plusDaysIso(6) }),
    queryFn: () => storeOpsService.getDays(todayIso(), plusDaysIso(6)),
  });

  useEffect(() => {
    if (status) {
      setWeeklyForm(status.weeklyHours);
      setOverrideStatus(status.source === 'MANUAL_OVERRIDE' ? (status.isOpen ? 'OPEN' : 'CLOSED') : 'AUTO');
      setOverrideNote(status.reason ?? '');
    }
  }, [status]);

  useEffect(() => {
    if (template) {
      if (template.length === WEEKDAY_KEYS.length) {
        setTemplateForm([...template].sort((a, b) => a.weekday - b.weekday));
      } else {
        // No template saved yet — seed a sensible default row per weekday.
        setTemplateForm(
          WEEKDAY_KEYS.map((_, i) => ({
            weekday: i, is_available: true, start_time: '09:00', end_time: '21:00', label: 'Standard Delivery', display_order: 0,
          }))
        );
      }
    }
  }, [template]);

  const invalidateStatus = () => queryClient.invalidateQueries({ queryKey: queryKeys.storeOps.status() });

  const weeklyHoursMutation = useMutation({
    mutationFn: (hours: WeeklyHours) => storeOpsService.updateWeeklyHours(hours),
    onSuccess: invalidateStatus,
  });

  const overrideMutation = useMutation({
    mutationFn: () => storeOpsService.setOverride(overrideStatus === 'AUTO' ? null : overrideStatus, overrideNote || undefined),
    onSuccess: invalidateStatus,
  });

  const templateMutation = useMutation({
    mutationFn: (rows: TemplateRow[]) => storeOpsService.putTemplate(rows),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.storeOps.deliveryTemplate() }),
  });

  const generateMutation = useMutation({
    mutationFn: () => storeOpsService.generate(30),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.storeOps.all }),
  });

  const dayToggleMutation = useMutation({
    mutationFn: ({ date, is_available }: { date: string; is_available: boolean }) =>
      storeOpsService.patchDay(date, { is_available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.storeOps.all }),
  });

  const setDayField = (key: typeof WEEKDAY_KEYS[number], field: keyof DayHours, value: string | boolean) => {
    if (!weeklyForm) return;
    const current = weeklyForm[key] ?? defaultDayHours;
    setWeeklyForm({ ...weeklyForm, [key]: { ...current, [field]: value } });
  };

  const setTemplateField = (idx: number, field: keyof TemplateRow, value: string | boolean) => {
    if (!templateForm) return;
    const next = [...templateForm];
    next[idx] = { ...next[idx], [field]: value };
    setTemplateForm(next);
  };

  return (
    <div className="space-y-4">
      <Card
        title="Store Hours & Manual Override"
        action={
          status ? (
            <Badge variant={status.isOpen ? 'success' : 'danger'} icon={<Store className="w-3 h-3" />}>
              {status.isOpen ? 'Open' : 'Closed'} · {status.source}
            </Badge>
          ) : undefined
        }
      >
        {statusLoading || !weeklyForm ? (
          <p className="text-xs text-status-neutral">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-3 p-3 bg-rose-50/60 rounded-[12px] border border-border">
              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Manual Override</label>
                <select className={inputClass} value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value as typeof overrideStatus)}>
                  <option value="AUTO">Auto (follow weekly hours)</option>
                  <option value="OPEN">Force Open</option>
                  <option value="CLOSED">Force Closed</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-ink mb-1">Note</label>
                <input className={inputClass} value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} placeholder="e.g. Public holiday" />
              </div>
              <Button variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />} isLoading={overrideMutation.isPending} onClick={() => overrideMutation.mutate()}>
                Apply
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-brand-berry uppercase tracking-wider">Weekly Hours</h4>
                <Button variant="outline" size="sm" icon={<Save className="w-3.5 h-3.5" />} isLoading={weeklyHoursMutation.isPending} onClick={() => weeklyForm && weeklyHoursMutation.mutate(weeklyForm)}>
                  Save Hours
                </Button>
              </div>
              <div className="space-y-1.5">
                {WEEKDAY_KEYS.map((key, i) => {
                  const day = weeklyForm[key] ?? defaultDayHours;
                  return (
                    <div key={key} className="grid grid-cols-[90px_1fr_1fr_auto] gap-2 items-center text-xs">
                      <span className="font-bold text-ink">{WEEKDAY_LABELS[i]}</span>
                      <input type="time" className={inputClass} value={day.open} disabled={day.closed} onChange={(e) => setDayField(key, 'open', e.target.value)} />
                      <input type="time" className={inputClass} value={day.close} disabled={day.closed} onChange={(e) => setDayField(key, 'close', e.target.value)} />
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
                        <input type="checkbox" checked={day.closed} onChange={(e) => setDayField(key, 'closed', e.target.checked)} /> Closed
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Delivery Calendar"
        action={
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} isLoading={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
            Generate 30 Days
          </Button>
        }
      >
        {templateLoading || !templateForm ? (
          <p className="text-xs text-status-neutral">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-brand-berry uppercase tracking-wider">Weekly Template</h4>
                <Button variant="outline" size="sm" icon={<Save className="w-3.5 h-3.5" />} isLoading={templateMutation.isPending} onClick={() => templateForm && templateMutation.mutate(templateForm)}>
                  Save Template
                </Button>
              </div>
              <div className="space-y-1.5">
                {templateForm.map((row, i) => (
                  <div key={row.weekday} className="grid grid-cols-[90px_1fr_1fr_1fr_auto] gap-2 items-center text-xs">
                    <span className="font-bold text-ink">{WEEKDAY_LABELS[row.weekday]}</span>
                    <input type="time" className={inputClass} value={row.start_time} disabled={!row.is_available} onChange={(e) => setTemplateField(i, 'start_time', e.target.value)} />
                    <input type="time" className={inputClass} value={row.end_time} disabled={!row.is_available} onChange={(e) => setTemplateField(i, 'end_time', e.target.value)} />
                    <input className={inputClass} value={row.label} onChange={(e) => setTemplateField(i, 'label', e.target.value)} />
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
                      <input type="checkbox" checked={row.is_available} onChange={(e) => setTemplateField(i, 'is_available', e.target.checked)} /> Active
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-brand-berry uppercase tracking-wider mb-2">Next 7 Days</h4>
              {days.length === 0 ? (
                <p className="text-xs text-status-neutral">No materialized days yet — click "Generate 30 Days" above.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {days.map((d) => (
                    <div key={d.id} className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
                      <p className="text-[11px] font-bold text-ink">{new Date(d.calendar_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] text-status-neutral">{d.slots.length} slot{d.slots.length === 1 ? '' : 's'}</p>
                      <button
                        className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${d.is_available ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}`}
                        onClick={() => dayToggleMutation.mutate({ date: toDateKey(new Date(d.calendar_date)), is_available: !d.is_available })}
                      >
                        {d.is_available ? 'Available' : 'Blocked'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
