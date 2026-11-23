import { useQuickDone, type Quick } from "@/components/quick/quick";
import { PageHeader } from "@/components/common/PageHeader";



import { useState, type ReactNode, type FormEvent } from "react";
import { toast } from "sonner";
import { useDb } from "@/stores/db";
import { useCan, useCurrentUser } from "@/hooks/use-session";
import { Records, type RecordRow } from "@/components/finance/ModuleUi";
import { UserDetail, YearDetail } from "@/components/admin/AdminDetails";
import { STAFF_ROLES, roleChangeBlock, staffUsers } from "@/lib/rules/accounts";
import { RequirePerm } from "@/components/common/RequirePerm";
import { Panel } from "@/components/common/Panel";
import { EmptyState } from "@/components/common/EmptyState";
import { Field } from "@/components/common/Field";
import { DateField } from "@/components/common/DateField";
import { DateText, useFormatDate } from "@/components/common/DateText";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";
import { formatETB } from "@/lib/format";
import { todayIso, isoToEth, academicYearDates } from "@/lib/ethiopian-calendar";
import { ACCENT } from "@/lib/accent";
import { downloadCsv } from "@/lib/export";

type Values = Record<string, string>;
type Spec = { key: string; label: string; type?: string; optional?: boolean; options?: [string, string][]; min?: number; max?: number };
function Editor({ title, initial, fields, onSave, onClose, hint, focusKey }: { title: string; initial: Values; fields: Spec[]; onSave: (v: Values) => boolean; onClose: () => void; hint?: string; focusKey?: string }) {
  const [values, setValues] = useState(initial);
  const change = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
    if (fields.some(f => !f.optional && !clean[f.key])) { toast.error(c.invalid); return; }
    if (onSave(clean)) onClose();
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto [&>button]:hidden"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{hint ?? c.description}</DialogDescription></DialogHeader><form onSubmit={submit} className="min-w-0 space-y-4">{fields.map(f => <Field key={f.key} label={f.label} htmlFor={`editor-${f.key}`} optional={f.optional ?? false}>{f.type === 'date' ? <DateField id={`editor-${f.key}`} value={values[f.key] ?? ''} onChange={v => change(f.key, v)} /> : f.type === 'multi' ? <div className="space-y-1 rounded-xl border p-2">{f.options?.map(([id,label]) => <label key={id} className="tap flex items-center gap-3 rounded-lg px-2"><input type="checkbox" className="h-5 w-5" checked={(values[f.key] ?? '').split(',').includes(id)} onChange={e => { const ids=(values[f.key] ?? '').split(',').filter(Boolean); change(f.key,(e.target.checked ? [...ids,id] : ids.filter(x=>x!==id)).join(',')); }} />{label}</label>)}</div> : f.options ? <select id={`editor-${f.key}`} autoFocus={f.key === focusKey} className="tap w-full min-w-0 rounded-xl border bg-background px-3" value={values[f.key] ?? ''} onChange={e => change(f.key, e.target.value)} required={!f.optional}>{f.optional && <option value="">{c.all}</option>}{f.options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select> : f.type === 'textarea' ? <Textarea id={`editor-${f.key}`} autoFocus={f.key === focusKey} className="min-h-28" required={!f.optional} value={values[f.key] ?? ''} onChange={e => change(f.key,e.target.value)} /> : <Input id={`editor-${f.key}`} autoFocus={f.key === focusKey} className="tap" type={f.type ?? 'text'} min={f.min} max={f.max} step={f.type === 'number' ? 'any' : undefined} required={!f.optional} value={values[f.key] ?? ''} onChange={e => change(f.key,e.target.value)} />}</Field>)}<div className="flex flex-wrap gap-2"><Button type="submit" className="tap">{c.save}</Button><Button type="button" variant="outline" className="tap" onClick={onClose}>{c.cancel}</Button></div></form></DialogContent></Dialog>;
}
function Confirm({ title, hint, onConfirm, onClose }: { title: string; hint?: string; onConfirm: () => void; onClose: () => void }) {
 return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="w-[calc(100%-2rem)] max-w-md [&>button]:hidden"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{hint ?? c.confirmHint}</DialogDescription></DialogHeader><div className="flex flex-wrap gap-2"><Button className="tap" onClick={() => { onConfirm(); onClose(); }}>{c.confirm}</Button><Button variant="outline" className="tap" onClick={onClose}>{c.cancel}</Button></div></DialogContent></Dialog>;
}
function DataList({ headers, rows, list }: { headers: string[]; rows: RecordRow[]; list?: number[] }) {
 return <Records headers={headers} rows={rows} {...(list?{list}:{})} emptyTitle={c.none} emptyHint={c.emptyHint} />;
}
function Tabs({ value, options, onChange }: { value: string; options: [string,string][]; onChange: (v: string) => void }) {
 return <nav className="-mx-3 mb-4 flex gap-2 overflow-x-auto px-3 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" aria-label={c.type}>{options.map(([id,label]) => <Button key={id} className={value === id ? 'tap press shrink-0 whitespace-nowrap rounded-full px-4 shadow-glow' : 'tap press shrink-0 whitespace-nowrap rounded-full bg-card px-4'} variant={value === id ? 'default' : 'outline'} aria-pressed={value === id} onClick={() => onChange(id)}>{label}</Button>)}</nav>;
}
function Filter({ label, value, options, onChange }: { label: string; value: string; options: [string,string][]; onChange: (v: string) => void }) {
 return <Field label={label}><select aria-label={label} className="tap w-full min-w-0 rounded-xl border bg-background px-3" value={value} onChange={e => onChange(e.target.value)}><option value="">{c.all}</option>{options.map(([id,text]) => <option key={id} value={id}>{text}</option>)}</select></Field>;
}
const f = (key: string, label: string, type = 'text', optional = false): Spec => ({ key, label, type, optional });
const n = (v: Values, key: string) => Number(v[key] ?? 0);
const s = (v: Values, key: string) => v[key] ?? '';
const validRange = (v: Values) => s(v,'startDate') <= s(v,'endDate');
const success = () => { toast.success(c.saved); return true; };
import { admin as c } from "@/i18n/am/admin";
import { t } from "@/i18n";
import { matchesAny } from "@/lib/amharic-search";
import type { Role } from "@/types/models";

const roles: [string,string][] = STAFF_ROLES.map(r=>[r,t.roles[r]]);
type EditorState = { kind: 'add' } | { kind: 'settings'; focus?: string } | { kind: 'user'; id: string } | { kind: 'year'; id: string };
export function AdminPage({quick}:{quick?:Quick}={}) {
 const db=useDb();const user=useCurrentUser();const users=useCan('admin.users');const years=useCan('admin.years');const settings=useCan('admin.settings');const audit=useCan('admin.audit');
 const tabs: [string,string][] = [...(users?[['users',c.users] as [string,string]]:[]),...(years?[['years',c.years] as [string,string]]:[]),...(settings?[['settings',c.settings] as [string,string],['backup',c.backup] as [string,string],['demo',c.demo] as [string,string]]:[]),...(audit?[['audit',c.audit] as [string,string]]:[])];
 const [selected,setSelected]=useState('users');const tab=tabs.some(([id])=>id===selected)?selected:tabs[0]?.[0]??'';
 const [query,setQuery]=useState('');const [role,setRole]=useState('');const [active,setActive]=useState('');const [editor,setEditor]=useState<EditorState|null>(quick?.action==='user'?{kind:'add'}:null);
 useQuickDone(quick,!!editor);
 const [detail,setDetail]=useState<{kind:'user'|'year';id:string}|null>(null);
 const [confirmation,setConfirmation]=useState<{title:string;hint?:string;run:()=>void}|null>(null);
 const [auditUser,setAuditUser]=useState('');const [module,setModule]=useState('');const [action,setAction]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');const [limit,setLimit]=useState(50);
 const confirm=(title:string,run:()=>void,hint?:string)=>setConfirmation({title,run,...(hint?{hint}:{})});
 const logs=db.auditLogs.filter(log=>(!auditUser||log.userId===auditUser)&&(!module||log.module===module)&&(!action||log.action===action)&&(!from||log.createdAt.slice(0,10)>=from)&&(!to||log.createdAt.slice(0,10)<=to)&&matchesAny([log.userName,log.details,log.entity],query)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const backupLogs=db.auditLogs.filter(log=>log.entityId==='backup').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const settingFields:Spec[]=[f('schoolName',c.schoolName),{...f('expenseThreshold',c.expenseThreshold,'number'),min:0},{...f('monthlyContribution',c.monthlyContribution,'number'),min:0},f('sessionNames',c.sessionNames),{key:'defaultCalendar',label:c.defaultCalendar,options:[['et',c.et],['gc',c.gc]]},{key:'defaultLanguage',label:c.defaultLanguage,options:[['am',c.am],['om',c.om],['en',c.en]]}];
 const staff=staffUsers(db.users).filter(u=>matchesAny([u.fullName,u.username],query)&&(!role||u.role===role)&&(!active||String(u.active)===active));
 const openSetting=(focus:string)=>setEditor({kind:'settings',focus});
 const settingRows:RecordRow[]=[{id:'schoolName',cells:[c.schoolName,db.settings.schoolName]},{id:'expenseThreshold',cells:[c.expenseThreshold,formatETB(db.settings.expenseThreshold)]},{id:'monthlyContribution',cells:[c.monthlyContribution,formatETB(db.settings.monthlyContribution)]},{id:'sessionNames',cells:[c.sessionNames,db.settings.sessionNames.join('፣ ')]},{id:'defaultCalendar',cells:[c.defaultCalendar,db.settings.defaultCalendar==='et'?c.et:c.gc]},{id:'defaultLanguage',cells:[c.defaultLanguage,({am:c.am,om:c.om,en:c.en})[db.settings.defaultLanguage]]}].map(r=>({...r,onOpen:()=>openSetting(r.id)}));
 const yearLabel={planned:c.planned,active:c.active,closed:c.closed};
 const editingUser=editor?.kind==='user'?db.users.find(u=>u.id===editor.id):undefined;
 const editingYear=editor?.kind==='year'?db.academicYears.find(y=>y.id===editor.id):undefined;
 const editorKind=editor?.kind==='add'?tab:editor?.kind;
 const nextYear=Math.max(isoToEth(todayIso()).year,...db.academicYears.map(y=>isoToEth(y.startDate).year))+1;
 const yearDefaults=academicYearDates(nextYear);
 const initial:Values=editingUser?{fullName:editingUser.fullName,email:editingUser.email,phone:editingUser.phone,role:editingUser.role}:editingYear?{name:editingYear.name,startDate:editingYear.startDate,endDate:editingYear.endDate}:editorKind==='users'?{username:'',fullName:'',email:'',phone:'',role:'teacher',active:'true'}:editorKind==='years'?{name:'',startDate:yearDefaults.startDate,endDate:yearDefaults.endDate}:editorKind==='settings'?{schoolName:db.settings.schoolName,expenseThreshold:String(db.settings.expenseThreshold),monthlyContribution:String(db.settings.monthlyContribution),sessionNames:db.settings.sessionNames.join(', '),defaultCalendar:db.settings.defaultCalendar,defaultLanguage:db.settings.defaultLanguage}:{confirmation:''};
 const fields:Spec[]=editingUser?[f('fullName',c.fullName),f('email',c.email,'email',true),f('phone',c.phone,'tel',true),{key:'role',label:c.role,options:roles}]:editingYear?[f('name',c.name),f('startDate',c.startDate,'date'),f('endDate',c.endDate,'date')]:editorKind==='users'?[f('username',c.username),f('fullName',c.fullName),f('email',c.email,'email',true),f('phone',c.phone,'tel',true),{key:'role',label:c.role,options:roles},{key:'active',label:c.status,options:[['true',c.active],['false',c.inactive]]}]:editorKind==='years'?[f('name',c.name),f('startDate',c.startDate,'date'),f('endDate',c.endDate,'date')]:editorKind==='settings'?settingFields:[f('confirmation',c.confirmation)];
 const editorTitle=editingUser?c.editUser:editingYear?c.editYear:editorKind==='settings'?c.edit:editorKind==='demo'?c.resetDemo:c.add;
 const save=(v:Values):boolean=>{
  if(editingUser&&users){const next=s(v,'role') as Role;if(!STAFF_ROLES.includes(next)){toast.error(c.invalid);return false;}if(roleChangeBlock(db.users,editingUser.id,next,user?.id)){toast.error(c.roleProtect);return false;}db.updateUser(editingUser.id,{fullName:s(v,'fullName'),email:s(v,'email'),phone:s(v,'phone'),role:next});}
  else if(editingYear&&years){if(!validRange(v)||db.academicYears.some(y=>y.id!==editingYear.id&&y.name===s(v,'name'))){toast.error(c.invalid);return false;}db.updateAcademicYear(editingYear.id,{name:s(v,'name'),startDate:s(v,'startDate'),endDate:s(v,'endDate')});}
  else if(editorKind==='users'&&users){const next=s(v,'role') as Role;if(!STAFF_ROLES.includes(next)){toast.error(c.invalid);return false;}const result=db.addUser({username:s(v,'username'),fullName:s(v,'fullName'),email:s(v,'email'),phone:s(v,'phone'),role:next,active:s(v,'active')==='true'});if(!result.ok){toast.error(result.error);return false;}}
  else if(editorKind==='years'&&years){if(!validRange(v)||db.academicYears.some(y=>y.name===s(v,'name'))){toast.error(c.invalid);return false;}db.addAcademicYear({name:s(v,'name'),startDate:s(v,'startDate'),endDate:s(v,'endDate')});}
  else if(editorKind==='settings'&&settings){const names=[...new Set(s(v,'sessionNames').split(/[,፣]/).map(x=>x.trim()).filter(Boolean))];if(!Number.isFinite(n(v,'expenseThreshold'))||!Number.isFinite(n(v,'monthlyContribution'))||n(v,'expenseThreshold')<0||n(v,'monthlyContribution')<0||!names.length){toast.error(c.invalid);return false;}db.updateSettings({schoolName:s(v,'schoolName'),expenseThreshold:n(v,'expenseThreshold'),monthlyContribution:n(v,'monthlyContribution'),sessionNames:names,defaultCalendar:s(v,'defaultCalendar') as 'et'|'gc',defaultLanguage:s(v,'defaultLanguage') as 'am'|'om'|'en'});}
  else if(editorKind==='demo'&&settings){if(s(v,'confirmation')!==c.resetWord){toast.error(c.invalid);return false;}db.resetDemo();}
  else return false;return success();
 };
 return <RequirePerm perm={['admin.users','admin.years','admin.settings','admin.audit']}><div className="min-w-0 space-y-4">{!quick&&<><PageHeader title={c.title} description={c.hint} /><Tabs value={tab} options={tabs} onChange={value=>{setSelected(value);setEditor(null);setDetail(null);setQuery('');setLimit(50);}} />
 {tab==='users'&&users&&<><div className="grid gap-3 sm:grid-cols-3"><SearchInput value={query} onChange={setQuery} /><Filter label={c.role} value={role} onChange={setRole} options={roles} /><Filter label={c.status} value={active} onChange={setActive} options={[[ 'true',c.active],['false',c.inactive]]} /></div><Panel title={`${c.users} (${staff.length})`} actions={<Button className="tap" onClick={()=>setEditor({kind:'add'})}>{c.add}</Button>}><p className="mb-1 text-sm text-muted-foreground">{c.tapRowHint}</p><p className="mb-4 text-xs text-muted-foreground">{c.studentsManaged}</p><DataList headers={[c.fullName,c.username,c.role,c.status]} rows={staff.map(u=>({id:u.id,onOpen:()=>setDetail({kind:'user',id:u.id}),cells:[u.fullName,<span className="font-mono text-xs">{u.username}</span>,t.roles[u.role],<StatusBadge status={u.active?'active':'inactive'} label={u.active?c.active:c.inactive} />]}))} /></Panel></>}
 {tab==='years'&&years&&<Panel title={c.years} actions={<Button className="tap" onClick={()=>setEditor({kind:'add'})}>{c.add}</Button>}><p className="mb-4 text-sm text-muted-foreground">{c.tapRowHint} {c.closeYearHint}</p><DataList headers={[c.name,c.startDate,c.endDate,c.status]} rows={db.academicYears.map(y=>({id:y.id,onOpen:()=>setDetail({kind:'year',id:y.id}),cells:[y.name,<DateText iso={y.startDate} />,<DateText iso={y.endDate} />,<StatusBadge status={y.status} label={yearLabel[y.status]} />]}))} /></Panel>}
 {tab==='settings'&&settings&&<Panel title={c.settings} actions={<Button className="tap" onClick={()=>setEditor({kind:'settings'})}>{c.edit}</Button>}><p className="mb-4 text-sm text-muted-foreground">{c.tapRowHint}</p><DataList headers={[c.name,c.value]} rows={settingRows} /></Panel>}
 {tab==='audit'&&audit&&<><Panel title={c.audit}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><SearchInput value={query} onChange={v=>{setQuery(v);setLimit(50);}} /><Filter label={c.user} value={auditUser} onChange={setAuditUser} options={[...new Map(db.auditLogs.map(log=>[log.userId,log.userName])).entries()]} /><Filter label={c.module} value={module} onChange={setModule} options={[...new Set(db.auditLogs.map(log=>log.module))].map(x=>[x,x])} /><Filter label={c.action} value={action} onChange={setAction} options={[...new Set(db.auditLogs.map(log=>log.action))].map(x=>[x,x])} /><Field label={c.from}><DateField value={from} onChange={setFrom} /></Field><Field label={c.to}><DateField value={to} onChange={setTo} /></Field><Button className="tap" variant="outline" onClick={()=>{setQuery('');setAuditUser('');setModule('');setAction('');setFrom('');setTo('');setLimit(50);}}>{c.clear}</Button></div>{from&&to&&from>to&&<p role="alert" className="text-destructive">{c.invalid}</p>}</Panel><Panel title={`${c.audit} (${logs.length})`}><DataList headers={[c.date,c.user,c.module,c.action,c.details]} list={[0,1,3]} rows={logs.slice(0,limit).map(log=>({id:log.id,cells:[<DateText iso={log.createdAt.slice(0,10)} />,log.userName,log.module,log.action,log.details]}))} />{logs.length>limit&&<Button className="tap mt-4" variant="outline" onClick={()=>setLimit(v=>v+50)}>{c.more}</Button>}</Panel></>}
 {tab==='backup'&&settings&&<Panel title={c.backup} actions={<Button className="tap" disabled={db.settings.backupStatus==='running'} onClick={()=>confirm(c.runBackup,()=>{if(settings){db.runBackup();toast.info(c.backupNote);}},c.backupNote)}>{c.runBackup}</Button>}><p className="mb-4 text-sm text-muted-foreground">{c.backupNote}</p><p>{c.lastBackup}: <DateText iso={db.settings.lastBackupAt.slice(0,10)} /></p><StatusBadge label={db.settings.backupStatus==='ok'?c.ok:db.settings.backupStatus==='running'?c.running:c.failed} tone={db.settings.backupStatus==='ok'?'success':'warning'} /><div className="mt-4"><DataList headers={[c.date,c.user,c.details]} rows={backupLogs.map(log=>({id:log.id,cells:[<DateText iso={log.createdAt.slice(0,10)} />,log.userName,log.details]}))} /></div></Panel>}
 {tab==='demo'&&settings&&<Panel title={c.demo}><p className="mb-4 text-sm text-destructive">{c.resetWarning}</p><Button className="tap" variant="destructive" onClick={()=>setEditor({kind:'add'})}>{c.resetDemo}</Button></Panel>}
 {detail?.kind==='user'&&users&&<UserDetail id={detail.id} onClose={()=>setDetail(null)} onEdit={()=>{setDetail(null);setEditor({kind:'user',id:detail.id});}} />}
 {detail?.kind==='year'&&years&&<YearDetail id={detail.id} onClose={()=>setDetail(null)} onEdit={()=>{setDetail(null);setEditor({kind:'year',id:detail.id});}} />}
 </>}
 {confirmation&&<Confirm title={confirmation.title} {...(confirmation.hint?{hint:confirmation.hint}:{})} onConfirm={confirmation.run} onClose={()=>setConfirmation(null)} />}
 {editor&&<Editor key={`${editor.kind}-${'id' in editor?editor.id:tab}`} title={quick?.title??editorTitle} hint={editorKind==='demo'?c.resetWarning:editorKind==='users'?c.passwordNote:c.description} {...(editor.kind==='settings'&&editor.focus?{focusKey:editor.focus}:{})} initial={initial} fields={fields} onClose={()=>setEditor(null)} onSave={save} />}
 </div></RequirePerm>;
}
