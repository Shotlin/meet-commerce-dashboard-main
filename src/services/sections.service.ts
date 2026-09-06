// Compatibility shim matching bakaloo-dashboard's src/services/sections.service.ts
// function-export API exactly, so every ported component/hook that imports
// from "@/services/sections.service" works completely unmodified. Wraps the
// existing, already-verified sectionService object (src/services/sectionService.ts)
// rather than re-implementing the HTTP calls — same backend, same shapes
// (verified byte-identical to bakaloo-backend's admin/sections module).
import { sectionService, type Section, type SectionInput, type SectionVersion } from './sectionService';
import type {
  CreateSectionPayload,
  ReorderSectionsPayload,
  RollbackPayload,
  ScheduleSectionLayoutPayload,
  SectionManifest,
  SectionManifestVersion,
  UpdateSectionMerchPayload,
  UpdateSectionPayload,
} from '../types/theme.types';

export async function getSections(tabId: string): Promise<SectionManifest[]> {
  return sectionService.listByTab(tabId) as unknown as Promise<SectionManifest[]>;
}

export async function getSection(id: string): Promise<SectionManifest> {
  return sectionService.getById(id) as unknown as Promise<SectionManifest>;
}

export async function addSection(
  tabId: string,
  payload: CreateSectionPayload
): Promise<SectionManifest> {
  return sectionService.create(tabId, payload as SectionInput) as unknown as Promise<SectionManifest>;
}

export async function updateSection(
  id: string,
  payload: UpdateSectionPayload
): Promise<SectionManifest> {
  return sectionService.update(id, payload as SectionInput) as unknown as Promise<SectionManifest>;
}

export async function updateSectionMerch(
  id: string,
  payload: UpdateSectionMerchPayload
): Promise<SectionManifest> {
  return sectionService.updateMerch(id, payload as any) as unknown as Promise<SectionManifest>;
}

export async function deleteSection(id: string): Promise<SectionManifest> {
  const section = await sectionService.getById(id);
  await sectionService.remove(id);
  return section as unknown as SectionManifest;
}

export async function reorderSections(
  tabId: string,
  payload: ReorderSectionsPayload
): Promise<SectionManifest[]> {
  return sectionService.reorder(tabId, payload.order) as unknown as Promise<SectionManifest[]>;
}

export async function duplicateSection(id: string): Promise<SectionManifest> {
  return sectionService.duplicate(id) as unknown as Promise<SectionManifest>;
}

export async function getSectionVersions(tabId: string): Promise<SectionManifestVersion[]> {
  const versions = await sectionService.getVersions(tabId);
  // bakaloo's SectionManifestVersion carries a `snapshot` (the full section
  // list at that version) which meet-commerce-backend's list endpoint does
  // not return inline — left undefined here; version rollback itself still
  // works (the backend resolves the snapshot server-side on rollback).
  return versions as unknown as SectionManifestVersion[];
}

export async function rollbackSectionVersion(
  tabId: string,
  payload: RollbackPayload
): Promise<SectionManifest[]> {
  return sectionService.rollback(tabId, payload.version_id) as unknown as Promise<SectionManifest[]>;
}

export async function scheduleSectionLayout(
  tabId: string,
  payload: ScheduleSectionLayoutPayload
): Promise<SectionManifestVersion> {
  const version = await sectionService.schedule(tabId, payload.scheduled_at);
  return version as unknown as SectionManifestVersion;
}

export async function cancelSectionSchedule(
  tabId: string
): Promise<{ tab_id: string; cancelled_count: number }> {
  return sectionService.cancelSchedule(tabId);
}

export type { Section, SectionVersion };
