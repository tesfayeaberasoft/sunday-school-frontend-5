import { t } from "@/i18n";
import * as seed from "@/data/mock";
import { academicYearDates, isoToEth, weekdayOf } from "@/lib/ethiopian-calendar";
import { legacyClassId, TEACHING_WEEKDAYS } from "./school-domain";
import type { DbData } from "@/stores/db";
import type { AttendanceSession } from "@/types/models";

/** Upgrade domain defaults in-place without reseeding or altering balances, stock, or recorded marks. */
export function upgradeSchoolDomain(data: Partial<DbData>): Partial<DbData> {
  const legacy = data.classes?.some(c => ["c-4", "c-5", "c-6"].includes(c.id)) ?? false;
  if (legacy && data.classes) {
    const merged = new Map<string, typeof data.classes[number]>();
    for (const c of data.classes) {
      const id = legacyClassId(c.id);
      const canonical = seed.classes.find(x => x.id === id);
      const prev = merged.get(id);
      merged.set(id, { ...c, ...(canonical ? { name: canonical.name, level: canonical.level } : {}), id,
        teacherIds: [...new Set([...(prev?.teacherIds ?? []), ...c.teacherIds])], schedule: t.domain.sessions.join("፣ ") });
    }
    data.classes = [...merged.values()];
    if (data.users) data.users = data.users.map(u => u.classIds ? { ...u, classIds: [...new Set(u.classIds.map(legacyClassId))] } : u);
    if (data.students) data.students = data.students.map(s => ({ ...s, classId: legacyClassId(s.classId), enrollments: s.enrollments.map(e => ({ ...e, classId: legacyClassId(e.classId) })) }));
    if (data.announcements) data.announcements = data.announcements.map(a => a.targetType === "class" ? { ...a, targetIds: [...new Set(a.targetIds.map(legacyClassId))] } : a);
    const sessions = new Map<string, AttendanceSession>();
    for (const a of data.attendanceSessions ?? []) {
      const classId = legacyClassId(a.classId);
      const sessionName = t.domain.sessions[TEACHING_WEEKDAYS.indexOf(weekdayOf(a.date) as 0 | 2 | 4 | 6)] ?? a.sessionName;
      const key = `${classId}:${a.academicYearId}:${a.date}:${sessionName}`;
      const prev = sessions.get(key);
      sessions.set(key, { ...a, classId, sessionName, records: [...new Map([...(prev?.records ?? []), ...a.records].map(r => [r.studentId, r])).values()] });
    }
    if (data.attendanceSessions) data.attendanceSessions = [...sessions.values()];
  }
  if (data.settings) data.settings = { ...data.settings, sessionNames: [...t.domain.sessions] };
  if (data.academicYears) data.academicYears = data.academicYears.map(y => {
    const defaults = academicYearDates(isoToEth(y.startDate).year);
    return { ...y, startDate: defaults.startDate, endDate: defaults.endDate };
  });
  if (data.financeCategories) {
    data.financeCategories = data.financeCategories.map(c => {
      const canonical = seed.financeCategories.find(x => x.id === c.id);
      return canonical ? { ...c, name: canonical.name } : c;
    });
    for (const c of seed.financeCategories.filter(c => c.kind === "income")) {
      if (!data.financeCategories.some(x => x.id === c.id)) data.financeCategories.push({ ...c });
    }
    const order = seed.financeCategories.map(c => c.id);
    data.financeCategories.sort((a, b) => (order.indexOf(a.id) < 0 ? 999 : order.indexOf(a.id)) - (order.indexOf(b.id) < 0 ? 999 : order.indexOf(b.id)));
  }
  if (data.assetCategories) {
    data.assetCategories = data.assetCategories.filter(c => c.id !== "ac-uniform").map(c => ({ ...c, name: seed.assetCategories.find(x => x.id === c.id)?.name ?? c.name }));
    for (const c of seed.assetCategories) if (!data.assetCategories.some(x => x.id === c.id)) data.assetCategories.push({ ...c });
  }
  if (data.assets) data.assets = data.assets.map(a => {
    const canonical = seed.assets.find(x => x.id === a.id);
    return canonical ? { ...a, name: canonical.name, categoryId: canonical.categoryId } : a.categoryId === "ac-uniform" ? { ...a, categoryId: "ac-cloth" } : a;
  });
  if (data.departments) data.departments = data.departments.map(d => ({ ...d, name: seed.departments.find(x => x.id === d.id)?.name ?? d.name }));
  // Refresh only sample informational text, preserving read state, dates, recipients and custom records.
  if (data.notifications) data.notifications = data.notifications.map(n => ({ ...n, body: seed.notifications.find(x => x.id === n.id)?.body ?? n.body }));
  return data;
}