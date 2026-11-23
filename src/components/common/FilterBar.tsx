import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/common/AdaptiveDialog";
import { t } from "@/i18n";

/**
 * Filters: inline card on tablet/desktop; on phones a compact "filter" button
 * that opens the same controls in a bottom sheet (changes apply live).
 */
export function FilterBar({ children, summary }: { children: ReactNode; summary?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Panel className="hidden md:block">{children}</Panel>
      <div className="flex items-center gap-2 md:hidden">
        <Button type="button" variant="outline" className="tap gap-2 rounded-full bg-card px-4" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4 text-brand-deep" />
          {t.actions.filter}
        </Button>
        {summary && <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{summary}</div>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg md:hidden">
          <DialogHeader>
            <DialogTitle>{t.actions.filter}</DialogTitle>
            <DialogDescription>{t.labels.noDataHint}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 [&>div]:grid-cols-1">{children}</div>
          <Button type="button" className="tap mt-5 w-full" onClick={() => setOpen(false)}>
            {t.actions.confirm}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
