import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck2, KeyRound, Lock, Pencil, UserCheck, UserX } from "lucide-react";
import { useDb } from "@/stores/db";
import { useCurrentUser } from "@/hooks/use-session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { DetailGrid } from "@/components/common/DetailGrid";
import { DateText } from "@/components/common/DateText";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TempPassword } from "@/components/admin/TempPassword";
import { Button } from "@/components/ui/button";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import { suspendBlock } from "@/lib/rules/accounts";
import { admin as c } from "@/i18n/am/admin";
import { t } from "@/i18n";

type Module = keyof typeof c.permModules;

/** Role permissions grouped by module: "view" only, or "manage" when any write permission exists. */
function permissionGroups(role: keyof typeof ROLE_PERMISSIONS): Array<{ module: Module; manage: boolean }> {
  const map = new Map<Module, boolean>();
  for (const p of ROLE_PERMISSIONS[role]) {
    const [mod, action] = p.split(".") as [Module, string];
    if (!(mod in c.permModules)) continue;
    map.set(mod, (map.get(mod) ?? false) || action !== "view");
  }
  return [...map.entries()].map(([module, manage]) => ({ module, manage }));
}

const shell = "max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto";

export function UserDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: () => void }) {
  const db = useDb();
  const me = useCurrentUser();
  const [temp, setTemp] = useState<string | null>(null);
  const u = db.users.find((x) => x.id === id);
  if (!u) return null;
  const block = suspendBlock(db.users, u.id, me?.id);
  const classes = db.classes.filter((cl) => cl.teacherIds.includes(u.id) || u.classIds?.includes(cl.id));
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className={shell}>
        <DialogHeader>
          <DialogTitle>{u.fullName}</DialogTitle>
          <DialogDescription>{c.userDetail}</DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-navy">{u.username}</span>
            <StatusBadge tone="navy" label={t.roles[u.role]} />
            <StatusBadge status={u.active ? "active" : "inactive"} label={u.active ? c.active : c.inactive} />
          </div>
          <DetailGrid
            items={[
              [c.email, u.email],
              [c.phone, u.phone],
              [c.departmentId, db.departments.find((d) => d.id === u.departmentId)?.name],
              [c.createdAt, <DateText key="c" iso={u.createdAt} />],
              [c.lastLogin, u.lastLogin ? <DateText key="l" iso={u.lastLogin.slice(0, 10)} /> : c.never],
              [c.failedLogins, String(u.failedLogins)],
              ...(classes.length ? [[c.assignedClasses, classes.map((cl) => cl.name).join("፣ "), "wide"] as [string, string, "wide"]] : []),
            ]}
          />
          {u.mustChangePassword && <p className="text-xs font-medium text-brand-deep">{c.mustChange}</p>}
          <section className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold text-navy">{c.permissions}</h3>
            <ul className="flex flex-wrap gap-1.5">
              {permissionGroups(u.role).map(({ module, manage }) => (
                <li key={module} className={manage ? "rounded-full bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand-deep" : "rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"}>
                  {c.permModules[module]} · {manage ? c.canManage : c.viewOnly}
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-navy">{c.accountActions}</h3>
            <div className="flex flex-wrap items-start gap-2">
              <ConfirmButton
                label={u.active ? c.deactivate : c.activate}
                question={u.active ? c.suspendConfirm : c.activateConfirm}
                danger={u.active}
                disabled={!!block}
                reason={c.selfProtect}
                icon={u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                onConfirm={() => {
                  const latest = useDb.getState();
                  if (suspendBlock(latest.users, u.id, me?.id)) { toast.error(c.selfProtect); return; }
                  latest.toggleUserActive(u.id);
                  toast.success(u.active ? c.suspended : c.activated);
                }}
              />
              <ConfirmButton
                label={c.resetPassword}
                question={c.resetConfirm}
                icon={<KeyRound className="h-4 w-4" />}
                onConfirm={() => { setTemp(db.resetPassword(u.id)); toast.success(c.tempPasswordReady); }}
              />
              <Button type="button" variant="outline" className="tap gap-2" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                {c.editUser}
              </Button>
            </div>
            {temp && <TempPassword value={temp} />}
            <p className="text-xs text-muted-foreground">{c.passwordNote}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function YearDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: () => void }) {
  const db = useDb();
  const y = db.academicYears.find((x) => x.id === id);
  if (!y) return null;
  const classes = db.classes.filter((cl) => cl.academicYearId === y.id);
  const enrolled = db.students.filter((st) => st.enrollments.some((en) => en.academicYearId === y.id && en.status === "enrolled")).length;
  const sessions = db.attendanceSessions.filter((x) => x.academicYearId === y.id).length;
  const days = Math.max(0, Math.round((Date.parse(y.endDate) - Date.parse(y.startDate)) / 86_400_000) + 1);
  const label = { planned: c.planned, active: c.active, closed: c.closed }[y.status];
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className={shell}>
        <DialogHeader>
          <DialogTitle>{y.name}</DialogTitle>
          <DialogDescription>{c.yearDetail}</DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-5">
          <StatusBadge status={y.status} label={label} />
          <DetailGrid items={[[c.startDate, <DateText key="s" iso={y.startDate} />], [c.endDate, <DateText key="e" iso={y.endDate} />], [c.durationDays, String(days)]]} />
          <dl className="grid grid-cols-3 gap-2">
            {([[c.classesCount, classes.length], [c.enrolledCount, enrolled], [c.sessionsCount, sessions]] as const).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted p-3 text-center">
                <dt className="truncate text-[11px] text-muted-foreground">{k}</dt>
                <dd className="font-display text-xl font-bold text-navy">{v}</dd>
              </div>
            ))}
          </dl>
          {classes.length > 0 && <p className="text-sm text-muted-foreground">{classes.map((cl) => cl.name).join("፣ ")}</p>}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-navy">{c.yearActions}</h3>
            <div className="flex flex-wrap items-start gap-2">
              {y.status === "planned" && (
                <>
                  <ConfirmButton label={c.activate} question={c.activateWarning} icon={<CalendarCheck2 className="h-4 w-4" />} onConfirm={() => { db.activateAcademicYear(y.id); toast.success(c.saved); }} />
                  <ConfirmButton label={c.close} question={c.closeConfirm} danger icon={<Lock className="h-4 w-4" />} onConfirm={() => { const r = db.closeAcademicYear(y.id); if (!r.ok) toast.error(r.error); else toast.success(c.saved); }} />
                </>
              )}
              {y.status !== "closed" && (
                <Button type="button" variant="outline" className="tap gap-2" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                  {c.editYear}
                </Button>
              )}
            </div>
            {y.status === "active" && <p className="text-xs text-muted-foreground">{c.closeYearHint}</p>}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
