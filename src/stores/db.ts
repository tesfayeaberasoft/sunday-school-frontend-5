import { generateTempPassword } from "@/lib/rules/accounts";
import { upgradeSchoolDomain } from "@/lib/rules/domain-migration";
import { canSaveClass } from "@/lib/rules/school-domain";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as seed from "@/data/mock";
import { t } from "@/i18n";
import { uuid } from "@/lib/format";
import { todayIso } from "@/lib/ethiopian-calendar";
import {
  buildReversal,
  effectForType,
  validateCorrection,
  type CorrectionError,
} from "@/lib/rules/finance";
import {
  allocatableForEvent,
  applyReturn,
  availableQuantity,
  validateReturn,
  type ReturnInput,
} from "@/lib/rules/assets";
import { findSessionConflict } from "@/lib/rules/attendance";
import { useAuth } from "./auth";
import type {
  AcademicYear,
  Account,
  Announcement,
  AppNotification,
  ArtsProgram,
  Asset,
  AssetCategory,
  AssetIssue,
  AssetMaintenance,
  AttendanceRecord,
  AttendanceSession,
  AuditLog,
  Contribution,
  Department,
  DepartmentMember,
  DevProject,
  EventAllocation,
  FinanceCategory,
  Mezmur,
  PaymentMethod,
  PracticeSchedule,
  ProgressReport,
  SchoolClass,
  SchoolEvent,
  Student,
  SystemSettings,
  Task,
  TaskStatus,
  Transaction,
  User,
} from "@/types/models";

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string };
const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: string): Result<never> => ({ ok: false, error });

const correctionMessage: Record<CorrectionError, string> = {
  not_verified: t.errors.notVerified,
  already_reversed: t.errors.alreadyReversed,
  is_correction: t.errors.isCorrection,
  reason_required: t.errors.reasonRequired,
  amount_invalid: t.errors.amountInvalid,
};

export interface DbData {
  users: User[];
  academicYears: AcademicYear[];
  classes: SchoolClass[];
  students: Student[];
  attendanceSessions: AttendanceSession[];
  accounts: Account[];
  financeCategories: FinanceCategory[];
  transactions: Transaction[];
  contributions: Contribution[];
  assetCategories: AssetCategory[];
  assets: Asset[];
  assetIssues: AssetIssue[];
  assetMaintenance: AssetMaintenance[];
  eventAllocations: EventAllocation[];
  departments: Department[];
  departmentMembers: DepartmentMember[];
  devProjects: DevProject[];
  progressReports: ProgressReport[];
  mezmurs: Mezmur[];
  practiceSchedules: PracticeSchedule[];
  artsPrograms: ArtsProgram[];
  events: SchoolEvent[];
  tasks: Task[];
  announcements: Announcement[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

export function seedData(): DbData {
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
  return clone({
    users: seed.users,
    academicYears: seed.academicYears,
    classes: seed.classes,
    students: seed.students,
    attendanceSessions: seed.attendanceSessions,
    accounts: seed.accounts,
    financeCategories: seed.financeCategories,
    transactions: seed.transactions,
    contributions: seed.contributions,
    assetCategories: seed.assetCategories,
    assets: seed.assets,
    assetIssues: seed.assetIssues,
    assetMaintenance: seed.assetMaintenance,
    eventAllocations: seed.eventAllocations,
    departments: seed.departments,
    departmentMembers: seed.departmentMembers,
    devProjects: seed.devProjects,
    progressReports: seed.progressReports,
    mezmurs: seed.mezmurs,
    practiceSchedules: seed.practiceSchedules,
    artsPrograms: seed.artsPrograms,
    events: seed.events,
    tasks: seed.tasks,
    announcements: seed.announcements,
    notifications: seed.notifications,
    auditLogs: seed.auditLogs,
    settings: seed.defaultSettings,
  });
}

export type NewStudent = Omit<Student, "id" | "code" | "enrollments" | "status" | "joinDate"> &
  Partial<Pick<Student, "joinDate">>;

export interface NewTransaction {
  type: "Income" | "Expense";
  accountId: string;
  categoryId: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
  receiptNo?: string;
  receiptFile?: string;
  eventId?: string;
  projectId?: string;
  contributorId?: string;
  clientUuid?: string;
}

export interface Promotion {
  studentId: string;
  toClassId: string;
  status: "promoted" | "repeated" | "graduated";
}

interface DbActions {
  resetDemo: () => void;
  logAudit: (module: string, action: string, entity: string, entityId: string, details: string) => void;

  // Users & admin
  addUser: (u: Omit<User, "id" | "failedLogins" | "createdAt">) => Result<User>;
  updateUser: (id: string, patch: Partial<User>) => void;
  toggleUserActive: (id: string) => void;
  /** Returns the one-time temporary password; it is shown once and never stored. */
  resetPassword: (id: string) => string;
  /** Suspend (false) or reactivate (true) a student and their linked sign-in account. */
  setStudentActive: (id: string, active: boolean) => void;
  bulkCreateStudentAccounts: (studentIds: string[]) => Result<number>;
  addAcademicYear: (y: Omit<AcademicYear, "id" | "status">) => void;
  activateAcademicYear: (id: string) => void;
  closeAcademicYear: (id: string) => Result;
  updateAcademicYear: (id: string, patch: Partial<Omit<AcademicYear, "id" | "status">>) => void;
  updateSettings: (patch: Partial<SystemSettings>) => void;
  runBackup: () => void;

  // Students & classes
  registerStudent: (s: NewStudent) => Result<Student>;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  importStudents: (rows: NewStudent[]) => Result<number>;
  promoteStudents: (toYearId: string, promotions: Promotion[]) => Result<number>;
  addClass: (c: Omit<SchoolClass, "id">) => void;
  updateClass: (id: string, patch: Partial<SchoolClass>) => void;

  // Attendance
  submitAttendance: (input: {
    classId: string;
    date: string;
    sessionName: string;
    records: AttendanceRecord[];
    clientUuid?: string;
  }) => Result<AttendanceSession>;
  correctAttendance: (sessionId: string, records: AttendanceRecord[], reason: string) => void;

  // Finance
  addTransaction: (input: NewTransaction) => Result<Transaction>;
  verifyTransaction: (id: string) => Result;
  rejectTransaction: (id: string, reason: string) => Result;
  reverseTransaction: (id: string, reason: string) => Result<Transaction>;
  adjustTransaction: (id: string, input: { amount: number; effect: 1 | -1; reason: string }) => Result<Transaction>;
  transferFunds: (input: { fromId: string; toId: string; amount: number; date: string; description: string }) => Result;
  addAccount: (a: Omit<Account, "id" | "storedBalance">) => void;
  addFinanceCategory: (c: Omit<FinanceCategory, "id">) => void;
  recordContribution: (input: { studentId: string; period: string; amount: number; accountId: string }) => Result;
  acknowledgeExpense: (id: string) => void;

  // Assets
  addAsset: (a: Omit<Asset, "id" | "code">) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  addAssetCategory: (c: Omit<AssetCategory, "id">) => void;
  issueAsset: (input: Omit<AssetIssue, "id" | "returnedQuantity" | "damagedOnReturn" | "missingOnReturn" | "status">) => Result<AssetIssue>;
  returnAsset: (issueId: string, input: ReturnInput) => Result;
  recordDamage: (assetId: string, quantity: number, note: string) => Result;
  recordMissing: (assetId: string, quantity: number, note: string) => Result;
  addMaintenance: (m: Omit<AssetMaintenance, "id" | "status">) => Result;
  completeMaintenance: (id: string) => void;
  allocateToEvent: (eventId: string, assetId: string, quantity: number) => Result;
  removeAllocation: (id: string) => void;

  // Departments, development, mezmur
  addDepartment: (d: Omit<Department, "id">) => void;
  addDepartmentMember: (m: Omit<DepartmentMember, "id">) => void;
  removeDepartmentMember: (id: string) => void;
  addProject: (p: Omit<DevProject, "id" | "spent" | "progress">) => void;
  updateProjectProgress: (projectId: string, progress: number, note: string) => void;
  updateProject: (id: string, patch: Partial<DevProject>) => void;
  addMezmur: (m: Omit<Mezmur, "id" | "createdAt">) => Mezmur;
  updateMezmur: (id: string, patch: Partial<Mezmur>) => void;
  addPractice: (p: Omit<PracticeSchedule, "id">) => void;
  addArtsProgram: (p: Omit<ArtsProgram, "id">) => void;
  updateArtsProgram: (id: string, patch: Partial<ArtsProgram>) => void;

  // Events, tasks, announcements
  addEvent: (e: Omit<SchoolEvent, "id">) => void;
  updateEvent: (id: string, patch: Partial<SchoolEvent>) => void;
  addTask: (tk: Omit<Task, "id" | "createdAt">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  addAnnouncement: (a: Omit<Announcement, "id" | "createdAt" | "readBy" | "authorId" | "authorName">) => void;
  markAnnouncementRead: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (ids: string[]) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
}

export type DbState = DbData & DbActions;

function nowIso() {
  return new Date().toISOString().slice(0, 19);
}

function currentActor(users: User[]) {
  const id = useAuth.getState().userId ?? "system";
  const u = users.find((x) => x.id === id);
  return { id, name: u?.fullName ?? "ሥርዓት" };
}

/** Upgrades saved on-device data from older versions (v1 had a separate "admin" role). */
export function migrateDbData(persisted: unknown, version: number): DbData {
  const data = (persisted ?? {}) as Partial<DbData>;
  if (version < 2) {
    const toManager = <T extends { role?: string }>(x: T): T => (x.role === "admin" ? { ...x, role: "manager" } : x);
    if (data.users) data.users = data.users.map(toManager);
    if (data.notifications) data.notifications = data.notifications.map(toManager);
    if (data.announcements) {
      data.announcements = data.announcements.map((a) =>
        a.targetType === "role" && a.targetIds.includes("admin")
          ? { ...a, targetIds: [...new Set(a.targetIds.map((id) => (id === "admin" ? "manager" : id)))] }
          : a,
      );
    }
  }
  if (version < 3) upgradeSchoolDomain(data);
  return data as DbData;
}

export const useDb = create<DbState>()(
  persist(
    (set, get) => {
      const audit = (module: string, action: string, entity: string, entityId: string, details: string) => {
        const actor = currentActor(get().users);
        const log: AuditLog = {
          id: uuid(),
          userId: actor.id,
          userName: actor.name,
          module,
          action,
          entity,
          entityId,
          details,
          ip: "196.188.0.1",
          createdAt: nowIso(),
        };
        set((s) => ({ auditLogs: [log, ...s.auditLogs] }));
      };
      const nextRef = () => `ግብ-${String(get().transactions.length + 1).padStart(4, "0")}`;

      return {
        ...seedData(),
        resetDemo: () => set(seedData()),
        logAudit: audit,

        addUser: (u) => {
          if (get().users.some((x) => x.username.toLowerCase() === u.username.toLowerCase())) {
            return fail(t.errors.usernameTaken);
          }
          const user: User = { ...u, id: uuid(), failedLogins: 0, createdAt: todayIso() };
          set((s) => ({ users: [...s.users, user] }));
          audit("ተጠቃሚዎች", "መፍጠር", "ተጠቃሚ", user.id, `${user.fullName} (${t.roles[user.role]}) ተፈጠረ`);
          return ok(user);
        },
        updateUser: (id, patch) => {
          set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
          const u = get().users.find((x) => x.id === id);
          audit("ተጠቃሚዎች", "ማሻሻል", "ተጠቃሚ", id, `${u?.fullName ?? ""} — ሚና/መረጃ ተሻሻለ`);
        },
        toggleUserActive: (id) => {
          set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)) }));
          const u = get().users.find((x) => x.id === id);
          audit("ተጠቃሚዎች", u?.active ? "ማንቃት" : "ማገድ", "ተጠቃሚ", id, u?.fullName ?? "");
        },
        resetPassword: (id) => {
          const temp = generateTempPassword();
          set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, failedLogins: 0, mustChangePassword: true } : u)) }));
          const u = get().users.find((x) => x.id === id);
          audit("ተጠቃሚዎች", "የይለፍ ቃል ማስጀመር", "ተጠቃሚ", id, `${u?.fullName ?? ""} — ጊዜያዊ የይለፍ ቃል ተሰጠ`);
          return temp;
        },
        setStudentActive: (id, active) => {
          set((s) => ({
            students: s.students.map((x) => (x.id === id ? { ...x, status: active ? "active" : "inactive" } : x)),
            users: s.users.map((u) => (u.studentId === id ? { ...u, active } : u)),
          }));
          audit("ተማሪዎች", active ? "ማንቃት" : "ማገድ", "ተማሪ", id, get().students.find((x) => x.id === id)?.fullName ?? "");
        },
        bulkCreateStudentAccounts: (studentIds) => {
          const { users, students } = get();
          const created: User[] = [];
          for (const sid of studentIds) {
            if (users.some((u) => u.studentId === sid)) continue;
            const st = students.find((s) => s.id === sid);
            if (!st) continue;
            created.push({
              id: uuid(),
              username: st.code.replace("ቅሚ-", "stu"),
              fullName: st.fullName,
              email: "",
              phone: st.phone,
              role: "student",
              studentId: sid,
              active: true,
              failedLogins: 0,
              createdAt: todayIso(),
            });
          }
          set((s) => ({ users: [...s.users, ...created] }));
          audit("ተጠቃሚዎች", "በጅምላ መፍጠር", "ተጠቃሚ", "bulk", `${created.length} የተማሪ መለያዎች ተፈጠሩ`);
          return ok(created.length);
        },
        addAcademicYear: (y) => {
          const year: AcademicYear = { ...y, id: uuid(), status: "planned" };
          set((s) => ({ academicYears: [...s.academicYears, year] }));
          audit("የትምህርት ዘመን", "መፍጠር", "የትምህርት ዘመን", year.id, year.name);
        },
        activateAcademicYear: (id) => {
          set((s) => ({
            academicYears: s.academicYears.map((y) =>
              y.id === id ? { ...y, status: "active" } : y.status === "active" ? { ...y, status: "closed" } : y,
            ),
          }));
          audit("የትምህርት ዘመን", "ማንቃት", "የትምህርት ዘመን", id, get().academicYears.find((y) => y.id === id)?.name ?? "");
        },
        closeAcademicYear: (id) => {
          const y = get().academicYears.find((x) => x.id === id);
          if (!y) return fail(t.errors.notFound);
          if (y.status === "active") return fail(t.errors.yearActive);
          set((s) => ({ academicYears: s.academicYears.map((x) => (x.id === id ? { ...x, status: "closed" } : x)) }));
          audit("የትምህርት ዘመን", "መዝጋት", "የትምህርት ዘመን", id, y.name);
          return ok(undefined);
        },
        updateAcademicYear: (id, patch) => {
          set((s) => ({ academicYears: s.academicYears.map((y) => (y.id === id ? { ...y, ...patch } : y)) }));
          audit("የትምህርት ዘመን", "ማሻሻል", "የትምህርት ዘመን", id, get().academicYears.find((y) => y.id === id)?.name ?? "");
        },
        updateSettings: (patch) => {
          set((s) => ({ settings: { ...s.settings, ...patch } }));
          audit("ቅንብሮች", "ማሻሻል", "ቅንብር", Object.keys(patch).join(","), "የሥርዓት ቅንብሮች ተሻሻሉ");
        },
        runBackup: () => {
          set((s) => ({ settings: { ...s.settings, backupStatus: "ok", lastBackupAt: nowIso() } }));
          audit("ምትኬ", "ምትኬ መውሰድ", "ሥርዓት", "backup", "በእጅ የተወሰደ ምትኬ ተጠናቋል");
        },

        registerStudent: (input) => {
          const s = get();
          const activeYear = s.academicYears.find((y) => y.status === "active");
          const n = s.students.length + 1;
          const student: Student = {
            ...input,
            id: uuid(),
            code: `ቅሚ-${String(n).padStart(3, "0")}`,
            status: "active",
            joinDate: input.joinDate ?? todayIso(),
            enrollments: activeYear ? [{ academicYearId: activeYear.id, classId: input.classId, status: "enrolled" }] : [],
          };
          set((st) => ({ students: [...st.students, student] }));
          audit("ተማሪዎች", "መመዝገብ", "ተማሪ", student.id, `${student.fullName} ተመዘገበ`);
          return ok(student);
        },
        updateStudent: (id, patch) => {
          set((s) => ({ students: s.students.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
          audit("ተማሪዎች", "ማሻሻል", "ተማሪ", id, get().students.find((x) => x.id === id)?.fullName ?? "");
        },
        importStudents: (rows) => {
          let count = 0;
          for (const r of rows) {
            const res = get().registerStudent(r);
            if (res.ok) count++;
          }
          audit("ተማሪዎች", "ማስመጣት", "ተማሪ", "bulk", `${count} ተማሪዎች ከፋይል ገቡ`);
          return ok(count);
        },
        promoteStudents: (toYearId, promotions) => {
          set((s) => ({
            students: s.students.map((st) => {
              const p = promotions.find((x) => x.studentId === st.id);
              if (!p) return st;
              const prev = st.enrollments.map((e) =>
                e.classId === st.classId && e.status === "enrolled" ? { ...e, status: p.status } : e,
              );
              if (p.status === "graduated") return { ...st, status: "graduated", enrollments: prev };
              return {
                ...st,
                classId: p.toClassId,
                enrollments: [...prev, { academicYearId: toYearId, classId: p.toClassId, status: "enrolled" }],
              };
            }),
          }));
          audit("ተማሪዎች", "ማሳለፍ", "ተማሪ", "bulk", `${promotions.length} ተማሪዎች ወደ ቀጣዩ ዘመን ተዛወሩ`);
          return ok(promotions.length);
        },
        addClass: (c) => {
          const cls: SchoolClass = { ...c, id: uuid() };
          if (!canSaveClass(get().classes, cls)) return;
          set((s) => ({ classes: [...s.classes, cls] }));
          audit("ክፍሎች", "መፍጠር", "ክፍል", cls.id, cls.name);
        },
        updateClass: (id, patch) => {
          const current = get().classes.find(c => c.id === id);
          if (!current || !canSaveClass(get().classes, { ...current, ...patch })) return;
          set((s) => ({ classes: s.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
          audit("ክፍሎች", "ማሻሻል", "ክፍል", id, get().classes.find((c) => c.id === id)?.name ?? "");
        },

        submitAttendance: (input) => {
          const s = get();
          const cls = s.classes.find((c) => c.id === input.classId);
          if (!cls) return fail(t.errors.notFound);
          const key = { classId: input.classId, academicYearId: cls.academicYearId, date: input.date, sessionName: input.sessionName };
          if (input.clientUuid && s.attendanceSessions.some((x) => x.clientUuid === input.clientUuid)) {
            const existing = s.attendanceSessions.find((x) => x.clientUuid === input.clientUuid);
            if (existing) return ok(existing); // idempotent replay
          }
          if (findSessionConflict(s.attendanceSessions, key)) return fail(t.errors.attendanceConflict);
          const session: AttendanceSession = {
            ...key,
            id: uuid(),
            recordedBy: useAuth.getState().userId ?? "system",
            createdAt: nowIso(),
            ...(input.clientUuid ? { clientUuid: input.clientUuid } : {}),
            records: input.records,
          };
          set((st) => ({ attendanceSessions: [...st.attendanceSessions, session] }));
          audit("ክትትል", "መመዝገብ", "ክትትል", session.id, `${cls.name} — ${input.sessionName}`);
          return ok(session);
        },
        correctAttendance: (sessionId, records, reason) => {
          set((s) => ({
            attendanceSessions: s.attendanceSessions.map((x) => (x.id === sessionId ? { ...x, records } : x)),
          }));
          audit("ክትትል", "ማስተካከል", "ክትትል", sessionId, reason);
        },

        addTransaction: (input) => {
          if (!(input.amount > 0)) return fail(t.errors.amountInvalid);
          const { clientUuid: _c, ...rest } = input;
          const tx: Transaction = {
            ...rest,
            id: uuid(),
            ref: nextRef(),
            effect: effectForType(input.type),
            status: "Pending",
            createdBy: useAuth.getState().userId ?? "system",
            createdAt: nowIso(),
          };
          set((s) => ({ transactions: [tx, ...s.transactions] }));
          audit("ፋይናንስ", "መመዝገብ", "ግብይት", tx.id, `${tx.ref} — ${tx.description}`);
          const { settings } = get();
          if (tx.type === "Expense" && tx.amount > settings.expenseThreshold) {
            get().pushNotification({
              role: "manager",
              title: "ከገደብ በላይ ወጪ ተመዝግቧል",
              body: `${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ብር — ${tx.description}`,
              kind: "warning",
              link: "/finance",
            });
          }
          return ok(tx);
        },
        verifyTransaction: (id) => {
          const tx = get().transactions.find((x) => x.id === id);
          if (!tx) return fail(t.errors.notFound);
          if (tx.status !== "Pending") return fail(t.errors.notPending);
          const by = useAuth.getState().userId ?? "system";
          set((s) => ({
            transactions: s.transactions.map((x) =>
              x.id === id ? { ...x, status: "Verified", verifiedBy: by, verifiedAt: nowIso() } : x,
            ),
            accounts: s.accounts.map((a) => (a.id === tx.accountId ? { ...a, storedBalance: a.storedBalance + tx.effect * tx.amount } : a)),
          }));
          audit("ፋይናንስ", "ማረጋገጥ", "ግብይት", id, `${tx.ref} ተረጋገጠ`);
          return ok(undefined);
        },
        rejectTransaction: (id, reason) => {
          const tx = get().transactions.find((x) => x.id === id);
          if (!tx) return fail(t.errors.notFound);
          if (tx.status !== "Pending") return fail(t.errors.notPending);
          if (!reason.trim()) return fail(t.errors.reasonRequired);
          set((s) => ({
            transactions: s.transactions.map((x) => (x.id === id ? { ...x, status: "Rejected", rejectReason: reason } : x)),
          }));
          audit("ፋይናንስ", "ውድቅ ማድረግ", "ግብይት", id, `${tx.ref} — ${reason}`);
          return ok(undefined);
        },
        reverseTransaction: (id, reason) => {
          const original = get().transactions.find((x) => x.id === id);
          if (!original) return fail(t.errors.notFound);
          const err = validateCorrection(original, "Reversal", reason);
          if (err) return fail(correctionMessage[err]);
          const by = useAuth.getState().userId ?? "system";
          const rev = buildReversal(original, reason, { id: uuid(), ref: nextRef(), createdBy: by, createdAt: nowIso(), date: todayIso() });
          set((s) => ({
            transactions: [rev, ...s.transactions.map((x) => (x.id === id ? { ...x, status: "Reversed" as const } : x))],
            accounts: s.accounts.map((a) => (a.id === rev.accountId ? { ...a, storedBalance: a.storedBalance + rev.effect * rev.amount } : a)),
          }));
          audit("ፋይናንስ", "መቀልበስ", "ግብይት", id, `${original.ref} ተቀለበሰ — ${reason}`);
          return ok(rev);
        },
        adjustTransaction: (id, input) => {
          const original = get().transactions.find((x) => x.id === id);
          if (!original) return fail(t.errors.notFound);
          const err = validateCorrection(original, "Adjustment", input.reason, input.amount);
          if (err) return fail(correctionMessage[err]);
          const by = useAuth.getState().userId ?? "system";
          const adj: Transaction = {
            id: uuid(),
            ref: nextRef(),
            type: "Adjustment",
            effect: input.effect,
            accountId: original.accountId,
            ...(original.categoryId ? { categoryId: original.categoryId } : {}),
            amount: input.amount,
            date: todayIso(),
            description: original.description,
            paymentMethod: original.paymentMethod,
            status: "Verified",
            originalTransactionId: original.id,
            reason: input.reason,
            createdBy: by,
            createdAt: nowIso(),
            verifiedBy: by,
            verifiedAt: nowIso(),
          };
          set((s) => ({
            transactions: [adj, ...s.transactions],
            accounts: s.accounts.map((a) => (a.id === adj.accountId ? { ...a, storedBalance: a.storedBalance + adj.effect * adj.amount } : a)),
          }));
          audit("ፋይናንስ", "ማስተካከል", "ግብይት", id, `${original.ref} ተስተካከለ — ${input.reason}`);
          return ok(adj);
        },
        transferFunds: ({ fromId, toId, amount, date, description }) => {
          if (fromId === toId) return fail(t.errors.sameAccount);
          if (!(amount > 0)) return fail(t.errors.amountInvalid);
          const by = useAuth.getState().userId ?? "system";
          const group = uuid();
          const base = { amount, date, description, paymentMethod: "bank_transfer" as const, status: "Verified" as const, transferGroupId: group, createdBy: by, createdAt: nowIso(), verifiedBy: by, verifiedAt: nowIso() };
          const out: Transaction = { ...base, id: uuid(), ref: nextRef(), type: "TransferOut", effect: -1, accountId: fromId };
          const inn: Transaction = { ...base, id: uuid(), ref: `ግብ-${String(get().transactions.length + 2).padStart(4, "0")}`, type: "TransferIn", effect: 1, accountId: toId };
          // Both legs are saved together (single DB transaction on the server).
          set((s) => ({
            transactions: [inn, out, ...s.transactions],
            accounts: s.accounts.map((a) =>
              a.id === fromId ? { ...a, storedBalance: a.storedBalance - amount } : a.id === toId ? { ...a, storedBalance: a.storedBalance + amount } : a,
            ),
          }));
          audit("ፋይናንስ", "ማስተላለፍ", "ግብይት", group, `${amount} ብር ተላለፈ`);
          return ok(undefined);
        },
        addAccount: (a) => {
          const acc: Account = { ...a, id: uuid(), storedBalance: a.openingBalance };
          set((s) => ({ accounts: [...s.accounts, acc] }));
          audit("ፋይናንስ", "ሂሳብ መክፈት", "ሂሳብ", acc.id, acc.name);
        },
        addFinanceCategory: (c) => {
          set((s) => ({ financeCategories: [...s.financeCategories, { ...c, id: uuid() }] }));
          audit("ፋይናንስ", "ምድብ መፍጠር", "ምድብ", "-", c.name);
        },
        recordContribution: ({ studentId, period, amount, accountId }) => {
          if (get().contributions.some((c) => c.studentId === studentId && c.period === period)) {
            return fail(t.errors.duplicateContribution);
          }
          const st = get().students.find((s) => s.id === studentId);
          const res = get().addTransaction({
            type: "Income",
            accountId,
            categoryId: "fc-contrib",
            amount,
            date: todayIso(),
            description: `ወርሃዊ መዋጮ — ${st?.fullName ?? ""} (${period})`,
            paymentMethod: "cash",
            contributorId: studentId,
          });
          if (!res.ok) return res;
          const c: Contribution = { id: uuid(), studentId, period, amount, paidDate: todayIso(), transactionId: res.value.id };
          set((s) => ({ contributions: [...s.contributions, c] }));
          return ok(undefined);
        },
        acknowledgeExpense: (id) => {
          set((s) => ({ settings: { ...s.settings, acknowledgedExpenseIds: [...s.settings.acknowledgedExpenseIds, id] } }));
          audit("ፋይናንስ", "ግምገማ", "ግብይት", id, "ከገደብ በላይ ወጪ ታይቷል");
        },

        addAsset: (a) => {
          const asset: Asset = { ...a, id: uuid(), code: `ንብ-${String(get().assets.length + 1).padStart(3, "0")}` };
          set((s) => ({ assets: [...s.assets, asset] }));
          audit("ንብረት", "መመዝገብ", "ንብረት", asset.id, asset.name);
        },
        updateAsset: (id, patch) => {
          set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
          audit("ንብረት", "ማሻሻል", "ንብረት", id, get().assets.find((a) => a.id === id)?.name ?? "");
        },
        addAssetCategory: (c) => {
          set((s) => ({ assetCategories: [...s.assetCategories, { ...c, id: uuid() }] }));
        },
        issueAsset: (input) => {
          const asset = get().assets.find((a) => a.id === input.assetId);
          if (!asset) return fail(t.errors.notFound);
          if (!(input.quantity > 0)) return fail(t.errors.amountInvalid);
          if (input.quantity > availableQuantity(asset, get().assetIssues)) return fail(t.errors.insufficientStock);
          const issue: AssetIssue = { ...input, id: uuid(), returnedQuantity: 0, damagedOnReturn: 0, missingOnReturn: 0, status: "issued" };
          set((s) => ({ assetIssues: [issue, ...s.assetIssues] }));
          audit("ንብረት", "መስጠት", "ንብረት", asset.id, `${input.quantity} ${asset.name} ለ${input.recipientName} ተሰጠ`);
          return ok(issue);
        },
        returnAsset: (issueId, input) => {
          const issue = get().assetIssues.find((i) => i.id === issueId);
          if (!issue) return fail(t.errors.notFound);
          const asset = get().assets.find((a) => a.id === issue.assetId);
          if (!asset) return fail(t.errors.notFound);
          const err = validateReturn(issue, input);
          if (err === "exceeds_outstanding") return fail(t.errors.exceedsOutstanding);
          if (err === "empty") return fail(t.errors.emptyReturn);
          if (err === "negative") return fail(t.errors.negative);
          const next = applyReturn(asset, issue, input, todayIso());
          set((s) => ({
            assets: s.assets.map((a) => (a.id === asset.id ? next.asset : a)),
            assetIssues: s.assetIssues.map((i) => (i.id === issueId ? next.issue : i)),
          }));
          audit("ንብረት", "መመለስ", "ንብረት", asset.id, `${asset.name}፦ ${input.returned} ተመለሰ፣ ${input.damaged} ተበላሸ፣ ${input.missing} ጠፋ`);
          return ok(undefined);
        },
        recordDamage: (assetId, quantity, note) => {
          const asset = get().assets.find((a) => a.id === assetId);
          if (!asset) return fail(t.errors.notFound);
          if (!(quantity > 0)) return fail(t.errors.amountInvalid);
          if (quantity > availableQuantity(asset, get().assetIssues)) return fail(t.errors.insufficientStock);
          set((s) => ({ assets: s.assets.map((a) => (a.id === assetId ? { ...a, damagedQuantity: a.damagedQuantity + quantity } : a)) }));
          audit("ንብረት", "ብልሽት መመዝገብ", "ንብረት", assetId, `${quantity} ${asset.name} ተበላሸ — ${note}`);
          return ok(undefined);
        },
        recordMissing: (assetId, quantity, note) => {
          const asset = get().assets.find((a) => a.id === assetId);
          if (!asset) return fail(t.errors.notFound);
          if (!(quantity > 0)) return fail(t.errors.amountInvalid);
          if (quantity > availableQuantity(asset, get().assetIssues)) return fail(t.errors.insufficientStock);
          set((s) => ({ assets: s.assets.map((a) => (a.id === assetId ? { ...a, totalQuantity: a.totalQuantity - quantity } : a)) }));
          audit("ንብረት", "መጥፋት መመዝገብ", "ንብረት", assetId, `${quantity} ${asset.name} ጠፋ — ${note}`);
          return ok(undefined);
        },
        addMaintenance: (m) => {
          const asset = get().assets.find((a) => a.id === m.assetId);
          if (!asset) return fail(t.errors.notFound);
          if (m.quantity > asset.damagedQuantity) return fail(t.errors.insufficientStock);
          set((s) => ({ assetMaintenance: [{ ...m, id: uuid(), status: "in_progress" }, ...s.assetMaintenance] }));
          audit("ንብረት", "ጥገና መመዝገብ", "ንብረት", m.assetId, `${asset.name} — ${m.description}`);
          return ok(undefined);
        },
        completeMaintenance: (id) => {
          const m = get().assetMaintenance.find((x) => x.id === id);
          if (!m || m.status === "completed") return;
          set((s) => ({
            assetMaintenance: s.assetMaintenance.map((x) => (x.id === id ? { ...x, status: "completed" } : x)),
            assets: s.assets.map((a) => (a.id === m.assetId ? { ...a, damagedQuantity: Math.max(0, a.damagedQuantity - m.quantity) } : a)),
          }));
          audit("ንብረት", "ጥገና ማጠናቀቅ", "ንብረት", m.assetId, m.description);
        },
        allocateToEvent: (eventId, assetId, quantity) => {
          const s = get();
          const asset = s.assets.find((a) => a.id === assetId);
          if (!asset) return fail(t.errors.notFound);
          if (!(quantity > 0)) return fail(t.errors.amountInvalid);
          if (quantity > allocatableForEvent(asset, s.assetIssues, s.eventAllocations, s.events, eventId)) {
            return fail(t.errors.insufficientStock);
          }
          set((st) => ({ eventAllocations: [...st.eventAllocations, { id: uuid(), eventId, assetId, quantity }] }));
          audit("ንብረት", "ለዝግጅት መመደብ", "ንብረት", assetId, `${quantity} ${asset.name}`);
          return ok(undefined);
        },
        removeAllocation: (id) => set((s) => ({ eventAllocations: s.eventAllocations.filter((a) => a.id !== id) })),

        addDepartment: (d) => {
          set((s) => ({ departments: [...s.departments, { ...d, id: uuid() }] }));
          audit("መምሪያዎች", "መፍጠር", "መምሪያ", "-", d.name);
        },
        addDepartmentMember: (m) => {
          set((s) => ({ departmentMembers: [...s.departmentMembers, { ...m, id: uuid() }] }));
          audit("መምሪያዎች", "አባል መጨመር", "መምሪያ", m.departmentId, m.name);
        },
        removeDepartmentMember: (id) => {
          const m = get().departmentMembers.find((x) => x.id === id);
          set((s) => ({ departmentMembers: s.departmentMembers.filter((x) => x.id !== id) }));
          audit("መምሪያዎች", "አባል ማስወገድ", "መምሪያ", m?.departmentId ?? "", m?.name ?? "");
        },
        addProject: (p) => {
          set((s) => ({ devProjects: [{ ...p, id: uuid(), spent: 0, progress: 0 }, ...s.devProjects] }));
          audit("ልማት", "መፍጠር", "ፕሮጀክት", "-", p.title);
        },
        updateProjectProgress: (projectId, progress, note) => {
          const actor = currentActor(get().users);
          const clamped = Math.max(0, Math.min(100, Math.round(progress)));
          set((s) => ({
            devProjects: s.devProjects.map((p) =>
              p.id === projectId ? { ...p, progress: clamped, status: clamped === 100 ? "completed" : p.status === "planned" ? "active" : p.status } : p,
            ),
            progressReports: [{ id: uuid(), projectId, date: todayIso(), progress: clamped, note, author: actor.name }, ...s.progressReports],
          }));
          audit("ልማት", "ሂደት ማሻሻል", "ፕሮጀክት", projectId, `ሂደት ${clamped}% ደረሰ`);
        },
        updateProject: (id, patch) => set((s) => ({ devProjects: s.devProjects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
        addMezmur: (m) => {
          const mz: Mezmur = { ...m, id: uuid(), createdAt: todayIso() };
          set((s) => ({ mezmurs: [mz, ...s.mezmurs] }));
          audit("መዝሙር", "መፍጠር", "መዝሙር", mz.id, mz.title);
          return mz;
        },
        updateMezmur: (id, patch) => {
          set((s) => ({ mezmurs: s.mezmurs.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
          audit("መዝሙር", "ማሻሻል", "መዝሙር", id, get().mezmurs.find((m) => m.id === id)?.title ?? "");
        },
        addPractice: (p) => set((s) => ({ practiceSchedules: [...s.practiceSchedules, { ...p, id: uuid() }] })),
        addArtsProgram: (p) => set((s) => ({ artsPrograms: [...s.artsPrograms, { ...p, id: uuid() }] })),
        updateArtsProgram: (id, patch) => set((s) => ({ artsPrograms: s.artsPrograms.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

        addEvent: (e) => {
          set((s) => ({ events: [...s.events, { ...e, id: uuid() }] }));
          audit("ዝግጅቶች", "መፍጠር", "ዝግጅት", "-", e.title);
        },
        updateEvent: (id, patch) => set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
        addTask: (tk) => {
          set((s) => ({ tasks: [{ ...tk, id: uuid(), createdAt: todayIso() }, ...s.tasks] }));
          audit("ተግባራት", "መፍጠር", "ተግባር", "-", tk.title);
        },
        updateTaskStatus: (id, status) => {
          set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, status } : x)) }));
          audit("ተግባራት", "ሁኔታ መቀየር", "ተግባር", id, t.status[status]);
        },
        addAnnouncement: (a) => {
          const actor = currentActor(get().users);
          const an: Announcement = { ...a, id: uuid(), createdAt: nowIso(), readBy: [actor.id], authorId: actor.id, authorName: actor.name };
          set((s) => ({ announcements: [an, ...s.announcements] }));
          audit("ማስታወቂያዎች", "መለጠፍ", "ማስታወቂያ", an.id, an.title);
        },
        markAnnouncementRead: (id) => {
          const uid = useAuth.getState().userId;
          if (!uid) return;
          set((s) => ({
            announcements: s.announcements.map((a) => (a.id === id && !a.readBy.includes(uid) ? { ...a, readBy: [...a.readBy, uid] } : a)),
          }));
        },
        markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotificationsRead: (ids) => set((s) => ({ notifications: s.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)) })),
        pushNotification: (n) => set((s) => ({ notifications: [{ ...n, id: uuid(), createdAt: nowIso(), read: false }, ...s.notifications] })),
      };
    },
    {
      name: "ssms-db-v1",
      version: 3,
      // v3 upgrades Sunday School domain defaults without resetting recorded data.
      migrate: (persisted, version) => migrateDbData(persisted, version),
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const out: Partial<DbData> = {};
        for (const k of Object.keys(seedData()) as Array<keyof DbData>) {
          (out as Record<string, unknown>)[k] = s[k];
        }
        return out as DbData;
      },
    },
  ),
);
