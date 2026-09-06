import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Image as ImageIcon, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { ThemeImageUploader } from '../themes/ThemeImageUploader';
import { queryKeys } from '../../services/queryKeys';
import {
  bannerService, Banner, BannerInput, BannerType, BannerLinkType,
} from '../../services/bannerService';

const LINK_TYPES: BannerLinkType[] = ['category', 'product', 'url', 'none'];

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

function emptyForm(bannerType: BannerType): BannerInput {
  return {
    title: '',
    imageUrl: '',
    bannerType,
    linkType: 'category',
    linkValue: '',
    isActive: true,
    startDate: null,
    endDate: null,
    triggerType: 'ALWAYS',
  };
}

const SortableRow: React.FC<{ banner: Banner; onEdit: () => void; onDelete: () => void }> = ({
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
      className="flex items-center gap-3 border border-border rounded-[12px] p-2.5 bg-white hover:border-brand-raspberry transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 text-status-neutral cursor-grab active:cursor-grabbing hover:text-brand-berry"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-16 h-10 rounded-[8px] overflow-hidden bg-rose-100 flex-shrink-0">
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-status-neutral">
            <ImageIcon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-ink truncate">{banner.title}</p>
        <p className="text-[10px] text-status-neutral truncate">
          {banner.linkType !== 'none' ? `${banner.linkType} → ${banner.linkValue || '—'}` : 'No link'}
        </p>
      </div>
      <Badge variant={banner.isActive ? 'success' : 'neutral'} size="sm">
        {banner.isActive ? 'Active' : 'Inactive'}
      </Badge>
      <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={onEdit} />
      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={onDelete} className="text-status-danger hover:bg-status-danger/10" />
    </div>
  );
};

interface SectionProps {
  fixedType: BannerType;
  heading: string;
  description: string;
  addLabel: string;
}

const BannerTypeSection: React.FC<SectionProps> = ({ fixedType, heading, description, addLabel }) => {
  const queryClient = useQueryClient();
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerInput>(emptyForm(fixedType));
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null);

  const { data: allBanners = [], isLoading, error } = useQuery({
    queryKey: queryKeys.banners.list(),
    queryFn: bannerService.getBanners,
  });

  const scoped = allBanners
    .filter((b) => b.bannerType === fixedType)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const displayBanners = orderedIds
    ? orderedIds.map((id) => scoped.find((b) => b.id === id)).filter((b): b is Banner => !!b)
    : scoped;

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
    mutationFn: (ids: string[]) => bannerService.reorderBanners(ids),
    onSuccess: () => { invalidate(); setOrderedIds(null); },
    onError: () => setOrderedIds(null),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayBanners.findIndex((b) => b.id === active.id);
    const newIndex = displayBanners.findIndex((b) => b.id === over.id);
    const next = arrayMove(displayBanners, oldIndex, newIndex);
    setOrderedIds(next.map((b) => b.id));
    reorderMutation.mutate(next.map((b) => b.id));
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm(fixedType)); setFormOpen(true); };
  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      bannerType: fixedType,
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
      updateMutation.mutate({ id: editing.id, input: form });
    } else {
      const { startDate, endDate, ...rest } = form;
      createMutation.mutate(rest);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  return (
    <Card>
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-ink">{heading}</h3>
          <p className="text-xs text-status-neutral mt-0.5">{description}</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
          {addLabel}
        </Button>
      </div>

      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load banners: {(error as Error).message}</p>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 bg-rose-100/60 rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : displayBanners.length === 0 ? (
        <p className="text-xs text-status-neutral text-center py-6">No banners yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayBanners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {displayBanners.map((banner) => (
                <SortableRow
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
        title={editing ? 'Edit Banner' : addLabel}
        subtitle={heading}
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
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fresh Seafood Delivered Faster" />
          </div>

          <ThemeImageUploader
            label="Banner Image"
            value={form.imageUrl || null}
            onChange={(url) => setForm({ ...form, imageUrl: url ?? '' })}
            hint="Recommended: 1200 × 500px (landscape, ~2.4:1) — the image fills this box edge-to-edge on the app, so matching this ratio avoids any cropping."
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Link Type</label>
              <select className={inputClass} value={form.linkType} onChange={(e) => setForm({ ...form, linkType: e.target.value as BannerLinkType })}>
                {LINK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Link Value</label>
              <input
                className={inputClass}
                value={form.linkValue ?? ''}
                disabled={form.linkType === 'none'}
                onChange={(e) => setForm({ ...form, linkValue: e.target.value })}
                placeholder={form.linkType === 'category' ? 'Category ID' : form.linkType === 'none' ? 'N/A' : 'ID or URL'}
              />
            </div>
            <div className="flex items-center gap-2 pt-5 col-span-2">
              <input type="checkbox" id={`banner-active-${fixedType}`} checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor={`banner-active-${fixedType}`} className="text-xs font-bold text-ink">Active</label>
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
      </Modal>
    </Card>
  );
};

export const CategoryPageBanners: React.FC = () => {
  return (
    <div className="space-y-4">
      <BannerTypeSection
        fixedType="category"
        heading="Top Carousel"
        description="Swipeable banners shown at the top of the mobile app's Category landing page."
        addLabel="Add Carousel Banner"
      />
      <BannerTypeSection
        fixedType="category_footer"
        heading="Bottom Combo Banner"
        description="Wide promo strip shown below the category grid (e.g. 'Combos — value packs for every need')."
        addLabel="Add Combo Banner"
      />
    </div>
  );
};
