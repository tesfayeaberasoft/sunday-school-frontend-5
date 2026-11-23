import type { Role } from "@/types/models";

export type Permission =
  | "dashboard.view"
  | "students.view"
  | "students.register"
  | "students.edit"
  | "students.import"
  | "students.promote"
  | "classes.view"
  | "classes.manage"
  | "attendance.view"
  | "attendance.record"
  | "finance.view"
  | "finance.record"
  | "finance.verify"
  | "finance.correct"
  | "finance.review_high"
  | "assets.view"
  | "assets.manage"
  | "departments.view"
  | "departments.manage"
  | "development.view"
  | "development.manage"
  | "mezmur.view"
  | "mezmur.manage"
  | "events.view"
  | "events.manage"
  | "tasks.view"
  | "tasks.manage"
  | "announcements.view"
  | "announcements.create_all"
  | "announcements.create_department"
  | "reports.view"
  | "admin.users"
  | "admin.settings"
  | "admin.audit"
  | "admin.years";

const ALL_VIEW: Permission[] = ["dashboard.view", "announcements.view", "events.view", "tasks.view"];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  manager: [
    ...ALL_VIEW,
    "students.view",
    "students.register",
    "students.edit",
    "students.import",
    "students.promote",
    "classes.view",
    "classes.manage",
    "attendance.view",
    "finance.view",
    "finance.review_high",
    "assets.view",
    "departments.view",
    "departments.manage",
    "development.view",
    "mezmur.view",
    "events.manage",
    "tasks.manage",
    "announcements.create_all",
    "reports.view",
    // System administration (merged from the former System Administrator role)
    "admin.users",
    "admin.settings",
    "admin.audit",
    "admin.years",
  ],
  finance: [
    ...ALL_VIEW,
    "finance.view",
    "finance.record",
    "finance.verify",
    "finance.correct",
    "reports.view",
  ],
  asset: [...ALL_VIEW, "assets.view", "assets.manage", "reports.view"],
  teacher: [...ALL_VIEW, "students.view", "classes.view", "attendance.view", "attendance.record"],
  development: [
    ...ALL_VIEW,
    "departments.view",
    "development.view",
    "development.manage",
    "announcements.create_department",
  ],
  mezmur: [
    ...ALL_VIEW,
    "departments.view",
    "mezmur.view",
    "mezmur.manage",
    "announcements.create_department",
  ],
  student: [...ALL_VIEW, "attendance.view", "mezmur.view"],
};

export function can(role: Role | undefined, perm: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(perm);
}
