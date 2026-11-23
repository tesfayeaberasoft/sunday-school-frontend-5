import { useAuth } from "@/stores/auth";
import { useDb } from "@/stores/db";
import { can, type Permission } from "@/lib/permissions";
import type { User } from "@/types/models";

export function useCurrentUser(): User | undefined {
  const userId = useAuth((s) => s.userId);
  return useDb((s) => s.users.find((u) => u.id === userId));
}

export function useCan(perm: Permission): boolean {
  const user = useCurrentUser();
  return can(user?.role, perm);
}
