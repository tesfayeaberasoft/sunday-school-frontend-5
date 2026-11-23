import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, LogOut, RotateCcw, User as UserIcon, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/common/AdaptiveDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-session";
import { api } from "@/services/api";
import { unsyncedCount, useSyncQueue } from "@/lib/sync-queue";
import { useAuth } from "@/stores/auth";
import { useDb } from "@/stores/db";
import { useUi } from "@/stores/ui";
import { initials, uuid } from "@/lib/format";
import { t } from "@/i18n";

export function useLogout() {
  const navigate = useNavigate();
  const clear = useAuth((s) => s.clear);
  return async () => {
    await api.auth.logout();
    clear();
    void navigate({ to: "/" });
  };
}

export function UserMenu() {
  const user = useCurrentUser();
  const users = useDb((s) => s.users);
  const resetDemo = useDb((s) => s.resetDemo);
  const setSession = useAuth((s) => s.setSession);
  const calendar = useUi((s) => s.calendar);
  const toggleCalendar = useUi((s) => s.toggleCalendar);
  const items = useSyncQueue((s) => s.items);
  const logout = useLogout();
  const [warn, setWarn] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  if (!user) return null;

  const pending = unsyncedCount(items);
  const askLogout = () => (pending > 0 ? setWarn(true) : void logout());

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="tap flex items-center justify-center gap-2 rounded-full px-1 transition-colors hover:bg-obsidian-raised md:rounded-xl md:px-1.5" aria-label={t.nav.profile}>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-brand text-sm font-semibold text-brand-foreground">{initials(user.fullName)}</AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 text-left leading-tight md:block">
              <span className="block max-w-36 truncate text-sm font-semibold text-navy-foreground">{user.fullName}</span>
              <span className="block max-w-36 truncate text-xs text-navy-foreground/60">{t.roles[user.role]}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs text-muted-foreground">{t.shell.signedInAs}</p>
            <p className="truncate font-semibold text-navy">{user.fullName}</p>
            <p className="text-xs text-brand">{t.roles[user.role]}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="min-h-11">
            <Link to="/profile">
              <UserIcon className="h-4 w-4" /> {t.nav.profile}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" onSelect={toggleCalendar}>
            <CalendarDays className="h-4 w-4" /> {t.shell.calendarToggle}:{" "}
            <span className="font-semibold">{calendar === "et" ? t.labels.ethiopian : t.labels.gregorian}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" onSelect={() => setSwitcher(true)}>
            <Users className="h-4 w-4" /> {t.shell.switchRole}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11"
            onSelect={() => {
              resetDemo();
              toast.success(t.shell.resetDemoDone);
            }}
          >
            <RotateCcw className="h-4 w-4" /> {t.shell.resetDemo}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-11 text-destructive focus:text-destructive" onSelect={askLogout}>
            <LogOut className="h-4 w-4" /> {t.actions.logout}
            {pending > 0 && <span className="ml-auto rounded-full bg-warning/30 px-2 text-xs">{pending}</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={warn} onOpenChange={setWarn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.shell.unsyncedWarnTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.shell.unsyncedWarnBody} ({t.shell.unsyncedCount}: {pending})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="tap">{t.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction className="tap bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void logout()}>
              {t.shell.logoutAnyway}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={switcher} onOpenChange={setSwitcher}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.shell.switchRole}</DialogTitle>
            <DialogDescription>{t.shell.switchRoleDesc}</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2">
            {users
              .filter((u) => u.active)
              .map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => {
                      setSession(u.id, `demo.${uuid()}`);
                      setSwitcher(false);
                      toast.success(`${t.login.welcomeBack}፣ ${u.fullName}`);
                    }}
                    className="tap flex w-full items-center gap-3 rounded-xl border p-2.5 text-left hover:border-brand hover:bg-brand/5 data-[current=true]:border-brand data-[current=true]:bg-brand/10"
                    data-current={u.id === user.id}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-navy/10 text-navy">{initials(u.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-navy">{u.fullName}</span>
                      <span className="block text-xs text-muted-foreground">{t.roles[u.role]}</span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
