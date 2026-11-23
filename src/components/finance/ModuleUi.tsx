import { isValidElement, useId, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { rowOpen } from '@/components/common/clickable';
import { Field } from '@/components/common/Field';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/common/AdaptiveDialog';
import { finance as f } from '@/i18n/am/finance';
import { t } from '@/i18n';
import { admin } from '@/i18n/am/admin';
import { community } from '@/i18n/am/community';
import { cn } from '@/lib/utils';

export const selectClass = 'tap min-h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm transition-colors focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

export function Text({label, value, onChange, type='text', required=false, min, step}: {label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean;min?:number;step?:string}) { const id=useId(); return <Field label={label} htmlFor={id}><Input id={id} className="tap min-h-11" value={value} onChange={e=>onChange(e.target.value)} type={type} required={required} {...(min===undefined?{}:{min})} {...(step===undefined?{}:{step})}/></Field>; }
export function Pick({label,value,onChange,options,optional=false}: {label:string;value:string;onChange:(v:string)=>void;options:readonly {id:string;name:string}[];optional?:boolean}) {const id=useId();return <Field label={label} htmlFor={id}><select id={id} className={selectClass} value={value} onChange={e=>onChange(e.target.value)} required={!optional}><option value="">{optional?f.all:f.choose}</option>{options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></Field>;}
export function Action({children,onClick,disabled=false}: {children:ReactNode;onClick:()=>void;disabled?:boolean}) {return <Button type="button" variant="outline" className="tap min-h-11 whitespace-normal" onClick={onClick} disabled={disabled}>{children}</Button>;}

/** Create/edit form: centered modal on tablet/desktop, bottom sheet on phones. */
export function Editor({title,close,submit,busy,children}: {title:string;close:()=>void;submit:()=>Promise<void>|void;busy:boolean;children:ReactNode}) {
 return <Dialog open onOpenChange={v=>{if(!v&&!busy)close();}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{f.formHint}</DialogDescription></DialogHeader>
 <form className="space-y-4" onSubmit={e=>{e.preventDefault();if(!busy)void submit();}}>{children}
 <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t bg-card px-4 py-3 md:static md:mx-0 md:justify-end md:border-0 md:p-0"><Button type="button" variant="outline" className="tap min-h-11 flex-1 md:flex-none" disabled={busy} onClick={close}>{f.cancel}</Button><Button className="tap min-h-11 flex-1 md:flex-none" disabled={busy}>{busy?f.saving:f.save}</Button></div></form></DialogContent></Dialog>;
}

/** Active/idle styles for module tab pills (horizontal scroll on phones). */
export function TabPills<T extends string>({tabs,value,onChange,label,labels}: {tabs:readonly T[];value:T;onChange:(v:T)=>void;label:string;labels:Record<T,string>}) {
 return <nav className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" aria-label={label}>{tabs.map(tab=><button key={tab} type="button" className={cn('tap press min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors',tab===value?'border-primary bg-primary text-primary-foreground shadow-glow':'border-border bg-card text-navy hover:border-border-warm hover:bg-accent')} aria-current={tab===value?'page':undefined} onClick={()=>onChange(tab)}>{labels[tab]}</button>)}</nav>;
}

export type RecordRow = {
 id: string;
 cells: ReactNode[];
 /** Custom detail for this row; default is the built-in detail modal. */
 onOpen?: () => void;
 /** Shorter cell content for the compact row (by header index); the detail modal keeps the full cell. */
 brief?: Partial<Record<number, ReactNode>>;
};

/**
 * Responsive record list: a table on tablet/desktop, compact touch cards on phones.
 * Rows stay scannable: only the `list` columns (header indices, default the first 4) are shown,
 * and the "actions" column never appears inline. Clicking a row opens its detail modal
 * (row.onOpen, or a built-in modal with every field and the row's actions).
 */
export function Records({headers,rows,emptyTitle,emptyHint,detail=true,list}: {headers:string[];rows:RecordRow[];emptyTitle?:string;emptyHint?:string;detail?:boolean;list?:number[]}) {
 const [openId,setOpenId]=useState<string|null>(null);
 if(!rows.length)return <EmptyState {...(emptyTitle?{title:emptyTitle}:{})} {...(emptyHint?{hint:emptyHint}:{})}/>;
 const last=headers.length-1;const hasActions=last>0&&ACTION_HEADERS.includes(headers[last]??'');
 const opener=(r:RecordRow)=>r.onOpen??(detail?()=>setOpenId(r.id):undefined);
 const cols=(list??headers.map((_,i)=>i).filter(i=>!(hasActions&&i===last)).slice(0,4)).filter(i=>i>=0&&i<headers.length&&!(hasActions&&i===last));
 // actions stay inline only for rows that cannot open a detail modal
 const inlineActions=hasActions&&rows.some(r=>!opener(r));
 const cell=(r:RecordRow,i:number)=>r.brief?.[i]??r.cells[i];
 const current=rows.find(r=>r.id===openId);
 return <><ul className="space-y-2.5 md:hidden">{rows.map(r=>{const [head,...rest]=cols;const open=opener(r);const action=inlineActions&&!open?r.cells[last]:null;return <li key={r.id} {...(open?rowOpen(open):{})} className={cn('min-w-0 rounded-2xl border bg-card p-3.5 shadow-card',open&&'row-click hover:border-brand/40')}>
  <div className="flex min-w-0 items-start gap-2"><div className="line-clamp-2 min-w-0 flex-1 break-words font-semibold text-navy [overflow-wrap:anywhere]">{head===undefined?null:cell(r,head)}</div>{open&&<ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden/>}</div>
  {rest.length>0&&<dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">{rest.map(i=>{const c=cell(r,i);return <div key={i} className="min-w-0"><dt className="truncate text-[11px] font-medium text-muted-foreground">{headers[i]}</dt><dd className="line-clamp-2 min-w-0 break-words text-sm text-navy [overflow-wrap:anywhere]">{filled(c)?c:'—'}</dd></div>;})}</dl>}
  {filled(action)&&<div className="mt-3 border-t pt-3 [&_button]:flex-1">{action}</div>}
 </li>;})}</ul>
 <div className="hidden overflow-hidden rounded-xl border md:block"><table className="w-full table-fixed text-left text-sm"><thead><tr>{cols.map(i=><th key={i} className="break-words p-3 text-xs font-semibold">{headers[i]}</th>)}{inlineActions&&<th className="p-3 text-xs font-semibold">{headers[last]}</th>}<th className="w-10" aria-hidden/></tr></thead><tbody>{rows.map(r=>{const open=opener(r);return <tr key={r.id} {...(open?rowOpen(open):{})} className={cn('border-t transition-colors',open&&'row-click')}>{cols.map(i=><td key={i} className="p-3 align-middle"><div className="line-clamp-2 break-words [overflow-wrap:anywhere]">{cell(r,i)}</div></td>)}{inlineActions&&<td className="p-3 align-middle">{open?null:r.cells[last]}</td>}<td className="w-10 pr-3 text-right align-middle">{open&&<ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden/>}</td></tr>;})}</tbody></table></div>
 {current&&!current.onOpen&&<RecordDetail headers={headers} row={current} hasActions={hasActions} onClose={()=>setOpenId(null)}/>}</>;
}

const ACTION_HEADERS=[t.labels.actions,admin.actions,community.actions];
const filled=(c:ReactNode)=>c!==null&&c!==undefined&&c!==false&&c!=='';

/** Built-in detail modal: every column as a labelled field, the row's actions underneath. */
function RecordDetail({headers,row,hasActions,onClose}:{headers:string[];row:RecordRow;hasActions:boolean;onClose:()=>void}) {
 const last=headers.length-1;const fields=hasActions?row.cells.slice(0,-1):row.cells;const action=hasActions?row.cells[last]:null;
 return <Dialog open onOpenChange={v=>{if(!v)onClose();}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle className="break-words [overflow-wrap:anywhere]">{row.cells[0]}</DialogTitle><DialogDescription>{t.detail.hint}</DialogDescription></DialogHeader>
 <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{fields.map((c,i)=><div key={i} className="min-w-0 rounded-xl bg-muted/60 p-3"><dt className="text-[11px] font-medium text-muted-foreground">{headers[i]}</dt><dd className="mt-0.5 min-w-0 break-words text-sm text-navy [overflow-wrap:anywhere]">{filled(c)?c:'—'}</dd></div>)}</dl>
 {filled(action)&&action!=='—'&&<div className="mt-5 flex flex-wrap gap-2 border-t pt-4" onClick={e=>{if((e.target as HTMLElement).closest('button'))onClose();}}>{action}</div>}
 </DialogContent></Dialog>;
}
