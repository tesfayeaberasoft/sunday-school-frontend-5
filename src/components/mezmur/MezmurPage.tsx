import { useQuickDone, type Quick } from "@/components/quick/quick";
import { PageHeader } from "@/components/common/PageHeader";



import { useState, type ReactNode, type FormEvent } from "react";
import { toast } from "sonner";
import { useDb } from "@/stores/db";
import { useCan, useCurrentUser } from "@/hooks/use-session";
import { Records, type RecordRow } from "@/components/finance/ModuleUi";
import { Fab } from "@/components/common/Fab";
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
import { community as c } from "@/i18n/am/community";
import { matchesAny } from "@/lib/amharic-search";
import type { ArtsType, ArtsProgram } from "@/types/models";

const artsTypes: [string,string][] = [['drama',c.drama],['poem',c.poem],['mezmur',c.mezmur],['exhibition',c.exhibition]];
const artsStatuses: [string,string][] = [['planned',c.planned],['rehearsing',c.rehearsing],['done',c.done]];
const safeUrl = (url: string) => { try { return ['http:','https:'].includes(new URL(url).protocol); } catch {return false;} };
export function MezmurPage({quick}:{quick?:Quick}={}) {
 const db = useDb(); const manage = useCan('mezmur.manage');
 const [tab,setTab] = useState(quick?.action==='practice'?'practices':'library'); const [query,setQuery] = useState(''); const [category,setCategory] = useState(''); const [editor,setEditor] = useState<string|null>(quick&&quick.action!=='browse'?'new':null); const [view,setView] = useState(''); const [browsing,setBrowsing] = useState(quick?.action==='browse');
 useQuickDone(quick, !!editor || !!view || browsing);
 const allowed = db.mezmurs.filter(m => manage || m.published);
 const songs = allowed.filter(m => matchesAny([m.title,m.author,m.lyrics],query) && (!category || m.category === category));
 const currentSong = allowed.find(m => m.id === editor);
 const currentArts = db.artsPrograms.find(p => p.id === editor);
 const viewed = allowed.find(m => m.id === view);
 const categories: [string,string][] = [...new Set(allowed.map(m => m.category))].map(x => [x,x]);
 const songFields: Spec[] = [f('title',c.titleLabel),f('category',c.category),f('lyrics',c.lyrics,'textarea'),f('author',c.author),f('audioUrl',c.audioUrl,'url',true),f('videoUrl',c.videoUrl,'url',true),{key:'published',label:c.status,options:[['true',c.published],['false',c.draft]]}];
 const practiceFields: Spec[] = [f('title',c.titleLabel),f('date',c.date,'date'),f('startTime',c.startTime,'time'),f('endTime',c.endTime,'time'),f('location',c.location),f('trainer',c.trainer),{key:'mezmurIds',label:c.mezmurIds,type:'multi',optional:true,options:allowed.map(m => [m.id,m.title])}];
 const artsFields: Spec[] = [f('title',c.titleLabel),{key:'type',label:c.type,options:artsTypes},f('date',c.date,'date'),f('description',c.description,'textarea'),{key:'status',label:c.status,options:artsStatuses}];
 return <RequirePerm perm="mezmur.view"><div className="min-w-0 space-y-4">{!quick && <>{manage && <Fab label={c.add} onClick={() => setEditor('new')}/>}<PageHeader title={c.mezmur} description={c.mezmurHint} actions={manage && <Button className="tap" onClick={() => setEditor('new')}>{c.add}</Button>} /><Tabs value={tab} onChange={value => {setTab(value);setEditor(null);setQuery('');}} options={[[ 'library',c.library],['practices',c.practices],['arts',c.arts]]} /><SearchInput value={query} onChange={setQuery} />
 {tab === 'library' && <><Filter label={c.category} value={category} onChange={setCategory} options={categories} /><Panel title={c.library}><DataList headers={[c.titleLabel,c.category,c.author,c.status,c.actions]} rows={songs.map(m => ({id:m.id,onOpen:()=>setView(m.id),cells:[m.title,m.category,m.author,<StatusBadge label={m.published ? c.published : c.draft} tone={m.published ? 'success':'muted'} />,<div className="flex flex-wrap gap-2"><Button className="tap" variant="outline" onClick={() => setView(m.id)}>{c.lyrics}</Button>{manage && <Button className="tap" variant="outline" onClick={() => setEditor(m.id)}>{c.edit}</Button>}</div>]}))} /></Panel></>}
 {tab === 'practices' && <Panel title={c.practices}><DataList headers={[c.titleLabel,c.date,c.location,c.trainer,c.mezmurIds]} rows={db.practiceSchedules.filter(p => matchesAny([p.title,p.trainer,p.location],query)).slice().sort((a,b) => b.date.localeCompare(a.date)).map(p => ({id:p.id,cells:[p.title,<><DateText iso={p.date} /><p>{p.startTime} — {p.endTime}</p></>,p.location,p.trainer,p.mezmurIds.map(id => allowed.find(m => m.id === id)?.title).filter(Boolean).join('፣ ')]}))} /></Panel>}
 {tab === 'arts' && <Panel title={c.arts}><DataList list={[0,1,2,4]} headers={[c.titleLabel,c.type,c.date,c.description,c.status,c.actions]} rows={db.artsPrograms.filter(p => matchesAny([p.title,p.description],query)).map(p => ({id:p.id,cells:[p.title,artsTypes.find(([id]) => id === p.type)?.[1],<DateText iso={p.date} />,p.description,<StatusBadge status={p.status} />,manage ? <Button className="tap" variant="outline" onClick={() => setEditor(p.id)}>{c.edit}</Button> : '—']}))} /></Panel>}</>}
 {browsing && <Dialog open onOpenChange={o => {if(!o)setBrowsing(false);}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto"><DialogHeader><DialogTitle>{c.library}</DialogTitle><DialogDescription>{c.pickSong}</DialogDescription></DialogHeader>{allowed.length ? <ul className="space-y-2">{allowed.map(m => <li key={m.id}><button type="button" className="tap press flex w-full min-w-0 items-center gap-3 rounded-xl border bg-card p-3 text-start hover:border-brand/40" onClick={() => {setView(m.id);setBrowsing(false);}}><span className="min-w-0 flex-1"><span className="block truncate font-medium text-navy">{m.title}</span><span className="block truncate text-xs text-muted-foreground">{m.category} · {m.author}</span></span></button></li>)}</ul> : <EmptyState title={c.none} />}</DialogContent></Dialog>}
 {viewed && <Dialog open onOpenChange={open => {if(!open)setView('');}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto [&>button]:hidden"><DialogHeader><DialogTitle>{viewed.title}</DialogTitle><DialogDescription>{viewed.category} — {viewed.author}</DialogDescription></DialogHeader><p className="whitespace-pre-wrap break-words">{viewed.lyrics}</p><div className="flex flex-wrap gap-3">{viewed.audioUrl && safeUrl(viewed.audioUrl) && <a className="tap inline-flex items-center rounded-xl border px-4 text-brand" href={viewed.audioUrl} target="_blank" rel="noopener noreferrer">{c.audioUrl}</a>}{viewed.videoUrl && safeUrl(viewed.videoUrl) && <a className="tap inline-flex items-center rounded-xl border px-4 text-brand" href={viewed.videoUrl} target="_blank" rel="noopener noreferrer">{c.videoUrl}</a>}</div><div className="flex flex-wrap gap-2 border-t pt-4">{manage && <Button className="tap" onClick={() => {setTab('library');setEditor(viewed.id);setView('');}}>{c.edit}</Button>}<Button className="tap" variant="outline" onClick={() => setView('')}>{c.close}</Button></div></DialogContent></Dialog>}
 {editor && manage && <Editor key={`${tab}-${editor}`} title={editor === 'new' ? quick?.title ?? c.add : c.edit} hint={tab === 'library' ? c.safeUrl : c.description} initial={tab === 'library' ? (currentSong ? {title:currentSong.title,category:currentSong.category,lyrics:currentSong.lyrics,author:currentSong.author,audioUrl:currentSong.audioUrl ?? '',videoUrl:currentSong.videoUrl ?? '',published:String(currentSong.published)} : {title:'',category:'',lyrics:'',author:'',audioUrl:'',videoUrl:'',published:'false'}) : tab === 'practices' ? {title:'',date:todayIso(),startTime:'09:00',endTime:'10:00',location:'',trainer:'',mezmurIds:''} : currentArts ? {title:currentArts.title,type:currentArts.type,date:currentArts.date,description:currentArts.description,status:currentArts.status} : {title:'',type:'drama',date:todayIso(),description:'',status:'planned'}} fields={tab === 'library' ? songFields : tab === 'practices' ? practiceFields : artsFields} onClose={() => setEditor(null)} onSave={v => {
 if(!manage)return false;
 if(tab === 'library') {if (['audioUrl','videoUrl'].some(key => s(v,key) && !safeUrl(s(v,key)))){toast.error(c.safeUrl);return false;} const input={title:s(v,'title'),category:s(v,'category'),lyrics:s(v,'lyrics'),author:s(v,'author'),audioUrl:s(v,'audioUrl'),videoUrl:s(v,'videoUrl'),published:s(v,'published')==='true'}; if(currentSong)db.updateMezmur(currentSong.id,input);else db.addMezmur(input);}
 else if(tab === 'practices') {if(s(v,'startTime') >= s(v,'endTime')){toast.error(c.invalid);return false;}db.addPractice({title:s(v,'title'),date:s(v,'date'),startTime:s(v,'startTime'),endTime:s(v,'endTime'),location:s(v,'location'),trainer:s(v,'trainer'),mezmurIds:s(v,'mezmurIds').split(',').filter(id => allowed.some(m => m.id === id))});}
 else {const input={title:s(v,'title'),type:s(v,'type') as ArtsType,date:s(v,'date'),description:s(v,'description'),status:s(v,'status') as ArtsProgram['status']};if(currentArts)db.updateArtsProgram(currentArts.id,input);else db.addArtsProgram(input);}return success();
 }} />}
 </div></RequirePerm>;
}
