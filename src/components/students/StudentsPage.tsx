import { UserAvatar } from "@/components/common/UserAvatar";
import { useQuickDone, type Quick } from "@/components/quick/quick";
import { useState } from "react";
import { toast } from "sonner";
import { useDb } from "@/stores/db";
import { useCan, useCurrentUser } from "@/hooks/use-session";
import { RequirePerm } from "@/components/common/RequirePerm";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";
import type { NewStudent, Promotion } from "@/stores/db";
import type { Student } from "@/types/models";
import { StudentFields, StudentProfile, newStudent, validStudent } from "@/components/students/StudentProfile";
import { selectClass } from "@/components/finance/ModuleUi";
import { Fab } from "@/components/common/Fab";
import { FilterBar } from "@/components/common/FilterBar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ChevronRight, UserPlus } from "lucide-react";
import { students as s } from "@/i18n/am/students";
import { matchesAny, normalizeAmharic } from "@/lib/amharic-search";
import { parseCsv, downloadCsv } from "@/lib/export";
import { rowOpen } from "@/components/common/clickable";



const selectStyle = selectClass;

export function StudentsPage({quick}:{quick?:Quick}={}) {
 const db=useDb(); const user=useCurrentUser();
 const register=useCan("students.register") && user?.role==="manager";
 const importing=useCan("students.import"); const promoting=useCan("students.promote"); const accounts=useCan("admin.users");
 const [search,setSearch]=useState("");const [classId,setClassId]=useState(""); const [status,setStatus]=useState("");
 const [selected,setSelected]=useState<string[]>([]); const [dialog,setDialog]=useState<"register"|"import"|"promote"|"accounts"|null>(quick?.action==="student"?"register":null);
 const [draft,setDraft]=useState(newStudent);const [csv,setCsv]=useState<string[][]>([]);const [fileError,setFileError]=useState(false);
 const [profileId,setProfileId]=useState<string|null>(null);const [year,setYear]=useState("");const [step,setStep]=useState(0);const [promotions,setPromotions]=useState<Promotion[]>([]);
 useQuickDone(quick,dialog!==null||profileId!==null);
 const activeYear=db.academicYears.find(y=>y.status==="active");const classes=db.classes.filter(c=>c.academicYearId===activeYear?.id);
 const assigned=db.classes.filter(c=>c.teacherIds.includes(user?.id??"") || user?.classIds?.includes(c.id)).map(c=>c.id);
 const visible=db.students.filter(st=>(user?.role!=="teacher" || assigned.includes(st.classId)) && (user?.role!=="student" || st.id===user.studentId) && (!classId || st.classId===classId) && (!status || st.status===status) && matchesAny([st.fullName,st.code,st.christianName],search));
 const chosen=visible.filter(st=>selected.includes(st.id));
 const headers=[s.name,s.christianName,s.gender,s.birthDate,s.phone,s.address,s.guardianName,s.guardianPhone,s.guardianRelation];
 const seen=new Set(db.students.map(st=>normalizeAmharic(st.fullName)+"|"+st.birthDate));
 const preview=csv.map(row=>{const st:NewStudent={...newStudent(),fullName:row[0]??"",christianName:row[1]??"",gender:row[2]===s.M?"M":row[2]===s.F?"F":row[2] as "M"|"F",birthDate:row[3]??"",phone:row[4]??"",address:row[5]??"",guardianName:row[6]??"",guardianPhone:row[7]??"",guardianRelation:row[8]??"",classId:draft.classId};const key=normalizeAmharic(st.fullName)+"|"+st.birthDate;const valid=row.length===headers.length && validStudent(st,classes) && !seen.has(key);if(valid)seen.add(key);return {st,valid};});
 const good=preview.filter(r=>r.valid).map(r=>r.st);
 const finish=(res:{ok:boolean;error?:string})=>{if(!res.ok){toast.error(res.error??s.failed);return;}toast.success(s.success);setDialog(null);setSelected([]);};
 const toggle=(id:string)=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const className=(st:Student)=>db.classes.find(c=>c.id===st.classId)?.name??s.empty;
 const card=(st:Student)=><li key={st.id} {...rowOpen(()=>setProfileId(st.id))} className="row-click flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-2 pl-3 shadow-card hover:border-brand/40"><input type="checkbox" className="h-5 w-5 shrink-0 accent-brand" checked={selected.includes(st.id)} onChange={()=>toggle(st.id)} aria-label={st.fullName}/><div className="flex min-w-0 flex-1 items-center gap-3"><UserAvatar user={st} className="h-10 w-10"/><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-navy">{st.fullName}</span><span className="block truncate text-xs text-muted-foreground">{st.code} · {className(st)}</span></span><StatusBadge status={st.status} label={s[st.status]}/><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden/></div></li>;
 return <RequirePerm perm="students.view"><div className="min-w-0 space-y-5">{!quick&&<><PageHeader title={s.title} description={s.description}/>
 <div className="flex flex-wrap gap-2">{register&&<Button className="tap" onClick={()=>{setDraft(newStudent());setDialog("register");}}>{s.register}</Button>}{importing&&<Button className="tap" variant="outline" onClick={()=>{setCsv([]);setFileError(false);setDraft(newStudent());setDialog("import");}}>{s.import}</Button>}{promoting&&<Button className="tap" variant="outline" disabled={!chosen.some(st=>st.status==="active")} onClick={()=>{setYear("");setStep(0);setPromotions(chosen.filter(st=>st.status==="active").map(st=>({studentId:st.id,toClassId:"",status:"promoted"})));setDialog("promote");}}>{s.promote}</Button>}{accounts&&<Button className="tap" variant="outline" disabled={!chosen.length} onClick={()=>setDialog("accounts")}>{s.accounts}</Button>}</div>
 <FilterBar summary={search||undefined}><div className="grid gap-3 sm:grid-cols-3"><Field label={s.search}><Input className="tap" value={search} onChange={e=>setSearch(e.target.value)}/></Field><Field label={s.class}><select className={selectStyle} value={classId} onChange={e=>setClassId(e.target.value)}><option value="">{s.all}</option>{db.classes.filter(c=>user?.role!=="teacher"||assigned.includes(c.id)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label={s.status}><select className={selectStyle} value={status} onChange={e=>setStatus(e.target.value)}><option value="">{s.all}</option>{(["active","inactive","graduated"] as const).map(v=><option key={v} value={v}>{s[v]}</option>)}</select></Field></div></FilterBar>
 <Panel title={`${s.title} (${visible.length})`}><p className="mb-2 text-xs text-muted-foreground">{s.openHint}</p><label className="tap mb-3 flex min-h-11 items-center gap-2"><input type="checkbox" checked={!!visible.length&&visible.every(st=>selected.includes(st.id))} onChange={e=>setSelected(e.target.checked?Array.from(new Set([...selected,...visible.map(st=>st.id)])):selected.filter(id=>!visible.some(st=>st.id===id)))}/>{s.selectAll} · {s.selected}: {chosen.length}</label>
 {!visible.length?<p>{s.empty}</p>:<><ul className="space-y-2 md:hidden">{visible.map(card)}</ul><div className="hidden overflow-hidden rounded-xl border md:block"><table className="w-full table-fixed text-left"><thead><tr>{[s.name,s.code,s.class,s.status].map(h=><th key={h} className="p-3 text-xs font-semibold">{h}</th>)}</tr></thead><tbody>{visible.map(st=><tr className="row-click border-t" key={st.id} {...rowOpen(()=>setProfileId(st.id))}>{[<span className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5 shrink-0 accent-brand" aria-label={st.fullName} checked={selected.includes(st.id)} onChange={()=>toggle(st.id)}/><UserAvatar user={st}/><span className="min-w-0 font-medium text-navy">{st.fullName}</span></span>,st.code,className(st),<StatusBadge status={st.status} label={s[st.status]}/>].map((v,i)=><td key={i} className="break-words p-2">{v}</td>)}</tr>)}</tbody></table></div></>}
 </Panel></>}
 <Dialog open={dialog!==null} onOpenChange={open=>{if(!open)setDialog(null);}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{dialog==="register"?s.register:dialog==="import"?s.import:dialog==="promote"?s.promote:s.accounts}</DialogTitle><DialogDescription>{dialog==="import"?s.csvHelp:dialog==="promote"?s.promotionHelp:dialog==="accounts"?s.accountHelp:s.description}</DialogDescription></DialogHeader>
 {dialog==="register"&&register&&<form className="space-y-4" onSubmit={e=>{e.preventDefault();if(!activeYear||!validStudent(draft,classes)){toast.error(s.invalid);return;}finish(db.registerStudent(draft));}}><StudentFields value={draft} onChange={setDraft} classes={classes}/><Button className="tap" type="submit">{s.save}</Button></form>}
 {dialog==="import"&&importing&&<div className="space-y-4"><Button className="tap" variant="outline" onClick={()=>downloadCsv("ተማሪዎች-አብነት",headers,[])}>{s.template}</Button><Field label={s.class}><select className={selectStyle} value={draft.classId} onChange={e=>setDraft({...draft,classId:e.target.value})}><option value="">{s.select}</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Input className="tap" type="file" accept=".csv,text/csv" aria-label={s.import} onChange={async e=>{const file=e.target.files?.[0];setCsv([]);setFileError(false);if(!file)return;try{if(file.size>2_000_000||!file.name.toLowerCase().endsWith(".csv"))throw Error();const parsed=parseCsv(await file.text());if(parsed.length<2||parsed.length>5001||!headers.every((h,i)=>parsed[0]?.[i]===h))throw Error();setCsv(parsed.slice(1));}catch{setFileError(true);}}}/>{fileError&&<p role="alert" className="text-destructive">{s.fileError}</p>}<h3>{s.preview}: {good.length}/{preview.length}</h3><div className="max-h-64 space-y-2 overflow-y-auto">{preview.map((r,i)=><p key={i} className={r.valid?"":"text-destructive"}>{i+2}. {r.st.fullName||s.empty} — {r.valid?s.valid:s.invalidRow}</p>)}</div><Button className="tap" disabled={!good.length||!activeYear} onClick={()=>finish(db.importStudents(good))}>{s.confirmImport} ({good.length})</Button></div>}
 {dialog==="promote"&&promoting&&<div className="space-y-4">{step===0?<Field label={s.year}><select className={selectStyle} value={year} onChange={e=>{setYear(e.target.value);setPromotions(p=>p.map(v=>({...v,toClassId:""})));}}><option value="">{s.select}</option>{db.academicYears.filter(y=>y.status==="planned"&&activeYear&&y.startDate>activeYear.endDate).map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>:promotions.map((p,i)=><div key={p.studentId} className="space-y-2 rounded-xl border p-3"><h3>{db.students.find(st=>st.id===p.studentId)?.fullName}</h3>{step===1?<><Field label={s.status}><select className={selectStyle} value={p.status} onChange={e=>setPromotions(v=>v.map((x,n)=>n===i?{...x,status:e.target.value as Promotion["status"]}:x))}>{(["promoted","repeated","graduated"] as const).map(v=><option key={v} value={v}>{s[v]}</option>)}</select></Field>{p.status!=="graduated"&&<Field label={s.class}><select className={selectStyle} value={p.toClassId} onChange={e=>setPromotions(v=>v.map((x,n)=>n===i?{...x,toClassId:e.target.value}:x))}><option value="">{s.select}</option>{db.classes.filter(c=>c.academicYearId===year).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}</>:<p>{s[p.status]} — {db.classes.find(c=>c.id===p.toClassId)?.name}</p>}</div>)}<div className="flex flex-wrap gap-2">{step>0&&<Button className="tap" variant="outline" onClick={()=>setStep(step-1)}>{s.back}</Button>}<Button className="tap" disabled={!year||!promotions.length||(step>0&&promotions.some(p=>p.status!=="graduated"&&!db.classes.some(c=>c.id===p.toClassId&&c.academicYearId===year)))} onClick={()=>{if(promotions.some(p=>db.students.find(st=>st.id===p.studentId)?.enrollments.some(e=>e.academicYearId===year))){toast.error(s.alreadyEnrolled);return;}if(step<2)setStep(step+1);else finish(db.promoteStudents(year,promotions));}}>{step<2?s.next:s.confirm}</Button></div></div>}
 {dialog==="accounts"&&accounts&&<div className="space-y-4"><p>{s.selected}: {chosen.length}</p><Button className="tap" onClick={()=>finish(db.bulkCreateStudentAccounts(chosen.map(st=>st.id)))}>{s.confirm}</Button></div>}
 </DialogContent></Dialog>
 <Dialog open={profileId!==null} onOpenChange={open=>{if(!open)setProfileId(null);}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{db.students.find(st=>st.id===profileId)?.fullName??s.profile}</DialogTitle><DialogDescription>{s.profile}</DialogDescription></DialogHeader>{profileId&&<StudentProfile key={profileId} id={profileId} embedded/>}</DialogContent></Dialog>
 {register&&<Fab label={s.register} icon={UserPlus} onClick={()=>{setDraft(newStudent());setDialog("register");}}/>}</div></RequirePerm>;
}
