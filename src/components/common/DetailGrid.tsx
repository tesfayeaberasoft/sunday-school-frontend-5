import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Label/value pairs for detail modals. Empty values show a dash. */
export function DetailGrid({ items, className }: { items: Array<[string, ReactNode] | [string, ReactNode, "wide"]>; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3", className)}>
      {items.map(([label, value, wide]) => (
        <div key={label} className={cn("min-w-0", wide && "col-span-2 sm:col-span-3")}>
          <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
          <dd className="break-words text-sm text-navy [overflow-wrap:anywhere]">{value === null || value === undefined || value === "" ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  );
}
