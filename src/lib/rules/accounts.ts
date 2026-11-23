import type { Role, User } from "@/types/models";

/** Roles managed under Administration → Users. Students are managed from the Students page. */
export const STAFF_ROLES: Role[] = ["manager", "finance", "asset", "teacher", "development", "mezmur"];

export function staffUsers(users: User[]): User[] {
  return users.filter((u) => u.role !== "student");
}

/** No look-alike characters (0/O, 1/l/I) so a password read aloud or copied by hand stays correct. */
export const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
export const TEMP_PASSWORD_LENGTH = 10;

function secureRandomInt(max: number): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return (buf[0] ?? 0) % max;
}

/** One-time temporary password (FR-102). */
export function generateTempPassword(random: (max: number) => number = secureRandomInt): string {
  let out = "";
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) out += TEMP_PASSWORD_ALPHABET[random(TEMP_PASSWORD_ALPHABET.length)];
  return out;
}

export type AccountBlock = "self" | "last_manager" | null;

/** Why an account may not be suspended: your own account, or the last active School Manager. Reactivating is never blocked. */
export function suspendBlock(users: User[], targetId: string, currentUserId?: string): AccountBlock {
  const target = users.find((u) => u.id === targetId);
  if (!target || !target.active) return null;
  if (target.id === currentUserId) return "self";
  if (target.role === "manager" && users.filter((u) => u.role === "manager" && u.active).length <= 1) return "last_manager";
  return null;
}

/** Why a role change is refused: changing your own role, or moving the last active School Manager to another role. */
export function roleChangeBlock(users: User[], targetId: string, nextRole: Role, currentUserId?: string): AccountBlock {
  const target = users.find((u) => u.id === targetId);
  if (!target || target.role === nextRole) return null;
  if (target.id === currentUserId) return "self";
  if (target.role === "manager" && target.active && users.filter((u) => u.role === "manager" && u.active).length <= 1) return "last_manager";
  return null;
}
