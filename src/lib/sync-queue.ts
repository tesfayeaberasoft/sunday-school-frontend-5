/**
 * Offline sync queue persisted in IndexedDB. Each record carries a device-generated `clientUuid`
 * so the server never inserts it twice. When online, writes go straight to the API; when offline
 * they are queued and pushed on reconnect or when the user presses "sync now".
 */
import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";
import { api, type ApiResult, type AssetIssueInput, type AttendanceInput } from "@/services/api";
import { isOnlineNow } from "@/hooks/use-online";
import { uuid } from "@/lib/format";
import type { SyncItem, SyncKind, TaskStatus } from "@/types/models";
import type { ReturnInput } from "@/lib/rules/assets";

const IDB_KEY = "ssms-sync-queue-v1";

export type SyncPayload =
  | { kind: "attendance"; data: AttendanceInput }
  | { kind: "task_update"; data: { id: string; status: TaskStatus } }
  | { kind: "asset_issue"; data: AssetIssueInput }
  | { kind: "asset_return"; data: { issueId: string; input: ReturnInput } };

function send(p: SyncPayload, clientUuid: string): Promise<ApiResult<unknown>> {
  switch (p.kind) {
    case "attendance":
      return api.attendance.submit({ ...p.data, clientUuid });
    case "task_update":
      return api.tasks.updateStatus(p.data.id, p.data.status, clientUuid);
    case "asset_issue":
      return api.assets.issue(p.data, clientUuid);
    case "asset_return":
      return api.assets.return(p.data.issueId, p.data.input, clientUuid);
  }
}

interface SyncState {
  items: SyncItem[];
  loaded: boolean;
  syncing: boolean;
  load: () => Promise<void>;
  enqueue: (payload: SyncPayload, label: string) => Promise<SyncItem>;
  syncNow: () => Promise<{ synced: number; failed: number }>;
  retry: (clientUuid: string) => Promise<void>;
  discard: (clientUuid: string) => void;
  clearSynced: () => void;
}

function persistItems(items: SyncItem[]) {
  if (typeof indexedDB === "undefined") return;
  void idbSet(IDB_KEY, items).catch(() => undefined);
}

export const useSyncQueue = create<SyncState>()((set, get) => {
  const update = (clientUuid: string, patch: Partial<SyncItem>) => {
    const items = get().items.map((i) => (i.clientUuid === clientUuid ? { ...i, ...patch } : i));
    set({ items });
    persistItems(items);
  };

  const pushOne = async (item: SyncItem) => {
    update(item.clientUuid, { status: "syncing" });
    const res = await send(item.payload as SyncPayload, item.clientUuid);
    if (res.ok) {
      update(item.clientUuid, { status: "synced" });
      return true;
    }
    const patch: Partial<SyncItem> = { status: res.conflict ? "conflict" : "error", error: res.error };
    update(item.clientUuid, patch);
    return false;
  };

  return {
    items: [],
    loaded: false,
    syncing: false,
    load: async () => {
      if (get().loaded || typeof indexedDB === "undefined") return;
      const stored = (await idbGet<SyncItem[]>(IDB_KEY).catch(() => undefined)) ?? [];
      // Anything interrupted mid-sync goes back to pending.
      set({ items: stored.map((i) => (i.status === "syncing" ? { ...i, status: "pending" } : i)), loaded: true });
    },
    enqueue: async (payload, label) => {
      const item: SyncItem = {
        clientUuid: uuid(),
        kind: payload.kind as SyncKind,
        label,
        payload,
        createdAt: new Date().toISOString().slice(0, 19),
        status: "pending",
      };
      const items = [item, ...get().items];
      set({ items });
      persistItems(items);
      return item;
    },
    syncNow: async () => {
      if (get().syncing || !isOnlineNow()) return { synced: 0, failed: 0 };
      set({ syncing: true });
      let synced = 0;
      let failed = 0;
      const pending = get().items.filter((i) => i.status === "pending" || i.status === "error").reverse();
      for (const item of pending) {
        if (await pushOne(item)) synced++;
        else failed++;
      }
      set({ syncing: false });
      return { synced, failed };
    },
    retry: async (clientUuid) => {
      const item = get().items.find((i) => i.clientUuid === clientUuid);
      if (item && isOnlineNow()) await pushOne(item);
    },
    discard: (clientUuid) => {
      const items = get().items.filter((i) => i.clientUuid !== clientUuid);
      set({ items });
      persistItems(items);
    },
    clearSynced: () => {
      const items = get().items.filter((i) => i.status !== "synced");
      set({ items });
      persistItems(items);
    },
  };
});

export function unsyncedCount(items: SyncItem[]): number {
  return items.filter((i) => i.status !== "synced").length;
}

export type SubmitOutcome = { ok: true; queued: boolean } | { ok: false; error: string; conflict: boolean };

/** Sends an offline-capable write now, or queues it in IndexedDB when the device is offline. */
export async function submitOrQueue(payload: SyncPayload, label: string): Promise<SubmitOutcome> {
  if (!isOnlineNow()) {
    await useSyncQueue.getState().enqueue(payload, label);
    return { ok: true, queued: true };
  }
  const res = await send(payload, uuid());
  if (res.ok) return { ok: true, queued: false };
  if (res.status === 0) {
    // Network failed mid-request: keep it safe in the queue.
    await useSyncQueue.getState().enqueue(payload, label);
    return { ok: true, queued: true };
  }
  return { ok: false, error: res.error, conflict: !!res.conflict };
}
