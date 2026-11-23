import { formatEthDate, formatGregDate } from "./ethiopian-calendar";

export type CalendarMode = "et" | "gc";

export function formatETB(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${abs} ብር`;
}

export function formatDate(
  iso: string | null | undefined,
  mode: CalendarMode,
  opts: { weekday?: boolean; short?: boolean } = {},
): string {
  if (!iso) return "—";
  return mode === "et" ? formatEthDate(iso, opts) : formatGregDate(iso, opts);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "ጠዋት" : h < 18 ? "ከሰዓት" : "ምሽት";
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${period}`;
}

export function formatPercent(v: number): string {
  return `${Math.round(v)}%`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
