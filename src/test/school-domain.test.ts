import { describe, expect, it } from "vitest";
import * as seed from "@/data/mock";
import { seedData, migrateDbData } from "@/stores/db";
import { academicYearDates, isoToEth, weekdayOf } from "@/lib/ethiopian-calendar";
import { canSaveClass, TEACHING_WEEKDAYS } from "@/lib/rules/school-domain";
import { availableQuantity } from "@/lib/rules/assets";
import { can, ROLE_PERMISSIONS } from "@/lib/permissions";

describe("Sunday School domain", () => {
  it("offers exactly three classes and keeps every student, teacher and attendance reference valid", () => {
    expect(seed.classes.map(c => c.name)).toEqual(["ሕፃናት ክፍል (5–10)", "ማዕከላውያን ክፍል (10–13)", "ወጣቶች ክፍል (13 በላይ)"]);
    const ids = seed.classes.map(c => c.id);
    for (const s of seed.students) { expect(ids).toContain(s.classId); for (const e of s.enrollments) expect(ids).toContain(e.classId); }
    for (const u of seed.users) for (const id of u.classIds ?? []) expect(ids).toContain(id);
    for (const a of seed.attendanceSessions) expect(ids).toContain(a.classId);
  });
  it("cannot create a fourth class designation or a duplicate in the same academic year", () => {
    const c = seed.classes[0]; if (!c) throw new Error("missing class");
    expect(canSaveClass(seed.classes, { ...c, id: "new", name: "ጎልማሶች ክፍል" })).toBe(false);
    expect(canSaveClass(seed.classes, { ...c, id: "new" })).toBe(false);
    expect(canSaveClass(seed.classes, { ...c, id: "new", academicYearId: "ay-2020" })).toBe(true);
  });
  it("academic records start at Meskerem 1 and end at Nehase 30, excluding Pagume", () => {
    for (const y of seed.academicYears) {
      const year = isoToEth(y.startDate).year;
      expect(isoToEth(y.startDate)).toEqual({ year, month: 1, day: 1 });
      expect(isoToEth(y.endDate)).toEqual({ year, month: 12, day: 30 });
    }
    expect(academicYearDates(2019)).toEqual({ startDate: "2026-09-11", endDate: "2027-09-05", pagumeStartDate: "2027-09-06", calendarEndDate: "2027-09-11" });
    expect(academicYearDates(2020).calendarEndDate).toBe("2028-09-10");
  });
  it("keeps the merged manager permissions and all seven internal roles", () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toEqual(["manager", "finance", "asset", "teacher", "development", "mezmur", "student"]);
    expect(can("manager", "admin.users")).toBe(true);
    expect(can("finance", "finance.verify")).toBe(true);
    expect(can("manager", "finance.verify")).toBe(false);
  });
  it("prioritizes six income sources, each represented in sample transactions", () => {
    const categories = seed.financeCategories.filter(c => c.kind === "income");
    expect(categories.map(c => c.name)).toEqual(["የአባላት ወርሃዊ መዋጮ", "ከጉዞ የሚገኝ ገቢ", "የበዓል ገቢ", "ስጦታና ልገሳ", "የመጻሕፍትና ዕቃዎች ሽያጭ", "ከልማት ሥራዎች ሽያጭ"]);
    for (const c of categories) expect(seed.transactions.some(tx => tx.type === "Income" && tx.categoryId === c.id)).toBe(true);
  });
  it("covers six inventory types with book varieties, clothing colors and unchanged availability math", () => {
    expect(seed.assetCategories).toHaveLength(6);
    for (const c of seed.assetCategories) expect(seed.assets.some(a => a.categoryId === c.id)).toBe(true);
    expect(seed.assets.filter(a => a.categoryId === "ac-books")).toHaveLength(3);
    expect(seed.assets.filter(a => a.categoryId === "ac-cloth")).toHaveLength(3);
    const drum = seed.assets.find(a => a.id === "a-3"); if (!drum) throw new Error("missing drum");
    expect(drum.totalQuantity).toBe(12);
    expect(availableQuantity(drum, seed.assetIssues)).toBe(7);
  });
  it("uses Tuesday, Thursday and Saturday afternoons and Sunday mornings consistently", () => {
    expect(seed.sessionNames).toEqual(["ማክሰኞ ከሰዓት", "ሐሙስ ከሰዓት", "ቅዳሜ ከሰዓት", "እሁድ ጠዋት"]);
    expect(new Set(seed.attendanceSessions.map(a => weekdayOf(a.date)))).toEqual(new Set([2, 4, 6, 0]));
    for (const a of seed.attendanceSessions) expect(a.sessionName).toBe(seed.sessionNames[TEACHING_WEEKDAYS.indexOf(weekdayOf(a.date) as 0 | 2 | 4 | 6)]);
    for (const c of seed.classes) expect(c.schedule.split("፣ ")).toEqual(seed.sessionNames);
  });
  it("upgrades older saved classes without losing attendance marks, money, stock, or account state", () => {
    const data = seedData(); const c = data.classes[0]; const a = data.attendanceSessions[0];
    if (!c || !a) throw new Error("missing seed");
    data.classes = Array.from({ length: 6 }, (_, i) => ({ ...c, id: `c-${i + 1}` }));
    data.attendanceSessions = [{ ...a, classId: "c-1", records: [{ studentId: "s-1", status: "late" }] }, { ...a, id: "legacy", classId: "c-2", records: [{ studentId: "s-2", status: "absent" }] }];
    const before = structuredClone(data);
    const out = migrateDbData(data, 2);
    expect(out.classes).toHaveLength(3);
    expect(out.attendanceSessions).toHaveLength(1);
    expect(out.attendanceSessions[0]?.records).toEqual([{ studentId: "s-1", status: "late" }, { studentId: "s-2", status: "absent" }]);
    expect(out.transactions).toEqual(before.transactions);
    expect(out.accounts).toEqual(before.accounts);
    expect(out.users.map(u => [u.id, u.role, u.active])).toEqual(before.users.map(u => [u.id, u.role, u.active]));
    expect(out.assets.map(a => [a.id, a.totalQuantity, a.damagedQuantity])).toEqual(before.assets.map(a => [a.id, a.totalQuantity, a.damagedQuantity]));
    expect(out.assetIssues).toEqual(before.assetIssues);
  });
});