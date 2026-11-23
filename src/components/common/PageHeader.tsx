import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ACCENT, type Accent } from "@/lib/accent";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  icon: Icon,
  accent = "brand",
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  accent?: Accent;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 animate-fade-up sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span data-accent={accent} className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-border-warm", ACCENT.brand.soft, "text-brand-deep")}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
    </div>
  );
}
