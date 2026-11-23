import { useQuickDone, type Quick } from "@/components/quick/quick";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { useDb } from "@/stores/db";
import { useCan } from "@/hooks/use-session";
import { PageHeader } from "@/components/common/PageHeader";
import { Fab } from "@/components/common/Fab";
import { RequirePerm } from "@/components/common/RequirePerm";
import { EmptyState } from "@/components/common/EmptyState";
import { Field } from "@/components/common/Field";
import { DateText } from "@/components/common/DateText";
import { DateField } from "@/components/common/DateField";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/AdaptiveDialog";
import type { SchoolEvent } from "@/types/models";
import { todayIso } from "@/lib/ethiopian-calendar";
import { formatETB } from "@/lib/format";
import { allocatableForEvent } from "@/lib/rules/assets";

function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <p className="text-sm">{label}: {done}/{total} ({pct}%)</p>
      <progress className="w-full accent-brand" max={Math.max(1, total)} value={done} aria-label={label} />
    </div>
  );
}

export function EventsPage({quick}:{quick?:Quick}={}) {
  const db = useDb(), manage = useCan('events.manage'), assets = useCan('assets.view'), finance = useCan('finance.view');
  const w = t.workspace, ev = t.events;
  const [open, setOpen] = useState(quick?.action === 'event'), [editing, setEditing] = useState<string>();
  const [detailId, setDetailId] = useState<string>();
  const blank = (): Omit<SchoolEvent, 'id'> => ({ title: '', description: '', location: '', type: 'program', status: 'planned', startDate: todayIso(), endDate: todayIso(), budget: 0 });
  const [form, setForm] = useState(blank), [scope, setScope] = useState('upcoming'), [month, setMonth] = useState('');
  const patch = (v: Partial<typeof form>) => setForm(f => ({ ...f, ...v }));
  const rows = db.events.filter(e => (scope === 'all' || (scope === 'upcoming' ? e.endDate >= todayIso() : e.endDate < todayIso())) && (!month || (e.startDate.slice(0, 7) <= month && e.endDate.slice(0, 7) >= month))).sort((a, b) => a.startDate.localeCompare(b.startDate));
  useQuickDone(quick, open);
  const detail = detailId ? db.events.find(e => e.id === detailId) : undefined;

  function startEdit(e: SchoolEvent) {
    const { id, ...data } = e;
    setEditing(id); setForm(data); setDetailId(undefined); setOpen(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault(); if (!manage) return;
    if (!form.title.trim() || !form.location.trim() || !form.startDate || !form.endDate || form.endDate < form.startDate || !Number.isFinite(form.budget) || form.budget < 0) { toast.error(w.invalid); return; }
    const candidate = { ...form, id: editing ?? 'preview' }; const events = editing ? db.events.map(x => x.id === editing ? candidate : x) : [...db.events, candidate];
    if (editing && db.eventAllocations.filter(a => a.eventId === editing).some(a => { const asset = db.assets.find(x => x.id === a.assetId); return !asset || a.quantity > allocatableForEvent(asset, db.assetIssues, db.eventAllocations.filter(x => x.eventId !== editing), events, candidate.id); })) { toast.error(w.invalid); return; }
    const payload = { ...form, title: form.title.trim(), location: form.location.trim(), description: form.description.trim() };
    if (editing) db.updateEvent(editing, payload); else db.addEvent(payload); setOpen(false); toast.success(w.saved);
  }

  return <RequirePerm perm="events.view"><div className="space-y-5 min-w-0">
    {!quick && <>
    {manage && <Fab label={t.actions.create} onClick={() => { setEditing(undefined); setForm(blank()); setOpen(true); }} />}
    <PageHeader title={ev.title} />
    <div className="flex flex-wrap items-end gap-2">
      <Field label={w.status} htmlFor="event-scope"><select id="event-scope" className="tap rounded-md border bg-background px-3" value={scope} onChange={e => setScope(e.target.value)}><option value="upcoming">{ev.upcoming}</option><option value="past">{ev.past}</option><option value="all">{w.all}</option></select></Field>
      <Field label={ev.month} htmlFor="event-month"><Input id="event-month" type="month" className="tap w-full" value={month} onChange={e => setMonth(e.target.value)} /></Field>
      {month && <Button className="tap" variant="outline" onClick={() => setMonth('')}>{t.actions.clear}</Button>}
      {manage && <Button className="tap" onClick={() => { setEditing(undefined); setForm(blank()); setOpen(true); }}>{t.actions.create}</Button>}
    </div>

    {rows.length ? (
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(e => {
          const tasks = db.tasks.filter(x => x.eventId === e.id);
          const completed = tasks.filter(x => x.status === 'Completed').length;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setDetailId(e.id)}
              aria-label={`${e.title} — ${ev.openDetails}`}
              className="tap flex h-full min-w-0 cursor-pointer flex-col gap-2 rounded-2xl border bg-card p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="min-w-0 flex-1 truncate text-base font-bold">{e.title}</h3>
                <StatusBadge status={e.status} label={ev.statuses[e.status]} className="shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground"><DateText iso={e.startDate} /> — <DateText iso={e.endDate} /></p>
              <p className="truncate text-sm text-muted-foreground">{ev.types[e.type]} · {e.location}</p>
              {tasks.length > 0 && <p className="mt-auto text-xs text-muted-foreground">{ev.preparation}: {completed}/{tasks.length}</p>}
            </button>
          );
        })}
      </div>
    ) : <EmptyState />}
    </>}

    <Dialog open={!!detail} onOpenChange={v => { if (!v) setDetailId(undefined); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {detail && (() => {
          const tasks = db.tasks.filter(x => x.eventId === detail.id);
          const completed = tasks.filter(x => x.status === 'Completed').length;
          const allocs = db.eventAllocations.filter(a => a.eventId === detail.id);
          const txns = db.transactions.filter(x => x.eventId === detail.id);
          const income = txns.filter(x => x.effect === 1).reduce((s, x) => s + x.amount, 0);
          const expense = txns.filter(x => x.effect === -1).reduce((s, x) => s + x.amount, 0);
          return (
            <div className="space-y-4 break-words">
              <DialogHeader>
                <DialogTitle>{detail.title}</DialogTitle>
                <DialogDescription>{ev.details}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.type} label={ev.types[detail.type]} tone="gold" />
                <StatusBadge status={detail.status} label={ev.statuses[detail.status]} />
              </div>
              <p><DateText iso={detail.startDate} /> — <DateText iso={detail.endDate} /></p>
              <p>{ev.location}: {detail.location}</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{detail.description}</p>
              <Progress done={completed} total={tasks.length} label={ev.preparation} />

              <section>
                <h3 className="font-semibold">{ev.tasks}</h3>
                {tasks.length ? (
                  <ul className="mt-2 space-y-2">
                    {tasks.map(task => (
                      <li key={task.id} className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-muted p-3">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{w.assignee}: {task.assigneeName}</span>
                        <StatusBadge status={task.status} label={w[task.status]} className="shrink-0" />
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-1 text-sm text-muted-foreground">{ev.noTasks}</p>}
              </section>

              {assets && (
                <section>
                  <h3 className="font-semibold">{ev.allocations}</h3>
                  {allocs.length ? (
                    <ul className="mt-2 space-y-2">
                      {allocs.map(a => <li key={a.id} className="rounded-lg bg-muted p-3">{db.assets.find(x => x.id === a.assetId)?.name ?? w.none} · {ev.quantity}: {a.quantity}</li>)}
                    </ul>
                  ) : <p className="mt-1 text-sm text-muted-foreground">{w.none}</p>}
                </section>
              )}

              {finance && (
                <section>
                  <h3 className="font-semibold">{ev.summary}</h3>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-muted p-3"><dt className="text-muted-foreground">{t.finance.income}</dt><dd className="font-semibold">{formatETB(income)}</dd></div>
                    <div className="rounded-lg bg-muted p-3"><dt className="text-muted-foreground">{t.finance.expense}</dt><dd className="font-semibold">{formatETB(expense)}</dd></div>
                    <div className="rounded-lg bg-muted p-3"><dt className="text-muted-foreground">{ev.net}</dt><dd className="font-semibold">{formatETB(income - expense)}</dd></div>
                    <div className="rounded-lg bg-muted p-3"><dt className="text-muted-foreground">{ev.budget}</dt><dd className="font-semibold">{formatETB(detail.budget)}</dd></div>
                  </dl>
                </section>
              )}

              <div className="flex flex-wrap gap-2">
                {manage && <Button className="tap" onClick={() => startEdit(detail)}>{t.actions.edit}</Button>}
                <Button asChild variant="outline" className="tap"><Link to="/tasks">{w.tasks}</Link></Button>
              </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? t.actions.edit : quick?.title ?? t.actions.create}</DialogTitle><DialogDescription>{ev.title}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={save}><Field label={w.title} htmlFor="event-title"><Input id="event-title" className="tap" required value={form.title} onChange={e => patch({ title: e.target.value })} /></Field><Field label={ev.location} htmlFor="event-location"><Input id="event-location" className="tap" required value={form.location} onChange={e => patch({ location: e.target.value })} /></Field><Field label={w.body} htmlFor="event-description"><Textarea id="event-description" value={form.description} onChange={e => patch({ description: e.target.value })} /></Field><Field label={ev.start} htmlFor="event-start"><DateField id="event-start" value={form.startDate} onChange={startDate => patch({ startDate })} /></Field><Field label={ev.end} htmlFor="event-end"><DateField id="event-end" value={form.endDate} onChange={endDate => patch({ endDate })} /></Field><Field label={ev.type} htmlFor="event-type"><select id="event-type" className="tap w-full rounded-md border bg-background px-3" value={form.type} onChange={e => patch({ type: e.target.value as SchoolEvent['type'] })}>{Object.entries(ev.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field><Field label={w.status} htmlFor="event-status"><select id="event-status" className="tap w-full rounded-md border bg-background px-3" value={form.status} onChange={e => patch({ status: e.target.value as SchoolEvent['status'] })}>{Object.entries(ev.statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field><Field label={ev.budget} htmlFor="event-budget"><Input id="event-budget" className="tap" type="number" min="0" step="0.01" required value={form.budget} onChange={e => patch({ budget: Number(e.target.value) })} /></Field><Button className="tap" type="submit">{t.actions.save}</Button></form></DialogContent></Dialog>
  </div></RequirePerm>;
}
