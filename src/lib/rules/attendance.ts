import type { AttendanceSession, AttendanceStatus } from "@/types/models";

/** Only one session per class + academic year + date + session name. */
export function findSessionConflict(
  sessions: AttendanceSession[],
  key: Pick<AttendanceSession, "classId" | "academicYearId" | "date" | "sessionName">,
  ignoreId?: string,
): AttendanceSession | undefined {
  return sessions.find(
    (s) =>
      s.id !== ignoreId &&
      s.classId === key.classId &&
      s.academicYearId === key.academicYearId &&
      s.date === key.date &&
      s.sessionName === key.sessionName,
  );
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
  /** Late counts as attended. */
  percent: number;
}

export function summarize(statuses: AttendanceStatus[]): AttendanceSummary {
  const present = statuses.filter((s) => s === "present").length;
  const late = statuses.filter((s) => s === "late").length;
  const absent = statuses.filter((s) => s === "absent").length;
  const total = statuses.length;
  return { present, late, absent, total, percent: total ? ((present + late) / total) * 100 : 0 };
}

export function studentSummary(sessions: AttendanceSession[], studentId: string): AttendanceSummary {
  const statuses: AttendanceStatus[] = [];
  for (const s of sessions) {
    const r = s.records.find((x) => x.studentId === studentId);
    if (r) statuses.push(r.status);
  }
  return summarize(statuses);
}
