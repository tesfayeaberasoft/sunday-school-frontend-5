import * as React from "react";
import { Drawer as Vaul } from "vaul";
import { X } from "lucide-react";
import * as Base from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

/**
 * Drop-in replacement for the shadcn Dialog parts: a centered modal on tablet/desktop
 * and a native-style slide-up bottom sheet on phones (< 768px).
 */
const SheetMode = React.createContext(false);

type RootProps = React.ComponentProps<typeof Base.Dialog>;

export function Dialog({ children, open, defaultOpen, onOpenChange, modal }: RootProps) {
  const mobile = useIsMobile();
  const shared = {
    ...(open === undefined ? {} : { open }),
    ...(defaultOpen === undefined ? {} : { defaultOpen }),
    ...(onOpenChange ? { onOpenChange } : {}),
    ...(modal === undefined ? {} : { modal }),
  };
  if (mobile) {
    return (
      <SheetMode.Provider value>
        <Vaul.Root {...shared}>{children}</Vaul.Root>
      </SheetMode.Provider>
    );
  }
  return (
    <SheetMode.Provider value={false}>
      <Base.Dialog {...shared}>{children}</Base.Dialog>
    </SheetMode.Provider>
  );
}

export const DialogContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Base.DialogContent>>(
  ({ className, children, ...props }, ref) => {
    const sheet = React.useContext(SheetMode);
    if (!sheet) {
      return (
        <Base.DialogContent ref={ref} className={cn("rounded-2xl border-border bg-card shadow-lift sm:rounded-2xl", className)} {...props}>
          {children}
        </Base.DialogContent>
      );
    }
    const hideClose = className?.includes("[&>button]:hidden");
    return (
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-[2px]" />
        <Vaul.Content
          ref={ref}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[1.75rem] border-t border-border bg-card text-card-foreground shadow-lift outline-none"
        >
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" aria-hidden />
          {!hideClose && (
            <Vaul.Close className="tap absolute right-2 top-2 grid place-items-center rounded-full text-muted-foreground hover:bg-muted">
              <X className="h-5 w-5" />
              <span className="sr-only">{t.actions.close}</span>
            </Vaul.Close>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
            {children}
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    );
  },
);
DialogContent.displayName = "AdaptiveDialogContent";

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const sheet = React.useContext(SheetMode);
  return <div className={cn("flex flex-col space-y-1.5 text-left", sheet && "mb-4 pr-10", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof Base.DialogTitle>>(
  ({ className, ...props }, ref) => {
    const sheet = React.useContext(SheetMode);
    const cls = cn("font-display text-lg font-bold leading-snug text-navy", className);
    return sheet ? <Vaul.Title ref={ref} className={cls} {...props} /> : <Base.DialogTitle ref={ref} className={cls} {...props} />;
  },
);
DialogTitle.displayName = "AdaptiveDialogTitle";

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<typeof Base.DialogDescription>>(
  ({ className, ...props }, ref) => {
    const sheet = React.useContext(SheetMode);
    const cls = cn("text-sm text-muted-foreground", className);
    return sheet ? <Vaul.Description ref={ref} className={cls} {...props} /> : <Base.DialogDescription ref={ref} className={cls} {...props} />;
  },
);
DialogDescription.displayName = "AdaptiveDialogDescription";
