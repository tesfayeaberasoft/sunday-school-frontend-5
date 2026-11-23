import { useQuickDone, type Quick } from "@/components/quick/quick";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { useDb } from "@/stores/db";
import { useCurrentUser, useCan } from "@/hooks/use-session";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { Fab } from "@/components/common/Fab";
import { Megaphone } from "lucide-react";
import { RequirePerm } from "@/components/common/RequirePerm";
import { EmptyState } from "@/components/common/EmptyState";
import { Field } from "@/components/common/Field";
import { DateText } from "@/components/common/DateText";
import { DateField } from "@/components/common/DateField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";
import type { AnnouncementTargetType } from "@/types/models";
import { DetailGrid } from "@/components/common/DetailGrid";
import { StatusBadge } from "@/components/common/StatusBadge";
import { rowOpen } from "@/components/common/clickable";
import { ChevronRight } from "lucide-react";


export function AnnouncementsPage({quick}:{quick?:Quick}={}){
 const db=useDb(), user=useCurrentUser(); const all=useCan('announcements.create_all'), dept=useCan('announcements.create_department');
 const [open,setOpen]=useState(quick?.action==='announcement'), [unread,setUnread]=useState(false), [detailId,setDetailId]=useState<string|null>(null);
 const [title,setTitle]=useState(''),[body,setBody]=useState(''),[urgent,setUrgent]=useState(false),[target,setTarget]=useState<AnnouncementTargetType>(all?'all':'department'),[targetId,setTargetId]=useState('');
 const w=t.workspace;
 useQuickDone(quick,open);
 if(!user)return null;
 const classIds=user.role==='student' ? db.students.filter(s=>s.id===user.studentId).map(s=>s.classId) : db.classes.filter(c=>c.teacherIds.includes(user.id)||user.classIds?.includes(c.id)).map(c=>c.id);
 const relevant=db.announcements.filter(a=>a.authorId===user.id||a.targetType==='all'||(a.targetType==='role'&&a.targetIds.includes(user.role))||(a.targetType==='department'&&!!user.departmentId&&a.targetIds.includes(user.departmentId))||(a.targetType==='class'&&a.targetIds.some(id=>classIds.includes(id))));
 const rows=relevant.filter(a=>!unread||!a.readBy.includes(user.id)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const choices=target==='department'?db.departments.map(d=>({id:d.id,name:d.name})):target==='class'?db.classes.map(c=>({id:c.id,name:c.name})):Object.entries(t.roles).map(([id,name])=>({id,name}));
 function submit(e:React.FormEvent){e.preventDefault();if(!user||(!all&&!dept))return;
   const kind=all?target:'department'; const id=all?targetId:user.departmentId;
   if(!title.trim()||!body.trim()||(kind!=='all'&&!id)){toast.error(w.invalid);return;}
   if(all&&kind!=='all'&&!choices.some(c=>c.id===id)){toast.error(w.invalid);return;}
   db.addAnnouncement({title:title.trim(),body:body.trim(),priority:urgent?'urgent':'normal',targetType:kind,targetIds:kind==='all'?[]:[id!],...(kind==='department'?{departmentId:id!}:{})});
   toast.success(w.saved);setOpen(false);setTitle('');setBody('');setUrgent(false);
 }
 return <RequirePerm perm="announcements.view"><div className="space-y-5 min-w-0">{!quick&&<>{(all||(dept&&user.departmentId))&&<Fab label={w.publish} icon={Megaphone} onClick={()=>{setTarget(all?'all':'department');setTargetId('');setOpen(true);}}/>}<PageHeader title={w.announcements}/><div className="flex flex-wrap gap-2"><Button variant={unread?'outline':'default'} className="tap" onClick={()=>setUnread(false)}>{w.all}</Button><Button variant={unread?'default':'outline'} className="tap" onClick={()=>setUnread(true)}>{w.unread}</Button>{(all||(dept&&user.departmentId))&&<Button className="tap" onClick={()=>{setTarget(all?'all':'department');setTargetId('');setOpen(true);}}>{w.publish}</Button>}</div>
 {rows.length?<div className="grid min-w-0 gap-3 md:grid-cols-2">{rows.map(a=>{const read=a.readBy.includes(user.id);return <article key={a.id} {...rowOpen(()=>setDetailId(a.id),a.title)} className="row-click flex min-w-0 flex-col gap-2 rounded-2xl border bg-card p-4 shadow-card hover:border-brand/40"><div className="flex min-w-0 items-start gap-2"><h3 className={`min-w-0 flex-1 break-words font-semibold text-navy ${read?'':'font-bold'}`}>{a.title}</h3><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden/></div><p className="line-clamp-1 text-sm text-muted-foreground">{a.body}</p><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><StatusBadge status={a.priority} label={a.priority==='urgent'?w.urgent:w.normal}/>{!read&&<StatusBadge tone="info" label={w.unread}/>}<span><DateText iso={a.createdAt}/></span></div></article>;})}</div>:<EmptyState/>}</>}
 {(()=>{const a=relevant.find(x=>x.id===detailId);if(!a)return null;const read=a.readBy.includes(user.id);return <Dialog open onOpenChange={o=>{if(!o)setDetailId(null);}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle className="break-words">{a.title}</DialogTitle><DialogDescription>{w.announcementDetail}</DialogDescription></DialogHeader><div className="min-w-0 space-y-5"><div className="flex flex-wrap gap-2"><StatusBadge status={a.priority} label={a.priority==='urgent'?w.urgent:w.normal}/><StatusBadge tone="navy" label={`${w.audience}: ${w[a.targetType]}`}/>{read&&<StatusBadge tone="muted" label={w.read}/>}</div><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-navy">{a.body}</p><DetailGrid items={[[w.author,a.authorName],[w.postedOn,<DateText key="d" iso={a.createdAt}/>],...(a.authorId===user.id?[[w.readers,String(a.readBy.length)] as [string,string]]:[])]}/>{!read&&<div className="flex justify-end border-t pt-4"><Button className="tap" onClick={()=>{db.markAnnouncementRead(a.id);toast.success(w.saved);}}>{w.markRead}</Button></div>}</div></DialogContent></Dialog>;})()}
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{quick?.title??w.publish}</DialogTitle><DialogDescription>{w.audience}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label={w.title} htmlFor="announcement-title"><Input id="announcement-title" className="tap" required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></Field><Field label={w.body} htmlFor="announcement-body"><Textarea id="announcement-body" required value={body} onChange={e=>setBody(e.target.value)}/></Field>{all?<><Field label={w.audience} htmlFor="announcement-target"><select id="announcement-target" className="tap w-full rounded-md border bg-background px-3" value={target} onChange={e=>{setTarget(e.target.value as AnnouncementTargetType);setTargetId('');}}>{(['all','department','role','class'] as const).map(k=><option key={k} value={k}>{w[k]}</option>)}</select></Field>{target!=='all'&&<Field label={w.choose} htmlFor="announcement-recipient"><select id="announcement-recipient" className="tap w-full rounded-md border bg-background px-3" required value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">{w.choose}</option>{choices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}</>:<p>{db.departments.find(d=>d.id===user.departmentId)?.name??w.noDepartment}</p>}<label className="tap flex items-center gap-3"><input type="checkbox" checked={urgent} onChange={e=>setUrgent(e.target.checked)}/>{w.urgent}</label><Button type="submit" className="tap">{w.publish}</Button></form></DialogContent></Dialog>
 </div></RequirePerm>;
}
