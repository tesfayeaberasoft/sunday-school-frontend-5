import { describe, expect, it } from "vitest";
import { availableQuantity, applyReturn, validateReturn } from "@/lib/rules/assets";
import { buildReversal, computeBalance, validateCorrection, isHighExpense } from "@/lib/rules/finance";
import { findSessionConflict, summarize } from "@/lib/rules/attendance";
import { can, ROLE_PERMISSIONS } from "@/lib/permissions";
import { isoToEth, ethToIso } from "@/lib/ethiopian-calendar";
import { formatETB } from "@/lib/format";
import type { Account, Asset, AssetIssue, AttendanceSession, Transaction } from "@/types/models";

const asset: Asset = {
  id: "a1", code: "A-1", name: "የበዓል ልብስ", categoryId: "c", totalQuantity: 10, damagedQuantity: 2,
  condition: "good", location: "መጋዘን", unitValue: 100, acquiredDate: "2026-01-01", notes: "",
};
const issue: AssetIssue = {
  id: "i1", assetId: "a1", quantity: 5, recipientName: "ሚካኤል", recipientType: "student", issueDate: "2026-11-01",
  dueDate: "2026-11-10", returnedQuantity: 1, damagedOnReturn: 0, missingOnReturn: 0, status: "partial", note: "",
};

describe("asset stock rule", () => {
  it("available = total - damaged - issued not returned", () => {
    expect(availableQuantity(asset, [issue])).toBe(4);
  });
  it("missing on return permanently reduces total, damaged raises damaged", () => {
    const r = applyReturn(asset, issue, { returned: 2, damaged: 1, missing: 1 }, "2026-11-12");
    expect(r.asset.totalQuantity).toBe(9);
    expect(r.asset.damagedQuantity).toBe(3);
    expect(r.issue.status).toBe("returned");
  });
  it("cannot return more than outstanding", () => {
    expect(validateReturn(issue, { returned: 5, damaged: 0, missing: 0 })).toBe("exceeds_outstanding");
  });
});

const account: Account = { id: "acc", name: "ጥሬ ገንዘብ", type: "cash", openingBalance: 1000, storedBalance: 1000 };
const tx = (over: Partial<Transaction>): Transaction => ({
  id: "t", ref: "r", type: "Income", effect: 1, accountId: "acc", amount: 500, date: "2026-11-01", description: "",
  paymentMethod: "cash", status: "Verified", createdBy: "u", createdAt: "2026-11-01", ...over,
});

describe("finance ledger", () => {
  it("only verified transactions affect the balance", () => {
    const bal = computeBalance(account, [tx({ id: "1" }), tx({ id: "2", status: "Pending" }), tx({ id: "3", status: "Rejected" })]);
    expect(bal).toBe(1500);
  });
  it("a reversal cancels the original amount", () => {
    const original = tx({ id: "1", status: "Reversed" });
    const rev = buildReversal(original, "ስህተት", { id: "2", ref: "r2", createdBy: "u", createdAt: "x", date: "2026-11-02" });
    expect(rev.effect).toBe(-1);
    expect(computeBalance(account, [original, rev])).toBe(1000);
  });
  it("pending transactions cannot be reversed", () => {
    expect(validateCorrection(tx({ status: "Pending" }), "Reversal", "ምክንያት")).toBe("not_verified");
  });
  it("corrections need a reason", () => {
    expect(validateCorrection(tx({}), "Reversal", "  ")).toBe("reason_required");
  });
  it("expenses above the threshold are flagged for review", () => {
    expect(isHighExpense(tx({ type: "Expense", effect: -1, amount: 6000 }), 5000)).toBe(true);
    expect(isHighExpense(tx({ type: "Expense", effect: -1, amount: 5000 }), 5000)).toBe(false);
  });
});

describe("attendance", () => {
  const s: AttendanceSession = {
    id: "s1", classId: "c-1", academicYearId: "ay", date: "2026-11-15", sessionName: "የእሑድ ጠዋት",
    recordedBy: "u", createdAt: "x", records: [],
  };
  it("blocks a second session for the same class, date and session", () => {
    expect(findSessionConflict([s], { classId: "c-1", academicYearId: "ay", date: "2026-11-15", sessionName: "የእሑድ ጠዋት" })).toBe(s);
    expect(findSessionConflict([s], { classId: "c-1", academicYearId: "ay", date: "2026-11-15", sessionName: "የእሑድ ከሰዓት" })).toBeUndefined();
  });
  it("late counts as attended", () => {
    expect(summarize(["present", "late", "absent", "absent"]).percent).toBe(50);
  });
});

describe("role rules", () => {
  it("only the School Manager registers students", () => {
    expect(can("manager", "students.register")).toBe(true);
    for (const r of ["teacher", "finance", "asset", "development", "mezmur", "student"] as const) {
      expect(can(r, "students.register")).toBe(false);
    }
  });
  it("finance officer verifies; manager only views finance", () => {
    expect(can("finance", "finance.verify")).toBe(true);
    expect(can("manager", "finance.verify")).toBe(false);
    expect(can("manager", "finance.view")).toBe(true);
  });
  it("School Manager holds every former System Administrator permission", () => {
    for (const p of ["admin.users", "admin.settings", "admin.audit", "admin.years"] as const) {
      expect(can("manager", p)).toBe(true);
    }
  });
  it("there is no separate System Administrator role", () => {
    expect(Object.keys(ROLE_PERMISSIONS)).not.toContain("admin");
    for (const r of ["teacher", "finance", "asset", "development", "mezmur", "student"] as const) {
      expect(can(r, "admin.users")).toBe(false);
    }
  });
  it("students cannot see the student list", () => {
    expect(can("student", "students.view")).toBe(false);
  });
});

describe("Ethiopian calendar and currency", () => {
  it("11 Sep 2026 is Meskerem 1, 2019", () => {
    expect(isoToEth("2026-09-11")).toEqual({ year: 2019, month: 1, day: 1 });
    expect(ethToIso({ year: 2019, month: 1, day: 1 })).toBe("2026-09-11");
  });
  it("leap year 2019 has Pagume 6, so 2020 starts 12 Sep 2027", () => {
    expect(isoToEth("2027-09-11")).toEqual({ year: 2019, month: 13, day: 6 });
    expect(isoToEth("2027-09-12")).toEqual({ year: 2020, month: 1, day: 1 });
  });
  it("formats Birr", () => {
    expect(formatETB(1500)).toBe("1,500.00 ብር");
  });
});
