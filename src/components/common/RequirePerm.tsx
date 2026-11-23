import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-session";
import { can, type Permission } from "@/lib/permissions";
import { t } from "@/i18n";

/** Renders children only when the signed-in role has one of the permissions. */
export function RequirePerm({ perm, children }: { perm: Permission | Permission[]; children: ReactNode }) {
  const user = useCurrentUser();
  const perms = Array.isArray(perm) ? perm : [perm];
  if (perms.some((p) => can(user?.role, p))) return <>{children}</>;
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center shadow-card">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/12 text-destructive">
        <ShieldOff className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold">{t.shell.forbiddenTitle}</h2>
      <p className="text-sm text-muted-foreground">{t.shell.forbiddenBody}</p>
      <Button asChild className="tap mt-2">
        <Link to="/dashboard">{t.shell.goDashboard}</Link>
      </Button>
    </div>
  );
}
