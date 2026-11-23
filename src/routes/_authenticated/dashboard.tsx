import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { QuickHost } from "@/components/dashboard/QuickActions";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";

import { StatCard } from "@/components/common/StatCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, BookOpen, CalendarDays, Wallet, Package, ListChecks, Shield, Music, TrendingUp, HardDrive, UserPlus, Megaphone, ArrowLeftRight, PackageMinus, PackageCheck, Wrench, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types/models";
import type { Permission } from "@/lib/permissions";
import { can } from "@/lib/permissions";
import { availableQuantity, outstandingQuantity } from "@/lib/rules/assets";
import { todayIso } from "@/lib/ethiopian-calendar";
import { formatETB } from "@/lib/format";
import { useSyncQueue } from "@/lib/sync-queue";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "ዳሽቦርድ — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የእርስዎ ሚና አጠቃላይ እይታ" },
      { property: "og:title", content: "ዳሽቦርድ — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የእርስዎ ሚና አጠቃላይ እይታ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});


function Page(){
 const db=useDb(),user=useCurrentUser(),queue=useSyncQueue(s=>s.items);const d=t.dashboard,w=t.workspace;
 const [quick,setQuick]=useState<string|null>(null);const closeQuick=useCallback(()=>setQuick(null),[]);
 if(!user)return null;
 const role=user.role,own=db.students.find(s=>s.id===user.studentId);
 const assigned=db.classes.filter(c=>c.teacherIds.includes(user.id)||user.classIds?.includes(c.id));
 const classIds=role==='student'?(own?[own.classId]:[]):assigned.map(c=>c.id);
 const sessions=db.attendanceSessions.filter(s=>(role!=='student'&&role!=='teacher')||classIds.includes(s.classId));
 const records=sessions.flatMap(s=>s.records.filter(r=>role!=='student'||r.studentId===own?.id));
 const attendance=records.length?Math.round(records.filter(r=>r.status!=='absent').length/records.length*100):0;
 const mine=db.tasks.filter(x=>x.assigneeUserId===user.id||(role!=='student'&&!x.assigneeUserId&&!!user.departmentId&&x.departmentId===user.departmentId));
 const pending=mine.filter(x=>x.status!=='Completed');
 const transactions=db.transactions.filter(x=>x.status==='Verified');
 const income=transactions.filter(x=>x.type==='Income').reduce((s,x)=>s+x.amount,0),expense=transactions.filter(x=>x.type==='Expense').reduce((s,x)=>s+x.amount,0);
 const balance=db.accounts.reduce((s,a)=>s+a.openingBalance,0)+transactions.reduce((s,x)=>s+x.effect*x.amount,0);
 const upcoming=db.events.filter(e=>e.endDate>=todayIso()).sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,4);
 type Metric={label:string,value:string|number,icon:LucideIcon};
 const m=(label:string,value:string|number,icon:LucideIcon):Metric=>({label,value,icon});
 const metrics:Record<Role,Metric[]>={
 manager:[m(d.totalStudents,db.students.filter(s=>s.status==='active').length,Users),m(d.activeClasses,db.classes.filter(c=>db.academicYears.some(y=>y.id===c.academicYearId&&y.status==='active')).length,BookOpen),m(d.attendanceRate,`${attendance}%`,CalendarDays),m(d.currentBalance,formatETB(balance),Wallet)],
 finance:[m(d.totalIncome,formatETB(income),TrendingUp),m(d.totalExpense,formatETB(expense),Wallet),m(d.currentBalance,formatETB(balance),Wallet),m(d.pendingVerification,db.transactions.filter(x=>x.status==='Pending').length,ListChecks)],
 asset:[m(d.totalAssets,db.assets.reduce((s,a)=>s+a.totalQuantity,0),Package),m(d.availableAssets,db.assets.reduce((s,a)=>s+availableQuantity(a,db.assetIssues),0),Package),m(d.issuedAssets,db.assetIssues.reduce((s,i)=>s+Math.max(0,outstandingQuantity(i)),0),Package),m(d.damagedAssets,db.assets.reduce((s,a)=>s+a.damagedQuantity,0),Package)],
 teacher:[m(d.assignedClasses,assigned.length,BookOpen),m(d.assignedStudents,db.students.filter(s=>classIds.includes(s.classId)&&s.status==='active').length,Users),m(d.attendanceRate,`${attendance}%`,CalendarDays),m(d.todayAttendance,assigned.filter(c=>sessions.some(s=>s.classId===c.id&&s.date===todayIso())).length,CalendarDays)],
 development:[m(d.projects,db.devProjects.length,TrendingUp),m(d.pendingTasks,pending.length,ListChecks),m(d.departments,db.departmentMembers.filter(x=>x.departmentId===user.departmentId).length,Users),m(d.upcomingEvents,upcoming.length,CalendarDays)],
 mezmur:[m(d.mezmurMaterials,db.mezmurs.filter(x=>x.published).length,Music),m(d.practiceSchedule,db.practiceSchedules.filter(x=>x.date>=todayIso()).length,CalendarDays),m(d.pendingTasks,pending.length,ListChecks),m(d.upcomingEvents,upcoming.length,CalendarDays)],
 student:[m(d.myClass,db.classes.find(c=>c.id===own?.classId)?.name??w.none,BookOpen),m(d.myAttendance,own?`${attendance}%`:w.none,CalendarDays),m(d.mezmurMaterials,db.mezmurs.filter(x=>x.published).length,Music),m(d.myTasks,pending.length,ListChecks)]
 };
 const q=d.qa;
 const actions:Record<Role,Array<{id:string,label:string,perm:Permission,icon:LucideIcon}>>={
 manager:[{id:'student',label:q.student,perm:'students.register',icon:UserPlus},{id:'user',label:q.user,perm:'admin.users',icon:Shield},{id:'event',label:q.event,perm:'events.manage',icon:CalendarDays},{id:'announcement',label:q.announcement,perm:'announcements.create_all',icon:Megaphone},{id:'task',label:q.task,perm:'tasks.manage',icon:ListChecks}],
 finance:[{id:'Income',label:q.income,perm:'finance.record',icon:TrendingUp},{id:'Expense',label:q.expense,perm:'finance.record',icon:Wallet},{id:'transfer',label:q.transfer,perm:'finance.record',icon:ArrowLeftRight}],
 asset:[{id:'issue',label:q.issueAsset,perm:'assets.manage',icon:PackageMinus},{id:'returnPick',label:q.returnAsset,perm:'assets.manage',icon:PackageCheck},{id:'add',label:q.addAsset,perm:'assets.manage',icon:Package},{id:'schedule',label:q.maintenance,perm:'assets.manage',icon:Wrench}],
 teacher:[{id:'record',label:q.record,perm:'attendance.record',icon:CalendarDays},{id:'myClasses',label:q.myClasses,perm:'classes.view',icon:BookOpen}],
 development:[{id:'progress',label:q.progress,perm:'development.manage',icon:TrendingUp},{id:'project',label:q.project,perm:'development.manage',icon:Plus},{id:'announcement',label:q.deptAnnouncement,perm:'announcements.create_department',icon:Megaphone}],
 mezmur:[{id:'mezmur',label:q.mezmur,perm:'mezmur.manage',icon:Music},{id:'practice',label:q.practice,perm:'mezmur.manage',icon:CalendarDays},{id:'announcement',label:q.deptAnnouncement,perm:'announcements.create_department',icon:Megaphone}],
 student:[{id:'myProfile',label:q.myProfile,perm:'dashboard.view',icon:Users},{id:'myAttendance',label:q.myAttendance,perm:'attendance.view',icon:CalendarDays},{id:'browse',label:q.songs,perm:'mezmur.view',icon:Music}]
 };
 let chartTitle=d.distribution;let chart:Array<{name:string,value:number,income?:number,expense?:number}>=[];
 switch(role){
 case 'manager':case 'teacher':case 'student':chartTitle=d.attendanceTrend;chart=Array.from(new Set(sessions.map(s=>s.date))).sort().slice(-8).map(date=>{const rs=sessions.filter(s=>s.date===date).flatMap(s=>s.records.filter(r=>role!=='student'||r.studentId===own?.id));return {name:date,value:rs.length?Math.round(rs.filter(r=>r.status!=='absent').length/rs.length*100):0};});break;
 case 'finance':chartTitle=d.monthlyFinance;chart=Array.from({length:6},(_,i)=>{const now=new Date();now.setMonth(now.getMonth()-5+i,1);const month=now.toISOString().slice(0,7);const rows=transactions.filter(x=>x.date.startsWith(month));const income=rows.filter(x=>x.type==='Income').reduce((s,x)=>s+x.amount,0),expense=rows.filter(x=>x.type==='Expense').reduce((s,x)=>s+x.amount,0);return {name:month,value:income+expense,income,expense};});break;
 case 'asset':chart=[{name:d.availableAssets,value:db.assets.reduce((s,a)=>s+availableQuantity(a,db.assetIssues),0)},{name:d.issuedAssets,value:db.assetIssues.reduce((s,i)=>s+Math.max(0,outstandingQuantity(i)),0)},{name:d.damagedAssets,value:db.assets.reduce((s,a)=>s+a.damagedQuantity,0)}];break;
 case 'development':chart=db.devProjects.map(p=>({name:p.title,value:p.progress}));break;
 case 'mezmur':chart=db.practiceSchedules.filter(p=>p.date>=todayIso()).slice(0,6).map(p=>({name:p.title,value:p.mezmurIds.length}));break;
 }
 const announcements=db.announcements.filter(a=>a.targetType==='all'||a.authorId===user.id||(a.targetType==='role'&&a.targetIds.includes(role))||(a.targetType==='department'&&!!user.departmentId&&a.targetIds.includes(user.departmentId))||(a.targetType==='class'&&a.targetIds.some(id=>classIds.includes(id)))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,3);
 return <RequirePerm perm="dashboard.view"><div className="space-y-5 min-w-0"><section className="relative overflow-hidden rounded-3xl bg-hero p-5 text-navy-foreground shadow-lift animate-fade-up sm:p-7"><div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/25 blur-3xl" aria-hidden/><div className="relative min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-brand-glow">{d.title} · <DateText iso={todayIso()} weekday/></p><h1 className="mt-1.5 truncate text-2xl font-bold text-navy-foreground sm:text-3xl">{user.fullName}</h1><p className="mt-0.5 text-sm text-navy-foreground/70">{t.roles[role]}</p><div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={d.quickActions} title={d.quickHint}>{actions[role].filter(a=>can(role,a.perm)).map((a,i)=><button type="button" key={a.id} onClick={()=>setQuick(a.id)} className={i===0?"press tap inline-flex max-w-full items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow":"press tap inline-flex max-w-full items-center gap-2 rounded-full border border-navy-foreground/20 bg-navy-foreground/5 px-4 text-sm font-medium text-navy-foreground hover:bg-navy-foreground/10"}><a.icon className="h-4 w-4 shrink-0" aria-hidden/><span className="truncate">{a.label}</span></button>)}</div></div></section>{role==='student'&&!own&&<EmptyState title={d.noStudent}/>}
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics[role].map((item,i)=><StatCard key={item.label} {...item} accent={(['brand','teal','gold','navy'] as const)[i%4]??'brand'}/>)}</div>
 <Panel title={chartTitle}>{chart.some(x=>x.value!==0)?<div className="h-72 min-w-0" role="img" aria-label={chartTitle}><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{top:12,right:8,left:-24,bottom:15}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="name" tick={{fontSize:10}} interval="preserveStartEnd"/><YAxis tick={{fontSize:10}}/><Tooltip/>{role==='finance'?[<Bar key="income" dataKey="income" name={d.income} fill="var(--brand)" radius={[5,5,0,0]}/>,<Bar key="expense" dataKey="expense" name={d.expense} fill="var(--navy)" radius={[5,5,0,0]}/>]:<Bar dataKey="value" name={chartTitle} fill="var(--brand)" radius={[5,5,0,0]}/>}</BarChart></ResponsiveContainer></div>:<EmptyState/>}<ul className="sr-only">{chart.map((x,i)=><li key={i}>{x.name}: {x.value}</li>)}</ul></Panel>
 {can(role,'admin.settings')&&<div className="grid min-w-0 gap-4 md:grid-cols-2"><Panel title={d.systemHealth} actions={<Button asChild size="sm" variant="outline" className="tap"><Link to="/admin">{t.actions.seeAll}</Link></Button>}><dl className="grid grid-cols-2 gap-3">{[
  {label:d.activeUsers,value:db.users.filter(u=>u.active).length,icon:Users},
  {label:d.failedLogins,value:db.users.reduce((s,u)=>s+u.failedLogins,0),icon:Shield},
  {label:d.syncErrors,value:queue.filter(q=>q.status==='error'||q.status==='conflict').length,icon:ListChecks},
 ].map(x=><div key={x.label} className="min-w-0 rounded-xl border bg-background p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><x.icon className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden/><span className="truncate">{x.label}</span></dt><dd className="mt-1 text-xl font-bold text-navy">{x.value}</dd></div>)}<div className="min-w-0 rounded-xl border bg-background p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><HardDrive className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden/><span className="truncate">{d.lastBackup}</span></dt><dd className="mt-1 text-sm font-semibold text-navy"><DateText iso={db.settings.lastBackupAt.slice(0,10)}/></dd><dd className={db.settings.backupStatus==='ok'?"text-xs font-medium text-success":"text-xs font-medium text-warning"}>{db.settings.backupStatus==='ok'?d.backupOk:db.settings.backupStatus==='running'?d.backupRunning:d.backupFailed}</dd></div></dl></Panel><Panel title={d.recentAudit}>{db.auditLogs.length?db.auditLogs.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5).map(a=><p className="border-b py-3 text-sm break-words last:border-0" key={a.id}><span className="font-medium">{a.userName}</span> · {a.action} · <span className="text-muted-foreground"><DateText iso={a.createdAt}/></span></p>):<EmptyState/>}</Panel></div>}
 {(role==='manager'||role==='finance')&&<Panel title={d.recentTransactions}>{db.transactions.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5).map(x=><div className="border-b py-3 break-words" key={x.id}><p>{x.description}</p><p className="text-sm text-muted-foreground">{formatETB(x.amount)} · <DateText iso={x.date}/></p></div>)}</Panel>}
 {role==='manager'&&<Panel title={d.highExpenses}>{db.transactions.filter(x=>x.type==='Expense'&&x.status==='Verified'&&x.amount>db.settings.expenseThreshold).map(x=><div className="border-b py-3 space-y-2 break-words" key={x.id}><p>{x.description} · {formatETB(x.amount)}</p>{db.settings.acknowledgedExpenseIds.includes(x.id)?<p>{d.acknowledged}</p>:<Button className="tap" variant="outline" onClick={()=>{db.acknowledgeExpense(x.id);toast.success(w.saved);}}>{d.acknowledge}</Button>}</div>)}</Panel>}
 {role==='asset'&&<Panel title={d.overdueReturns}>{db.assetIssues.filter(i=>i.dueDate<todayIso()&&outstandingQuantity(i)>0).map(i=><p key={i.id} className="border-b py-3 break-words">{db.assets.find(a=>a.id===i.assetId)?.name} · {i.recipientName} · <DateText iso={i.dueDate}/></p>)}</Panel>}
 {role==='development'&&<Panel title={d.projects}>{db.devProjects.map(p=><div key={p.id} className="py-3 border-b"><p>{p.title} · {p.progress}%</p><progress className="w-full accent-brand" value={p.progress} max={100} aria-label={p.title}/></div>)}</Panel>}
 {role==='mezmur'&&<Panel title={d.practiceSchedule}>{db.practiceSchedules.filter(p=>p.date>=todayIso()).slice(0,5).map(p=><p key={p.id} className="border-b py-3 break-words">{p.title} · <DateText iso={p.date}/> · {p.startTime} — {p.endTime} · {p.location}</p>)}</Panel>}
 {role==='teacher'&&<Panel title={d.assignedClasses}>{assigned.length?assigned.map(c=><div key={c.id} className="py-3 border-b break-words"><p>{c.name} · {c.schedule}</p><p className="text-sm text-muted-foreground">{sessions.some(s=>s.classId===c.id&&s.date===todayIso())?d.recorded:d.notRecorded}</p></div>):<EmptyState/>}</Panel>}
 <div className="grid min-w-0 gap-4 md:grid-cols-2"><Panel title={d.upcomingEvents}>{upcoming.length?upcoming.map(e=><p className="border-b py-3 break-words" key={e.id}>{e.title} · <DateText iso={e.startDate}/></p>):<EmptyState title={d.noUpcoming}/>}</Panel><Panel title={d.myTasks}>{pending.length?pending.slice(0,5).map(task=><p className="border-b py-3 break-words" key={task.id}>{task.title} · <DateText iso={task.dueDate}/>{task.dueDate<todayIso()&&<span className="text-destructive"> · {w.overdue}</span>}</p>):<EmptyState/>}</Panel></div>
 <Panel title={d.recentAnnouncements}>{announcements.length?announcements.map(a=><article className="border-b py-3 break-words" key={a.id}><h3 className="font-semibold">{a.title}</h3><p className="text-sm whitespace-pre-wrap">{a.body}</p></article>):<EmptyState/>}<Button asChild className="tap mt-3" variant="outline"><Link to="/announcements">{t.actions.seeAll}</Link></Button></Panel>
 {quick&&(()=>{const label=actions[role].find(a=>a.id===quick.split(':')[0])?.label??(quick.startsWith('record')?q.record:undefined);return <QuickHost key={quick} action={quick} {...(label?{title:label}:{})} onDone={closeQuick} onSwitch={setQuick}/>;})()}
 </div></RequirePerm>;
}
