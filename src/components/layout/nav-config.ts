import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  Music,
  Package,
  School,
  Settings,
  Sprout,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { t } from "@/i18n";
import type { Accent } from "@/lib/accent";
import { can, type Permission } from "@/lib/permissions";
import type { Role } from "@/types/models";

export type NavPath =
  | "/dashboard"
  | "/students"
  | "/classes"
  | "/attendance"
  | "/finance"
  | "/assets"
  | "/departments"
  | "/development"
  | "/mezmur"
  | "/events"
  | "/tasks"
  | "/announcements"
  | "/reports"
  | "/admin";

export interface NavItem {
  key: string;
  to: NavPath;
  label: string;
  short: string;
  icon: LucideIcon;
  perm: Permission;
  accent: Accent;
  group: keyof typeof t.nav.groups;
}

export const NAV: NavItem[] = [
  { key: "dashboard", to: "/dashboard", label: t.nav.dashboard, short: t.nav.dashboard, icon: LayoutDashboard, perm: "dashboard.view", accent: "brand", group: "main" },
  { key: "students", to: "/students", label: t.nav.students, short: t.nav.students, icon: GraduationCap, perm: "students.view", accent: "sky", group: "academic" },
  { key: "classes", to: "/classes", label: t.nav.classes, short: t.nav.classes, icon: School, perm: "classes.view", accent: "teal", group: "academic" },
  { key: "attendance", to: "/attendance", label: t.nav.attendance, short: t.nav.attendanceShort, icon: ClipboardCheck, perm: "attendance.view", accent: "success", group: "academic" },
  { key: "finance", to: "/finance", label: t.nav.finance, short: t.nav.finance, icon: Wallet, perm: "finance.view", accent: "gold", group: "operations" },
  { key: "assets", to: "/assets", label: t.nav.assets, short: t.nav.assets, icon: Package, perm: "assets.view", accent: "orange", group: "operations" },
  { key: "events", to: "/events", label: t.nav.events, short: t.nav.eventsShort, icon: CalendarDays, perm: "events.view", accent: "rose", group: "operations" },
  { key: "tasks", to: "/tasks", label: t.nav.tasks, short: t.nav.tasks, icon: ListTodo, perm: "tasks.view", accent: "lime", group: "operations" },
  { key: "departments", to: "/departments", label: t.nav.departments, short: t.nav.departmentsShort, icon: Building2, perm: "departments.view", accent: "navy", group: "community" },
  { key: "development", to: "/development", label: t.nav.development, short: t.nav.development, icon: Sprout, perm: "development.view", accent: "success", group: "community" },
  { key: "mezmur", to: "/mezmur", label: t.nav.mezmur, short: t.nav.mezmurShort, icon: Music, perm: "mezmur.view", accent: "rose", group: "community" },
  { key: "announcements", to: "/announcements", label: t.nav.announcements, short: t.nav.announcementsShort, icon: Megaphone, perm: "announcements.view", accent: "orange", group: "community" },
  { key: "reports", to: "/reports", label: t.nav.reports, short: t.nav.reports, icon: BarChart3, perm: "reports.view", accent: "teal", group: "system" },
  { key: "admin", to: "/admin", label: t.nav.settings, short: t.nav.settingsShort, icon: Settings, perm: "admin.users", accent: "navy", group: "system" },
];

/** Four thumb-reach shortcuts per role for the mobile bottom bar. */
const PRIMARY: Record<Role, string[]> = {
  manager: ["dashboard", "students", "attendance", "finance"],
  finance: ["dashboard", "finance", "reports", "announcements"],
  asset: ["dashboard", "assets", "events", "reports"],
  teacher: ["dashboard", "attendance", "students", "announcements"],
  development: ["dashboard", "development", "tasks", "announcements"],
  mezmur: ["dashboard", "mezmur", "events", "announcements"],
  student: ["dashboard", "attendance", "mezmur", "announcements"],
};

export function navFor(role: Role | undefined): NavItem[] {
  return NAV.filter((n) => can(role, n.perm));
}

export function primaryNavFor(role: Role | undefined): NavItem[] {
  if (!role) return [];
  return PRIMARY[role].map((k) => NAV.find((n) => n.key === k)).filter((n): n is NavItem => !!n && can(role, n.perm));
}
