import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Table, Column } from '../common/Table';
import { queryKeys } from '../../services/queryKeys';
import { customerSegmentService, CustomerSegment, CustomerSegmentInput } from '../../services/customerSegmentService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const emptyForm: CustomerSegmentInput = { name: '', description: '' };

export const CustomerSegmentsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerSegment | null>(null);
  const [form, setForm] = useState<CustomerSegmentInput>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<CustomerSegment | null>(null);

  const { data: segments = [], isLoading, error } = useQuery({
    queryKey: queryKeys.customerSegments.list(),
    queryFn: customerSegmentService.getSegments,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.customerSegments.all });
  const createMutation = useMutation({ mutationFn: (i: CustomerSegmentInput) => customerSegmentService.createSegment(i), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<CustomerSegmentInput> }) => customerSegmentService.updateSegment(id, input), onSuccess: () => { invalidate(); setFormOpen(false); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => customerSegmentService.deleteSegment(id), onSuccess: () => { invalidate(); setPendingDelete(null); } });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (s: CustomerSegment) => { setEditing(s); setForm({ name: s.name, description: s.description ?? '', isActive: s.is_active }); setFormOpen(true); };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const columns: Column<CustomerSegment>[] = [
    { header: 'Segment', cell: (row) => (
      <div><p className="font-bold text-ink">{row.name}</p>{row.description && <p className="text-[11px] text-status-neutral">{row.description}</p>}</div>
    ) },
    { header: 'Members', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">{row.member_count}</span> },
    { header: 'Created', cell: (row) => <span className="text-[11px] text-status-neutral">{new Date(row.created_at).toLocaleDateString('en-IN')}</span> },
    { header: 'Status', cell: (row) => <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(row)}>Edit</Button>
        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setPendingDelete(row)} className="text-status-danger hover:bg-status-danger/10">Delete</Button>
      </div>
    ) },
  ];

  return (
    <Card title="Customer Segments" action={
      <div className="flex items-center gap-2">
        <Badge variant="brand" icon={<Users className="w-3 h-3" />}>{segments.length} Segments</Badge>
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Segment</Button>
      </div>
    }>
      {error ? <p className="text-xs text-status-danger p-3">{(error as Error).message}</p> : (
        <Table columns={columns} data={segments} keyExtractor={(r) => r.id} isLoading={isLoading} emptyText="No customer segments configured yet." />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Segment' : 'New Segment'} maxWidth="md"
        footer={<>
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" isLoading={isSaving} disabled={!form.name}
            onClick={() => editing ? updateMutation.mutate({ id: editing.id, input: form }) : createMutation.mutate(form)}>
            {editing ? 'Save Changes' : 'Create Segment'}
          </Button>
        </>}
      >
        {saveError && <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">{(saveError as Error).message}</p>}
        <div className="space-y-3">
          <div><label className={labelClass}>Name</label><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {editing && <div className="flex items-center gap-2"><input type="checkbox" id="seg-active" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><label htmlFor="seg-active" className="text-xs font-bold text-ink">Active</label></div>}
        </div>
        <p className="text-[11px] text-status-neutral mt-3">Members are curated manually — add customers to this segment from the customer's profile once it exists (CRM drill-down, mini-phase 3).</p>
      </Modal>

      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete Segment" maxWidth="sm"
        footer={<><Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}>Delete</Button></>}>
        <p className="text-sm text-ink">Delete <span className="font-bold">{pendingDelete?.name}</span>? This cannot be undone.</p>
      </Modal>
    </Card>
  );
};
