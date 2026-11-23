export type Role =
  | "manager"
  | "finance"
  | "asset"
  | "teacher"
  | "development"
  | "mezmur"
  | "student";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  departmentId?: string;
  studentId?: string;
  classIds?: string[];
  lastLogin?: string;
  failedLogins: number;
  /** Set after an admin reset; the user must choose a new password at next sign-in. */
  mustChangePassword?: boolean;
  createdAt: string;
}

export type AcademicYearStatus = "planned" | "active" | "closed";
export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
}

export interface SchoolClass {
  id: string;
  name: string;
  level: string;
  academicYearId: string;
  teacherIds: string[];
  room: string;
  schedule: string;
  color: string;
}

export type Gender = "M" | "F";
export type StudentStatus = "active" | "inactive" | "graduated";
export type EnrollmentStatus = "enrolled" | "promoted" | "repeated" | "graduated";

export interface Enrollment {
  academicYearId: string;
  classId: string;
  status: EnrollmentStatus;
}

export interface Student {
  id: string;
  code: string;
  fullName: string;
  christianName: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  photoConsent: boolean;
  classId: string;
  status: StudentStatus;
  joinDate: string;
  notes: string;
  enrollments: Enrollment[];
}

export type AttendanceStatus = "present" | "absent" | "late";
export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}
export interface AttendanceSession {
  id: string;
  classId: string;
  academicYearId: string;
  date: string;
  sessionName: string;
  recordedBy: string;
  createdAt: string;
  clientUuid?: string;
  records: AttendanceRecord[];
}

export type AccountType = "cash" | "bank";
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  openingBalance: number;
  /** Balance as stored by the server; compared against computed balance in reconciliation. */
  storedBalance: number;
}

export type CategoryKind = "income" | "expense";
export interface FinanceCategory {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
}

export type TransactionType =
  | "Income"
  | "Expense"
  | "Reversal"
  | "Adjustment"
  | "TransferIn"
  | "TransferOut";
export type TransactionStatus = "Pending" | "Verified" | "Rejected" | "Reversed";
export type PaymentMethod = "cash" | "bank_transfer" | "mobile_money" | "cheque";

export interface Transaction {
  id: string;
  ref: string;
  type: TransactionType;
  /** +1 increases the account balance, -1 decreases it. Amount is always positive. */
  effect: 1 | -1;
  accountId: string;
  categoryId?: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
  receiptNo?: string;
  receiptFile?: string;
  status: TransactionStatus;
  rejectReason?: string;
  originalTransactionId?: string;
  reason?: string;
  transferGroupId?: string;
  eventId?: string;
  projectId?: string;
  contributorId?: string;
  createdBy: string;
  createdAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Contribution {
  id: string;
  studentId: string;
  /** Ethiopian period "YYYY-MM" */
  period: string;
  amount: number;
  paidDate: string;
  transactionId?: string;
}

export type AssetCondition = "new" | "good" | "fair" | "poor";
export interface AssetCategory {
  id: string;
  name: string;
  color: string;
}
export interface Asset {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  totalQuantity: number;
  damagedQuantity: number;
  condition: AssetCondition;
  location: string;
  unitValue: number;
  acquiredDate: string;
  notes: string;
}

export type IssueStatus = "issued" | "partial" | "returned";
export interface AssetIssue {
  id: string;
  assetId: string;
  quantity: number;
  recipientName: string;
  recipientType: "student" | "member";
  recipientId?: string;
  issueDate: string;
  dueDate: string;
  returnedQuantity: number;
  damagedOnReturn: number;
  missingOnReturn: number;
  returnDate?: string;
  status: IssueStatus;
  eventId?: string;
  note: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  quantity: number;
  description: string;
  cost: number;
  date: string;
  vendor: string;
  status: "in_progress" | "completed";
}

export interface EventAllocation {
  id: string;
  eventId: string;
  assetId: string;
  quantity: number;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  leaderName: string;
  color: string;
  icon: string;
}

export interface DepartmentMember {
  id: string;
  departmentId: string;
  name: string;
  roleTitle: string;
  phone: string;
  joinedDate: string;
}

export type ProjectStatus = "planned" | "active" | "completed" | "on_hold";
export interface DevProject {
  id: string;
  title: string;
  description: string;
  goal: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  progress: number;
  status: ProjectStatus;
  leadName: string;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  date: string;
  progress: number;
  note: string;
  author: string;
}

export interface Mezmur {
  id: string;
  title: string;
  category: string;
  lyrics: string;
  author: string;
  audioUrl?: string;
  videoUrl?: string;
  published: boolean;
  createdAt: string;
}

export interface PracticeSchedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  mezmurIds: string[];
  trainer: string;
}

export type ArtsType = "drama" | "poem" | "mezmur" | "exhibition";
export interface ArtsProgram {
  id: string;
  title: string;
  type: ArtsType;
  date: string;
  description: string;
  status: "planned" | "rehearsing" | "done";
}

export type EventType = "festival" | "holiday" | "program" | "meeting" | "trip";
export interface SchoolEvent {
  id: string;
  title: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  budget: number;
  status: "planned" | "preparing" | "completed";
}

export type TaskStatus = "Pending" | "InProgress" | "Completed";
export type Priority = "low" | "normal" | "high";
export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeName: string;
  assigneeUserId?: string;
  departmentId?: string;
  eventId?: string;
  dueDate: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
}

export type AnnouncementTargetType = "all" | "role" | "class" | "department";
export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "urgent";
  targetType: AnnouncementTargetType;
  targetIds: string[];
  authorId: string;
  authorName: string;
  departmentId?: string;
  createdAt: string;
  readBy: string[];
}

export interface AppNotification {
  id: string;
  /** Recipient user id, or a role-wide notification */
  userId?: string;
  role?: Role;
  title: string;
  body: string;
  kind: "info" | "success" | "warning" | "danger";
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ip: string;
  createdAt: string;
}

export interface SystemSettings {
  schoolName: string;
  expenseThreshold: number;
  sessionNames: string[];
  defaultCalendar: "et" | "gc";
  defaultLanguage: "am" | "om" | "en";
  monthlyContribution: number;
  lastBackupAt: string;
  backupStatus: "ok" | "failed" | "running";
  acknowledgedExpenseIds: string[];
}

export type SyncKind = "attendance" | "task_update" | "asset_issue" | "asset_return";
export type SyncStatus = "pending" | "syncing" | "error" | "conflict" | "synced";
export interface SyncItem {
  clientUuid: string;
  kind: SyncKind;
  label: string;
  payload: unknown;
  createdAt: string;
  status: SyncStatus;
  error?: string;
}
