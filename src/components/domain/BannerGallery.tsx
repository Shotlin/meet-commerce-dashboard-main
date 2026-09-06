import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Image as ImageIcon, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { queryKeys } from '../../services/queryKeys';
import {
  bannerService, Banner, BannerInput, BannerType, BannerLinkType, BannerTriggerType,
} from '../../services/bannerService';

const BANNER_TYPES: BannerType[] = ['carousel', 'popup', 'announcement'];
const LINK_TYPES: BannerLinkType[] = ['none', 'category', 'product', 'url'];
const TRIGGER_TYPES: BannerTriggerType[] = ['ALWAYS', 'STORE_CLOSED'];

const emptyForm: BannerInput = {
  title: '',
  imageUrl: '',
  bannerType: 'carousel',
  linkType: 'none',
  linkValue: '',
  isActive: true,
  startDate: null,
  endDate: null,
  triggerType: 'ALWAYS',
};

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const SortableBannerCard: React.FC<{ banner: Banner; onEdit: () => void; onDelete: () => void }> = ({
  banner, onEdit, onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-border rounded-[12px] overflow-hidden bg-rose-50/50 group hover:border-brand-raspberry transition-all shadow-xs"
    >
      <div className="relative aspect-video overflow-hidden bg-rose-100">
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-status-neutral">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/90 text-status-neutral cursor-grab active:cursor-grabbing hover:text-brand-berry"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="absolute top-2 right-2">
          <Badge variant={banner.isActive ? 'success' : 'neutral'} size="sm">
            {banner.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <span className="text-[11px] font-bold text-brand-berry uppercase tracking-wider">{banner.bannerType}</span>
        <p className="text-xs font-bold text-ink mt-0.5">{banner.title}</p>
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={onEdit}>Edit</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={onDelete} className="text-status-danger hover:bg-status-danger/10">Delete</Button>
        </div>
      </div>
    </div>
  );
};

export const BannerGallery: React.FC = () => {
  const queryClient = useQueryClient();
  const [orderedBanners, setOrderedBanners] = useState<Banner[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerInput>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null);

  const { data: banners = [], isLoading, error } = useQuery({
    queryKey: queryKeys.banners.list(),
    queryFn: bannerService.getBanners,
  });

  const displayBanners = orderedBanners ?? banners;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });

  const createMutation = useMutation({
    mutationFn: (input: BannerInput) => bannerService.createBanner(input),
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BannerInput> }) => bannerService.updateBanner(id, input),
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannerService.deleteBanner(id),
    onSuccess: () => { invalidate(); setPendingDelete(null); },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => bannerService.reorderBanners(orderedIds),
    onSuccess: () => { invalidate(); setOrderedBanners(null); },
    onError: () => setOrderedBanners(null),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayBanners.findIndex((b) => b.id === active.id);
    const newIndex = displayBanners.findIndex((b) => b.id === over.id);
    const next = arrayMove(displayBanners, oldIndex, newIndex);
    setOrderedBanners(next);
    reorderMutation.mutate(next.map((b) => b.id));
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      bannerType: banner.bannerType,
      linkType: banner.linkType,
      linkValue: banner.linkValue ?? '',
      isActive: banner.isActive,
      startDate: banner.startDate,
      endDate: banner.endDate,
      triggerType: banner.triggerType,
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      // Update schema allows null start/end date (clears it) — send as-is.
      updateMutation.mutate({ id: editing.id, input: form });
    } else {
      // Create schema requires startDate/endDate to be a valid date-time
      // string when present (no null in the union) — omit unset ones.
      const { startDate, endDate, ...rest } = form;
      const payload: BannerInput = {
        ...rest,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      };
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 shadow-card">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-brand-berry" />
          <h3 className="text-sm font-bold text-ink">Campaign Banner Asset Library</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-status-neutral">{banners.length} Banner{banners.length === 1 ? '' : 's'}</span>
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Banner</Button>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load banners: {(error as Error).message}</p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="aspect-video bg-rose-100/60 rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : displayBanners.length === 0 ? (
        <p className="text-xs text-status-neutral text-center py-8">No banners yet — add one to populate the storefront carousel.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayBanners.map((b) => b.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayBanners.map((banner) => (
                <SortableBannerCard
                  key={banner.id}
                  banner={banner}
                  onEdit={() => openEdit(banner)}
                  onDelete={() => setPendingDelete(banner)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Banner' : 'New Banner'}
        subtitle="Promotional artwork shown on the storefront"
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={isSaving} disabled={!form.title || !form.imageUrl}>
              {editing ? 'Save Changes' : 'Create Banner'}
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
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Image URL</label>
            <input className={inputClass} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            {form.imageUrl && (
              <div className="mt-2 aspect-video w-full max-w-xs rounded-[10px] overflow-hidden border border-border bg-rose-100">
                <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Banner Type</label>
              <select className={inputClass} value={form.bannerType} onChange={(e) => setForm({ ...form, bannerType: e.target.value as BannerType })}>
                {BANNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Shown When</label>
              <select className={inputClass} value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value as BannerTriggerType })}>
                {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t === 'ALWAYS' ? 'Always' : 'Store Closed'}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Link Type</label>
              <select className={inputClass} value={form.linkType} onChange={(e) => setForm({ ...form, linkType: e.target.value as BannerLinkType })}>
                {LINK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Link Value</label>
              <input className={inputClass} value={form.linkValue ?? ''} disabled={form.linkType === 'none'} onChange={(e) => setForm({ ...form, linkValue: e.target.value })} placeholder={form.linkType === 'none' ? 'N/A' : 'ID or URL'} />
            </div>
            <div>
              <label className={labelClass}>Start Date</label>
              <input type="date" className={inputClass} value={form.startDate ? form.startDate.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, startDate: e.target.value || null })} />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input type="date" className={inputClass} value={form.endDate ? form.endDate.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, endDate: e.target.value || null })} />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="banner-active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="banner-active" className="text-xs font-bold text-ink">Active</label>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete Banner"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)} isLoading={deleteMutation.isPending}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-ink">Delete <span className="font-bold">{pendingDelete?.title}</span>? This cannot be undone.</p>
        {deleteMutation.error && <p className="text-xs text-status-danger mt-2">{(deleteMutation.error as Error).message}</p>}
      </Modal>
    </div>
  );
};
