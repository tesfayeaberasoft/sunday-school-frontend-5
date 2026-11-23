import { t } from "@/i18n";
import type { SchoolClass } from "@/types/models";

export const TEACHING_WEEKDAYS = [2, 4, 6, 0] as const;

export function canSaveClass(classes: SchoolClass[], draft: SchoolClass): boolean {
  return t.domain.classes.some(c => c.name === draft.name && c.level === draft.level)
    && !classes.some(c => c.id !== draft.id && c.academicYearId === draft.academicYearId && c.name === draft.name);
}

export function legacyClassId(id: string): string {
  const ids: Record<string, string> = { "c-1": "c-1", "c-2": "c-1", "c-3": "c-2", "c-4": "c-3", "c-5": "c-3", "c-6": "c-3" };
  return ids[id] ?? id;
}