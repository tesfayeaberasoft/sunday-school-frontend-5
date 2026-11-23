import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "ሪፖርቶች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { name: "description", content: "የአስተዳደርና የፋይናንስ ሪፖርቶች" },
      { property: "og:title", content: "ሪፖርቶች — ቅዱስ ሚካአል ሰንበት ትምህርት ቤት" },
      { property: "og:description", content: "የአስተዳደርና የፋይናንስ ሪፖርቶች" },
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
import { summarize } from "@/lib/rules/attendance";
import { countsTowardBalance } from "@/lib/rules/finance";
import { availableQuantity, issuedNotReturned } from "@/lib/rules/assets";

type ReportRow = {id:string; name:string; values:(string|number)[]; chart:number};
function Page() {
 const db=useDb(); const user=useCurrentUser(); const fd=useFormatDate();
 const attendance=useCan('attendance.view'); const finance=useCan('finance.view'); const assets=useCan('assets.view'); const students=useCan('students.view');
 const options: [string,string][] = [...(attendance ? [['attendance',c.attendance] as [string,string]]:[]),...(finance ? [['finance',c.finance] as [string,string]]:[]),...(assets ? [['assets',c.assets] as [string,string]]:[]),...(students ? [['students',c.students] as [string,string]]:[])];
 const [selected,setSelected]=useState('attendance'); const tab=options.some(([id])=>id===selected) ? selected : options[0]?.[0] ?? '';
 const [from,setFrom]=useState(''); const [to,setTo]=useState(''); const [classId,setClassId]=useState(''); const [yearId,setYearId]=useState(''); const [accountId,setAccountId]=useState(''); const [categoryId,setCategoryId]=useState('');
 const rangeOk=!from || !to || from <= to;
 const inRange=(date:string) => rangeOk && (!from || date >= from) && (!to || date <= to);
 let headers:string[]=[];let rows:ReportRow[]=[];let hint='';
 if(tab==='attendance') {
 headers=[c.classId,c.present,c.absent,c.late,c.total,c.percent];
 rows=db.classes.filter(cl=>(!classId || cl.id===classId) && (!yearId || cl.academicYearId===yearId)).flatMap(cl=>{ const sessions=db.attendanceSessions.filter(a=>a.classId===cl.id && (!yearId || a.academicYearId===yearId) && inRange(a.date)); if(!sessions.length)return [];const summary=summarize(sessions.flatMap(a=>a.records.map(r=>r.status)));return [{id:cl.id,name:cl.name,values:[cl.name,summary.present,summary.absent,summary.late,summary.total,Number(summary.percent.toFixed(1))],chart:summary.percent}]; });
 } else if(tab==='finance') {
 headers=[c.category,c.income,c.expense,c.net];hint=c.financeNote;
 const groups=new Map<string,{income:number;expense:number}>();
 db.transactions.filter(tx=>countsTowardBalance(tx) && inRange(tx.date) && (!accountId || tx.accountId===accountId)).forEach(tx=>{
 const original=tx.originalTransactionId ? db.transactions.find(x=>x.id===tx.originalTransactionId) : tx;
 const kind=original?.type;
 if(kind!=='Income' && kind!=='Expense')return;
 const key=tx.categoryId ?? original?.categoryId ?? '';
 const group=groups.get(key) ?? {income:0,expense:0};
 if(kind==='Income') group.income+=tx.effect*tx.amount;else group.expense-=tx.effect*tx.amount;
 groups.set(key,group);
 });
 rows=[...groups].map(([id,g])=>{const name=db.financeCategories.find(c=>c.id===id)?.name ?? c.none;return {id,name,values:[name,g.income,g.expense,g.income-g.expense],chart:g.income-g.expense};});
 } else if(tab==='assets') {
 headers=[c.name,c.quantity,c.damaged,c.issued,c.available,c.value];hint=c.assetNote;
 rows=db.assets.filter(a=>!categoryId || a.categoryId===categoryId).map(a=>({id:a.id,name:a.name,values:[a.name,a.totalQuantity,a.damagedQuantity,issuedNotReturned(a.id,db.assetIssues),availableQuantity(a,db.assetIssues),a.totalQuantity*a.unitValue],chart:a.totalQuantity}));
 } else if(tab==='students') {
 headers=[c.classId,c.male,c.female,c.total];hint=c.studentNote;
 rows=db.classes.filter(cl=>(!classId || cl.id===classId) && (!yearId || cl.academicYearId===yearId)).flatMap(cl=>{
 const list=db.students.filter(st=>inRange(st.joinDate) && (yearId ? st.enrollments.some(e=>e.academicYearId===yearId && e.classId===cl.id) : st.classId===cl.id));
 return list.length ? [{id:cl.id,name:cl.name,values:[cl.name,list.filter(st=>st.gender==='M').length,list.filter(st=>st.gender==='F').length,list.length],chart:list.length}] : [];
 });
 }
 const total=rows.reduce((sum,row)=>sum+row.chart,0);const max=Math.max(1,...rows.map(row=>Math.abs(row.chart)));
 const display=(value:string|number,index:number) => typeof value==='number' && ((tab==='finance' && index>0) || (tab==='assets' && index===5)) ? formatETB(value) : value;
 const exportRows=()=>{if(!tab || !rangeOk || !rows.length)return;const safe=(v:string|number)=>typeof v==='string' && /^[\s]*[=+@\-]/.test(v) ? `'${v}` : v;downloadCsv(options.find(([id])=>id===tab)?.[1] ?? c.reports,[...headers,c.from,c.to,c.yearId],rows.map(row=>[...row.values.map(safe),tab==='assets'?'—':fd(from),tab==='assets'?'—':fd(to),db.academicYears.find(y=>y.id===yearId)?.name ?? c.all]));toast.success(c.exported);};
 return <RequirePerm perm="reports.view"><div className="min-w-0 space-y-4"><PageHeader title={c.reports} description={c.reportsHint} actions={<Button className="tap" disabled={!rows.length || !rangeOk} onClick={exportRows}>{c.exportCsv}</Button>} /><Tabs value={tab} options={options} onChange={setSelected} />{!tab ? <EmptyState title={c.noAccess} hint="" /> : <><Panel title={c.type}><div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">{tab!=='assets' && <><Field label={c.from}><DateField value={from} onChange={setFrom} /></Field><Field label={c.to}><DateField value={to} onChange={setTo} /></Field></>}{(tab==='attendance'||tab==='students') && <><Filter label={c.yearId} value={yearId} onChange={v=>{setYearId(v);setClassId('');}} options={db.academicYears.map(y=>[y.id,y.name])} /><Filter label={c.classId} value={classId} onChange={setClassId} options={db.classes.filter(cl=>!yearId||cl.academicYearId===yearId).map(cl=>[cl.id,cl.name])} /></>}{tab==='finance' && <Filter label={c.accountId} value={accountId} onChange={setAccountId} options={db.accounts.map(a=>[a.id,a.name])} />}{tab==='assets' && <Filter label={c.category} value={categoryId} onChange={setCategoryId} options={db.assetCategories.map(a=>[a.id,a.name])} />}<Button variant="outline" className="tap self-end" onClick={()=>{setFrom('');setTo('');setYearId('');setClassId('');setAccountId('');setCategoryId('');}}>{c.clear}</Button></div>{!rangeOk && <p className="mt-3 text-sm text-destructive" role="alert">{c.invalid}</p>}</Panel><Panel title={c.chart} description={hint}><div className="space-y-3" role="img" aria-label={`${c.chart}: ${rows.map(row=>`${row.name} ${row.chart}`).join('፣ ')}`}>{rows.length ? rows.map(row=><div key={row.id} className="min-w-0"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="break-words">{row.name}</span><span>{tab==='finance' ? formatETB(row.chart) : `${Number(row.chart.toFixed(1))}${tab==='attendance'?'%':''}`}</span></div><div className="mt-1 h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${row.chart<0 ? ACCENT.destructive.solid : ACCENT.brand.solid}`} style={{width:`${Math.abs(row.chart)/max*100}%`}} /></div></div>) : <EmptyState title={c.none} hint={c.emptyHint} />}</div></Panel><Panel title={options.find(([id])=>id===tab)?.[1]}><DataList headers={headers} rows={rows.map(row=>({id:row.id,cells:row.values.map(display)}))} /></Panel></>}</div></RequirePerm>;
}
