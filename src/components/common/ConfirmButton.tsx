import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

/** Action button that asks for an inline confirmation inside the same modal (no stacked dialogs). */
export function ConfirmButton({ label, question, onConfirm, icon, danger = false, disabled = false, reason }: {
  label: string;
  question: string;
  onConfirm: () => void;
  icon?: ReactNode;
  /** Red confirm step for suspending/closing. */
  danger?: boolean;
  disabled?: boolean;
  /** Shown under the button when it is disabled. */
  reason?: string | undefined;
}) {
  const [asking, setAsking] = useState(false);
  if (asking) {
    return (
      <div role="alertdialog" aria-label={label} className="w-full space-y-3 rounded-xl border border-brand/40 bg-accent/60 p-3 animate-pop">
        <p className="text-sm text-navy">{question}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={danger ? "destructive" : "default"} className="tap flex-1 sm:flex-none" onClick={() => { setAsking(false); onConfirm(); }}>
            {t.actions.confirm}
          </Button>
          <Button type="button" variant="outline" className="tap flex-1 sm:flex-none" onClick={() => setAsking(false)}>
            {t.actions.cancel}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-0 space-y-1">
      <Button type="button" variant="outline" disabled={disabled} className={cn("tap w-full gap-2 sm:w-auto", danger && "text-destructive hover:text-destructive")} onClick={() => setAsking(true)}>
        {icon}
        {label}
      </Button>
      {disabled && reason && <p className="max-w-xs text-xs text-muted-foreground">{reason}</p>}
    </div>
  );
}
