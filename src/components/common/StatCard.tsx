import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Accent } from "@/lib/accent";
import { cn } from "@/lib/utils";

/** Crisp white metric card with an amber icon badge. */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "brand",
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  accent?: Accent;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div data-accent={accent} className={cn("card-orange-solid animate-fade-up relative overflow-hidden rounded-2xl p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-1 truncate font-display text-xl font-bold text-navy sm:text-2xl">{value}</p>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-brand-deep ring-1 ring-border-warm">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-brand opacity-80" aria-hidden />
    </div>
  );
}
