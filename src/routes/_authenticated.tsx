import { useEffect, useState } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { LogoMark } from "@/components/brand/Logo";
import { useCurrentUser } from "@/hooks/use-session";
import { t } from "@/i18n";

// Session and records live in on-device storage, so signed-in pages render only after hydration.
export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-hero">
      <div className="flex flex-col items-center gap-3 text-navy-foreground">
        <LogoMark className="h-16 w-16 animate-float" />
        <p className="text-sm opacity-80">{t.shell.loadingApp}</p>
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  const [hydrated, setHydrated] = useState(false);
  const user = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && (!user || !user.active)) void navigate({ to: "/", replace: true });
  }, [hydrated, user, navigate]);

  if (!hydrated || !user) return <Splash />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
