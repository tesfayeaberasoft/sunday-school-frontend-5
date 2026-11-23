import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { rowOpen } from "@/components/common/clickable";

/** Card surface used by every module for grouped content. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  onOpen,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Makes the whole card clickable (opens its detail modal); inner buttons keep working. */
  onOpen?: () => void;
}) {
  return (
    <section {...(onOpen ? rowOpen(onOpen) : {})} className={cn("card-orange animate-fade-up min-w-0 rounded-2xl bg-card text-card-foreground shadow-card", onOpen && "row-click hover:shadow-lift", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-navy">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
