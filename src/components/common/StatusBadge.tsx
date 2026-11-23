import { t } from "@/i18n";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "muted" | "gold" | "navy";

const TONE: Record<Tone, string> = {
  success: "bg-success text-success-foreground border-success",
  warning: "bg-navy-deep text-brand border-navy-deep",
  danger: "bg-destructive text-destructive-foreground border-destructive",
  info: "bg-brand-deep text-brand-foreground border-brand-deep",
  muted: "bg-muted text-muted-foreground border-border",
  gold: "bg-gold/20 text-gold-foreground border-gold/40",
  navy: "bg-navy text-navy-foreground border-navy",
};

const STATUS_TONE: Record<string, Tone> = {
  active: "success",
  inactive: "muted",
  graduated: "gold",
  planned: "info",
  closed: "muted",
  present: "success",
  absent: "danger",
  late: "warning",
  Pending: "warning",
  Verified: "success",
  Rejected: "danger",
  Reversed: "muted",
  InProgress: "info",
  Completed: "success",
  overdue: "danger",
  urgent: "danger",
  normal: "muted",
  low: "muted",
  high: "danger",
  issued: "info",
  partial: "warning",
  returned: "success",
  in_progress: "warning",
  completed: "success",
  on_hold: "muted",
  preparing: "warning",
  rehearsing: "info",
  done: "success",
  pending: "warning",
  syncing: "info",
  error: "danger",
  conflict: "danger",
  synced: "success",
};

/** Colored pill for any known status key; label defaults to the Amharic status name. */
export function StatusBadge({ status, label, tone, className }: { status?: string; label?: string; tone?: Tone; className?: string }) {
  const statusLabels = t.status as Record<string, string>;
  const text = label ?? (status ? statusLabels[status] ?? status : "");
  const tn = tone ?? (status ? STATUS_TONE[status] : undefined) ?? "muted";
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", TONE[tn], className)}>
      {text}
    </span>
  );
}
