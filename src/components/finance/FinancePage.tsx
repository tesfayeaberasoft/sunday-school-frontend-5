import { useState, type ReactNode } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
import { EmptyState } from '@/components/common/EmptyState';
import { formatETB } from '@/lib/format';
import { todayIso, isoToEth } from '@/lib/ethiopian-calendar';
import { computeBalance, countsTowardBalance, reconcile, isHighExpense } from '@/lib/rules/finance';
import { matchesAny } from '@/lib/amharic-search';
import { downloadCsv } from '@/lib/export';
import { ACCENT } from '@/lib/accent';
import { finance as f } from '@/i18n/am/finance';
import type { Transaction, PaymentMethod } from '@/types/models';
import { Action, Editor, Pick, Records, TabPills, Text } from './ModuleUi';
import { Fab } from '@/components/common/Fab';
import { useQuickDone, type Quick } from '@/components/quick/quick';
import { FilterBar } from '@/components/common/FilterBar';

type Tab='overview'|'ledger'|'transfers'|'contributions'|'reconciliation'|'review';
type Mode='Income'|'Expense'|'reverse'|'adjust'|'reject'|'transfer'|'contribution'|'account'|'category';
const options=(r:Record<string,string>)=>Object.entries(r).map(([id,name])=>({id,name}));
const positive=(v:string)=>Number.isFinite(Number(v))&&Number(v)>0;
const safe=(v:string|number)=>typeof v==='string'&&/^[=+\-@\t\r]/.test(v)?`'${v}`:v;
function csv(name:string,headers:string[],rows:(string|number)[][]){downloadCsv(name,headers,rows.map(row=>row.map(safe)));}
export function FinancePage({quick}:{quick?:Quick}={}){return <RequirePerm perm="finance.view"><FinanceBody {...(quick?{quick}:{})}/></RequirePerm>;}
function FinanceBody({quick}:{quick?:Quick}){
 const db=useDb();const record=useCan('finance.record'),verify=useCan('finance.verify'),correct=useCan('finance.correct'),review=useCan('finance.review_high');
 const [tab,setTab]=useState<Tab>('overview'),[query,setQuery]=useState(''),[account,setAccount]=useState(''),[status,setStatus]=useState(''),[kind,setKind]=useState(''),[category,setCategory]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[classId,setClassId]=useState('');
 const et=isoToEth(todayIso());const [period,setPeriod]=useState(`${et.year}-${String(et.month).padStart(2,'0')}`);
 const [modal,setModal]=useState<{mode:Mode;id?:string}|null>(quick?{mode:quick.action as Mode}:null),[v,setV]=useState<Record<string,string>>(()=>quick?{date:todayIso(),accountId:db.accounts[0]?.id??'',amount:String(db.settings.monthlyContribution),effect:'1',method:'cash',accountType:'cash',categoryKind:'income'}:{}),[busy,setBusy]=useState(false);
 useQuickDone(quick,!!modal);
 const get=(k:string)=>v[k]??'';const put=(k:string,value:string)=>setV(s=>({...s,[k]:value}));
 const open=(mode:Mode,id?:string)=>{setV({date:todayIso(),accountId:db.accounts[0]?.id??'',amount:String(db.settings.monthlyContribution),effect:'1',method:'cash',accountType:'cash',categoryKind:'income'});setModal({mode,...(id?{id}:{})});};
 const accountName=(id:string)=>db.accounts.find(a=>a.id===id)?.name??'—';
 const txById=(id:string)=>db.transactions.find(t=>t.id===id);
 const filtered=db.transactions.filter(t=>(!account||t.accountId===account)&&(!status||t.status===status)&&(!kind||t.type===kind)&&(!category||t.categoryId===category)&&(!start||t.date>=start)&&(!end||t.date<=end)&&matchesAny([t.ref,t.description,t.receiptNo,t.reason],query)).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
 const students=db.students.filter(s=>s.status==='active'&&(!classId||s.classId===classId)&&matchesAny([s.fullName,s.code],query));
 const payment=(id:string)=>db.contributions.find(c=>c.studentId===id&&c.period===period);
 const paymentStatus=(id:string)=>{const c=payment(id);if(!c)return f.unpaid;const t=c.transactionId?txById(c.transactionId):undefined;return t&&t.status!=='Verified'?f.statuses[t.status]:c.amount>=db.settings.monthlyContribution?f.paid:f.partial;};
 const totals={income:0,expense:0};for(const t of filtered){if(!countsTowardBalance(t))continue;const original=t.originalTransactionId?txById(t.originalTransactionId):t;if(original?.type==='Income')totals.income+=t.effect*t.amount;if(original?.type==='Expense')totals.expense-=t.effect*t.amount;}
 const trend=Array.from({length:12},(_,i)=>{const date=new Date();date.setDate(1);date.setMonth(date.getMonth()-11+i);const month=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;const n={month,income:0,expense:0};for(const t of filtered){if(!t.date.startsWith(month)||!countsTowardBalance(t))continue;const o=t.originalTransactionId?txById(t.originalTransactionId):t;if(o?.type==='Income')n.income+=t.effect*t.amount;if(o?.type==='Expense')n.expense-=t.effect*t.amount;}return n;});
 const result=(r:Result<unknown>)=>{if(!r.ok){toast.error(r.error);return false;}toast.success(f.saved);return true;};
 const online=()=>{if(typeof navigator!=='undefined'&&!navigator.onLine){toast.error(f.offline);return false;}return true;};
 const verifyOne=(id:string)=>{if(!verify||!online())return;result(useDb.getState().verifyTransaction(id));};
 const original=modal?.id?txById(modal.id):undefined;
 const submit=async()=>{
  if(!modal||busy)return;const m=modal.mode;const allowed=['reverse','adjust'].includes(m)?correct:m==='reject'?verify:record;
  if(!allowed){toast.error(f.noPermission);return;}if(!online())return;setBusy(true);
  try{const s=useDb.getState();const amount=Number(get('amount'));let r:Result<unknown>|undefined;
   if(m==='Income'||m==='Expense'){
    if(!positive(get('amount'))||!s.accounts.some(a=>a.id===get('accountId'))||!s.financeCategories.some(c=>c.id===get('categoryId')&&c.kind===(m==='Income'?'income':'expense'))||!get('date')||!get('description').trim())throw Error(f.invalid);
    r=s.addTransaction({type:m,accountId:get('accountId'),categoryId:get('categoryId'),amount,date:get('date'),description:get('description').trim(),paymentMethod:get('method') as PaymentMethod,...(get('receiptNo')?{receiptNo:get('receiptNo')}:{}),...(get('receiptFile')?{receiptFile:get('receiptFile')}:{}),...(get('eventId')?{eventId:get('eventId')}:{}),...(get('projectId')?{projectId:get('projectId')}:{})});
   }else if(m==='reverse'||m==='adjust'||m==='reject'){
    if(!modal.id||!get('reason').trim())throw Error(f.invalid);
    if(m==='reverse')r=s.reverseTransaction(modal.id,get('reason').trim());
    if(m==='adjust'){if(!positive(get('amount')))throw Error(f.invalid);r=s.adjustTransaction(modal.id,{amount,effect:get('effect')==='1'?1:-1,reason:get('reason').trim()});}
    if(m==='reject')r=s.rejectTransaction(modal.id,get('reason').trim());
   }else if(m==='transfer'){
    if(!positive(get('amount'))||get('fromId')===get('toId')||!s.accounts.some(a=>a.id===get('fromId'))||!s.accounts.some(a=>a.id===get('toId'))||!get('description').trim()||!get('date'))throw Error(f.invalid);
    r=s.transferFunds({fromId:get('fromId'),toId:get('toId'),amount,date:get('date'),description:get('description').trim()});
   }else if(m==='contribution'){
    if(!modal.id||!positive(get('amount'))||!/^\d{4}-(0[1-9]|1[0-3])$/.test(period)||!s.accounts.some(a=>a.id===get('accountId')))throw Error(f.invalid);
    r=s.recordContribution({studentId:modal.id,period,amount,accountId:get('accountId')});
   }else if(m==='account'){
    if(!get('name').trim()||!Number.isFinite(Number(get('opening')))||!get('opening'))throw Error(f.invalid);
    s.addAccount({name:get('name').trim(),type:get('accountType')==='bank'?'bank':'cash',openingBalance:Number(get('opening')),...(get('accountType')==='bank'?{bankName:get('bankName'),accountNumber:get('accountNumber')}:{})});
   }else if(m==='category'){
    if(!get('name').trim())throw Error(f.invalid);s.addFinanceCategory({name:get('name').trim(),kind:get('categoryKind')==='expense'?'expense':'income',color:'teal'});
   }
   if(r?!result(r):(toast.success(f.saved),false))return;setModal(null);
  }catch(e){toast.error(e instanceof Error?e.message:f.error);}finally{setBusy(false);}
 };
 const text=(key:string,label:string,type='text',required=true)=><Text label={label} value={get(key)} onChange={x=>put(key,x)} type={type} required={required} {...(type==='number'?{min:0,step:'0.01'}:{})}/>;
 const pick=(key:string,label:string,items:{id:string;name:string}[],optional=false)=><Pick label={label} value={get(key)} onChange={x=>put(key,x)} options={items} optional={optional}/>;
 const date=<Field label={f.date}><DateField value={get('date')} onChange={x=>put('date',x)}/></Field>;
 const accountPick=pick('accountId',f.account,db.accounts);
 const txActions=(t:Transaction)=><div className="flex flex-wrap gap-1">{t.status==='Pending'&&verify&&<><Action onClick={()=>verifyOne(t.id)}>{f.verify}</Action><Action onClick={()=>open('reject',t.id)}>{f.reject}</Action></>}{t.status==='Verified'&&correct&&!['Reversal','Adjustment','TransferIn','TransferOut'].includes(t.type)&&<><Action onClick={()=>open('reverse',t.id)}>{f.reverse}</Action><Action onClick={()=>open('adjust',t.id)}>{f.adjust}</Action></>}</div>;
 const txRows=(txs:Transaction[])=>txs.map(t=>({id:t.id,brief:{0:t.ref,2:t.description},cells:[<div>{t.ref}<div className="text-xs text-muted-foreground">{f.types[t.type]}</div>{t.originalTransactionId&&<div>{f.original}: {txById(t.originalTransactionId)?.ref??t.originalTransactionId}</div>}{t.transferGroupId&&<div>{t.transferGroupId}</div>}</div>,<DateText iso={t.date}/>,<div>{t.description}{t.reason&&<p>{f.reason}: {t.reason}</p>}{t.rejectReason&&<p>{f.reason}: {t.rejectReason}</p>}{t.receiptNo&&<p>{f.receipt}: {t.receiptNo}</p>}{t.eventId&&<p>{db.events.find(e=>e.id===t.eventId)?.title}</p>}{t.projectId&&<p>{db.devProjects.find(p=>p.id===t.projectId)?.title}</p>}{t.receiptFile&&/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/.test(t.receiptFile)&&<a className="tap inline-flex min-h-11 items-center underline" href={t.receiptFile} download={`${t.ref}.${t.receiptFile.startsWith('data:application/pdf')?'pdf':'png'}`}>{f.viewReceipt}</a>}</div>,accountName(t.accountId),formatETB(t.effect*t.amount),<span className={`inline-block rounded-lg px-2 py-1 ${t.status==='Verified'?ACCENT.success.soft:t.status==='Rejected'?ACCENT.destructive.soft:ACCENT.gold.soft}`}>{f.statuses[t.status]}</span>,txActions(t)]}));
 const headers=[f.reference,f.date,f.descriptionLabel,f.account,f.amount,f.status,f.actions];
 const exportLedger=()=>csv(f.ledger,[...headers.slice(0,-1),f.category,f.method,f.reason,f.original],[...filtered.map(t=>[t.ref,t.date,t.description,accountName(t.accountId),t.effect*t.amount,f.statuses[t.status],db.financeCategories.find(c=>c.id===t.categoryId)?.name??'',f.methods[t.paymentMethod],t.reason??t.rejectReason??'',t.originalTransactionId??''])]);
 const title=modal?({Income:f.income,Expense:f.expense,reverse:f.reverse,adjust:f.adjust,reject:f.reject,transfer:f.transfer,contribution:f.recordPayment,account:f.addAccount,category:f.addCategory}[modal.mode]):'';
 return <div className="min-w-0 space-y-4">{!quick&&<><PageHeader title={f.title} description={f.description} icon={Wallet} accent="teal" actions={record&&<><Action onClick={()=>open('Income')}>{f.income}</Action><Action onClick={()=>open('Expense')}>{f.expense}</Action></>}/>
 <TabPills tabs={['overview','ledger','transfers','contributions','reconciliation','review'] as const} value={tab} onChange={setTab} label={f.title} labels={f}/>{record&&<Fab label={f.income} onClick={()=>open('Income')}/>}
 {['overview','ledger','transfers'].includes(tab)&&<FilterBar><div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4"><SearchInput value={query} onChange={setQuery}/><Pick label={f.account} value={account} onChange={setAccount} options={db.accounts} optional/><Text label={f.start} type="date" value={start} onChange={setStart}/><Text label={f.end} type="date" value={end} onChange={setEnd}/>{tab==='ledger'&&<><Pick label={f.status} value={status} onChange={setStatus} options={options(f.statuses)} optional/><Pick label={f.type} value={kind} onChange={setKind} options={options(f.types)} optional/><Pick label={f.category} value={category} onChange={setCategory} options={db.financeCategories} optional/></>}</div></FilterBar>}
 {tab==='overview'&&<><div className="grid gap-3 sm:grid-cols-3"><StatCard label={f.income} value={formatETB(totals.income)} icon={ArrowDownLeft} accent="success"/><StatCard label={f.expense} value={formatETB(totals.expense)} icon={ArrowUpRight} accent="orange"/><StatCard label={f.balance} value={formatETB(db.accounts.reduce((n,a)=>n+computeBalance(a,db.transactions),0))} icon={Wallet} accent="teal"/></div><Panel title={f.accounts} description={f.verifiedOnly} actions={record&&<><Action onClick={()=>open('account')}>{f.addAccount}</Action><Action onClick={()=>open('category')}>{f.addCategory}</Action></>}><Records headers={[f.account,f.type,f.opening,f.balance]} rows={db.accounts.map(a=>({id:a.id,cells:[a.name,a.type==='cash'?f.cash:f.bank,formatETB(a.openingBalance),formatETB(computeBalance(a,db.transactions))]}))}/></Panel><Panel title={f.trend}><div className="h-72 min-w-0" role="img" aria-label={f.trend}><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{left:0,right:8,top:8,bottom:0}}><CartesianGrid stroke="var(--border)"/><XAxis dataKey="month" tick={{fontSize:10}}/><YAxis width={55} tick={{fontSize:10}}/><Tooltip formatter={value=>formatETB(Number(value))}/><Legend/><Area name={f.income} dataKey="income" stroke="var(--success)" fill="var(--success)" fillOpacity={0.15}/><Area name={f.expense} dataKey="expense" stroke="var(--orange)" fill="var(--orange)" fillOpacity={0.15}/></AreaChart></ResponsiveContainer></div></Panel><Panel title={f.categories}><Records headers={[f.name,f.type]} rows={db.financeCategories.map(c=>({id:c.id,cells:[c.name,c.kind==='income'?f.income:f.expense]}))}/></Panel></>}
 {tab==='ledger'&&<Panel title={f.ledger} description={f.immutable} actions={<Action onClick={exportLedger}>{f.export}</Action>}><Records headers={headers} list={[1,0,4,5]} rows={txRows(filtered)}/></Panel>}
 {tab==='transfers'&&<Panel title={f.transfers} actions={record&&<Action onClick={()=>open('transfer')}>{f.transfer}</Action>}><Records headers={headers} list={[1,0,4,5]} rows={txRows(filtered.filter(t=>!!t.transferGroupId))}/></Panel>}
 {tab==='contributions'&&<Panel title={f.contributions} description={f.periodHint} actions={<Action onClick={()=>csv(f.contributions,[f.student,f.period,f.amount,f.status],students.map(s=>[s.fullName,period,payment(s.id)?.amount??0,paymentStatus(s.id)]))}>{f.export}</Action>}><div className="mb-4 grid gap-3 sm:grid-cols-3"><Text label={f.period} value={period} onChange={setPeriod}/><Pick label={f.class} value={classId} onChange={setClassId} options={db.classes} optional/><SearchInput value={query} onChange={setQuery}/></div><Records headers={[f.student,f.class,f.amount,f.status,f.actions]} rows={students.map(s=>({id:s.id,cells:[s.fullName,db.classes.find(c=>c.id===s.classId)?.name??'—',formatETB(payment(s.id)?.amount??0),paymentStatus(s.id),record&&!payment(s.id)?<Action onClick={()=>open('contribution',s.id)}>{f.recordPayment}</Action>:null]}))}/></Panel>}
 {tab==='reconciliation'&&<Panel title={f.reconciliation} actions={<Action onClick={()=>csv(f.reconciliation,[f.account,f.stored,f.computed,f.difference],reconcile(db.accounts,db.transactions).map(r=>[accountName(r.accountId),r.stored,r.computed,r.difference]))}>{f.export}</Action>}><Records headers={[f.account,f.stored,f.computed,f.difference,f.status]} list={[0,2,3,4]} rows={reconcile(db.accounts,db.transactions).map(r=>({id:r.accountId,cells:[accountName(r.accountId),formatETB(r.stored),formatETB(r.computed),formatETB(r.difference),r.balanced?f.balanced:f.mismatch]}))}/></Panel>}
 {tab==='review'&&<Panel title={f.review} description={`${f.reviewHint} ${f.threshold}: ${formatETB(db.settings.expenseThreshold)}`}><Records headers={[f.reference,f.descriptionLabel,f.amount,f.actions]} rows={db.transactions.filter(t=>isHighExpense(t,db.settings.expenseThreshold)).map(t=>({id:t.id,cells:[t.ref,t.description,formatETB(t.amount),db.settings.acknowledgedExpenseIds.includes(t.id)?f.acknowledged:review?<Action onClick={()=>{if(!review||!online())return;const s=useDb.getState();if(!s.settings.acknowledgedExpenseIds.includes(t.id))s.acknowledgeExpense(t.id);toast.success(f.saved);}}>{f.acknowledge}</Action>:f.statuses.Pending]}))}/></Panel>}
 </>}
 {modal&&<Editor title={quick?.title??title} close={()=>setModal(null)} submit={submit} busy={busy}>
 {(modal.mode==='Income'||modal.mode==='Expense')&&<>{accountPick}{pick('categoryId',f.category,db.financeCategories.filter(c=>c.kind===(modal.mode==='Income'?'income':'expense')))}{text('amount',f.amount,'number')}{date}{text('description',f.descriptionLabel)}{pick('method',f.method,options(f.methods))}{text('receiptNo',f.receipt,'text',false)}<Field label={f.attachment}><input className="tap min-h-11 w-full min-w-0 text-sm" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" aria-label={f.attachment} onChange={async e=>{const file=e.target.files?.[0];if(!file){put('receiptFile','');return;}if(file.size>2*1024*1024||!['image/png','image/jpeg','image/webp','application/pdf'].includes(file.type)){e.target.value='';toast.error(f.receiptLimit);return;}setBusy(true);try{const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(Error(f.error));r.readAsDataURL(file);});put('receiptFile',data);}catch{toast.error(f.error);}finally{setBusy(false);}}}/></Field>{pick('eventId',f.event,db.events.map(e=>({id:e.id,name:e.title})),true)}{pick('projectId',f.project,db.devProjects.map(p=>({id:p.id,name:p.title})),true)}</>}
 {['reverse','adjust','reject'].includes(modal.mode)&&<>{original&&<p className="break-words text-sm">{original.ref} — {original.description} — {formatETB(original.amount)}</p>}{text('reason',f.reason)}{modal.mode==='adjust'&&<>{text('amount',f.amount,'number')}{pick('effect',f.effect,[{id:'1',name:f.increase},{id:'-1',name:f.decrease}])}</>}</>}
 {modal.mode==='transfer'&&<>{pick('fromId',f.from,db.accounts)}{pick('toId',f.to,db.accounts.filter(a=>a.id!==get('fromId')))}{text('amount',f.amount,'number')}{date}{text('description',f.descriptionLabel)}</>}
 {modal.mode==='contribution'&&<><p>{db.students.find(s=>s.id===modal.id)?.fullName} — {period}</p>{accountPick}{text('amount',f.amount,'number')}</>}
 {modal.mode==='account'&&<>{text('name',f.name)}{pick('accountType',f.type,[{id:'cash',name:f.cash},{id:'bank',name:f.bank}])}{text('opening',f.opening,'number')}{get('accountType')==='bank'&&<>{text('bankName',f.bankName)}{text('accountNumber',f.accountNumber)}</>}</>}
 {modal.mode==='category'&&<>{text('name',f.name)}{pick('categoryKind',f.type,[{id:'income',name:f.income},{id:'expense',name:f.expense}])}</>}
 </Editor>}
 </div>;
}
