import { useMemo } from "react";
import { t } from "@/i18n";
import { useDb } from "@/stores/db";
import { useCurrentUser } from "@/hooks/use-session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";
import { DetailGrid } from "@/components/common/DetailGrid";
import { DateText } from "@/components/common/DateText";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { StudentsPage } from "@/components/students/StudentsPage";
import { AdminPage } from "@/components/admin/AdminPage";
import { EventsPage } from "@/components/events/EventsPage";
import { AnnouncementsPage } from "@/components/announcements/AnnouncementsPage";
import { TasksPage } from "@/components/tasks/TasksPage";
import { FinancePage } from "@/components/finance/FinancePage";
import { AssetsPage } from "@/components/assets/AssetsPage";
import { AttendancePage } from "@/components/attendance/AttendancePage";
import { DevelopmentPage } from "@/components/development/DevelopmentPage";
import { MezmurPage } from "@/components/mezmur/MezmurPage";
import { studentSummary } from "@/lib/rules/attendance";
import { todayIso } from "@/lib/ethiopian-calendar";
import { attendance as at } from "@/i18n/am/attendance";
import type { Quick } from "@/components/quick/quick";

/**
 * Opens a dashboard quick action in place: module forms come from the module's own page body
 * rendered in quick mode (same form + rules), small read-only views are built here.
 */
export function QuickHost({ action, title, onDone, onSwitch }: { action: string; title?: string; onDone: () => void; onSwitch: (action: string) => void }) {
  const quick = useMemo<Quick>(() => ({ action, onDone, ...(title ? { title } : {}) }), [action, title, onDone]);
  const base = action.split(":")[0];
  switch (base) {
    case "student": return <StudentsPage quick={quick} />;
    case "user": return <AdminPage quick={quick} />;
    case "event": return <EventsPage quick={quick} />;
    case "announcement": return <AnnouncementsPage quick={quick} />;
    case "task": return <TasksPage quick={quick} />;
    case "Income": case "Expense": case "transfer": return <FinancePage quick={quick} />;
    case "add": case "issue": case "returnPick": case "schedule": return <AssetsPage quick={quick} />;
    case "record": return <AttendancePage quick={quick} />;
    case "project": case "progress": return <DevelopmentPage quick={quick} />;
    case "mezmur": case "practice": case "browse": return <MezmurPage quick={quick} />;
    case "myProfile": return <MyProfile onDone={onDone} />;
    case "myAttendance": return <MyAttendance onDone={onDone} />;
    case "myClasses": return <MyClasses onDone={onDone} onSwitch={onSwitch} />;
    default: return null;
  }
}

function Shell({ title, hint, onDone, children }: { title: string; hint: string; onDone: () => void; children: React.ReactNode }) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onDone(); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{hint}</DialogDescription></DialogHeader>
        <div className="min-w-0 space-y-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function MyProfile({ onDone }: { onDone: () => void }) {
  const user = useCurrentUser(); const db = useDb(); const d = t.dashboard, w = t.workspace;
  if (!user) return null;
  const st = user.studentId ? db.students.find((s) => s.id === user.studentId) : undefined;
  const cls = st ? db.classes.find((c) => c.id === st.classId) : undefined;
  return (
    <Shell title={d.qa.myProfile} hint={d.myProfileHint} onDone={onDone}>
      <DetailGrid items={[[t.labels.fullName, user.fullName], [t.roles[user.role], user.username], [t.labels.email, user.email], [t.labels.phone, user.phone]]} />
      {st ? (
        <section className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-semibold text-navy">{w.classInfo}</h3>
          <DetailGrid items={[[d.myClass, cls?.name], [w.address, st.address], [w.guardian, st.guardianName], [t.labels.phone, st.guardianPhone], [w.classInfo, cls ? `${cls.room} · ${cls.schedule}` : null, "wide"]]} />
        </section>
      ) : user.role === "student" ? <EmptyState title={d.noStudent} /> : null}
    </Shell>
  );
}

function MyAttendance({ onDone }: { onDone: () => void }) {
  const user = useCurrentUser(); const db = useDb(); const d = t.dashboard;
  const id = user?.studentId;
  if (!id) return <Shell title={d.qa.myAttendance} hint={d.myAttendanceHint} onDone={onDone}><EmptyState title={d.noStudent} /></Shell>;
  const sum = studentSummary(db.attendanceSessions, id);
  const recent = db.attendanceSessions.filter((s) => s.records.some((r) => r.studentId === id)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  return (
    <Shell title={d.qa.myAttendance} hint={d.myAttendanceHint} onDone={onDone}>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([[at.present, sum.present], [at.absent, sum.absent], [at.late, sum.late], [at.percent, `${Math.round(sum.percent)}%`]] as const).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-muted p-3 text-center"><dt className="truncate text-[11px] text-muted-foreground">{k}</dt><dd className="font-display text-xl font-bold text-navy">{v}</dd></div>
        ))}
      </dl>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-navy">{d.recentSessions}</h3>
        {recent.length ? (
          <ul className="space-y-2">
            {recent.map((s) => { const r = s.records.find((x) => x.studentId === id)!; return (
              <li key={s.id} className="flex min-w-0 items-center gap-3 rounded-xl border p-3">
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-navy"><DateText iso={s.date} /></span><span className="block truncate text-xs text-muted-foreground">{s.sessionName}</span></span>
                <StatusBadge status={r.status} label={at[r.status]} />
              </li>
            ); })}
          </ul>
        ) : <EmptyState />}
      </section>
    </Shell>
  );
}

function MyClasses({ onDone, onSwitch }: { onDone: () => void; onSwitch: (action: string) => void }) {
  const user = useCurrentUser(); const db = useDb(); const d = t.dashboard;
  if (!user) return null;
  const classes = db.classes.filter((c) => c.teacherIds.includes(user.id) || user.classIds?.includes(c.id));
  return (
    <Shell title={d.qa.myClasses} hint={d.myClassesHint} onDone={onDone}>
      {classes.length ? (
        <ul className="space-y-2">
          {classes.map((c) => {
            const count = db.students.filter((s) => s.classId === c.id && s.status === "active").length;
            const done = db.attendanceSessions.some((s) => s.classId === c.id && s.date === todayIso());
            return (
              <li key={c.id} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border p-3">
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-navy">{c.name}</span><span className="block truncate text-xs text-muted-foreground">{c.schedule} · {count} {d.studentsCount}</span></span>
                <StatusBadge status={done ? "completed" : "Pending"} label={done ? d.recorded : d.notRecorded} />
                <Button className="tap" size="sm" onClick={() => onSwitch(`record:${c.id}`)}>{d.recordAttendance}</Button>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState />}
    </Shell>
  );
}
