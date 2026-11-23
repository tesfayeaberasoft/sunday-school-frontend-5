import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { t } from "@/i18n";

export function EmptyState({
  title = t.labels.noData,
  hint = t.labels.noDataHint,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  hint?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-semibold text-navy">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
