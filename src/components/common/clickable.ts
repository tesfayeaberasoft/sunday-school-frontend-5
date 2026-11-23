import type { KeyboardEvent, MouseEvent } from "react";

const INNER = 'button, a, input, select, textarea, label, summary, [role="button"], [role="checkbox"], [data-no-row]';

/** True when the click landed on a control inside the row (checkbox, button, link…), which handles itself. */
export function isInnerControl(e: MouseEvent<HTMLElement>): boolean {
  const el = (e.target as HTMLElement).closest(INNER);
  return !!el && el !== e.currentTarget && e.currentTarget.contains(el);
}

/**
 * Props that make a whole row/card open its detail: click anywhere except inner controls,
 * Enter/Space from the keyboard. Pass `label` for cards without inner controls to expose them as a button.
 */
export function rowOpen(open: () => void, label?: string) {
  return {
    tabIndex: 0,
    "data-row-open": "",
    ...(label ? { role: "button" as const, "aria-label": label } : {}),
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (isInnerControl(e)) return;
      if (typeof window !== "undefined" && window.getSelection()?.toString()) return;
      open();
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    },
  };
}
