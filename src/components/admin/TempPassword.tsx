import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { admin as c } from "@/i18n/am/admin";

/** Shows a freshly generated one-time password with a copy button. */
export function TempPassword({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2 rounded-xl border border-brand/40 bg-accent/60 p-3 animate-pop" role="status">
      <p className="flex items-center gap-2 text-sm font-semibold text-navy"><KeyRound className="h-4 w-4 text-brand-deep" />{c.tempPassword}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 select-all break-all rounded-lg bg-card px-3 py-2 font-mono text-lg tracking-widest text-navy">{value}</code>
        <Button
          type="button"
          variant="outline"
          className="tap gap-2"
          onClick={async () => {
            try { await navigator.clipboard.writeText(value); setCopied(true); toast.success(c.copied); } catch { /* clipboard blocked: text stays selectable */ }
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? c.copied : c.copy}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{c.tempPasswordHint}</p>
    </div>
  );
}
