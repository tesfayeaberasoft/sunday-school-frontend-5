import { useQuickDone, type Quick } from "@/components/quick/quick";
import { rowOpen } from "@/components/common/clickable";
import { PageHeader } from "@/components/common/PageHeader";



import { useState, type ReactNode, type FormEvent } from "react";
import { toast } from "sonner";
import { useDb } from "@/stores/db";
import { useCan, useCurrentUser } from "@/hooks/use-session";
import { Records } from "@/components/finance/ModuleUi";
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
import { t } from "@/i18n";
import { formatETB } from "@/lib/format";
import { todayIso } from "@/lib/ethiopian-calendar";
import { ACCENT } from "@/lib/accent";
import { downloadCsv } from "@/lib/export";

type Values = Record<string, string>;
type Spec = { key: string; label: string; type?: string; optional?: boolean; options?: [string, string][]; min?: number; max?: number };
function Editor({ title, initial, fields, onSave, onClose, hint }: { title: string; initial: Values; fields: Spec[]; onSave: (v: Values) => boolean; onClose: () => void; hint?: string }) {
  const [values, setValues] = useState(initial);
  const change = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
    if (fields.some(f => !f.optional && !clean[f.key])) { toast.error(c.invalid); return; }
    if (onSave(clean)) onClose();
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto [&>button]:hidden"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{hint ?? c.description}</DialogDescription></DialogHeader><form onSubmit={submit} className="min-w-0 space-y-4">{fields.map(f => <Field key={f.key} label={f.label} htmlFor={`editor-${f.key}`} optional={f.optional ?? false}>{f.type === 'date' ? <DateField id={`editor-${f.key}`} value={values[f.key] ?? ''} onChange={v => change(f.key, v)} /> : f.type === 'multi' ? <div className="space-y-1 rounded-xl border p-2">{f.options?.map(([id,label]) => <label key={id} className="tap flex items-center gap-3 rounded-lg px-2"><input type="checkbox" className="h-5 w-5" checked={(values[f.key] ?? '').split(',').includes(id)} onChange={e => { const ids=(values[f.key] ?? '').split(',').filter(Boolean); change(f.key,(e.target.checked ? [...ids,id] : ids.filter(x=>x!==id)).join(',')); }} />{label}</label>)}</div> : f.options ? <select id={`editor-${f.key}`} className="tap w-full min-w-0 rounded-xl border bg-background px-3" value={values[f.key] ?? ''} onChange={e => change(f.key, e.target.value)} required={!f.optional}>{f.optional && <option value="">{c.all}</option>}{f.options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select> : f.type === 'textarea' ? <Textarea id={`editor-${f.key}`} className="min-h-28" required={!f.optional} value={values[f.key] ?? ''} onChange={e => change(f.key,e.target.value)} /> : <Input id={`editor-${f.key}`} className="tap" type={f.type ?? 'text'} min={f.min} max={f.max} step={f.type === 'number' ? 'any' : undefined} required={!f.optional} value={values[f.key] ?? ''} onChange={e => change(f.key,e.target.value)} />}</Field>)}<div className="flex flex-wrap gap-2"><Button type="submit" className="tap">{c.save}</Button><Button type="button" variant="outline" className="tap" onClick={onClose}>{c.cancel}</Button></div></form></DialogContent></Dialog>;
}
function Confirm({ title, hint, onConfirm, onClose }: { title: string; hint?: string; onConfirm: () => void; onClose: () => void }) {
 return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="w-[calc(100%-2rem)] max-w-md [&>button]:hidden"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{hint ?? c.confirmHint}</DialogDescription></DialogHeader><div className="flex flex-wrap gap-2"><Button className="tap" onClick={() => { onConfirm(); onClose(); }}>{c.confirm}</Button><Button variant="outline" className="tap" onClick={onClose}>{c.cancel}</Button></div></DialogContent></Dialog>;
}
function DataList({ headers, rows }: { headers: string[]; rows: { id: string; cells: ReactNode[] }[] }) {
 return <Records headers={headers} rows={rows} emptyTitle={c.none} emptyHint={c.emptyHint} />;
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
import { community as c } from "@/i18n/am/community";
import type { ProjectStatus } from "@/types/models";

const projectStatuses: [string,string][] = [['planned',c.planned],['active',c.active],['completed',c.completed],['on_hold',c.on_hold]];
export function DevelopmentPage({quick}:{quick?:Quick}={}) {
 const db = useDb(); const manage = useCan('development.manage');
 const [query,setQuery] = useState(''); const [status,setStatus] = useState(''); const [editor,setEditor] = useState<string|null>(quick?.action==='project'?'new':null); const [picking,setPicking] = useState(quick?.action==='progress');
 useQuickDone(quick, !!editor || picking); const [view,setView] = useState('');
 const projects = db.devProjects.filter(p => `${p.title} ${p.leadName}`.includes(query) && (!status || p.status === status));
 const current = db.devProjects.find(p => p.id === editor);
 const viewed = db.devProjects.find(p => p.id === view);
 const fields: Spec[] = [f('title',c.titleLabel),f('description',c.description,'textarea'),f('goal',c.goal,'textarea'),{...f('budget',c.budget,'number'),min:0},f('leadName',c.leadName),f('startDate',c.startDate,'date'),f('endDate',c.endDate,'date'),{key:'status',label:c.status,options:projectStatuses}];
 return <RequirePerm perm="development.view"><div className="min-w-0 space-y-4">{!quick&&<><PageHeader title={c.development} description={c.developmentHint} actions={manage && <Button className="tap" onClick={() => setEditor('new')}>{c.add}</Button>} /><div className="grid gap-3 sm:grid-cols-2"><SearchInput value={query} onChange={setQuery} /><Filter label={c.status} value={status} options={projectStatuses} onChange={setStatus} /></div><div className="grid min-w-0 gap-4 xl:grid-cols-2">{projects.map(p => <article key={p.id} {...rowOpen(() => setView(p.id), p.title)} className="row-click flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card hover:border-brand/40"><div className="flex min-w-0 items-start gap-2"><h3 className="min-w-0 flex-1 break-words font-semibold text-navy">{p.title}</h3><StatusBadge status={p.status} /></div><p className="truncate text-sm text-muted-foreground">{p.leadName} · <DateText iso={p.endDate} /></p><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-brand" style={{width:`${Math.min(100,Math.max(0,p.progress))}%`}} /></div><span className="text-xs font-semibold text-navy">{p.progress}%</span></div>{p.spent > p.budget && <p className="text-xs text-destructive">{c.overBudget}</p>}</article>)}</div>{!projects.length && <EmptyState title={c.none} hint={c.emptyHint} />}</>}
 {picking && <Dialog open onOpenChange={o => {if(!o)setPicking(false);}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto"><DialogHeader><DialogTitle>{c.updateProgress}</DialogTitle><DialogDescription>{c.pickProject}</DialogDescription></DialogHeader>{db.devProjects.filter(p => p.status !== 'completed').length ? <ul className="space-y-2">{db.devProjects.filter(p => p.status !== 'completed').map(p => <li key={p.id}><button type="button" className="tap press flex w-full min-w-0 items-center gap-3 rounded-xl border bg-card p-3 text-start hover:border-brand/40" onClick={() => {setEditor(p.id);setPicking(false);}}><span className="min-w-0 flex-1 truncate font-medium text-navy">{p.title}</span><span className="text-xs font-semibold text-muted-foreground">{p.progress}%</span></button></li>)}</ul> : <EmptyState title={c.none} />}</DialogContent></Dialog>}
 {viewed && <Dialog open onOpenChange={o => {if(!o)setView('');}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle className="break-words">{viewed.title}</DialogTitle><DialogDescription>{t.detail.hint}</DialogDescription></DialogHeader>{(p => <div className="min-w-0 space-y-4 break-words"><StatusBadge status={p.status} /><p className="text-sm text-navy">{p.description}</p><p className="text-sm"><strong>{c.goal}: </strong>{p.goal}</p><p className="text-sm">{c.leadName}: {p.leadName}</p><p className="text-sm"><DateText iso={p.startDate} /> — <DateText iso={p.endDate} /></p><dl className="grid gap-2 sm:grid-cols-3">{[[c.budget,formatETB(p.budget)],[c.spent,formatETB(p.spent)],[c.remaining,formatETB(p.budget-p.spent)]].map(([label,value]) => <div key={label} className="min-w-0 rounded-xl bg-muted p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>)}</dl>{p.spent > p.budget && <p className="text-sm text-destructive">{c.overBudget}</p>}<div><p className="text-sm">{c.progress}: {p.progress}%</p><progress max={100} value={p.progress} className="block h-3 w-full accent-brand" /></div><section className="space-y-2 border-t pt-4"><h3 className="text-sm font-semibold text-navy">{c.history}</h3><DataList headers={[c.date,c.progress,c.note,c.author]} rows={db.progressReports.filter(r => r.projectId === p.id).sort((a,b) => b.date.localeCompare(a.date)).map(r => ({id:r.id,cells:[<DateText iso={r.date} />,`${r.progress}%`,r.note,r.author]}))} /></section>{manage && <div className="flex justify-end border-t pt-4"><Button className="tap" onClick={() => {setView('');setEditor(p.id);}}>{c.edit}</Button></div>}</div>)(viewed)}</DialogContent></Dialog>}
 {editor && manage && <Editor key={editor} title={current ? c.edit : quick?.title ?? c.add} initial={current ? {title:current.title,description:current.description,goal:current.goal,budget:String(current.budget),spent:String(current.spent),progress:String(current.progress),note:'',leadName:current.leadName,startDate:current.startDate,endDate:current.endDate,status:current.status} : {title:'',description:'',goal:'',budget:'0',leadName:'',startDate:todayIso(),endDate:todayIso(),status:'planned'}} fields={current ? [...fields,{...f('spent',c.spent,'number'),min:0},{...f('progress',c.progress,'number'),min:0,max:100},f('note',c.note,'textarea')] : fields} onClose={() => setEditor(null)} onSave={v => {
 if (!manage || !validRange(v) || !Number.isFinite(n(v,'budget')) || n(v,'budget') < 0 || (current && (!Number.isFinite(n(v,'spent')) || n(v,'spent') < 0 || !Number.isFinite(n(v,'progress')) || n(v,'progress') < 0 || n(v,'progress') > 100)) || (s(v,'status') === 'completed' && current && n(v,'progress') !== 100)) {toast.error(c.invalid);return false;}
 const input = {title:s(v,'title'),description:s(v,'description'),goal:s(v,'goal'),budget:n(v,'budget'),leadName:s(v,'leadName'),startDate:s(v,'startDate'),endDate:s(v,'endDate'),status:s(v,'status') as ProjectStatus};
 if(current) { db.updateProject(current.id,{...input,spent:n(v,'spent')});db.updateProjectProgress(current.id,n(v,'progress'),s(v,'note')); } else {if(input.status === 'completed') {toast.error(c.invalid);return false;}db.addProject(input);}return success();
 }} />}
 </div></RequirePerm>;
}
