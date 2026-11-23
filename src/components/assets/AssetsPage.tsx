import { useState } from 'react';
import { Boxes, PackageCheck, PackageMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useDb, type Result } from '@/stores/db';
import { useCan } from '@/hooks/use-session';
import { RequirePerm } from '@/components/common/RequirePerm';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { StatCard } from '@/components/common/StatCard';
import { Field } from '@/components/common/Field';
import { DateField } from '@/components/common/DateField';
import { DateText } from '@/components/common/DateText';
import { SearchInput } from '@/components/common/SearchInput';
import { formatETB } from '@/lib/format';
import { todayIso } from '@/lib/ethiopian-calendar';
import { availableQuantity, issuedNotReturned, outstandingQuantity, validateReturn, allocatableForEvent } from '@/lib/rules/assets';
import { matchesAny } from '@/lib/amharic-search';
import { submitOrQueue } from '@/lib/sync-queue';
import { downloadCsv } from '@/lib/export';
import { assets as a } from '@/i18n/am/assets';
import { finance as f } from '@/i18n/am/finance';
import type { AssetCondition } from '@/types/models';
import { Action, Editor, Pick, Records, TabPills, Text } from '@/components/finance/ModuleUi';
import { Fab } from '@/components/common/Fab';
import { FilterBar } from '@/components/common/FilterBar';
import { EmptyState } from '@/components/common/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/common/AdaptiveDialog';
import { useQuickDone, type Quick } from '@/components/quick/quick';

type Tab='inventory'|'categories'|'issues'|'maintenance'|'allocations'|'history';
type Mode='add'|'addCategory'|'issue'|'return'|'damage'|'missing'|'schedule'|'complete'|'allocate'|'remove';
const whole=(v:string,min=1)=>v.trim()!==''&&Number.isSafeInteger(Number(v))&&Number(v)>=min;
export function AssetsPage({quick}:{quick?:Quick}={}){return <RequirePerm perm="assets.view"><AssetsBody {...(quick?{quick}:{})}/></RequirePerm>;}
function AssetsBody({quick}:{quick?:Quick}){
 const db=useDb(),manage=useCan('assets.manage');
 const [tab,setTab]=useState<Tab>('inventory'),[query,setQuery]=useState(''),[category,setCategory]=useState(''),[assetFilter,setAssetFilter]=useState('');
 const [modal,setModal]=useState<{mode:Mode;id?:string}|null>(quick&&quick.action!=='returnPick'?{mode:quick.action as Mode}:null),[v,setV]=useState<Record<string,string>>(()=>{const id=undefined as string|undefined;return quick?{assetId:id??'',date:todayIso(),dueDate:todayIso(),condition:'good',recipientType:'student',quantity:'1',damaged:'0',missing:'0',returned:'0',total:'1',initialDamage:'0',value:'0',cost:'0'}:{};}),[picking,setPicking]=useState(quick?.action==='returnPick'),[busy,setBusy]=useState(false);
 useQuickDone(quick,!!modal||picking);
 const get=(k:string)=>v[k]??'';const put=(k:string,value:string)=>setV(s=>({...s,[k]:value}));
 const open=(mode:Mode,id?:string)=>{setV({assetId:id??'',date:todayIso(),dueDate:todayIso(),condition:'good',recipientType:'student',quantity:'1',damaged:'0',missing:'0',returned:'0',total:'1',initialDamage:'0',value:'0',cost:'0'});setModal({mode,...(id?{id}:{})});};
 const assets=db.assets.filter(x=>(!category||x.categoryId===category)&&(!assetFilter||x.id===assetFilter)&&matchesAny([x.name,x.code,x.location],query));
 const visible=new Set(assets.map(x=>x.id));const assetName=(id:string)=>db.assets.find(x=>x.id===id)?.name??'—';
 const eventName=(id:string)=>db.events.find(e=>e.id===id)?.title??'—';
 const selected=db.assets.find(x=>x.id===get('assetId'));const issue=modal?.mode==='return'?db.assetIssues.find(i=>i.id===modal.id):undefined;
 const offline=()=>{if(typeof navigator!=='undefined'&&!navigator.onLine){toast.error(a.offline);return true;}return false;};
 const success=(r:Result<unknown>)=>{if(!r.ok){toast.error(r.error);return false;}toast.success(f.saved);return true;};
 const submit=async()=>{
  if(!modal||busy)return;if(!manage){toast.error(f.noPermission);return;}if(!['issue','return'].includes(modal.mode)&&offline())return;
  setBusy(true);try{const s=useDb.getState(),m=modal.mode,q=Number(get('quantity'));let r:Result<unknown>|undefined;
   const asset=s.assets.find(x=>x.id===get('assetId'));
   if(['issue','damage','missing','schedule','allocate'].includes(m)&&(!asset||!whole(get('quantity'))))throw Error(a.invalid);
   if(m==='add'){
    if(!get('name').trim()||!s.assetCategories.some(c=>c.id===get('categoryId'))||!whole(get('total'))||!whole(get('initialDamage'),0)||Number(get('initialDamage'))>Number(get('total'))||!Number.isFinite(Number(get('value')))||Number(get('value'))<0||!get('date')||!get('location').trim())throw Error(a.invalid);
    s.addAsset({name:get('name').trim(),categoryId:get('categoryId'),totalQuantity:Number(get('total')),damagedQuantity:Number(get('initialDamage')),condition:get('condition') as AssetCondition,location:get('location').trim(),unitValue:Number(get('value')),acquiredDate:get('date'),notes:get('note')});
   }else if(m==='addCategory'){
    if(!get('name').trim())throw Error(a.invalid);s.addAssetCategory({name:get('name').trim(),color:'teal'});
   }else if(m==='issue'){
    const student=s.students.find(x=>x.id===get('recipientId'));
    const recipientName=get('recipientType')==='student'?student?.fullName:get('recipientName').trim();
    if(!recipientName||!get('date')||!get('dueDate')||get('dueDate')<get('date')||q>availableQuantity(asset!,s.assetIssues))throw Error(a.invalid);
    const outcome=await submitOrQueue({kind:'asset_issue',data:{assetId:asset!.id,quantity:q,recipientName,recipientType:get('recipientType')==='student'?'student':'member',...(get('recipientType')==='student'?{recipientId:get('recipientId')}:{}),issueDate:get('date'),dueDate:get('dueDate'),...(get('eventId')?{eventId:get('eventId')}:{}),note:get('note')}},a.issue);
    if(!outcome.ok)throw Error(outcome.error);toast.success(outcome.queued?a.queued:f.saved);setModal(null);return;
   }else if(m==='return'){
    const current=s.assetIssues.find(i=>i.id===modal.id);const input={returned:Number(get('returned')),damaged:Number(get('damaged')),missing:Number(get('missing'))};
    if(!current||!['returned','damaged','missing'].every(k=>whole(get(k),0))||validateReturn(current,input))throw Error(a.invalid);
    const outcome=await submitOrQueue({kind:'asset_return',data:{issueId:current.id,input}},a.return);
    if(!outcome.ok)throw Error(outcome.error);toast.success(outcome.queued?a.queued:f.saved);setModal(null);return;
   }else if(m==='damage'||m==='missing'){
    if(!get('note').trim())throw Error(a.invalid);r=m==='damage'?s.recordDamage(asset!.id,q,get('note').trim()):s.recordMissing(asset!.id,q,get('note').trim());
   }else if(m==='schedule'){
    const reserved=s.assetMaintenance.filter(x=>x.assetId===asset!.id&&x.status==='in_progress').reduce((n,x)=>n+x.quantity,0);
    if(q>asset!.damagedQuantity-reserved||!get('note').trim()||!get('vendor').trim()||!get('date')||!Number.isFinite(Number(get('cost')))||Number(get('cost'))<0)throw Error(a.invalid);
    r=s.addMaintenance({assetId:asset!.id,quantity:q,description:get('note').trim(),cost:Number(get('cost')),date:get('date'),vendor:get('vendor').trim()});
   }else if(m==='complete'){
    const maintenance=s.assetMaintenance.find(x=>x.id===modal.id);if(!maintenance||maintenance.status!=='in_progress')throw Error(a.invalid);s.completeMaintenance(maintenance.id);
   }else if(m==='allocate'){
    if(!s.events.some(e=>e.id===get('eventId'))||q>allocatableForEvent(asset!,s.assetIssues,s.eventAllocations,s.events,get('eventId')))throw Error(a.invalid);
    r=s.allocateToEvent(get('eventId'),asset!.id,q);
   }else if(m==='remove'){
    if(!modal.id||!s.eventAllocations.some(x=>x.id===modal.id))throw Error(a.invalid);s.removeAllocation(modal.id);
   }
   if(r){if(!success(r))return;}else toast.success(f.saved);setModal(null);
  }catch(e){toast.error(e instanceof Error?e.message:f.error);}finally{setBusy(false);}
 };
 const text=(key:string,label:string,type='text',required=true)=><Text label={label} value={get(key)} onChange={x=>put(key,x)} type={type} required={required} {...(type==='number'?{min:0,step:['value','cost'].includes(key)?'0.01':'1'}:{})}/>;
 const pick=(key:string,label:string,items:{id:string;name:string}[],optional=false)=><Pick label={label} value={get(key)} onChange={x=>put(key,x)} options={items} optional={optional}/>;
 const date=(key:string,label:string)=><Field label={label}><DateField value={get(key)} onChange={x=>put(key,x)}/></Field>;
 const exportAssets=()=>downloadCsv(a.inventory,[a.code,a.name,a.total,a.damaged,a.issued,a.available,a.location],assets.map(x=>[x.code,/^[=+\-@]/.test(x.name)?`'${x.name}`:x.name,x.totalQuantity,x.damagedQuantity,issuedNotReturned(x.id,db.assetIssues),availableQuantity(x,db.assetIssues),/^[=+\-@]/.test(x.location)?`'${x.location}`:x.location]));
 return <div className="min-w-0 space-y-4">{!quick&&<><PageHeader title={a.title} description={a.description} icon={Boxes} accent="orange" actions={<><Action onClick={exportAssets}>{f.export}</Action>{manage&&<Action onClick={()=>open('add')}>{a.add}</Action>}</>}/>
 <div className="grid gap-3 sm:grid-cols-3"><StatCard label={a.total} value={assets.reduce((n,x)=>n+x.totalQuantity,0)} icon={Boxes} accent="orange"/><StatCard label={a.available} value={assets.reduce((n,x)=>n+availableQuantity(x,db.assetIssues),0)} icon={PackageCheck} accent="success"/><StatCard label={a.issued} value={assets.reduce((n,x)=>n+issuedNotReturned(x.id,db.assetIssues),0)} icon={PackageMinus} accent="gold"/></div>
 <TabPills tabs={['inventory','categories','issues','maintenance','allocations','history'] as const} value={tab} onChange={setTab} label={a.title} labels={a}/>{manage&&<Fab label={a.add} onClick={()=>open('add')}/>}
 <FilterBar summary={query||undefined}><div className="grid gap-3 sm:grid-cols-3"><SearchInput value={query} onChange={setQuery}/><Pick label={a.category} value={category} onChange={setCategory} options={db.assetCategories} optional/><Pick label={a.asset} value={assetFilter} onChange={setAssetFilter} options={db.assets} optional/></div></FilterBar>
 {tab==='inventory'&&<Panel title={a.inventory} description={a.formula}><Records headers={[a.name,a.category,a.total,a.damaged,a.issued,a.available,a.actions]} list={[0,1,5,2]} rows={assets.map(x=>({id:x.id,brief:{0:x.name},cells:[<div>{x.name}<p className="text-xs text-muted-foreground">{x.code} · {a.conditions[x.condition]} · {x.location}</p><p className="text-xs">{formatETB(x.unitValue)} · <DateText iso={x.acquiredDate}/></p>{x.notes&&<p>{x.notes}</p>}</div>,db.assetCategories.find(c=>c.id===x.categoryId)?.name??'—',x.totalQuantity,x.damagedQuantity,issuedNotReturned(x.id,db.assetIssues),availableQuantity(x,db.assetIssues),manage?<div className="flex flex-wrap gap-1"><Action onClick={()=>open('issue',x.id)} disabled={availableQuantity(x,db.assetIssues)===0}>{a.issue}</Action><Action onClick={()=>open('damage',x.id)}>{a.damage}</Action><Action onClick={()=>open('missing',x.id)}>{a.missing}</Action><Action onClick={()=>open('schedule',x.id)} disabled={x.damagedQuantity===0}>{a.schedule}</Action><Action onClick={()=>open('allocate',x.id)}>{a.allocate}</Action></div>:null]}))}/></Panel>}
 {tab==='categories'&&<Panel title={a.categories} actions={manage&&<Action onClick={()=>open('addCategory')}>{a.addCategory}</Action>}><Records headers={[a.category,a.total]} rows={db.assetCategories.map(c=>({id:c.id,cells:[c.name,db.assets.filter(x=>x.categoryId===c.id).length]}))}/></Panel>}
 {tab==='issues'&&<Panel title={a.issues} actions={manage&&<Action onClick={()=>open('issue')}>{a.issue}</Action>}><Records headers={[a.asset,a.recipient,a.quantity,a.outstanding,a.status,a.actions]} list={[0,1,3,4]} rows={db.assetIssues.filter(i=>visible.has(i.assetId)).map(i=>({id:i.id,brief:{1:i.recipientName},cells:[assetName(i.assetId),<div>{i.recipientName}<p className="text-xs">{a.issueDate}: <DateText iso={i.issueDate}/></p><p className="text-xs">{a.dueDate}: <DateText iso={i.dueDate}/></p>{i.eventId&&<p>{eventName(i.eventId)}</p>}{i.note&&<p>{i.note}</p>}</div>,<div>{i.quantity}<p>{a.returned}: {i.returnedQuantity}</p><p>{a.damaged}: {i.damagedOnReturn}</p><p>{a.missingReturn}: {i.missingOnReturn}</p>{i.returnDate&&<DateText iso={i.returnDate}/>}</div>,outstandingQuantity(i),a.issueStatuses[i.status],manage&&outstandingQuantity(i)>0?<Action onClick={()=>open('return',i.id)}>{a.return}</Action>:null]}))}/></Panel>}
 {tab==='maintenance'&&<Panel title={a.maintenance} actions={manage&&<Action onClick={()=>open('schedule')}>{a.schedule}</Action>}><Records headers={[a.asset,a.quantity,a.details,a.cost,a.status,a.actions]} list={[0,1,3,4]} rows={db.assetMaintenance.filter(m=>visible.has(m.assetId)).map(m=>({id:m.id,cells:[assetName(m.assetId),m.quantity,<div>{m.description}<p>{m.vendor}</p><DateText iso={m.date}/></div>,formatETB(m.cost),m.status==='completed'?a.completed:a.inProgress,manage&&m.status==='in_progress'?<Action onClick={()=>open('complete',m.id)}>{a.complete}</Action>:null]}))}/></Panel>}
 {tab==='allocations'&&<Panel title={a.allocations} description={a.allocationHint} actions={manage&&<Action onClick={()=>open('allocate')}>{a.allocate}</Action>}><Records headers={[a.event,a.asset,a.quantity,a.actions]} rows={db.eventAllocations.filter(x=>visible.has(x.assetId)).map(x=>({id:x.id,brief:{0:eventName(x.eventId)},cells:[<div>{eventName(x.eventId)}<p className="text-xs"><DateText iso={db.events.find(e=>e.id===x.eventId)?.startDate}/> — <DateText iso={db.events.find(e=>e.id===x.eventId)?.endDate}/></p></div>,assetName(x.assetId),x.quantity,manage?<Action onClick={()=>open('remove',x.id)}>{a.remove}</Action>:null]}))}/></Panel>}
 {tab==='history'&&<Panel title={a.history}><Records headers={[a.date,a.asset,a.actions,a.by,a.details]} rows={db.auditLogs.filter(l=>l.module===a.title&&visible.has(l.entityId)).sort((x,y)=>y.createdAt.localeCompare(x.createdAt)).map(l=>({id:l.id,cells:[<DateText iso={l.createdAt}/>,assetName(l.entityId),l.action,l.userName,l.details]}))}/></Panel>}
 </>}
 {picking&&<Dialog open onOpenChange={o=>{if(!o)setPicking(false);}}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto"><DialogHeader><DialogTitle>{a.return}</DialogTitle><DialogDescription>{a.pickIssue}</DialogDescription></DialogHeader>{db.assetIssues.filter(i=>outstandingQuantity(i)>0).length?<ul className="space-y-2">{db.assetIssues.filter(i=>outstandingQuantity(i)>0).map(i=><li key={i.id}><button type="button" className="tap press flex w-full min-w-0 items-center gap-3 rounded-xl border bg-card p-3 text-start hover:border-brand/40" onClick={()=>{setPicking(false);open('return',i.id);}}><span className="min-w-0 flex-1"><span className="block truncate font-medium text-navy">{assetName(i.assetId)}</span><span className="block truncate text-xs text-muted-foreground">{i.recipientName} · {a.dueDate}: <DateText iso={i.dueDate}/></span></span><span className="text-xs font-semibold text-navy">{outstandingQuantity(i)}</span></button></li>)}</ul>:<EmptyState/>}</DialogContent></Dialog>}
 {modal&&<Editor title={quick?.title??a[modal.mode]} close={()=>setModal(null)} submit={submit} busy={busy}>
 {modal.mode==='add'&&<>{text('name',a.name)}{pick('categoryId',a.category,db.assetCategories)}{text('total',a.total,'number')}{text('initialDamage',a.damaged,'number')}{pick('condition',a.condition,Object.entries(a.conditions).map(([id,name])=>({id,name})))}{text('location',a.location)}{text('value',a.value,'number')}{date('date',a.acquired)}{text('note',a.note,'text',false)}</>}
 {modal.mode==='addCategory'&&text('name',a.name)}
 {['issue','damage','missing','schedule','allocate'].includes(modal.mode)&&<>{pick('assetId',a.asset,db.assets)}{selected&&<p className="text-sm text-muted-foreground">{a.available}: {availableQuantity(selected,db.assetIssues)} · {a.damaged}: {selected.damagedQuantity}</p>}{text('quantity',a.quantity,'number')}</>}
 {modal.mode==='issue'&&<>{pick('recipientType',a.recipientType,[{id:'student',name:a.student},{id:'member',name:a.member}])}{get('recipientType')==='student'?pick('recipientId',a.student,db.students.filter(s=>s.status==='active').map(s=>({id:s.id,name:s.fullName}))):text('recipientName',a.recipient)}{date('date',a.issueDate)}{date('dueDate',a.dueDate)}{pick('eventId',a.event,db.events.map(e=>({id:e.id,name:e.title})),true)}{text('note',a.note,'text',false)}</>}
 {modal.mode==='return'&&<><p>{issue&&`${assetName(issue.assetId)} — ${issue.recipientName} · ${a.outstanding}: ${outstandingQuantity(issue)}`}</p>{text('returned',a.returned,'number')}{text('damaged',a.damagedReturn,'number')}{text('missing',a.missingReturn,'number')}</>}
 {['damage','missing'].includes(modal.mode)&&text('note',a.reason)}
 {modal.mode==='schedule'&&<>{text('note',a.details)}{text('vendor',a.vendor)}{text('cost',a.cost,'number')}{date('date',a.date)}</>}
 {modal.mode==='allocate'&&<>{pick('eventId',a.event,db.events.filter(e=>e.status!=='completed').map(e=>({id:e.id,name:e.title})))}{selected&&get('eventId')&&<p>{a.availableForEvent}: {allocatableForEvent(selected,db.assetIssues,db.eventAllocations,db.events,get('eventId'))}</p>}<p className="text-sm text-muted-foreground">{a.allocationHint}</p></>}
 {modal.mode==='complete'&&<p>{assetName(db.assetMaintenance.find(m=>m.id===modal.id)?.assetId??'')} — {db.assetMaintenance.find(m=>m.id===modal.id)?.description}</p>}
 {modal.mode==='remove'&&<p>{eventName(db.eventAllocations.find(x=>x.id===modal.id)?.eventId??'')} — {assetName(db.eventAllocations.find(x=>x.id===modal.id)?.assetId??'')}</p>}
 </Editor>}
 </div>;
}
