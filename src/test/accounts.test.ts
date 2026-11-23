import { describe, expect, it } from "vitest";
import { STAFF_ROLES, TEMP_PASSWORD_ALPHABET, generateTempPassword, roleChangeBlock, staffUsers, suspendBlock } from "@/lib/rules/accounts";
import type { User } from "@/types/models";

const u = (id: string, role: User["role"], active = true): User => ({ id, username: id, fullName: id, email: "", phone: "", role, active, failedLogins: 0, createdAt: "2026-01-01" });

describe("user management excludes students", () => {
  it("staff role list has no student role", () => {
    expect(STAFF_ROLES).not.toContain("student");
    expect(STAFF_ROLES).toHaveLength(6);
  });
  it("student accounts are filtered out of the users list", () => {
    expect(staffUsers([u("a", "manager"), u("b", "student"), u("c", "teacher")]).map((x) => x.id)).toEqual(["a", "c"]);
  });
});

describe("temporary password", () => {
  it("is 10 characters from the unambiguous alphabet", () => {
    const pw = generateTempPassword();
    expect(pw).toHaveLength(10);
    expect([...pw].every((ch) => TEMP_PASSWORD_ALPHABET.includes(ch))).toBe(true);
  });
  it("never uses look-alike characters", () => {
    expect(TEMP_PASSWORD_ALPHABET).not.toMatch(/[0O1lI]/);
  });
});

describe("suspend protection", () => {
  const users = [u("m1", "manager"), u("t1", "teacher")];
  it("cannot suspend your own account", () => expect(suspendBlock(users, "t1", "t1")).toBe("self"));
  it("cannot suspend the last active manager", () => expect(suspendBlock(users, "m1", "t1")).toBe("last_manager"));
  it("can suspend a manager when another manager is active", () => expect(suspendBlock([...users, u("m2", "manager")], "m1", "m2")).toBeNull());
  it("reactivating is never blocked", () => expect(suspendBlock([u("m1", "manager", false)], "m1", "m1")).toBeNull());
});

describe("role change protection", () => {
  const users = [u("m1", "manager"), u("t1", "teacher")];
  it("cannot change your own role", () => expect(roleChangeBlock(users, "m1", "teacher", "m1")).toBe("self"));
  it("cannot demote the last active manager", () => expect(roleChangeBlock(users, "m1", "teacher", "x")).toBe("last_manager"));
  it("other staff can change role", () => expect(roleChangeBlock(users, "t1", "finance", "m1")).toBeNull());
});
