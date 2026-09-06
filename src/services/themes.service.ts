// Compatibility shim matching bakaloo-dashboard's src/services/themes.service.ts
// function-export API exactly, wrapping legacyThemeService.ts (the real
// implementation against meet-commerce-backend's /api/v1/admin/themes,
// verified byte-identical to bakaloo-backend's own admin/themes module).
import { legacyThemeService } from './legacyThemeService';
import type {
  CreateThemePayload,
  RollbackPayload,
  ScheduleThemePayload,
  Theme,
  ThemeVersion,
  UpdateThemePayload,
} from '../types/theme.types';

export async function getThemes(): Promise<Theme[]> {
  return legacyThemeService.list();
}

export async function getTheme(id: string): Promise<Theme> {
  return legacyThemeService.getById(id);
}

export async function createTheme(payload: CreateThemePayload): Promise<Theme> {
  return legacyThemeService.create(payload);
}

export async function updateTheme(id: string, payload: UpdateThemePayload): Promise<Theme> {
  return legacyThemeService.update(id, payload);
}

export async function activateTheme(id: string): Promise<Theme> {
  return legacyThemeService.activate(id);
}

export async function deleteTheme(id: string): Promise<void> {
  return legacyThemeService.remove(id);
}

export async function getTabThemes(): Promise<Theme[]> {
  return legacyThemeService.getTabThemes();
}

export async function scheduleTheme(id: string, payload: ScheduleThemePayload): Promise<Theme> {
  return legacyThemeService.schedule(id, payload);
}

export async function cancelSchedule(id: string): Promise<Theme> {
  return legacyThemeService.cancelSchedule(id);
}

export async function getThemeVersions(id: string): Promise<ThemeVersion[]> {
  return legacyThemeService.getVersions(id);
}

export async function rollbackThemeVersion(themeId: string, payload: RollbackPayload): Promise<Theme> {
  return legacyThemeService.rollback(themeId, payload);
}
