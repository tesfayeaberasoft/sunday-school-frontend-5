import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({
    meta: [
      { title: "መምሪያዎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "መምሪያዎችና አባላት" },
      { property: "og:title", content: "መምሪያዎች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "መምሪያዎችና አባላት" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});


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

function Page() {
 const db = useDb(); const manage = useCan('departments.manage'); const user = useCurrentUser();
 const [query,setQuery] = useState(''); const [selected,setSelected] = useState('');
 const [editor,setEditor] = useState<'department'|'member'|null>(null); const [remove,setRemove] = useState('');
 const departments = db.departments.filter(d => `${d.name} ${d.leaderName}`.includes(query));
 const current = db.departments.find(d => d.id === selected) ?? departments[0];
 const members = db.departmentMembers.filter(m => m.departmentId === current?.id);
 const tasks = db.tasks.filter(task => task.departmentId === current?.id && (manage || user?.departmentId === current?.id));
 return <RequirePerm perm="departments.view"><div className="min-w-0 space-y-4"><PageHeader title={c.departments} description={c.departmentsHint} actions={manage && <Button className="tap" onClick={() => setEditor('department')}>{c.add}</Button>} /><SearchInput value={query} onChange={setQuery} /><div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><Panel title={c.departments}>{departments.length ? <div className="space-y-2">{departments.map(d => <button key={d.id} className={`tap w-full rounded-xl border p-3 text-left ${current?.id === d.id ? ACCENT.brand.soft : 'bg-card'}`} onClick={() => setSelected(d.id)} aria-pressed={current?.id === d.id}><span className="block break-words font-semibold">{d.name}</span><span className="block text-sm text-muted-foreground">{d.leaderName}</span><span className="text-xs">{c.members}: {db.departmentMembers.filter(m => m.departmentId === d.id).length}</span></button>)}</div> : <EmptyState title={c.none} hint={c.emptyHint} />}</Panel>{current && <div className="min-w-0 space-y-4"><Panel title={current.name} description={current.description} actions={manage && <Button className="tap" onClick={() => setEditor('member')}>{c.members} — {c.add}</Button>}><DataList headers={[c.name,c.roleTitle,c.phone,c.joinedDate,c.actions]} rows={members.map(m => ({id:m.id,cells:[m.name,m.roleTitle,m.phone,<DateText iso={m.joinedDate} />,manage ? <Button className="tap" variant="outline" onClick={() => setRemove(m.id)}>{c.remove}</Button> : '—']}))} /></Panel><Panel title={c.activities}><DataList headers={[c.titleLabel,c.leadName,c.endDate,c.status]} rows={tasks.map(task => ({id:task.id,cells:[task.title,task.assigneeName,<DateText iso={task.dueDate} />,<StatusBadge status={task.status} />]}))} /></Panel></div>}</div>
 {editor === 'department' && manage && <Editor title={c.departments} initial={{name:'',description:'',leaderName:''}} fields={[f('name',c.name),f('description',c.description,'textarea'),f('leaderName',c.leaderName)]} onClose={() => setEditor(null)} onSave={v => { if (!manage) return false; if (db.departments.some(d => d.name === s(v,'name'))) {toast.error(c.duplicate);return false;} db.addDepartment({name:s(v,'name'),description:s(v,'description'),leaderName:s(v,'leaderName'),color:'brand',icon:'Users'}); return success(); }} />}
 {editor === 'member' && manage && current && <Editor title={`${current.name} — ${c.members}`} initial={{name:'',roleTitle:'',phone:'',joinedDate:todayIso()}} fields={[f('name',c.name),f('roleTitle',c.roleTitle),f('phone',c.phone,'tel'),f('joinedDate',c.joinedDate,'date')]} onClose={() => setEditor(null)} onSave={v => { if (!manage) return false; db.addDepartmentMember({departmentId:current.id,name:s(v,'name'),roleTitle:s(v,'roleTitle'),phone:s(v,'phone'),joinedDate:s(v,'joinedDate')});return success(); }} />}
 {remove && manage && <Confirm title={c.remove} onClose={() => setRemove('')} onConfirm={() => { if(manage) {db.removeDepartmentMember(remove);toast.success(c.removed);} }} />}
 </div></RequirePerm>;
}
