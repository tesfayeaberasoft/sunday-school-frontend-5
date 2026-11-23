import { rowOpen } from "@/components/common/clickable";
import { ChevronRight } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useDb } from "@/stores/db";
import { useCan, useCurrentUser } from "@/hooks/use-session";
import { RequirePerm } from "@/components/common/RequirePerm";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { Field } from "@/components/common/Field";
import { DateField } from "@/components/common/DateField";
import { DateText } from "@/components/common/DateText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";
import { students as s } from "@/i18n/am/students";
import type { SchoolClass } from "@/types/models";
import { ACCENT } from "@/lib/accent";
import { DetailGrid } from "@/components/common/DetailGrid";
import { t } from "@/i18n";
import { canSaveClass } from "@/lib/rules/school-domain";

export const Route = createFileRoute("/_authenticated/classes")({
  head: () => ({
    meta: [
      { title: "ክፍሎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "ክፍሎችና የተመደቡ መምህራን" },
      { property: "og:title", content: "ክፍሎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "ክፍሎችና የተመደቡ መምህራን" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const selectStyle="tap min-h-11 w-full min-w-0 rounded-xl border bg-background px-3";
function Page() {
 const db=useDb();const user=useCurrentUser();const manage=useCan("classes.manage");const [year,setYear]=useState("");const [draft,setDraft]=useState<SchoolClass|null>(null);const [roster,setRoster]=useState("");
 const assigned=(c:SchoolClass)=>c.teacherIds.includes(user?.id??"")||!!user?.classIds?.includes(c.id);
 const classes=db.classes.filter(c=>(!year||c.academicYearId===year)&&(user?.role!=="teacher"||assigned(c)));
 const count=(c:SchoolClass)=>db.students.filter(st=>st.enrollments.some(e=>e.classId===c.id&&e.academicYearId===c.academicYearId&&e.status==="enrolled"));
 const open=(c?:SchoolClass)=>setDraft(c?{...c,teacherIds:[...c.teacherIds]}:{id:"",name:"",level:"",academicYearId:db.academicYears.find(y=>y.status==="active")?.id??"",teacherIds:[],room:"",schedule:t.domain.sessions.join("፣ "),color:"brand"});
 return <RequirePerm perm="classes.view"><div className="min-w-0 space-y-5"><PageHeader title={s.classes} description={s.classesDescription}/><div className="flex flex-wrap items-end gap-3"><Field label={s.year}><select className={selectStyle} value={year} onChange={e=>setYear(e.target.value)}><option value="">{s.all}</option>{db.academicYears.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>{manage&&<Button className="tap" onClick={()=>open()}>{s.addClass}</Button>}</div>
 {!classes.length&&<Panel><p>{s.empty}</p></Panel>}<div className="grid gap-4 md:grid-cols-2">{classes.map(c=><article key={c.id} {...rowOpen(()=>setRoster(c.id),c.name)} className="row-click flex min-w-0 flex-col gap-2 rounded-2xl border bg-card p-4 shadow-card hover:border-brand/40"><div className="flex min-w-0 items-start gap-2"><div className="min-w-0 flex-1"><h3 className="break-words font-semibold text-navy">{c.name}</h3><p className="break-words text-sm text-muted-foreground">{c.level} · {c.schedule||s.empty}</p></div><span className={`font-display text-xl font-bold ${ACCENT.brand.text}`} aria-label={s.count}>{count(c).length}</span><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden/></div><p className="truncate text-sm text-navy">{db.users.filter(u=>c.teacherIds.includes(u.id)).map(u=>u.fullName).join("፣ ")||s.empty}</p></article>)}</div>
 <Dialog open={!!draft} onOpenChange={o=>{if(!o)setDraft(null);}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto"><DialogHeader><DialogTitle>{draft?.id?s.edit:s.addClass}</DialogTitle><DialogDescription>{s.classesDescription}</DialogDescription></DialogHeader>{draft&&manage&&<form className="space-y-4" onSubmit={e=>{e.preventDefault();if(!canSaveClass(db.classes,draft)||!db.academicYears.some(y=>y.id===draft.academicYearId&&y.status!=="closed")||!draft.teacherIds.every(id=>db.users.some(u=>u.id===id&&u.role==="teacher"&&u.active))||db.classes.some(c=>c.id!==draft.id&&c.academicYearId===draft.academicYearId&&c.name.trim()===draft.name.trim())){toast.error(s.invalid);return;}if(draft.id)db.updateClass(draft.id,draft);else db.addClass(draft);toast.success(s.success);setDraft(null);}}><Field label={s.name} htmlFor="class-name"><select id="class-name" className={selectStyle} value={draft.name} onChange={e=>{const chosen=t.domain.classes.find(c=>c.name===e.target.value);if(chosen)setDraft({...draft,...chosen});}}><option value="">{s.select}</option>{t.domain.classes.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></Field><Field label={s.level}><Input className="tap" readOnly value={draft.level}/></Field><Field label={s.room} htmlFor="room"><Input id="room" className="tap" value={draft.room} onChange={e=>setDraft({...draft,room:e.target.value})}/></Field><fieldset><legend>{s.schedule}</legend>{t.domain.sessions.map(session=><label key={session} className="tap flex items-center gap-3"><input type="checkbox" checked={draft.schedule.split("፣ ").includes(session)} onChange={e=>{const selected=draft.schedule.split("፣ ").filter(Boolean);setDraft({...draft,schedule:t.domain.sessions.filter(x=>x===session?e.target.checked:selected.includes(x)).join("፣ ")});}}/>{session}</label>)}</fieldset><Field label={s.year}><select disabled={!!draft.id} className={selectStyle} value={draft.academicYearId} onChange={e=>setDraft({...draft,academicYearId:e.target.value})}><option value="">{s.select}</option>{db.academicYears.filter(y=>y.status!=="closed"||y.id===draft.academicYearId).map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></Field><fieldset className="space-y-2"><legend>{s.teachers}</legend>{db.users.filter(u=>u.role==="teacher"&&u.active).map(u=><label key={u.id} className="tap flex min-h-11 items-center gap-3"><input type="checkbox" checked={draft.teacherIds.includes(u.id)} onChange={e=>setDraft({...draft,teacherIds:e.target.checked?[...draft.teacherIds,u.id]:draft.teacherIds.filter(id=>id!==u.id)})}/>{u.fullName}</label>)}</fieldset><Button type="submit" className="tap">{s.save}</Button></form>}</DialogContent></Dialog>
 {(()=>{const c=db.classes.find(x=>x.id===roster);if(!c)return null;const list=count(c);return <Dialog open onOpenChange={o=>{if(!o)setRoster("");}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{c.name}</DialogTitle><DialogDescription>{s.classDetail}</DialogDescription></DialogHeader><div className="min-w-0 space-y-5"><DetailGrid items={[[s.level,c.level],[s.year,db.academicYears.find(y=>y.id===c.academicYearId)?.name],[s.count,String(list.length)],[s.room,c.room],[s.schedule,c.schedule],[s.teachers,db.users.filter(u=>c.teacherIds.includes(u.id)).map(u=>u.fullName).join("፣ "),"wide"]]}/><section className="space-y-2 border-t pt-4"><h3 className="text-sm font-semibold text-navy">{s.roster} ({list.length})</h3>{list.length?<ul className="grid gap-2 sm:grid-cols-2">{list.map(st=><li key={st.id} className="flex min-w-0 items-center gap-3 rounded-xl border p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-brand-deep">{st.fullName.slice(0,1)}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-navy">{st.fullName}</span><span className="block text-xs text-muted-foreground">{st.code}</span></span></li>)}</ul>:<p className="text-sm text-muted-foreground">{s.empty}</p>}</section>{manage&&<div className="flex justify-end border-t pt-4"><Button className="tap" onClick={()=>{setRoster("");open(c);}}>{s.edit}</Button></div>}</div></DialogContent></Dialog>;})()}
 </div></RequirePerm>;
}

