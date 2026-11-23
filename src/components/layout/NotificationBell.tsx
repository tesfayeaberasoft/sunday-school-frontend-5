import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrentUser } from "@/hooks/use-session";
import { useDb } from "@/stores/db";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { AppNotification, User } from "@/types/models";

export function notificationsFor(all: AppNotification[], user: User | undefined): AppNotification[] {
  if (!user) return [];
  return all.filter((n) => n.userId === user.id || n.role === user.role || (!n.userId && !n.role));
}

const DOT: Record<AppNotification["kind"], string> = {
  info: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

export function NotificationBell() {
  const user = useCurrentUser();
  const all = useDb((s) => s.notifications);
  const markRead = useDb((s) => s.markNotificationRead);
  const markAll = useDb((s) => s.markAllNotificationsRead);
  const mine = notificationsFor(all, user);
  const unread = mine.filter((n) => !n.read);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="tap relative rounded-full text-navy-foreground hover:bg-obsidian-raised hover:text-navy-foreground" aria-label={t.nav.notifications}>
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,22rem)] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="font-semibold text-navy">{t.nav.notifications}</p>
          {unread.length > 0 && (
            <button className="tap px-2 text-xs font-medium text-brand" onClick={() => markAll(unread.map((n) => n.id))}>
              {t.actions.markAllRead}
            </button>
          )}
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {mine.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">{t.shell.noNotifications}</li>}
          {mine.slice(0, 8).map((n) => (
            <li key={n.id}>
              <button
                onClick={() => markRead(n.id)}
                className={cn("flex w-full gap-3 px-3 py-2.5 text-left hover:bg-muted", !n.read && "bg-brand/5")}
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-border" : DOT[n.kind])} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-navy">{n.title}</span>
                  <span className="line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
                  <span className="text-[11px] text-muted-foreground">{formatTime(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="tap w-full">
            <Link to="/notifications">{t.actions.seeAll}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
