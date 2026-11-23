import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

/** Label + control + error text, used in every form. */
export function Field({
  label,
  htmlFor,
  error,
  optional,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string | undefined;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-navy">
        {label} {optional && <span className="font-normal text-muted-foreground">{t.labels.optional}</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
