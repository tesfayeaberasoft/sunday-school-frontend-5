import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { useDb } from "@/stores/db";
import { useCurrentUser, useCan } from "@/hooks/use-session";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { RequirePerm } from "@/components/common/RequirePerm";
import { EmptyState } from "@/components/common/EmptyState";
import { Field } from "@/components/common/Field";
import { DateText } from "@/components/common/DateText";
import { DateField } from "@/components/common/DateField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfilePhoto } from "@/components/common/ProfilePhoto";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "የእኔ መገለጫ — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የግል መረጃዎ" },
      { property: "og:title", content: "የእኔ መገለጫ — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የግል መረጃዎ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});


function Page() {
  const user = useCurrentUser(); const db = useDb();
  if (!user) return null;
  const student = user.studentId ? db.students.find(s => s.id === user.studentId) : undefined;
  const classes = db.classes.filter(c => student ? c.id === student.classId : c.teacherIds.includes(user.id) || user.classIds?.includes(c.id));
  const w = t.workspace;
  return <RequirePerm perm="dashboard.view"><div className="space-y-5 min-w-0"><PageHeader title={w.profile} description={w.ownOnly}/>
    <ProfilePhoto user={user}/>
    <Panel title={w.identity}><dl className="grid gap-4 sm:grid-cols-2">{[[t.labels.fullName,user.fullName],[t.roles[user.role],user.username],[t.labels.email,user.email],[t.labels.phone,user.phone],[w.department,db.departments.find(d=>d.id===user.departmentId)?.name ?? w.none]].map(([label,value],i)=><div key={i} className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words font-medium">{value || w.none}</dd></div>)}</dl></Panel>
    {user.role === 'student' && !student && <EmptyState title={t.dashboard.noStudent}/>}
    {student && <Panel title={w.contact}><dl className="space-y-3">{[[w.address,student.address],[w.guardian,student.guardianName],[t.labels.phone,student.guardianPhone]].map(([k,v])=><div key={k}><dt className="text-sm text-muted-foreground">{k}</dt><dd className="break-words">{v || w.none}</dd></div>)}</dl></Panel>}
    <Panel title={w.classInfo}>{classes.length ? classes.map(c=><article key={c.id} className="border-b py-3 last:border-0"><h3 className="font-semibold">{c.name}</h3><p className="text-sm text-muted-foreground break-words">{c.room} · {c.schedule}</p></article>) : <EmptyState/>}</Panel>
  </div></RequirePerm>;
}
