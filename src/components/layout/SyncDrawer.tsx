import { CloudOff, RefreshCw, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { useOnline } from "@/hooks/use-online";
import { useSyncQueue } from "@/lib/sync-queue";
import { useUi } from "@/stores/ui";
import { formatTime } from "@/lib/format";
import { t } from "@/i18n";

export function SyncDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const online = useOnline();
  const { items, syncing, syncNow, retry, discard, clearSynced } = useSyncQueue();
  const simulateOffline = useUi((s) => s.simulateOffline);
  const setSimulateOffline = useUi((s) => s.setSimulateOffline);
  const hasSynced = items.some((i) => i.status === "synced");
  const unsynced = items.filter((i) => i.status !== "synced").length;

  const runSync = async () => {
    const r = await syncNow();
    if (r.failed) toast.error(`${t.shell.syncError}: ${r.failed}`);
    else toast.success(t.shell.syncDone);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="flex items-center gap-2">
            {online ? <Wifi className="h-5 w-5 text-success" /> : <CloudOff className="h-5 w-5 text-destructive" />}
            {t.shell.syncQueue}
          </SheetTitle>
          <SheetDescription>{t.shell.syncQueueDesc}</SheetDescription>
        </SheetHeader>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <label htmlFor="sim-offline" className="text-sm font-medium">
            {t.shell.simulateOffline}
          </label>
          <Switch id="sim-offline" checked={simulateOffline} onCheckedChange={setSimulateOffline} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <EmptyState title={t.shell.syncEmpty} hint="" icon={RefreshCw} />
          ) : (
            <ul className="space-y-2">
              {items.map((i) => (
                <li key={i.clientUuid} className="rounded-xl border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">{i.label}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {formatTime(i.createdAt)} · {i.clientUuid.slice(0, 8)}
                      </p>
                    </div>
                    <StatusBadge
                      status={i.status}
                      label={
                        {
                          pending: t.shell.syncPending,
                          syncing: t.shell.syncSyncing,
                          error: t.shell.syncError,
                          conflict: t.shell.syncConflict,
                          synced: t.shell.syncSynced,
                        }[i.status]
                      }
                    />
                  </div>
                  {i.error && <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{i.error}</p>}
                  {(i.status === "error" || i.status === "conflict") && (
                    <div className="mt-2 flex gap-2">
                      {i.status === "error" && (
                        <Button size="sm" variant="outline" className="tap" disabled={!online} onClick={() => void retry(i.clientUuid)}>
                          {t.actions.retry}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="tap text-destructive" onClick={() => discard(i.clientUuid)}>
                        <Trash2 className="h-4 w-4" /> {t.shell.discard}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2 border-t p-4 pb-safe">
          <Button className="tap flex-1" disabled={!online || syncing || unsynced === 0} onClick={() => void runSync()}>
            <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {syncing ? t.shell.syncSyncing : t.shell.syncNow}
          </Button>
          {hasSynced && (
            <Button variant="outline" className="tap" onClick={clearSynced}>
              {t.shell.clearSynced}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
