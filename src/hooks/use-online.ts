import { useSyncExternalStore } from "react";
import { useUi } from "@/stores/ui";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function isOnlineNow(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine && !useUi.getState().simulateOffline;
}

export function useOnline(): boolean {
  const browserOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const simulateOffline = useUi((s) => s.simulateOffline);
  return browserOnline && !simulateOffline;
}
