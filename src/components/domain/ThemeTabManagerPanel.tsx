import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Table, Column } from '../common/Table';
import { queryKeys } from '../../services/queryKeys';
import { themeTabService, ThemeTab, ThemeTabInput, STORE_KEYS, StoreKey } from '../../services/themeTabService';

const emptyForm: ThemeTabInput = {
  store_key: 'zepto',
  key: '',
  label: '',
  image_url: null,
  text_color: null,
  sort_order: 0,
};

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

export const ThemeTabManagerPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ThemeTab | null>(null);
  const [form, setForm] = useState<ThemeTabInput>(emptyForm);
  const [pendingArchive, setPendingArchive] = useState<ThemeTab | null>(null);

  const { data: tabs = [], isLoading, error } = useQuery({
    queryKey: queryKeys.themeTabs.list(showArchived ? undefined : { status: 'active' }),
    queryFn: () => themeTabService.list(showArchived ? undefined : { status: 'active' }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.themeTabs.all });

  const createMutation = useMutation({
    mutationFn: (input: ThemeTabInput) => themeTabService.create(input),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ThemeTabInput }) => themeTabService.update(id, input),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => themeTabService.archive(id),
    onSuccess: () => {
      invalidate();
      setPendingArchive(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => themeTabService.restore(id),
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (tab: ThemeTab) => {
    setEditing(tab);
    setForm({
      store_key: tab.store_key,
      key: tab.key,
      label: tab.label,
      image_url: tab.image_url,
      text_color: tab.text_color,
      sort_order: tab.sort_order,
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const columns: Column<ThemeTab>[] = [
    { header: 'Tab', cell: (row) => (
      <div className="flex items-center gap-2">
        {row.text_color && <span className="w-3 h-3 rounded-full border border-border shrink-0" style={{ backgroundColor: row.text_color }} />}
        <div>
          <p className="font-bold text-ink">{row.label}</p>
          <p className="text-[11px] text-status-neutral font-mono-num">key: {row.key}</p>
        </div>
      </div>
    ) },
    { header: 'Store', cell: (row) => <span className="font-mono-num">{row.store_key}</span> },
    { header: 'Sort Order', cell: (row) => <span className="font-mono-num">{row.sort_order}</span> },
    { header: 'Legacy Themes', cell: (row) => (
      <span className="text-[11px] text-status-neutral">
        A: {row.theme_a_name ?? '—'} · B: {row.theme_b_name ?? '—'}
      </span>
    ) },
    { header: 'Status', cell: (row) => <Badge variant={row.status === 'active' ? 'success' : 'neutral'} size="sm">{row.status}</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => openEdit(row)} icon={<Pencil className="w-3.5 h-3.5" />}>Edit</Button>
        {row.status === 'active' ? (
          <Button variant="ghost" size="sm" onClick={() => setPendingArchive(row)} icon={<Archive className="w-3.5 h-3.5" />} className="text-status-danger hover:bg-status-danger/10">Archive</Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => restoreMutation.mutate(row.id)} isLoading={restoreMutation.isPending} icon={<ArchiveRestore className="w-3.5 h-3.5" />}>Restore</Button>
        )}
      </div>
    ) },
  ];

  return (
    <Card
      title="Manage Tabs"
      subtitle="Create, edit, archive, and restore the store tabs the app renders."
      action={
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-status-neutral">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>New Tab</Button>
        </div>
      }
    >
      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load theme tabs: {(error as Error).message}</p>
      ) : (
        <Table
          columns={columns}
          data={tabs}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyText="No theme tabs yet."
        />
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Theme Tab' : 'New Theme Tab'}
        subtitle="A tab the app renders as its own home-screen layout"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={isSaving} disabled={!form.key || !form.label}>
              {editing ? 'Save Changes' : 'Create Tab'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {saveError && (
            <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
              {(saveError as Error).message}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Store</label>
              <select className={inputClass} value={form.store_key} onChange={(e) => setForm({ ...form, store_key: e.target.value as StoreKey })}>
                {STORE_KEYS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Key (URL-safe slug)</label>
              <input className={inputClass} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. diwali" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Label</label>
            <input className={inputClass} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Diwali" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Icon / Image URL</label>
              <input className={inputClass} value={form.image_url ?? ''} onChange={(e) => setForm({ ...form, image_url: e.target.value || null })} />
            </div>
            <div>
              <label className={labelClass}>Text Color</label>
              <input type="color" className={`${inputClass} h-9 p-1`} value={form.text_color ?? '#000000'} onChange={(e) => setForm({ ...form, text_color: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Sort Order</label>
            <input type="number" className={inputClass} value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!pendingArchive}
        onClose={() => setPendingArchive(null)}
        title="Archive Theme Tab"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingArchive(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => pendingArchive && archiveMutation.mutate(pendingArchive.id)} isLoading={archiveMutation.isPending}>
              Archive
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          Archive <span className="font-bold">{pendingArchive?.label}</span>? It will stop rendering in the app. You can restore it later from "Show archived".
        </p>
        {archiveMutation.error && (
          <p className="text-xs text-status-danger mt-2">{(archiveMutation.error as Error).message}</p>
        )}
      </Modal>
    </Card>
  );
};
