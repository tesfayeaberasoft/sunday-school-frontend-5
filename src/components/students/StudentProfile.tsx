import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CalendarCheck, KeyRound, Pencil, UserCheck, UserPlus, UserX } from "lucide-react";
import { useDb, type NewStudent } from "@/stores/db";
import { useCan, useCurrentUser } from "@/hooks/use-session";
import { Panel } from "@/components/common/Panel";
import { Field } from "@/components/common/Field";
import { DateField } from "@/components/common/DateField";
import { DateText } from "@/components/common/DateText";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectClass } from "@/components/finance/ModuleUi";
import { students as s } from "@/i18n/am/students";
import { studentSummary } from "@/lib/rules/attendance";
import { formatETB } from "@/lib/format";
import { todayIso } from "@/lib/ethiopian-calendar";
import type { SchoolClass } from "@/types/models";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { DetailGrid } from "@/components/common/DetailGrid";
import { TempPassword } from "@/components/admin/TempPassword";
import { admin as c } from "@/i18n/am/admin";

export const studentFields = ["fullName", "christianName", "phone", "address", "guardianName", "guardianPhone", "guardianRelation", "notes"] as const;

export function newStudent(): NewStudent {
  return { fullName: "", christianName: "", gender: "M", birthDate: "", phone: "", address: "", guardianName: "", guardianPhone: "", guardianRelation: "", photoConsent: false, classId: "", notes: "" };
}

export function validStudent(st: NewStudent, classes: SchoolClass[]): boolean {
  const day = new Date(st.birthDate + "T00:00:00Z");
  const phone = (v: string) => !v || /^(?:\+251|0)[1-9]\d{8}$/.test(v.replace(/[ -]/g, ""));
  return !!st.fullName.trim() && !!st.guardianName.trim() && !!st.guardianPhone.trim() && phone(st.phone) && phone(st.guardianPhone) && /^\d{4}-\d{2}-\d{2}$/.test(st.birthDate) && !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === st.birthDate && st.birthDate <= todayIso() && classes.some((c) => c.id === st.classId) && (st.gender === "M" || st.gender === "F");
}

export function StudentFields({ value, onChange, classes }: { value: NewStudent; onChange: (v: NewStudent) => void; classes: SchoolClass[] }) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      {studentFields.map((k) => (
        <Field key={k} label={s[k]} htmlFor={k}>
          <Input id={k} className="tap" value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
        </Field>
      ))}
      <Field label={s.birthDate}>
        <DateField value={value.birthDate} onChange={(birthDate) => onChange({ ...value, birthDate })} />
      </Field>
      <Field label={s.gender}>
        <select className={selectClass} value={value.gender} onChange={(e) => onChange({ ...value, gender: e.target.value as "M" | "F" })}>
          <option value="M">{s.M}</option>
          <option value="F">{s.F}</option>
        </select>
      </Field>
      <Field label={s.class}>
        <select className={selectClass} value={value.classId} onChange={(e) => onChange({ ...value, classId: e.target.value })}>
          <option value="">{s.select}</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <label className="tap flex min-h-11 items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-brand" checked={value.photoConsent} onChange={(e) => onChange({ ...value, photoConsent: e.target.checked })} />
        {s.photoConsent}
      </label>
    </div>
  );
}

/** Whether the signed-in user may open this student's profile. */
export function useCanViewStudent(id: string): boolean {
  const db = useDb();
  const user = useCurrentUser();
  const view = useCan("students.view");
  const st = db.students.find((x) => x.id === id);
  const assigned = !!st && db.classes.some((c) => c.id === st.classId && (c.teacherIds.includes(user?.id ?? "") || user?.classIds?.includes(c.id)));
  return !!st && (user?.role === "student" ? user.studentId === id : view && (user?.role !== "teacher" || assigned));
}

function Block({ title, embedded, children, actions }: { title: ReactNode; embedded: boolean; children: ReactNode; actions?: ReactNode }) {
  if (!embedded) return <Panel title={title} actions={actions}>{children}</Panel>;
  return (
    <section className="space-y-3 border-t pt-4 first:border-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Enrollment, sign-in account and the suspend / reset-password actions (FR-102). */
function StudentAccount({ id, embedded }: { id: string; embedded: boolean }) {
  const db = useDb();
  const edit = useCan("students.edit");
  const accounts = useCan("admin.users");
  const [temp, setTemp] = useState<string | null>(null);
  const st = db.students.find((x) => x.id === id);
  if (!st || (!edit && !accounts)) return null;
  const account = db.users.find((u) => u.studentId === id);
  const year = db.academicYears.find((y) => y.status === "active");
  const enrollment = st.enrollments.find((en) => en.academicYearId === year?.id);
  const active = st.status === "active";
  return (
    <Block title={s.accountSection} embedded={embedded}>
      <DetailGrid
        items={[
          [s.currentEnrollment, enrollment ? `${year?.name ?? ""} · ${db.classes.find((x) => x.id === enrollment.classId)?.name ?? s.empty} · ${s[enrollment.status]}` : s.noEnrollment, "wide"],
          [s.account, account ? <span className="font-mono">{account.username}</span> : s.noAccount],
          [c.status, account ? <StatusBadge status={account.active ? "active" : "inactive"} label={account.active ? c.active : c.inactive} /> : null],
          [c.lastLogin, account ? (account.lastLogin ? <DateText iso={account.lastLogin.slice(0, 10)} /> : c.never) : null],
        ]}
      />
      {account?.mustChangePassword && <p className="text-xs font-medium text-brand-deep">{c.mustChange}</p>}
      <div className="flex flex-wrap items-start gap-2">
        {edit &&
          (st.status === "graduated" ? (
            <p className="text-xs text-muted-foreground">{s.graduatedLocked}</p>
          ) : (
            <ConfirmButton
              label={active ? s.suspend : s.reactivate}
              question={active ? s.suspendConfirm : s.reactivateConfirm}
              danger={active}
              icon={active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              onConfirm={() => {
                db.setStudentActive(id, !active);
                toast.success(active ? s.suspended : s.reactivated);
              }}
            />
          ))}
        {accounts &&
          (account ? (
            <ConfirmButton
              label={c.resetPassword}
              question={c.resetConfirm}
              icon={<KeyRound className="h-4 w-4" />}
              disabled={!account.active}
              reason={c.inactive}
              onConfirm={() => {
                setTemp(db.resetPassword(account.id));
                toast.success(c.tempPasswordReady);
              }}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              className="tap gap-2"
              onClick={() => {
                const res = db.bulkCreateStudentAccounts([id]);
                if (res.ok) toast.success(s.accountCreated);
                else toast.error(res.error);
              }}
            >
              <UserPlus className="h-4 w-4" />
              {s.createAccount}
            </Button>
          ))}
      </div>
      {temp && <TempPassword value={temp} />}
    </Block>
  );
}

/** Student details + inline edit; used inside the list modal and on the deep-link page. */
export function StudentProfile({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const db = useDb();
  const edit = useCan("students.edit");
  const allowed = useCanViewStudent(id);
  const [draft, setDraft] = useState<NewStudent | null>(null);
  const [status, setStatus] = useState<"active" | "inactive" | "graduated">("active");
  const st = db.students.find((x) => x.id === id);
  const active = db.academicYears.find((y) => y.status === "active");
  const classes = db.classes.filter((c) => c.academicYearId === active?.id || c.id === st?.classId);
  if (!st || !allowed) return <p className="text-sm text-muted-foreground">{s.denied}</p>;
  const summary = studentSummary(db.attendanceSessions, id);

  if (draft && edit) {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!validStudent(draft, classes)) {
            toast.error(s.invalid);
            return;
          }
          db.updateStudent(id, { ...draft, status, enrollments: st.enrollments.map((en) => (en.academicYearId === active?.id && en.status === "enrolled" ? { ...en, classId: draft.classId } : en)) });
          toast.success(s.success);
          setDraft(null);
        }}
      >
        <h3 className="font-semibold text-navy">{s.edit}</h3>
        <StudentFields value={draft} onChange={setDraft} classes={classes} />
        <Field label={s.status}>
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {(["active", "inactive", "graduated"] as const).map((v) => (
              <option key={v} value={v}>{s[v]}</option>
            ))}
          </select>
        </Field>
        <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t bg-card px-4 py-3 md:static md:mx-0 md:justify-end md:border-0 md:p-0">
          <Button type="button" variant="outline" className="tap flex-1 md:flex-none" onClick={() => setDraft(null)}>{s.back}</Button>
          <Button type="submit" className="tap flex-1 md:flex-none">{s.save}</Button>
        </div>
      </form>
    );
  }

  const details: Array<[string, ReactNode]> = [
    [s.christianName, st.christianName],
    [s.gender, s[st.gender]],
    [s.class, db.classes.find((c) => c.id === st.classId)?.name],
    [s.birthDate, <DateText key="b" iso={st.birthDate} />],
    [s.phone, st.phone],
    [s.address, st.address],
    [s.guardianName, st.guardianName],
    [s.guardianPhone, st.guardianPhone],
    [s.guardianRelation, st.guardianRelation],
    [s.photoConsent, st.photoConsent ? s.yes : s.no],
    [s.notes, st.notes],
  ];

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-navy">{st.code}</span>
        <StatusBadge status={st.status} label={s[st.status]} />
        {edit && (
          <Button
            size="sm"
            variant="outline"
            className="tap ml-auto gap-1.5"
            onClick={() => {
              setDraft({ ...st });
              setStatus(st.status);
            }}
          >
            <Pencil className="h-4 w-4" />
            {s.edit}
          </Button>
        )}
      </div>

      <StudentAccount id={id} embedded={embedded} />

      <Block title={s.profile} embedded={embedded}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div className="min-w-0" key={label}>
              <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
              <dd className="break-words text-sm text-navy">{value || s.empty}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title={s.attendance} embedded={embedded}>
        <dl className="grid grid-cols-4 gap-2">
          {([[s.present, summary.present], [s.absent, summary.absent], [s.late, summary.late], [s.percent, `${Math.round(summary.percent)}%`]] as const).map(([label, n]) => (
            <div key={label} className="rounded-xl bg-muted p-2.5 text-center">
              <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
              <dd className="font-display text-lg font-bold text-navy">{n}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-3 space-y-2">
          {db.attendanceSessions
            .filter((x) => x.records.some((r) => r.studentId === id))
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((x) => {
              const rec = x.records.find((r) => r.studentId === id);
              return (
                <li key={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border p-3 text-sm">
                  <CalendarCheck className="h-4 w-4 shrink-0 text-brand-deep" />
                  <DateText iso={x.date} />
                  <span className="text-muted-foreground">{x.sessionName}</span>
                  {rec && <StatusBadge className="ml-auto" status={rec.status} label={s[rec.status]} />}
                </li>
              );
            })}
        </ul>
      </Block>

      <Block title={s.enrollments} embedded={embedded}>
        <div className="space-y-2">
          {st.enrollments.length ? (
            st.enrollments.map((en, i) => (
              <article key={i} className="grid gap-1 rounded-xl border p-3 text-sm sm:grid-cols-3">
                <span>{db.academicYears.find((y) => y.id === en.academicYearId)?.name ?? s.empty}</span>
                <span>{db.classes.find((c) => c.id === en.classId)?.name ?? s.empty}</span>
                <span className="text-muted-foreground">{s[en.status]}</span>
              </article>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{s.empty}</p>
          )}
        </div>
      </Block>

      <Block title={s.contributions} embedded={embedded}>
        <div className="space-y-2">
          {db.contributions.some((c) => c.studentId === id) ? (
            db.contributions
              .filter((c) => c.studentId === id)
              .map((c) => (
                <article key={c.id} className="flex flex-wrap justify-between gap-2 rounded-xl border p-3 text-sm">
                  <span>{s.period}: {c.period}</span>
                  <span className="font-semibold text-navy">{formatETB(c.amount)}</span>
                  <DateText iso={c.paidDate} />
                </article>
              ))
          ) : (
            <p className="text-sm text-muted-foreground">{s.empty}</p>
          )}
        </div>
      </Block>
    </div>
  );
}
