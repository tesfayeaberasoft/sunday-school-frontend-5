import { describe, expect, it } from "vitest";
import { migrateDbData } from "@/stores/db";

describe("saved data from before the role merge", () => {
  it("turns a former System Administrator account into a School Manager", () => {
    const out = migrateDbData(
      {
        users: [{ id: "u-admin", role: "admin" }, { id: "u-t", role: "teacher" }],
        notifications: [{ id: "n", role: "admin" }],
        announcements: [{ id: "a", targetType: "role", targetIds: ["admin", "manager"] }],
      },
      1,
    );
    expect(out.users.map((u) => u.role)).toEqual(["manager", "teacher"]);
    expect(out.notifications[0]?.role).toBe("manager");
    expect(out.announcements[0]?.targetIds).toEqual(["manager"]);
  });
});
