import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight, CloudOff, LayoutGrid, LogOut, RefreshCw, X } from "lucide-react";
import { Drawer as Vaul } from "vaul";
import { toast } from "sonner";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { NotificationBell } from "./NotificationBell";
import { SyncDrawer } from "./SyncDrawer";
import { UserMenu, useAskLogout } from "./UserMenu";
import { UserAvatar } from "@/components/common/UserAvatar";
import { NAV, navFor, primaryNavFor, type NavItem } from "./nav-config";
import { useCurrentUser } from "@/hooks/use-session";
import { useOnline } from "@/hooks/use-online";
import { unsyncedCount, useSyncQueue } from "@/lib/sync-queue";
import { useUi } from "@/stores/ui";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

function useActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => pathname === to || pathname.startsWith(`${to}/`);
}

/** Sidebar links. "auto" = icon rail on tablet, full labels on desktop (unless collapsed). */
function SidebarLinks({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  const isActive = useActive();
  const groups = Object.keys(t.nav.groups) as Array<keyof typeof t.nav.groups>;
  const wide = !collapsed;
  return (
    <nav className="space-y-4">
      {groups.map((g) => {
        const list = items.filter((i) => i.group === g);
        if (!list.length) return null;
        return (
          <div key={g}>
            {wide && (
              <p className="mb-1 hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45 lg:block">
                {t.nav.groups[g]}
              </p>
            )}
            <ul className="space-y-1">
              {list.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      to={item.to}
                      title={item.label}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "tap group relative flex items-center justify-center gap-3 rounded-xl px-0 text-sm font-medium transition-all duration-200",
                        wide && "lg:justify-start lg:px-3",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      {wide && <span className="hidden truncate lg:inline">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function OnlinePill({ onClick }: { onClick: () => void }) {
  const online = useOnline();
  const items = useSyncQueue((s) => s.items);
  const syncing = useSyncQueue((s) => s.syncing);
  const pending = unsyncedCount(items);
  return (
    <button
      onClick={onClick}
      className={cn(
        "tap flex items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
        online ? "border-success/40 bg-success/15 text-success" : "border-destructive/50 bg-destructive/20 text-navy-foreground",
      )}
      aria-label={t.shell.syncQueue}
    >
      {online ? <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} /> : <CloudOff className="h-4 w-4" />}
      <span className="hidden sm:inline">{online ? t.shell.online : t.shell.offline}</span>
      {pending > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-bold text-brand-foreground">{pending}</span>}
    </button>
  );
}

/** Bottom sheet listing every module the role can open (Android "More" pattern). */
function MoreSheet({ open, onOpenChange, items }: { open: boolean; onOpenChange: (v: boolean) => void; items: NavItem[] }) {
  const isActive = useActive();
  const groups = Object.keys(t.nav.groups) as Array<keyof typeof t.nav.groups>;
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-[2px] md:hidden" />
        <Vaul.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[1.75rem] bg-card outline-none md:hidden">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" aria-hidden />
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <Vaul.Title className="font-display text-lg font-bold text-navy">{t.nav.moreTitle}</Vaul.Title>
            <Vaul.Description className="sr-only">{t.nav.menu}</Vaul.Description>
            <Vaul.Close className="tap grid place-items-center rounded-full text-muted-foreground hover:bg-muted">
              <X className="h-5 w-5" />
              <span className="sr-only">{t.actions.close}</span>
            </Vaul.Close>
          </div>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {groups.map((g) => {
              const list = items.filter((i) => i.group === g);
              if (!list.length) return null;
              return (
                <section key={g}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.nav.groups[g]}</h3>
                  <ul className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4">
                    {list.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.to);
                      return (
                        <li key={item.key}>
                          <Link
                            to={item.to}
                            onClick={() => onOpenChange(false)}
                            className={cn(
                              "press flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center text-[11px] font-medium leading-tight transition-colors",
                              active ? "border-border-warm bg-accent text-accent-foreground" : "border-border bg-card text-navy hover:bg-muted",
                            )}
                          >
                            <span className={cn("grid h-10 w-10 place-items-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-accent text-brand-deep")}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="line-clamp-2">{item.short}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const online = useOnline();
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const loadQueue = useSyncQueue((s) => s.load);
  const syncNow = useSyncQueue((s) => s.syncNow);
  const [syncOpen, setSyncOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = useActive();
  const items = navFor(user?.role);
  const primary = primaryNavFor(user?.role);
  const signOut = useAskLogout();
  const wide = !collapsed;

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  // Push queued records as soon as the connection comes back.
  useEffect(() => {
    if (!online) return;
    const pending = useSyncQueue.getState().items.some((i) => i.status === "pending");
    if (!pending) return;
    void syncNow().then((r) => {
      if (r.synced) toast.success(`${t.shell.syncDone} (${r.synced})`);
      if (r.failed) toast.error(`${t.shell.syncError}: ${r.failed}`);
    });
  }, [online, syncNow]);

  const current = NAV.find((n) => isActive(n.to));
  const moreActive = !!current && !primary.some((p) => p.key === current.key);

  return (
    <div className="min-h-screen bg-background">
      {/* Tablet rail + desktop sidebar (obsidian) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-20 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex",
          !collapsed && "lg:w-64",
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border px-0", !collapsed && "lg:justify-start lg:px-4")}>
          <LogoMark className={cn(!collapsed && "lg:hidden")} />
          {!collapsed && <Logo light className="hidden lg:flex" />}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
          <SidebarLinks items={items} collapsed={collapsed} />
        </div>
        {user && (
          <div className="shrink-0 space-y-1 border-t border-sidebar-border px-3 py-3">
            <Link
              to="/profile"
              title={t.shell.profileShort}
              aria-label={t.shell.profileShort}
              className={cn(
                "tap flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 transition-colors hover:bg-sidebar-accent",
                wide && "lg:justify-start",
              )}
              activeProps={{ className: "bg-sidebar-accent" }}
            >
              <UserAvatar user={user} className="h-9 w-9" />
              {wide && (
                <span className="hidden min-w-0 leading-tight lg:block">
                  <span className="block truncate text-sm font-semibold text-sidebar-accent-foreground">{user.fullName}</span>
                  <span className="block truncate text-xs text-sidebar-foreground/60">
                    {t.shell.profileShort} · {t.roles[user.role]}
                  </span>
                </span>
              )}
            </Link>
            <button
              onClick={signOut.ask}
              title={t.shell.signOutShort}
              aria-label={t.shell.signOutShort}
              className={cn(
                "tap flex min-h-11 w-full items-center justify-center gap-3 rounded-xl px-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-destructive/15 hover:text-destructive",
                wide && "lg:justify-start lg:px-3",
              )}
            >
              <LogOut className="h-4 w-4" />
              {wide && <span className="hidden lg:inline">{t.shell.signOutShort}</span>}
            </button>
            {signOut.dialog}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? t.shell.expand : t.shell.collapse}
          className="tap hidden items-center justify-center gap-2 border-t border-sidebar-border text-xs text-sidebar-foreground/70 transition-colors hover:text-sidebar-accent-foreground lg:flex"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && t.shell.collapse}
        </button>
      </aside>

      <div className={cn("flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 md:pl-20", !collapsed && "lg:pl-64")}>
        {/* Top app bar (obsidian) */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-1.5 border-b border-sidebar-border bg-navy-deep/95 px-2 text-navy-foreground backdrop-blur sm:gap-2 sm:px-4 md:h-16 md:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Link to="/dashboard" className="shrink-0 md:hidden" aria-label={t.nav.dashboard}>
              <LogoMark className="h-9 w-9" />
            </Link>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight text-navy-foreground md:text-lg">{current?.label ?? t.appShort}</p>
              <p className="hidden truncate text-xs text-navy-foreground/55 sm:block">ቅዱስ ሚካአል ሰንበት ትምህርት ቤት</p>
            </div>
          </div>
          <OnlinePill onClick={() => setSyncOpen(true)} />
          <NotificationBell />
          <UserMenu />
        </header>

        {!online && (
          <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive sm:text-sm">
            <CloudOff className="h-4 w-4 shrink-0" /> {t.shell.offlineBanner}
          </div>
        )}

        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 pb-safe-nav pt-4 sm:px-5 md:pb-10 lg:px-8 lg:pt-6">{children}</main>
      </div>

      {/* Phone bottom navigation (Android style) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-card/95 pb-safe shadow-bar backdrop-blur md:hidden" aria-label={t.nav.menu}>
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-[11px] transition-colors",
                    active ? "font-semibold text-navy" : "font-medium text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-14 place-items-center rounded-full transition-all duration-300",
                      active ? "bg-accent text-brand-deep" : "bg-transparent",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="max-w-full truncate">{item.short}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                "press flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                moreActive ? "font-semibold text-navy" : "font-medium text-muted-foreground",
              )}
            >
              <span className={cn("grid h-8 w-14 place-items-center rounded-full transition-all duration-300", moreActive && "bg-accent text-brand-deep")}>
                <LayoutGrid className="h-5 w-5" />
              </span>
              {t.nav.more}
            </button>
          </li>
        </ul>
      </nav>

      <MoreSheet open={menuOpen} onOpenChange={setMenuOpen} items={items} />
      <SyncDrawer open={syncOpen} onOpenChange={setSyncOpen} />
    </div>
  );
}
