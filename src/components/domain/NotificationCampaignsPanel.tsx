import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Send, FileText, Users2, Ban } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Table, Column } from '../common/Table';
import { queryKeys } from '../../services/queryKeys';
import {
  notificationCampaignService, NotificationTemplate, TemplateInput, NotificationCampaign,
  SendBulkInput, SegmentKey, NotificationType,
} from '../../services/notificationCampaignService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const SEGMENTS: { value: SegmentKey; label: string }[] = [
  { value: 'all_customers', label: 'All Customers' },
  { value: 'inactive_customers', label: 'Inactive Customers' },
  { value: 'cart_not_empty', label: 'Cart Not Empty' },
  { value: 'high_value', label: 'High Value' },
  { value: 'new', label: 'New Customers' },
];

const CAMPAIGN_STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  SENT: 'success', SCHEDULED: 'info', SENDING: 'warning', FAILED: 'danger', CANCELLED: 'neutral',
};

const emptyTemplate: TemplateInput = { name: '', title: '', body: '', type: 'PUSH' };
const emptyCampaign: SendBulkInput = { title: '', body: '', segment: 'all_customers', type: 'general' };

const TemplatesSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [form, setForm] = useState<TemplateInput>(emptyTemplate);
  const [pendingDelete, setPendingDelete] = useState<NotificationTemplate | null>(null);

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: queryKeys.notificationCampaigns.templates(),
    queryFn: notificationCampaignService.getTemplates,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationCampaigns.templates() });
  const createMutation = useMutation({ mutationFn: (i: TemplateInput) => notificationCampaignService.createTemplate(i), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<TemplateInput> }) => notificationCampaignService.updateTemplate(id, input), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => notificationCampaignService.deleteTemplate(id), onSuccess: () => { invalidate(); setPendingDelete(null); } });

  const openCreate = () => { setEditing(null); setForm(emptyTemplate); setFormOpen(true); };
  const openEdit = (t: NotificationTemplate) => { setEditing(t); setForm({ name: t.name, title: t.title, body: t.body, type: t.type, image_url: t.image_url ?? undefined, deep_link: t.deep_link ?? undefined, is_active: t.is_active }); setFormOpen(true); };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const columns: Column<NotificationTemplate>[] = [
    { header: 'Template', cell: (row) => <div><p className="font-bold text-ink">{row.name}</p><p className="text-[11px] text-status-neutral">{row.title}</p></div> },
    { header: 'Type', cell: (row) => <Badge variant="info" size="sm">{row.type}</Badge> },
    { header: 'Status', cell: (row) => <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(row)}>Edit</Button>
        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setPendingDelete(row)} className="text-status-danger hover:bg-status-danger/10">Delete</Button>
      </div>
    ) },
  ];

  return (
    <Card title="Notification Templates" action={
      <div className="flex items-center gap-2">
        <Badge variant="brand" icon={<FileText className="w-3 h-3" />}>{templates.length} Templates</Badge>
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Template</Button>
      </div>
    }>
      {error ? <p className="text-xs text-status-danger p-3">{(error as Error).message}</p> : (
        <Table columns={columns} data={templates} keyExtractor={(r) => r.id} isLoading={isLoading} emptyText="No notification templates yet." />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Template' : 'New Template'} maxWidth="md"
        footer={<>
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" isLoading={isSaving} disabled={!form.name || !form.title || !form.body}
            onClick={() => editing ? updateMutation.mutate({ id: editing.id, input: form }) : createMutation.mutate(form)}>
            {editing ? 'Save Changes' : 'Create Template'}
          </Button>
        </>}
      >
        {saveError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(saveError as Error).message}</p>}
        <div className="space-y-3">
          <div><label className={labelClass}>Internal Name</label><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className={labelClass}>Notification Title</label><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className={labelClass}>Body</label><textarea className={inputClass} rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <div>
            <label className={labelClass}>Channel</label>
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NotificationType })}>
              <option value="PUSH">Push</option><option value="SMS">SMS</option><option value="EMAIL">Email</option><option value="IN_APP">In-App</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete Template" maxWidth="sm"
        footer={<><Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}>Delete</Button></>}>
        <p className="text-sm text-ink">Delete <span className="font-bold">{pendingDelete?.name}</span>? This cannot be undone.</p>
      </Modal>
    </Card>
  );
};

const CampaignsSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState<SendBulkInput>(emptyCampaign);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: queryKeys.notificationCampaigns.campaigns(),
    queryFn: notificationCampaignService.getCampaigns,
  });

  const { data: segmentCount } = useQuery({
    queryKey: queryKeys.notificationCampaigns.segmentCount({ segment: form.segment }),
    queryFn: () => notificationCampaignService.getSegmentCount(form.segment),
    enabled: composeOpen,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationCampaigns.all });
  const sendMutation = useMutation({ mutationFn: (i: SendBulkInput) => notificationCampaignService.sendBulk(i), onSuccess: () => { invalidate(); setComposeOpen(false); } });
  const scheduleMutation = useMutation({ mutationFn: (i: SendBulkInput & { scheduledAt: string }) => notificationCampaignService.schedule(i), onSuccess: () => { invalidate(); setComposeOpen(false); } });
  const cancelMutation = useMutation({ mutationFn: (id: string) => notificationCampaignService.cancelCampaign(id), onSuccess: invalidate });

  const isSending = sendMutation.isPending || scheduleMutation.isPending;
  const sendError = sendMutation.error || scheduleMutation.error;

  const openCompose = () => { setForm(emptyCampaign); setScheduleMode(false); setScheduledAt(''); setComposeOpen(true); };
  const submit = () => {
    if (scheduleMode) scheduleMutation.mutate({ ...form, scheduledAt: new Date(scheduledAt).toISOString() });
    else sendMutation.mutate(form);
  };

  const columns: Column<NotificationCampaign>[] = [
    { header: 'Campaign', cell: (row) => <div><p className="font-bold text-ink">{row.title}</p><p className="text-[11px] text-status-neutral">{row.segment}</p></div> },
    { header: 'Status', cell: (row) => <Badge variant={CAMPAIGN_STATUS_VARIANT[row.status] ?? 'neutral'}>{row.status}</Badge> },
    { header: 'Target', cell: (row) => <span className="font-mono-num">{row.target_count ?? '—'}</span> },
    { header: 'Sent / Opened', cell: (row) => <span className="font-mono-num">{row.sent_count} / {row.opened_count}</span> },
    { header: 'When', cell: (row) => <span className="text-[11px] text-status-neutral">{row.sent_at ? new Date(row.sent_at).toLocaleString('en-IN') : row.scheduled_at ? `Scheduled: ${new Date(row.scheduled_at).toLocaleString('en-IN')}` : '—'}</span> },
    { header: 'Actions', cell: (row) => row.status === 'SCHEDULED' ? (
      <Button variant="ghost" size="sm" icon={<Ban className="w-3.5 h-3.5" />} onClick={() => cancelMutation.mutate(row.id)} className="text-status-danger hover:bg-status-danger/10">Cancel</Button>
    ) : null },
  ];

  return (
    <Card title="Notification Campaigns" action={
      <div className="flex items-center gap-2">
        <Badge variant="brand" icon={<Send className="w-3 h-3" />}>{campaigns.length} Campaigns</Badge>
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCompose}>Compose</Button>
      </div>
    }>
      {error ? <p className="text-xs text-status-danger p-3">{(error as Error).message}</p> : (
        <Table columns={columns} data={campaigns} keyExtractor={(r) => r.id} isLoading={isLoading} emptyText="No campaigns sent yet." />
      )}

      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="Compose Campaign" maxWidth="lg"
        footer={<>
          <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button variant="primary" icon={<Send className="w-3.5 h-3.5" />} isLoading={isSending} disabled={!form.title || !form.body || (scheduleMode && !scheduledAt)} onClick={submit}>
            {scheduleMode ? 'Schedule Campaign' : 'Send Now'}
          </Button>
        </>}
      >
        {sendError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(sendError as Error).message}</p>}
        <div className="space-y-3">
          <div><label className={labelClass}>Title</label><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className={labelClass}>Message</label><textarea className={inputClass} rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className={labelClass}>Audience</label>
              <select className={inputClass} value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value as SegmentKey })}>
                {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 pb-2 text-xs">
              <Users2 className="w-3.5 h-3.5 text-brand-berry" />
              <span className="font-mono-num font-bold text-brand-berry">{segmentCount ?? '…'}</span>
              <span className="text-status-neutral">recipients</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="camp-schedule" checked={scheduleMode} onChange={(e) => setScheduleMode(e.target.checked)} />
            <label htmlFor="camp-schedule" className="text-xs font-bold text-ink">Schedule for later</label>
          </div>
          {scheduleMode && (
            <div><label className={labelClass}>Send At</label><input type="datetime-local" className={inputClass} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
          )}
        </div>
      </Modal>
    </Card>
  );
};

export const NotificationCampaignsPanel: React.FC = () => (
  <div className="space-y-4">
    <CampaignsSection />
    <TemplatesSection />
  </div>
);
