import { useEffect, useRef } from "react";

/**
 * Quick mode: a page body rendered from the dashboard with `quick` shows only the requested
 * create/record dialog (same form, same rules) and calls `onDone` once that dialog closes.
 */
export type Quick = { action: string; onDone: () => void; /** Dialog title shown in quick mode (the dashboard button label). */ title?: string };

export function useQuickDone(quick: Quick | undefined, open: boolean) {
  const done = useRef(quick?.onDone);
  done.current = quick?.onDone;
  const active = !!quick;
  useEffect(() => {
    if (!active || open) return;
    // let the close animation finish before the dashboard unmounts the hidden page
    const id = setTimeout(() => done.current?.(), 220);
    return () => clearTimeout(id);
  }, [active, open]);
}
