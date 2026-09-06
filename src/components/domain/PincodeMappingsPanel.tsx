import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Table, Column } from '../common/Table';
import { queryKeys } from '../../services/queryKeys';
import { pincodeMappingService, PincodeMapping, PincodeMappingInput } from '../../services/pincodeMappingService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const emptyForm: PincodeMappingInput = { pincode: '', city: '', area: '', state: '', isActive: true };

export const PincodeMappingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PincodeMapping | null>(null);
  const [form, setForm] = useState<PincodeMappingInput>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<PincodeMapping | null>(null);

  const { data: mappings = [], isLoading, error } = useQuery({
    queryKey: queryKeys.pincodeMappings.list(),
    queryFn: pincodeMappingService.getMappings,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.pincodeMappings.all });

  const createMutation = useMutation({
    mutationFn: (input: PincodeMappingInput) => pincodeMappingService.createMapping(input),
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PincodeMappingInput> }) => pincodeMappingService.updateMapping(id, input),
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pincodeMappingService.deleteMapping(id),
    onSuccess: () => { invalidate(); setPendingDelete(null); },
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (m: PincodeMapping) => {
    setEditing(m);
    setForm({ pincode: m.pincode, city: m.city, area: m.area ?? '', state: m.state, isActive: m.isActive });
    setFormOpen(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const columns: Column<PincodeMapping>[] = [
    { header: 'Pincode', cell: (row) => <span className="font-mono-num font-bold text-brand-berry">{row.pincode}</span> },
    { header: 'City', accessorKey: 'city' },
    { header: 'Area', cell: (row) => row.area || '—' },
    { header: 'State', accessorKey: 'state' },
    { header: 'Status', cell: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(row)}>Edit</Button>
        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setPendingDelete(row)} className="text-status-danger hover:bg-status-danger/10">Delete</Button>
      </div>
    ) },
  ];

  return (
    <Card
      title="Pincode Serviceability Mapping"
      action={
        <div className="flex items-center gap-2">
          <Badge variant="brand" icon={<MapPin className="w-3 h-3" />}>{mappings.length} Mapped</Badge>
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Pincode</Button>
        </div>
      }
    >
      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load pincode mappings: {(error as Error).message}</p>
      ) : (
        <Table columns={columns} data={mappings} keyExtractor={(r) => r.id} isLoading={isLoading} emptyText="No pincode mappings yet." />
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Pincode Mapping' : 'New Pincode Mapping'}
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              isLoading={isSaving}
              disabled={!form.pincode || !form.city || !form.state}
              onClick={() => editing ? updateMutation.mutate({ id: editing.id, input: form }) : createMutation.mutate(form)}
            >
              {editing ? 'Save Changes' : 'Create Mapping'}
            </Button>
          </>
        }
      >
        {saveError && (
          <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">
            {(saveError as Error).message}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Pincode</label>
            <input className={inputClass} value={form.pincode} maxLength={6} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Area (optional)</label>
            <input className={inputClass} value={form.area ?? ''} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <input type="checkbox" id="pincode-active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <label htmlFor="pincode-active" className="text-xs font-bold text-ink">Active</label>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete Pincode Mapping"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)} isLoading={deleteMutation.isPending}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-ink">Delete pincode <span className="font-bold font-mono-num">{pendingDelete?.pincode}</span> ({pendingDelete?.city})? This cannot be undone.</p>
        {deleteMutation.error && <p className="text-xs text-status-danger mt-2">{(deleteMutation.error as Error).message}</p>}
      </Modal>
    </Card>
  );
};
