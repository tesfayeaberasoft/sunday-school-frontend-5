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
import { RequirePerm } from "@/components/common/RequirePerm";
import { EmptyState } from "@/components/common/EmptyState";
import { Field } from "@/components/common/Field";
import { DateText } from "@/components/common/DateText";
import { DateField } from "@/components/common/DateField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";
import type { Task, TaskStatus } from "@/types/models";
import { todayIso } from "@/lib/ethiopian-calendar";
import { submitOrQueue } from "@/lib/sync-queue";
import { isOnlineNow } from "@/hooks/use-online";
import { rowOpen } from "@/components/common/clickable";
import { DetailGrid } from "@/components/common/DetailGrid";
import { StatusBadge } from "@/components/common/StatusBadge";


const statuses:TaskStatus[]=['Pending','InProgress','Completed'];
export function TasksPage({quick}:{quick?:Quick}={}){
 const db=useDb(),user=useCurrentUser(),manage=useCan('tasks.manage'); const w=t.workspace;
 const [detailId,setDetailId]=useState<string|null>(null);const [open,setOpen]=useState(quick?.action==='task'),[busy,setBusy]=useState<string>(),[assignment,setAssignment]=useState('user');
 const blank=():Omit<Task,'id'|'createdAt'>=>({title:'',description:'',assigneeName:'',dueDate:todayIso(),status:'Pending',priority:'normal'});
 const [form,setForm]=useState(blank); const patch=(v:Partial<typeof form>)=>setForm(f=>({...f,...v}));
 useQuickDone(quick,open);
 if(!user)return null;
 const mine=(task:Task)=>task.assigneeUserId===user.id||(user.role!=='student'&&!task.assigneeUserId&&!!user.departmentId&&task.departmentId===user.departmentId);
 const rows=db.tasks.filter(task=>manage||mine(task));
 async function update(task:Task,status:TaskStatus){if(!manage&&!mine(task)||busy)return;setBusy(task.id);try{const result=await submitOrQueue({kind:'task_update',data:{id:task.id,status}},task.title);if(!result.ok){toast.error(result.error);return;}toast.success(result.queued?w.queued:w.saved);}catch{toast.error(w.failed);}finally{setBusy(undefined);}}
 function save(e:React.FormEvent){e.preventDefault();if(!manage)return;
   const person=db.users.find(u=>u.id===form.assigneeUserId&&u.active),department=db.departments.find(d=>d.id===form.departmentId);
   if(!form.title.trim()||!form.dueDate||(assignment==='user'?!person:!department)||(form.eventId&&!db.events.some(e=>e.id===form.eventId))){toast.error(w.invalid);return;}
   db.addTask({...form,title:form.title.trim(),description:form.description.trim(),assigneeName:assignment==='user'?person!.fullName:department!.name,...(assignment==='user'?{assigneeUserId:person!.id}:{departmentId:department!.id})});toast.success(w.saved);setOpen(false);setForm(blank());
 }
 return <RequirePerm perm="tasks.view"><div className="space-y-5 min-w-0">{!quick&&<>{manage&&<Fab label={t.actions.create} onClick={()=>{setForm(blank());setAssignment('user');setOpen(true);}}/>}<PageHeader title={w.tasks}/>{manage&&<Button className="tap" onClick={()=>{setForm(blank());setAssignment('user');setOpen(true);}}>{t.actions.create}</Button>}
 <div className="grid min-w-0 gap-4 lg:grid-cols-3">{statuses.map(status=><Panel key={status} title={<>{w[status]} ({rows.filter(x=>x.status===status).length})</>}><div className="space-y-3">{rows.filter(x=>x.status===status).length?rows.filter(x=>x.status===status).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map(task=><article key={task.id} {...rowOpen(()=>setDetailId(task.id),task.title)} className="row-click min-w-0 space-y-1.5 rounded-xl border bg-background p-3 hover:border-brand/40"><div className="flex min-w-0 items-start gap-2"><h3 className="min-w-0 flex-1 break-words font-semibold text-navy">{task.title}</h3><StatusBadge status={task.priority} label={w[task.priority]}/></div><p className="truncate text-sm text-muted-foreground">{task.assigneeName}</p><p className={task.dueDate<todayIso()&&task.status!=='Completed'?'text-destructive text-sm':'text-sm text-muted-foreground'}>{w.due}: <DateText iso={task.dueDate}/>{task.dueDate<todayIso()&&task.status!=='Completed'&&<> · {w.overdue}</>}</p></article>):<EmptyState/>}</div></Panel>)}</div></>}
 {(()=>{const task=rows.find(x=>x.id===detailId);if(!task)return null;const late=task.dueDate<todayIso()&&task.status!=='Completed';return <Dialog open onOpenChange={o=>{if(!o)setDetailId(null);}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle className="break-words">{task.title}</DialogTitle><DialogDescription>{w.taskDetail}</DialogDescription></DialogHeader><div className="min-w-0 space-y-5"><div className="flex flex-wrap gap-2"><StatusBadge status={task.status} label={w[task.status]}/><StatusBadge status={task.priority} label={`${w.priority}: ${w[task.priority]}`}/>{late&&<StatusBadge status="overdue" label={w.overdue}/>}</div>{task.description&&<p className="whitespace-pre-wrap break-words text-sm text-navy">{task.description}</p>}<DetailGrid items={[[w.assignee,task.assigneeName],[w.due,<DateText key="d" iso={task.dueDate}/>],[w.event,task.eventId?db.events.find(e=>e.id===task.eventId)?.title:null],[w.postedOn,<DateText key="c" iso={task.createdAt.slice(0,10)}/>]]}/><Field label={w.status} htmlFor={`task-detail-${task.id}`}><select id={`task-detail-${task.id}`} className="tap w-full rounded-xl border bg-background px-3" disabled={!!busy||(!manage&&!mine(task))} value={task.status} onChange={e=>void update(task,e.target.value as TaskStatus)}>{statuses.map(s=><option key={s} value={s}>{w[s]}</option>)}</select></Field></div></DialogContent></Dialog>;})()}
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{quick?.title??t.actions.create}</DialogTitle><DialogDescription>{w.tasks}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={save}><Field label={w.title} htmlFor="task-title"><Input id="task-title" className="tap" required value={form.title} onChange={e=>patch({title:e.target.value})}/></Field><Field label={w.body} htmlFor="task-description"><Textarea id="task-description" value={form.description} onChange={e=>patch({description:e.target.value})}/></Field><Field label={w.assignee} htmlFor="task-assignment"><select id="task-assignment" className="tap w-full rounded-md border bg-background px-3" value={assignment} onChange={e=>{setAssignment(e.target.value);setForm(f=>{const {assigneeUserId,departmentId,...rest}=f;return rest;});}}><option value="user">{w.assignee}</option><option value="department">{w.department}</option></select></Field><Field label={w.choose} htmlFor="task-recipient"><select id="task-recipient" required className="tap w-full rounded-md border bg-background px-3" value={assignment==='user'?form.assigneeUserId??'':form.departmentId??''} onChange={e=>patch(assignment==='user'?{assigneeUserId:e.target.value}:{departmentId:e.target.value})}><option value="">{w.choose}</option>{(assignment==='user'?db.users.filter(u=>u.active).map(u=>({id:u.id,name:u.fullName})):db.departments).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field><Field label={w.due} htmlFor="task-due"><DateField id="task-due" value={form.dueDate} onChange={dueDate=>patch({dueDate})}/></Field><Field label={w.priority} htmlFor="task-priority"><select id="task-priority" className="tap w-full rounded-md border bg-background px-3" value={form.priority} onChange={e=>patch({priority:e.target.value as Task['priority']})}>{(['low','normal','high'] as const).map(p=><option key={p} value={p}>{w[p]}</option>)}</select></Field><Field label={w.event} htmlFor="task-event" optional><select id="task-event" className="tap w-full rounded-md border bg-background px-3" value={form.eventId??''} onChange={e=>{const id=e.target.value;setForm(f=>{const {eventId,...rest}=f;return id?{...rest,eventId:id}:rest;});}}><option value="">{w.none}</option>{db.events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></Field><Button type="submit" className="tap">{t.actions.save}</Button></form></DialogContent></Dialog>
 </div></RequirePerm>;
}
