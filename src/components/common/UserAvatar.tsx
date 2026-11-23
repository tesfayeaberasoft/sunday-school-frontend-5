import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { User } from "@/types/models";

/** Circular profile photo with an initials fallback, used wherever a user's name appears. */
export function UserAvatar({ user, className }: { user: Pick<User, "fullName" | "photoUrl">; className?: string }) {
  return (
    <Avatar className={cn("h-9 w-9 shrink-0 ring-2 ring-brand/30", className)}>
      {user.photoUrl && <AvatarImage src={user.photoUrl} alt={`${t.shell.photo.alt} — ${user.fullName}`} className="object-cover" />}
      <AvatarFallback className="bg-gradient-brand text-sm font-semibold text-brand-foreground">{initials(user.fullName)}</AvatarFallback>
    </Avatar>
  );
}
