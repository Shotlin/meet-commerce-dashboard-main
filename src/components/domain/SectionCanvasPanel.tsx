import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Pencil, Trash2, Copy, GripVertical, Eye, EyeOff, Layers } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { queryKeys } from '../../services/queryKeys';
import { ThemeTab } from '../../services/themeTabService';
import { sectionService, Section, SectionInput, SectionType, SECTION_TYPES, MERCH_BOUND_SECTION_TYPES, MerchBinding } from '../../services/sectionService';
import { SECTION_FIELD_DEFS, FieldDef } from './sectionFieldRegistry';
import { MerchBindingEditor } from './MerchBindingEditor';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

const humanize = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Parses the working config text for typed-field rendering; falls back to an
// empty object on invalid JSON so the form never throws mid-edit.
const safeParseConfig = (text: string): Record<string, any> => {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const TypedConfigFields: React.FC<{
  defs: FieldDef[];
  configText: string;
  onChange: (nextConfigText: string) => void;
}> = ({ defs, configText, onChange }) => {
  const config = safeParseConfig(configText);

  const setField = (key: string, value: any) => {
    onChange(JSON.stringify({ ...config, [key]: value }, null, 2));
  };

  const setArrayField = (key: string, index: number, value: any) => {
    const arr = Array.isArray(config[key]) ? [...config[key]] : [];
    arr[index] = value;
    onChange(JSON.stringify({ ...config, [key]: arr }, null, 2));
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {defs.map((def) => {
        if (def.type === 'color-pair') {
          const pair = Array.isArray(config[def.key]) ? config[def.key] : ['#FFFFFF', '#FFFFFF'];
          return (
            <div key={def.key} className="col-span-2">
              <label className={labelClass}>{def.label}</label>
              <div className="flex gap-3">
                {def.labels.map((lbl, i) => (
                  <div key={lbl} className="flex items-center gap-2">
                    <span className="text-[11px] text-status-neutral">{lbl}</span>
                    <input type="color" className="h-9 w-14 p-1 rounded-[10px] border border-border bg-white" value={pair[i] ?? '#FFFFFF'} onChange={(e) => setArrayField(def.key, i, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (def.type === 'toggle') {
          return (
            <div key={def.key} className="flex items-center gap-2 pt-5">
              <input type="checkbox" id={`cfg-${def.key}`} checked={!!config[def.key]} onChange={(e) => setField(def.key, e.target.checked)} />
              <label htmlFor={`cfg-${def.key}`} className="text-xs font-bold text-ink">{def.label}</label>
            </div>
          );
        }
        if (def.type === 'color') {
          return (
            <div key={def.key}>
              <label className={labelClass}>{def.label}</label>
              <input type="color" className="h-9 w-full p-1 rounded-[10px] border border-border bg-white" value={config[def.key] ?? '#FFFFFF'} onChange={(e) => setField(def.key, e.target.value)} />
            </div>
          );
        }
        if (def.type === 'number') {
          return (
            <div key={def.key}>
              <label className={labelClass}>{def.label}</label>
              <input type="number" min={def.min} max={def.max} className={inputClass} value={config[def.key] ?? ''} onChange={(e) => setField(def.key, e.target.value === '' ? null : Number(e.target.value))} />
            </div>
          );
        }
        if (def.type === 'combo') {
          const listId = `cfg-list-${def.key}`;
          return (
            <div key={def.key}>
              <label className={labelClass}>{def.label}</label>
              <input list={listId} className={inputClass} value={config[def.key] ?? ''} onChange={(e) => setField(def.key, e.target.value)} />
              <datalist id={listId}>
                {def.suggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          );
        }
        // text
        return (
          <div key={def.key}>
            <label className={labelClass}>{def.label}</label>
            <input className={inputClass} placeholder={def.placeholder} value={config[def.key] ?? ''} onChange={(e) => setField(def.key, e.target.value || null)} />
          </div>
        );
      })}
    </div>
  );
};

const SortableSectionCard: React.FC<{
  section: Section;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisible: () => void;
}> = ({ section, onEdit, onDelete, onDuplicate, onToggleVisible }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border border-border rounded-[12px] bg-rose-50/50 hover:border-brand-raspberry transition-all"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 rounded-full text-status-neutral cursor-grab active:cursor-grabbing hover:text-brand-berry shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Layers className="w-4 h-4 text-brand-berry shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-ink">{humanize(section.section_type)}</p>
        <p className="text-[10px] text-status-neutral font-mono-num">order {section.sort_order}</p>
      </div>
      {!section.visible && <Badge variant="neutral" size="sm">Hidden</Badge>}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={onToggleVisible} icon={section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} title={section.visible ? 'Visible — click to hide' : 'Hidden — click to show'} />
        <Button variant="ghost" size="sm" onClick={onEdit} icon={<Pencil className="w-3.5 h-3.5" />}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate} icon={<Copy className="w-3.5 h-3.5" />} title="Duplicate" />
        <Button variant="ghost" size="sm" onClick={onDelete} icon={<Trash2 className="w-3.5 h-3.5" />} className="text-status-danger hover:bg-status-danger/10" title="Delete" />
      </div>
    </div>
  );
};

export const SectionCanvasPanel: React.FC<{ tab: ThemeTab }> = ({ tab }) => {
  const queryClient = useQueryClient();
  const [orderedSections, setOrderedSections] = useState<Section[] | null>(null);
  const [addType, setAddType] = useState<SectionType>(SECTION_TYPES[0]);
  const [editing, setEditing] = useState<Section | null>(null);
  const [editForm, setEditForm] = useState<{ section_type: SectionType; visible: boolean; configText: string; merchBinding: MerchBinding }>({
    section_type: SECTION_TYPES[0],
    visible: true,
    configText: '{}',
    merchBinding: { category_ids: [], product_ids: [], limit: 12, source: 'category' },
  });
  const [configError, setConfigError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Section | null>(null);

  const { data: sections = [], isLoading, error } = useQuery({
    queryKey: queryKeys.sections.byTab(tab.id),
    queryFn: () => sectionService.listByTab(tab.id),
  });

  const displaySections = orderedSections ?? sections;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.sections.byTab(tab.id) });

  const createMutation = useMutation({
    mutationFn: (input: SectionInput) => sectionService.create(tab.id, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SectionInput }) => sectionService.update(id, input),
    onSuccess: invalidate,
  });

  const updateMerchMutation = useMutation({
    mutationFn: ({ id, binding }: { id: string; binding: MerchBinding }) => sectionService.updateMerch(id, binding),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => sectionService.remove(id),
    onSuccess: () => { invalidate(); setPendingDelete(null); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => sectionService.duplicate(id),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => sectionService.reorder(tab.id, orderedIds),
    onSuccess: () => { invalidate(); setOrderedSections(null); },
    onError: () => setOrderedSections(null),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displaySections.findIndex((s) => s.id === active.id);
    const newIndex = displaySections.findIndex((s) => s.id === over.id);
    const next = arrayMove(displaySections, oldIndex, newIndex);
    setOrderedSections(next);
    reorderMutation.mutate(next.map((s) => s.id));
  };

  const openEdit = (section: Section) => {
    setEditing(section);
    setConfigError(null);
    setSaveError(null);
    setEditForm({
      section_type: section.section_type,
      visible: section.visible,
      configText: JSON.stringify(section.config ?? {}, null, 2),
      merchBinding: section.merch_binding ?? { category_ids: [], product_ids: [], limit: 12, source: 'category' },
    });
  };

  const isMerchBound = MERCH_BOUND_SECTION_TYPES.includes(editForm.section_type);

  const handleSaveEdit = async () => {
    let parsedConfig: Record<string, any>;
    try {
      parsedConfig = JSON.parse(editForm.configText);
      if (typeof parsedConfig !== 'object' || parsedConfig === null || Array.isArray(parsedConfig)) {
        throw new Error('Config must be a JSON object');
      }
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : 'Invalid JSON');
      return;
    }
    if (!editing) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: editing.id,
        input: { section_type: editForm.section_type, visible: editForm.visible, config: parsedConfig },
      });
      if (isMerchBound) {
        await updateMerchMutation.mutateAsync({ id: editing.id, binding: editForm.merchBinding });
      }
      setEditing(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e : new Error('Failed to save section'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      title={`Sections — ${tab.label}`}
      subtitle="Reorder, show/hide, duplicate, and edit the layout blocks this tab renders."
      action={
        <div className="flex items-center gap-2">
          <select className={`${inputClass} w-auto`} value={addType} onChange={(e) => setAddType(e.target.value as SectionType)}>
            {SECTION_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
          </select>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            isLoading={createMutation.isPending}
            onClick={() => createMutation.mutate({ section_type: addType, config: {} })}
          >
            Add Section
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load sections: {(error as Error).message}</p>
      ) : isLoading ? (
        <p className="text-xs text-status-neutral p-3">Loading sections…</p>
      ) : displaySections.length === 0 ? (
        <p className="text-xs text-status-neutral text-center py-6">No sections yet — add one above to start building this tab's layout.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displaySections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {displaySections.map((section) => (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  onEdit={() => openEdit(section)}
                  onDelete={() => setPendingDelete(section)}
                  onDuplicate={() => duplicateMutation.mutate(section.id)}
                  onToggleVisible={() => updateMutation.mutate({ id: section.id, input: { visible: !section.visible } })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${editing ? humanize(editing.section_type) : ''}`}
        subtitle={
          SECTION_FIELD_DEFS[editForm.section_type]
            ? 'Typed fields for this section type.'
            : 'No typed editor for this section type yet — edit its config as raw JSON.'
        }
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEdit} isLoading={isSaving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          {saveError && (
            <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
              {saveError.message}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Section Type</label>
              <select className={inputClass} value={editForm.section_type} onChange={(e) => setEditForm({ ...editForm, section_type: e.target.value as SectionType })}>
                {SECTION_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="section-visible" checked={editForm.visible} onChange={(e) => setEditForm({ ...editForm, visible: e.target.checked })} />
              <label htmlFor="section-visible" className="text-xs font-bold text-ink">Visible</label>
            </div>
          </div>
          {SECTION_FIELD_DEFS[editForm.section_type] ? (
            <TypedConfigFields
              defs={SECTION_FIELD_DEFS[editForm.section_type]!}
              configText={editForm.configText}
              onChange={(next) => { setEditForm({ ...editForm, configText: next }); setConfigError(null); }}
            />
          ) : (
            <div>
              <label className={labelClass}>Config (JSON)</label>
              <textarea
                className={`${inputClass} font-mono-num`}
                rows={10}
                value={editForm.configText}
                onChange={(e) => { setEditForm({ ...editForm, configText: e.target.value }); setConfigError(null); }}
              />
              {configError && <p className="text-xs text-status-danger mt-1">{configError}</p>}
            </div>
          )}
          {isMerchBound && (
            <MerchBindingEditor
              binding={editForm.merchBinding}
              onChange={(next) => setEditForm({ ...editForm, merchBinding: next })}
            />
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete Section"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => pendingDelete && removeMutation.mutate(pendingDelete.id)} isLoading={removeMutation.isPending}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          Delete this <span className="font-bold">{pendingDelete ? humanize(pendingDelete.section_type) : ''}</span> section? This cannot be undone.
        </p>
        {removeMutation.error && <p className="text-xs text-status-danger mt-2">{(removeMutation.error as Error).message}</p>}
      </Modal>
    </Card>
  );
};
