/* Realistic Amharic sample data. Dates are stored as Gregorian ISO strings and shown in the Ethiopian calendar. */
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
  AttendanceSession,
  AttendanceStatus,
  AuditLog,
  Contribution,
  Department,
  DepartmentMember,
  DevProject,
  EventAllocation,
  FinanceCategory,
  Mezmur,
  PracticeSchedule,
  ProgressReport,
  SchoolClass,
  SchoolEvent,
  Student,
  SystemSettings,
  Task,
  Transaction,
  User,
} from "@/types/models";
import { computeBalance } from "@/lib/rules/finance";
import { academicYearDates } from "@/lib/ethiopian-calendar";
import { TEACHING_WEEKDAYS } from "@/lib/rules/school-domain";
import { t } from "@/i18n";

export const SCHOOL_NAME = "ቅዱስ ሚካኤል ሰንበት ትምህርት ቤት";
export const DEMO_PASSWORD = "1234";
export const DEMO_TODAY = "2026-11-22";

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261122);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T;

export const academicYears: AcademicYear[] = [
  { id: "ay-2018", name: "2018 ዓ.ም", startDate: academicYearDates(2018).startDate, endDate: academicYearDates(2018).endDate, status: "closed" },
  { id: "ay-2019", name: "2019 ዓ.ም", startDate: academicYearDates(2019).startDate, endDate: academicYearDates(2019).endDate, status: "active" },
  { id: "ay-2020", name: "2020 ዓ.ም", startDate: academicYearDates(2020).startDate, endDate: academicYearDates(2020).endDate, status: "planned" },
];

export const users: User[] = [
  { id: "u-manager", username: "manager", fullName: "ሔለን ገብረ ሥላሴ", email: "manager@kidusmikael.org", phone: "0912345678", role: "manager", active: true, failedLogins: 0, lastLogin: "2026-11-22T07:40:00", createdAt: "2025-08-01" },
  { id: "u-finance", username: "finance", fullName: "ዳዊት አለማየሁ", email: "finance@kidusmikael.org", phone: "0913456789", role: "finance", active: true, failedLogins: 1, lastLogin: "2026-11-20T16:05:00", createdAt: "2025-08-03" },
  { id: "u-asset", username: "asset", fullName: "መሠረት ታደሰ", email: "asset@kidusmikael.org", phone: "0914567890", role: "asset", active: true, failedLogins: 0, lastLogin: "2026-11-19T10:12:00", createdAt: "2025-08-03" },
  { id: "u-teacher", username: "teacher", fullName: "ቀሲስ ሰሎሞን በቀለ", email: "solomon@kidusmikael.org", phone: "0915678901", role: "teacher", active: true, classIds: ["c-1", "c-2"], failedLogins: 0, lastLogin: "2026-11-15T08:01:00", createdAt: "2025-08-05" },
  { id: "u-teacher2", username: "birhanu", fullName: "ብርሃኑ ወልደ ማርያም", email: "birhanu@kidusmikael.org", phone: "0916789012", role: "teacher", active: true, classIds: ["c-2", "c-3"], failedLogins: 3, lastLogin: "2026-11-15T08:10:00", createdAt: "2025-08-05" },
  { id: "u-teacher3", username: "fasika", fullName: "ፋሲካ ኃይሌ", email: "fasika@kidusmikael.org", phone: "0917890123", role: "teacher", active: true, classIds: ["c-3"], failedLogins: 0, lastLogin: "2026-11-15T08:05:00", createdAt: "2025-08-06" },
  { id: "u-dev", username: "development", fullName: "ኤልያስ ገበየሁ", email: "elias@kidusmikael.org", phone: "0918901234", role: "development", departmentId: "d-dev", active: true, failedLogins: 0, lastLogin: "2026-11-18T19:30:00", createdAt: "2025-08-10" },
  { id: "u-mezmur", username: "mezmur", fullName: "ማርታ ደምሴ", email: "marta@kidusmikael.org", phone: "0919012345", role: "mezmur", departmentId: "d-mezmur", active: true, failedLogins: 0, lastLogin: "2026-11-21T15:45:00", createdAt: "2025-08-10" },
  { id: "u-student", username: "student", fullName: "ሚካኤል ተስፋዬ", email: "michael.s@kidusmikael.org", phone: "0920123456", role: "student", studentId: "s-1", active: true, failedLogins: 0, lastLogin: "2026-11-21T20:00:00", createdAt: "2026-09-15" },
  { id: "u-old", username: "abebe", fullName: "አበበ ከበደ", email: "abebe@kidusmikael.org", phone: "0921234567", role: "teacher", active: false, classIds: [], failedLogins: 5, createdAt: "2024-09-01" },
];

export const sessionNames = [...t.domain.sessions];

export const classes: SchoolClass[] = t.domain.classes.map((c, i) => ({
  id: `c-${i + 1}`, ...c, academicYearId: "ay-2019",
  teacherIds: i === 0 ? ["u-teacher"] : i === 1 ? ["u-teacher", "u-teacher2"] : ["u-teacher2", "u-teacher3"],
  room: `ክፍል ${i + 1}`, schedule: sessionNames.join("፣ "), color: ["gold", "orange", "brand"][i] ?? "brand",
}));

const MALE = ["ሚካኤል", "ዳንኤል", "ናትናኤል", "ዮናታን", "አቤል", "ሳሙኤል", "ኢዮብ", "በረከት", "ሔኖክ", "ኪሩቤል", "ቢንያም", "ያሬድ"] as const;
const FEMALE = ["ማርታ", "ሣራ", "ቤተልሔም", "ሕይወት", "ሩት", "ኤደን", "ሜሮን", "ቅድስት", "ፀጋ", "ሐና", "ትዕግሥት", "ማኅሌት"] as const;
const FATHERS = ["ተስፋዬ", "ገብረ መድኅን", "አበበ", "ኃይሉ", "ወልደ ሥላሴ", "በቀለ", "ታደሰ", "ደምሴ", "ሙሉጌታ", "ጌታቸው", "አለሙ", "ሽፈራው"] as const;
const CHRISTIAN_M = ["ወልደ ሚካኤል", "ገብረ ማርያም", "ኃይለ ሥላሴ", "ተክለ ሃይማኖት", "ወልደ ገብርኤል", "ገብረ ኢየሱስ"] as const;
const CHRISTIAN_F = ["ወለተ ማርያም", "ወለተ ጊዮርጊስ", "ኪዳነ ማርያም", "ወለተ ሥላሴ", "ወለተ ሚካኤል", "አመተ ማርያም"] as const;
const AREAS = ["ቦሌ፣ ወረዳ 03", "ቦሌ፣ ወረዳ 06", "የካ፣ ወረዳ 11", "ቂርቆስ፣ ወረዳ 02", "ለሚ ኩራ፣ ወረዳ 08", "አቃቂ ቃሊቲ፣ ወረዳ 05"] as const;
const RELATIONS = ["አባት", "እናት", "አጎት", "አክስት", "ታላቅ ወንድም", "ታላቅ እህት"] as const;
const BIRTH_YEAR_BY_CLASS: Record<string, number> = { "c-1": 2017, "c-2": 2014, "c-3": 2005 };

export const students: Student[] = Array.from({ length: 48 }, (_, i) => {
  const female = i % 2 === 1;
  const first = female ? FEMALE[(i * 5) % FEMALE.length] : MALE[(i * 7) % MALE.length];
  const father = FATHERS[(i * 3 + Math.floor(i / 12)) % FATHERS.length];
  const classId = `c-${(i % 3) + 1}`;
  const by = (BIRTH_YEAR_BY_CLASS[classId] ?? 2010) + (Math.floor(i / 3) % 2);
  const n = String(i + 1).padStart(3, "0");
  const isNew = i >= 42;
  return {
    id: `s-${i + 1}`,
    code: `ቅሚ-${n}`,
    fullName: i === 0 ? "ሚካኤል ተስፋዬ" : `${first} ${father}`,
    christianName: female ? pick(CHRISTIAN_F) : pick(CHRISTIAN_M),
    gender: female ? "F" : "M",
    birthDate: `${by}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
    phone: classId === "c-1" || classId === "c-2" ? "" : `09${String(30000000 + i * 104729).slice(0, 8)}`,
    address: pick(AREAS),
    guardianName: `${pick(FATHERS)} ${pick(FATHERS)}`,
    guardianPhone: `09${String(11000000 + i * 7919).slice(0, 8)}`,
    guardianRelation: pick(RELATIONS),
    photoConsent: rand() > 0.25,
    classId,
    status: i === 47 ? "inactive" : "active",
    joinDate: isNew ? "2026-09-20" : "2025-09-21",
    notes: "",
    enrollments: isNew
      ? [{ academicYearId: "ay-2019", classId, status: "enrolled" }]
      : [
          { academicYearId: "ay-2018", classId: `c-${Math.max(1, (i % 3))}`, status: "promoted" },
          { academicYearId: "ay-2019", classId, status: "enrolled" },
        ],
  } satisfies Student;
});

const TEACHING_DATES = ["2026-09-13", "2026-09-15", "2026-09-17", "2026-09-19", "2026-09-20", "2026-10-06", "2026-10-08", "2026-10-10", "2026-11-08", "2026-11-10", "2026-11-12", "2026-11-14", "2026-11-15"];

export const attendanceSessions: AttendanceSession[] = classes.flatMap((c) =>
  TEACHING_DATES.map((date, wi) => {
    const teacher = c.teacherIds[0] ?? "u-teacher";
    return {
      id: `att-${c.id}-${date}`,
      classId: c.id,
      academicYearId: "ay-2019",
      date,
      sessionName: sessionNames[TEACHING_WEEKDAYS.indexOf(new Date(`${date}T12:00:00Z`).getUTCDay() as 0 | 2 | 4 | 6)] ?? t.domain.sessions[3] ?? "",
      recordedBy: teacher,
      createdAt: `${date}T${new Date(`${date}T12:00:00Z`).getUTCDay() === 0 ? "09:30" : "15:30"}:00`,
      records: students
        .filter((s) => s.classId === c.id && s.status === "active")
        .map((s) => {
          const r = rand();
          const status: AttendanceStatus = r < 0.78 + wi * 0.01 ? "present" : r < 0.9 ? "late" : "absent";
          return { studentId: s.id, status };
        }),
    };
  }),
);

export const accounts: Account[] = [
  { id: "acc-cash", name: "ጥሬ ገንዘብ ካዝና", type: "cash", openingBalance: 12000, storedBalance: 0 },
  { id: "acc-cbe", name: "የኢትዮጵያ ንግድ ባንክ", type: "bank", bankName: "የኢትዮጵያ ንግድ ባንክ", accountNumber: "1000123456789", openingBalance: 85000, storedBalance: 0 },
  { id: "acc-awash", name: "አዋሽ ባንክ — የልማት ሂሳብ", type: "bank", bankName: "አዋሽ ባንክ", accountNumber: "0132045678901", openingBalance: 40000, storedBalance: 0 },
];

export const financeCategories: FinanceCategory[] = [
  ...["fc-contrib", "fc-ticket", "fc-festival", "fc-donation", "fc-sales", "fc-development"].map((id, i) => ({ id, name: t.domain.incomeSources[i] ?? "", kind: "income" as const, color: ["success", "orange", "gold", "teal", "sky", "lime"][i] ?? "brand" })),
  { id: "fc-edu", name: "የትምህርት መርጃ መሣሪያዎች", kind: "expense", color: "brand" },
  { id: "fc-fest-exp", name: "የበዓል ዝግጅት", kind: "expense", color: "rose" },
  { id: "fc-repair", name: "ጥገና", kind: "expense", color: "orange" },
  { id: "fc-office", name: "የቢሮ ዕቃዎች", kind: "expense", color: "sky" },
  { id: "fc-transport", name: "ትራንስፖርት", kind: "expense", color: "teal" },
  { id: "fc-project", name: "የልማት ፕሮጀክት", kind: "expense", color: "lime" },
];

type TxSeed = Omit<Transaction, "ref" | "createdBy" | "createdAt" | "effect"> & { effect?: 1 | -1 };
const txSeeds: TxSeed[] = [
  { id: "t-1", type: "Income", accountId: "acc-cbe", categoryId: "fc-contrib", amount: 2350, date: "2026-09-21", description: "የመስከረም ወር የአባላት መዋጮ", paymentMethod: "bank_transfer", receiptNo: "ደ-0001", status: "Verified" },
  { id: "t-2", type: "Income", accountId: "acc-cash", categoryId: "fc-festival", amount: 8600, date: "2026-09-27", description: "የመስቀል በዓል ስጦታ ስብስብ", paymentMethod: "cash", receiptNo: "ደ-0002", status: "Verified", eventId: "ev-meskel" },
  { id: "t-3", type: "Expense", accountId: "acc-cash", categoryId: "fc-fest-exp", amount: 3200, date: "2026-09-25", description: "ለደመራ ዝግጅት ችቦና ጌጣጌጥ", paymentMethod: "cash", receiptNo: "ወ-0001", status: "Verified", eventId: "ev-meskel" },
  { id: "t-4", type: "Expense", accountId: "acc-cbe", categoryId: "fc-edu", amount: 4750, date: "2026-10-02", description: "የሕፃናት የትምህርት መጻሕፍት ግዢ", paymentMethod: "bank_transfer", receiptNo: "ወ-0002", status: "Verified" },
  { id: "t-5", type: "Income", accountId: "acc-cbe", categoryId: "fc-donation", amount: 25000, date: "2026-10-05", description: "ከበጎ አድራጊ ምእመን የተገኘ ልገሳ", paymentMethod: "bank_transfer", receiptNo: "ደ-0003", status: "Verified", projectId: "p-library" },
  { id: "t-6", type: "Income", accountId: "acc-cbe", categoryId: "fc-contrib", amount: 2600, date: "2026-10-19", description: "የጥቅምት ወር የአባላት መዋጮ", paymentMethod: "bank_transfer", receiptNo: "ደ-0004", status: "Verified" },
  { id: "t-7", type: "Expense", accountId: "acc-cash", categoryId: "fc-repair", amount: 1800, date: "2026-10-12", description: "የከበሮ ቆዳ ጥገና", paymentMethod: "cash", receiptNo: "ወ-0003", status: "Verified" },
  { id: "t-8", type: "Expense", accountId: "acc-awash", categoryId: "fc-project", amount: 12400, date: "2026-10-20", description: "ለቤተ መጻሕፍት መደርደሪያ ግዢ", paymentMethod: "cheque", receiptNo: "ወ-0004", status: "Verified", projectId: "p-library" },
  { id: "t-9", type: "Income", accountId: "acc-cash", categoryId: "fc-sales", amount: 1450, date: "2026-10-26", description: "የመዝሙር ደብተርና ሻማ ሽያጭ", paymentMethod: "cash", receiptNo: "ደ-0005", status: "Verified" },
  { id: "t-10", type: "Expense", accountId: "acc-cash", categoryId: "fc-office", amount: 950, date: "2026-10-28", description: "የወረቀትና ቀለም ግዢ", paymentMethod: "cash", receiptNo: "ወ-0005", status: "Reversed" },
  { id: "t-11", type: "Reversal", effect: 1, accountId: "acc-cash", categoryId: "fc-office", amount: 950, date: "2026-10-30", description: "የወረቀትና ቀለም ግዢ", paymentMethod: "cash", status: "Verified", originalTransactionId: "t-10", reason: "ደረሰኙ በስህተት ሁለት ጊዜ ተመዝግቧል" },
  { id: "t-12", type: "TransferOut", accountId: "acc-cash", amount: 5000, date: "2026-11-02", description: "ከካዝና ወደ ንግድ ባንክ ገቢ", paymentMethod: "bank_transfer", status: "Verified", transferGroupId: "tg-1" },
  { id: "t-13", type: "TransferIn", accountId: "acc-cbe", amount: 5000, date: "2026-11-02", description: "ከካዝና ወደ ንግድ ባንክ ገቢ", paymentMethod: "bank_transfer", status: "Verified", transferGroupId: "tg-1" },
  { id: "t-14", type: "Expense", accountId: "acc-cbe", categoryId: "fc-fest-exp", amount: 18500, date: "2026-11-10", description: "ለኅዳር ጽዮን የመዘምራን ነጭ ልብስ ስፌት", paymentMethod: "bank_transfer", receiptNo: "ወ-0006", status: "Verified", eventId: "ev-hidar-tsion" },
  { id: "t-15", type: "Expense", accountId: "acc-cash", categoryId: "fc-transport", amount: 1200, date: "2026-11-14", description: "ለመዘምራን የልምምድ ትራንስፖርት", paymentMethod: "cash", receiptNo: "ወ-0007", status: "Verified" },
  { id: "t-16", type: "Income", accountId: "acc-cbe", categoryId: "fc-contrib", amount: 1850, date: "2026-11-16", description: "የኅዳር ወር የአባላት መዋጮ (ከፊል)", paymentMethod: "mobile_money", receiptNo: "ደ-0006", status: "Pending" },
  { id: "t-17", type: "Income", accountId: "acc-cash", categoryId: "fc-ticket", amount: 3600, date: "2026-11-18", description: "የኅዳር ጽዮን ጉዞ ትኬት ሽያጭ", paymentMethod: "cash", receiptNo: "ደ-0007", status: "Pending", eventId: "ev-hidar-tsion" },
  { id: "t-18", type: "Expense", accountId: "acc-cash", categoryId: "fc-edu", amount: 640, date: "2026-11-19", description: "ለሕፃናት የስዕል ቀለሞች", paymentMethod: "cash", receiptNo: "ወ-0008", status: "Pending" },
  { id: "t-19", type: "Expense", accountId: "acc-awash", categoryId: "fc-project", amount: 7200, date: "2026-11-20", description: "የድምፅ ማጉያ ቅድመ ክፍያ", paymentMethod: "cheque", receiptNo: "ወ-0009", status: "Pending", projectId: "p-instruments" },
  { id: "t-20", type: "Expense", accountId: "acc-cash", categoryId: "fc-office", amount: 2300, date: "2026-11-11", description: "ያልተረጋገጠ የሻይ ቡና ወጪ", paymentMethod: "cash", status: "Rejected", rejectReason: "ደረሰኝ አልቀረበም" },
  { id: "t-22", type: "Income", accountId: "acc-awash", categoryId: "fc-development", amount: 4200, date: "2026-11-21", description: "ከልማት ሥራዎች ሽያጭ", paymentMethod: "cash", receiptNo: "ደ-0009", status: "Verified" },
  { id: "t-21", type: "Income", accountId: "acc-awash", categoryId: "fc-donation", amount: 15000, date: "2026-11-05", description: "ለመዝሙር መሣሪያዎች ፕሮጀክት ልገሳ", paymentMethod: "bank_transfer", receiptNo: "ደ-0008", status: "Verified", projectId: "p-instruments" },
];

export const transactions: Transaction[] = txSeeds.map((s, i) => ({
  ...s,
  effect: s.effect ?? (s.type === "Income" || s.type === "TransferIn" ? 1 : -1),
  ref: `ግብ-${String(i + 1).padStart(4, "0")}`,
  createdBy: "u-finance",
  createdAt: `${s.date}T10:00:00`,
  ...(s.status === "Verified" || s.status === "Reversed" ? { verifiedBy: "u-finance", verifiedAt: `${s.date}T15:00:00` } : {}),
}));

// Stored balances: cash intentionally off by 150 ብር to demonstrate reconciliation.
for (const a of accounts) {
  a.storedBalance = computeBalance(a, transactions) + (a.id === "acc-cash" ? 150 : 0);
}

export const contributions: Contribution[] = students
  .filter((s) => s.status === "active" && s.classId !== "c-1")
  .flatMap((s, i) => {
    const out: Contribution[] = [];
    if (i % 5 !== 0) out.push({ id: `ct-${s.id}-02`, studentId: s.id, period: "2019-02", amount: 50, paidDate: "2026-10-19" });
    if (i % 3 !== 0) out.push({ id: `ct-${s.id}-03`, studentId: s.id, period: "2019-03", amount: 50, paidDate: "2026-11-16" });
    return out;
  });

export const assetCategories: AssetCategory[] = ["ac-books", "ac-instr", "ac-cloth", "ac-sound", "ac-begena", "ac-furn"].map((id, i) => ({ id, name: t.domain.assetCategories[i] ?? "", color: ["gold", "rose", "brand", "sky", "teal", "orange"][i] ?? "brand" }));

export const assets: Asset[] = [
  { id: "a-1", code: "ንብ-001", name: "መጽሐፈ ዳዊት", categoryId: "ac-books", totalQuantity: 60, damagedQuantity: 3, condition: "good", location: "ቤተ መጻሕፍት", unitValue: 350, acquiredDate: "2024-10-10", notes: "" },
  { id: "a-2", code: "ንብ-002", name: "ውዳሴ ማርያም ከአንቀጸ ብርሃን", categoryId: "ac-books", totalQuantity: 80, damagedQuantity: 0, condition: "new", location: "ቤተ መጻሕፍት", unitValue: 180, acquiredDate: "2026-10-02", notes: "" },
  { id: "a-3", code: "ንብ-003", name: "ከበሮ", categoryId: "ac-instr", totalQuantity: 12, damagedQuantity: 2, condition: "fair", location: "የመዝሙር ክፍል", unitValue: 4500, acquiredDate: "2023-09-15", notes: "ሁለቱ ቆዳ መቀየር ያስፈልጋቸዋል" },
  { id: "a-4", code: "ንብ-004", name: "መጽሐፍ ቅዱስ", categoryId: "ac-books", totalQuantity: 30, damagedQuantity: 1, condition: "good", location: "የመዝሙር ክፍል", unitValue: 600, acquiredDate: "2024-01-20", notes: "" },
  { id: "a-5", code: "ንብ-005", name: "በገናዎች", categoryId: "ac-begena", totalQuantity: 40, damagedQuantity: 0, condition: "good", location: "የመዝሙር ክፍል", unitValue: 450, acquiredDate: "2024-01-20", notes: "" },
  { id: "a-6", code: "ንብ-006", name: "የተማሪዎች ለበዓል የሚለብሱት አልባሳት (ነጭ)", categoryId: "ac-cloth", totalQuantity: 70, damagedQuantity: 4, condition: "good", location: "የአልባሳት ማከማቻ", unitValue: 1200, acquiredDate: "2026-11-10", notes: "ለኅዳር ጽዮን የተሰፋ" },
  { id: "a-7", code: "ንብ-007", name: "የተማሪዎች ለበዓል የሚለብሱት አልባሳት (ቀይ)", categoryId: "ac-cloth", totalQuantity: 25, damagedQuantity: 0, condition: "good", location: "የአልባሳት ማከማቻ", unitValue: 2500, acquiredDate: "2025-01-05", notes: "" },
  { id: "a-8", code: "ንብ-008", name: "የተማሪዎች ለበዓል የሚለብሱት አልባሳት (ሰማያዊ)", categoryId: "ac-cloth", totalQuantity: 120, damagedQuantity: 6, condition: "good", location: "ማከማቻ 2", unitValue: 650, acquiredDate: "2025-09-01", notes: "" },
  { id: "a-9", code: "ንብ-009", name: "የማስተማሪያ ሰሌዳዎች (ጥቁር)", categoryId: "ac-furn", totalQuantity: 150, damagedQuantity: 9, condition: "fair", location: "ዋና አዳራሽ", unitValue: 400, acquiredDate: "2022-06-01", notes: "" },
  { id: "a-10", code: "ንብ-010", name: "የማስተማሪያ ሰሌዳዎች (ነጭ)", categoryId: "ac-furn", totalQuantity: 20, damagedQuantity: 1, condition: "good", location: "ዋና አዳራሽ", unitValue: 2200, acquiredDate: "2023-03-10", notes: "" },
  { id: "a-11", code: "ንብ-011", name: "ድምፅ ማጉያ ስፒከር", categoryId: "ac-sound", totalQuantity: 4, damagedQuantity: 0, condition: "good", location: "የድምፅ ክፍል", unitValue: 18000, acquiredDate: "2024-04-12", notes: "" },
  { id: "a-12", code: "ንብ-012", name: "ድምፅ ማጉያ ስፒከር (ተንቀሳቃሽ)", categoryId: "ac-sound", totalQuantity: 6, damagedQuantity: 1, condition: "fair", location: "የድምፅ ክፍል", unitValue: 5500, acquiredDate: "2024-04-12", notes: "" },
];

export const assetIssues: AssetIssue[] = [
  { id: "ai-1", assetId: "a-6", quantity: 45, recipientName: "የመዘምራን ቡድን (በማርታ ደምሴ)", recipientType: "member", issueDate: "2026-11-18", dueDate: "2026-12-02", returnedQuantity: 0, damagedOnReturn: 0, missingOnReturn: 0, status: "issued", eventId: "ev-hidar-tsion", note: "ለኅዳር ጽዮን" },
  { id: "ai-2", assetId: "a-3", quantity: 4, recipientName: "የመዘምራን ቡድን (በማርታ ደምሴ)", recipientType: "member", issueDate: "2026-11-01", dueDate: "2026-11-15", returnedQuantity: 1, damagedOnReturn: 0, missingOnReturn: 0, returnDate: "2026-11-15", status: "partial", note: "ለሳምንታዊ ልምምድ" },
  { id: "ai-3", assetId: "a-1", quantity: 1, recipientName: "ዳንኤል አበበ", recipientType: "student", recipientId: "s-3", issueDate: "2026-10-05", dueDate: "2026-11-05", returnedQuantity: 0, damagedOnReturn: 0, missingOnReturn: 0, status: "issued", note: "" },
  { id: "ai-4", assetId: "a-8", quantity: 30, recipientName: "ሕፃናት ክፍል (5–10) ተማሪዎች", recipientType: "member", issueDate: "2026-09-20", dueDate: "2027-07-01", returnedQuantity: 0, damagedOnReturn: 0, missingOnReturn: 0, status: "issued", note: "ለዓመቱ" },
  { id: "ai-5", assetId: "a-7", quantity: 10, recipientName: "የመስቀል በዓል አስተባባሪዎች", recipientType: "member", issueDate: "2026-09-24", dueDate: "2026-09-30", returnedQuantity: 9, damagedOnReturn: 1, missingOnReturn: 0, returnDate: "2026-09-30", status: "returned", eventId: "ev-meskel", note: "" },
  { id: "ai-6", assetId: "a-12", quantity: 2, recipientName: "ሔኖክ ደምሴ", recipientType: "student", recipientId: "s-9", issueDate: "2026-11-08", dueDate: "2026-11-12", returnedQuantity: 0, damagedOnReturn: 0, missingOnReturn: 0, status: "issued", note: "ለወጣቶች ጉባኤ" },
];

export const assetMaintenance: AssetMaintenance[] = [
  { id: "am-1", assetId: "a-3", quantity: 2, description: "የከበሮ ቆዳ መቀየር", cost: 1800, date: "2026-10-12", vendor: "መርካቶ የባህል መሣሪያዎች", status: "in_progress" },
  { id: "am-2", assetId: "a-12", quantity: 1, description: "የተንቀሳቃሽ ስፒከር ባትሪ ጥገና", cost: 600, date: "2026-09-28", vendor: "ኤሌክትሮ ቴክ", status: "completed" },
];

export const eventAllocations: EventAllocation[] = [
  { id: "ea-1", eventId: "ev-hidar-tsion", assetId: "a-6", quantity: 50 },
  { id: "ea-2", eventId: "ev-hidar-tsion", assetId: "a-5", quantity: 30 },
  { id: "ea-3", eventId: "ev-timket", assetId: "a-9", quantity: 100 },
];

export const departments: Department[] = [
  { id: "d-edu", name: "ትምህርትና ሥልጠና ክፍል", description: "የክፍል ትምህርቶችን፣ የመምህራን ሥልጠናና የሥርዓተ ትምህርት ዝግጅትን ያስተባብራል።", leaderName: "ቀሲስ ሰሎሞን በቀለ", color: "brand", icon: "book" },
  { id: "d-mezmur", name: "የመዝሙር እና ኪነ ጥበብ ክፍል", description: "የመዝሙር ጥናት፣ የመዘምራን ልምምድ፣ ድራማና ሥነ ጽሑፍ ያዘጋጃል።", leaderName: "ማርታ ደምሴ", color: "rose", icon: "music" },
  { id: "d-dev", name: "የልማት ክፍል", description: "የልማት ፕሮጀክቶችን ያቅዳል፣ ገቢ ያሰባስባል፣ ሂደታቸውንም ይከታተላል።", leaderName: "ኤልያስ ገበየሁ", color: "lime", icon: "sprout" },
  { id: "d-charity", name: "በጎ አድራጎትና ማኅበራዊ ክፍል", description: "አቅመ ደካሞችን መርዳትና የማኅበራዊ አገልግሎት ሥራዎችን ያስተባብራል።", leaderName: "ሕይወት ታደሰ", color: "teal", icon: "heart" },
  { id: "d-pr", name: "ሕዝብ ግንኙነትና ሚዲያ ክፍል", description: "ማስታወቂያዎችን፣ ፎቶግራፍና የማኅበራዊ ሚዲያ ሥራዎችን ይመራል።", leaderName: "ናትናኤል ጌታቸው", color: "orange", icon: "megaphone" },
];

export const departmentMembers: DepartmentMember[] = [
  { id: "dm-1", departmentId: "d-edu", name: "ቀሲስ ሰሎሞን በቀለ", roleTitle: "ሰብሳቢ", phone: "0915678901", joinedDate: "2023-09-12" },
  { id: "dm-2", departmentId: "d-edu", name: "ብርሃኑ ወልደ ማርያም", roleTitle: "ፀሐፊ", phone: "0916789012", joinedDate: "2024-09-15" },
  { id: "dm-3", departmentId: "d-edu", name: "ፋሲካ ኃይሌ", roleTitle: "አባል", phone: "0917890123", joinedDate: "2025-09-20" },
  { id: "dm-4", departmentId: "d-mezmur", name: "ማርታ ደምሴ", roleTitle: "ሰብሳቢና አሠልጣኝ", phone: "0919012345", joinedDate: "2022-10-01" },
  { id: "dm-5", departmentId: "d-mezmur", name: "ያሬድ ሙሉጌታ", roleTitle: "የከበሮ አሠልጣኝ", phone: "0922345678", joinedDate: "2023-10-01" },
  { id: "dm-6", departmentId: "d-mezmur", name: "ቅድስት አለሙ", roleTitle: "የድራማ አስተባባሪ", phone: "0923456789", joinedDate: "2024-10-05" },
  { id: "dm-7", departmentId: "d-mezmur", name: "ማኅሌት ሽፈራው", roleTitle: "አባል", phone: "0924567890", joinedDate: "2025-10-05" },
  { id: "dm-8", departmentId: "d-dev", name: "ኤልያስ ገበየሁ", roleTitle: "ሰብሳቢ", phone: "0918901234", joinedDate: "2023-11-01" },
  { id: "dm-9", departmentId: "d-dev", name: "በረከት ኃይሉ", roleTitle: "ገንዘብ ያዥ", phone: "0925678901", joinedDate: "2024-11-01" },
  { id: "dm-10", departmentId: "d-dev", name: "ሩት በቀለ", roleTitle: "አባል", phone: "0926789012", joinedDate: "2025-11-01" },
  { id: "dm-11", departmentId: "d-charity", name: "ሕይወት ታደሰ", roleTitle: "ሰብሳቢ", phone: "0927890123", joinedDate: "2024-01-10" },
  { id: "dm-12", departmentId: "d-charity", name: "ኢዮብ ደምሴ", roleTitle: "አባል", phone: "0928901234", joinedDate: "2025-01-10" },
  { id: "dm-13", departmentId: "d-pr", name: "ናትናኤል ጌታቸው", roleTitle: "ሰብሳቢ", phone: "0929012345", joinedDate: "2024-02-02" },
  { id: "dm-14", departmentId: "d-pr", name: "ኤደን ተስፋዬ", roleTitle: "ፎቶግራፈር", phone: "0930123456", joinedDate: "2025-02-02" },
];

export const devProjects: DevProject[] = [
  { id: "p-library", title: "የሰንበት ት/ቤቱ ቤተ መጻሕፍት ማደራጀት", description: "ለተማሪዎች የንባብ ክፍል፣ መደርደሪያና ከ500 በላይ መጻሕፍት ማሟላት።", goal: "500 መጻሕፍትና 40 የንባብ ወንበሮች", budget: 120000, spent: 12400, startDate: "2026-09-15", endDate: "2027-03-30", progress: 35, status: "active", leadName: "ኤልያስ ገበየሁ" },
  { id: "p-instruments", title: "የመዝሙር መሣሪያዎችና ድምፅ ማጉያ ግዢ", description: "አዳዲስ ከበሮዎች፣ ጸናጽልና ዘመናዊ የድምፅ ሥርዓት መግዛት።", goal: "6 ከበሮ፣ 1 የድምፅ ሥርዓት", budget: 85000, spent: 0, startDate: "2026-10-20", endDate: "2027-01-15", progress: 20, status: "active", leadName: "በረከት ኃይሉ" },
  { id: "p-uniform", title: "ለአዲስ ተማሪዎች ዩኒፎርም", description: "ለ2019 ዓ.ም አዲስ ተማሪዎች ዩኒፎርም ማሰፋት።", goal: "60 ዩኒፎርም", budget: 39000, spent: 39000, startDate: "2026-08-01", endDate: "2026-09-20", progress: 100, status: "completed", leadName: "ሩት በቀለ" },
  { id: "p-charity", title: "የአቅመ ደካሞች የበዓል ድጋፍ", description: "ለገና በዓል ለ30 አቅመ ደካማ ቤተሰቦች የምግብ ድጋፍ።", goal: "30 ቤተሰቦች", budget: 45000, spent: 0, startDate: "2026-12-01", endDate: "2027-01-06", progress: 0, status: "planned", leadName: "ሕይወት ታደሰ" },
];

export const progressReports: ProgressReport[] = [
  { id: "pr-1", projectId: "p-library", date: "2026-10-05", progress: 15, note: "የመጀመሪያ ልገሳ ተሰብስቧል፤ የክፍል ዝግጅት ተጀምሯል።", author: "ኤልያስ ገበየሁ" },
  { id: "pr-2", projectId: "p-library", date: "2026-10-22", progress: 35, note: "መደርደሪያዎች ተገዝተው ተተክለዋል።", author: "ኤልያስ ገበየሁ" },
  { id: "pr-3", projectId: "p-instruments", date: "2026-11-06", progress: 20, note: "የዋጋ ማቅረቢያ ከሦስት ድርጅቶች ተሰብስቧል።", author: "በረከት ኃይሉ" },
  { id: "pr-4", projectId: "p-uniform", date: "2026-09-20", progress: 100, note: "ሁሉም ዩኒፎርሞች ለተማሪዎች ተሰራጭተዋል።", author: "ሩት በቀለ" },
];

export const mezmurs: Mezmur[] = [
  { id: "m-1", title: "ሚካኤል ሊቀ መላእክት", category: "የንግሥ መዝሙር", author: "የሰንበት ት/ቤቱ መዘምራን", published: true, createdAt: "2026-09-10", audioUrl: "ሚካኤል-ሊቀ-መላእክት.mp3",
    lyrics: "ሚካኤል ሊቀ መላእክት\nየብርሃን መልአክ ጠባቂያችን\nበክንፎችህ ጋርደን\nከክፉ ሁሉ አድነን\n\nአዝ፦ ሊቀ መላእክት ቅዱስ ሚካኤል\nለምንልን በእግዚአብሔር ፊት\n\nበጭንቅ ቀን ደራሽ\nለደካሞች ብርታት\nየእግዚአብሔርን ምሕረት\nአማልደን ለእኛ" },
  { id: "m-2", title: "እንኳን ደስ አላችሁ", category: "የበዓል መዝሙር", author: "ባህላዊ", published: true, createdAt: "2026-09-12",
    lyrics: "እንኳን ደስ አላችሁ\nበዓሉ ደረሰ\nብርሃን ወጣልን\nጨለማው ፈረሰ\n\nአዝ፦ እልል በሉ እልል\nደስታ ሆነልን\n\nዘምሩ በከበሮ\nአመስግኑ በጸናጽል\nለአምላካችን ክብር\nይሁን ምስጋና ሁሉ" },
  { id: "m-3", title: "አቤቱ ማረን", category: "የንስሐ መዝሙር", author: "ባህላዊ", published: true, createdAt: "2026-09-20",
    lyrics: "አቤቱ ማረን\nበቸርነትህ\nኃጢአታችንን\nአታስብብን\n\nአዝ፦ ኪርያላይሶን\nአቤቱ ማረን\n\nልባችንን አንጻ\nመንፈስህን ስጠን\nበፊትህ እንድንቆም\nበንጽሕና" },
  { id: "m-4", title: "ምስጋና ለአምላክ", category: "የምስጋና መዝሙር", author: "ማርታ ደምሴ", published: true, createdAt: "2026-10-01", videoUrl: "ምስጋና-ለአምላክ.mp4",
    lyrics: "ምስጋና ለአምላክ\nለፈጠረን ጌታ\nበጠዋት በማታ\nይሁን እልልታ\n\nአዝ፦ ክብር ለአብ ለወልድ\nለመንፈስ ቅዱስ\n\nለሰጠን ሕይወት\nለሰጠን ዕውቀት\nምስጋና ይድረስህ\nዘወትር ለዘላለም" },
  { id: "m-5", title: "ትንሹ ልጅ ዘመረ", category: "የሕፃናት መዝሙር", author: "የሕፃናት ክፍል", published: true, createdAt: "2026-10-05",
    lyrics: "ትንሹ ልጅ ዘመረ\nበደስታ ተሞላ\nእግዚአብሔርን አመሰገነ\nበእጁ አጨበጨበ\n\nአዝ፦ እኛም እንዘምር\nከመላእክት ጋር\n\nእናቴ አስተማረችኝ\nአባቴ መከረኝ\nሰንበት ት/ቤት ሄጄ\nመዝሙር ተማርኩኝ" },
  { id: "m-6", title: "ጽዮን ማርያም", category: "የበዓል መዝሙር", author: "ባህላዊ", published: true, createdAt: "2026-11-01",
    lyrics: "ጽዮን ማርያም\nየአምላክ ማደሪያ\nእመቤታችን\nየሕይወት መገኛ\n\nአዝ፦ ኅዳር ጽዮን\nበዓልሽ ደረሰ\n\nታቦተ ጽዮን\nክብርሽ ከፍ አለ\nልጆችሽ በደስታ\nይዘምራሉ" },
  { id: "m-7", title: "ብርሃነ ልደት", category: "የበዓል መዝሙር", author: "ማርታ ደምሴ", published: false, createdAt: "2026-11-15",
    lyrics: "ብርሃነ ልደት\nበቤተ ልሔም\nተወለደ ጌታ\nለዓለም ሰላም\n\nአዝ፦ ስብሐት ለእግዚአብሔር\nበአርያም\n\n(ረቂቅ — ለገና በዓል በዝግጅት ላይ)" },
  { id: "m-8", title: "ሐዋርያት ሰበኩ", category: "የትምህርት መዝሙር", author: "ያሬድ ሙሉጌታ", published: true, createdAt: "2026-10-18",
    lyrics: "ሐዋርያት ሰበኩ\nወንጌልን ለዓለም\nበፍቅር አስተማሩ\nሰላምን ለሰው\n\nአዝ፦ እኛም እንማር\nቃሉን እንጠብቅ" },
];

export const practiceSchedules: PracticeSchedule[] = [
  { id: "ps-1", title: "ለኅዳር ጽዮን የመዘምራን ልምምድ", date: "2026-11-24", startTime: "8:00", endTime: "10:00", location: "ዋና አዳራሽ", mezmurIds: ["m-6", "m-2"], trainer: "ማርታ ደምሴ" },
  { id: "ps-2", title: "የከበሮ ልምምድ", date: "2026-11-26", startTime: "8:00", endTime: "10:00", location: "የመዝሙር ክፍል", mezmurIds: ["m-1"], trainer: "ያሬድ ሙሉጌታ" },
  { id: "ps-3", title: "የገና መዝሙር ዝግጅት", date: "2026-12-05", startTime: "8:00", endTime: "10:00", location: "ዋና አዳራሽ", mezmurIds: ["m-7"], trainer: "ማርታ ደምሴ" },
  { id: "ps-4", title: "የሕፃናት መዝሙር ልምምድ", date: "2026-11-15", startTime: "4:00", endTime: "5:00", location: "ክፍል 1", mezmurIds: ["m-5"], trainer: "ማኅሌት ሽፈራው" },
];

export const artsPrograms: ArtsProgram[] = [
  { id: "ap-1", title: "\"የቅዱስ ሚካኤል ተራዳኢነት\" ድራማ", type: "drama", date: "2026-11-30", description: "በኅዳር ጽዮን ዋዜማ የሚቀርብ የወጣቶች ድራማ።", status: "rehearsing" },
  { id: "ap-2", title: "የገና ቅኔና ግጥም ምሽት", type: "poem", date: "2027-01-05", description: "ወጣቶች የሚያቀርቡት የቅኔና ግጥም መርሐ ግብር።", status: "planned" },
  { id: "ap-3", title: "የሕፃናት የስዕል ዐውደ ርዕይ", type: "exhibition", date: "2026-10-25", description: "\"ቤተ ክርስቲያኔ\" በሚል ርዕስ የሕፃናት ስዕሎች ትርኢት።", status: "done" },
];

export const events: SchoolEvent[] = [
  { id: "ev-meskel", title: "የመስቀል ደመራ በዓል", type: "festival", startDate: "2026-09-26", endDate: "2026-09-27", location: "የደብሩ ቅጽር ግቢ", description: "የደመራ ሥርዓትና የመዘምራን አገልግሎት።", budget: 10000, status: "completed" },
  { id: "ev-hidar-tsion", title: "ኅዳር ጽዮን (ጽዮን ማርያም)", type: "festival", startDate: "2026-11-29", endDate: "2026-11-30", location: "አክሱም ጉዞና በደብሩ", description: "የመዘምራን አገልግሎት፣ ድራማና የአክሱም ጉዞ።", budget: 35000, status: "preparing" },
  { id: "ev-parents", title: "የወላጆች ቀን", type: "program", startDate: "2026-12-13", endDate: "2026-12-13", location: "ዋና አዳራሽ", description: "የተማሪዎች ውጤት ማቅረቢያና ከወላጆች ጋር ውይይት።", budget: 6000, status: "planned" },
  { id: "ev-genna", title: "የገና (ልደት) በዓል", type: "holiday", startDate: "2027-01-06", endDate: "2027-01-07", location: "ደብሩ", description: "የዋዜማ መዝሙርና የበዓል መርሐ ግብር።", budget: 20000, status: "planned" },
  { id: "ev-timket", title: "የጥምቀት በዓል", type: "festival", startDate: "2027-01-18", endDate: "2027-01-19", location: "ጃን ሜዳ", description: "ታቦት አጀባ፣ የመዘምራን አገልግሎትና የአልባሳት ዝግጅት።", budget: 40000, status: "planned" },
  { id: "ev-meeting", title: "የሥራ አስፈጻሚ ወርሃዊ ስብሰባ", type: "meeting", startDate: "2026-11-28", endDate: "2026-11-28", location: "ቢሮ", description: "የወሩ ሪፖርትና የበዓል ዝግጅት ግምገማ።", budget: 0, status: "planned" },
];

export const tasks: Task[] = [
  { id: "tk-1", title: "የኅዳር ጽዮን የጉዞ ተሳታፊዎችን ዝርዝር ማጠናቀቅ", description: "የአውቶቡስ ቦታ ለ60 ሰው።", assigneeName: "ሔለን ገብረ ሥላሴ", assigneeUserId: "u-manager", eventId: "ev-hidar-tsion", dueDate: "2026-11-25", status: "InProgress", priority: "high", createdAt: "2026-11-10" },
  { id: "tk-2", title: "የመዘምራን ልብስ ማከፋፈል", description: "", assigneeName: "መሠረት ታደሰ", assigneeUserId: "u-asset", eventId: "ev-hidar-tsion", dueDate: "2026-11-27", status: "InProgress", priority: "high", createdAt: "2026-11-12" },
  { id: "tk-3", title: "የጥቅምት ወር የፋይናንስ ሪፖርት ማቅረብ", description: "", assigneeName: "ዳዊት አለማየሁ", assigneeUserId: "u-finance", dueDate: "2026-11-15", status: "Pending", priority: "normal", createdAt: "2026-11-01" },
  { id: "tk-4", title: "ድራማውን የመጨረሻ ልምምድ", description: "", assigneeName: "ማርታ ደምሴ", assigneeUserId: "u-mezmur", departmentId: "d-mezmur", eventId: "ev-hidar-tsion", dueDate: "2026-11-28", status: "Pending", priority: "high", createdAt: "2026-11-14" },
  { id: "tk-5", title: "የቤተ መጻሕፍት መጻሕፍት ዝርዝር ማዘጋጀት", description: "", assigneeName: "ኤልያስ ገበየሁ", assigneeUserId: "u-dev", departmentId: "d-dev", dueDate: "2026-11-18", status: "InProgress", priority: "normal", createdAt: "2026-11-02" },
  { id: "tk-6", title: "የሕፃናት ክፍል የሩብ ዓመት ፈተና ማዘጋጀት", description: "", assigneeName: "ቀሲስ ሰሎሞን በቀለ", assigneeUserId: "u-teacher", departmentId: "d-edu", dueDate: "2026-12-06", status: "Pending", priority: "normal", createdAt: "2026-11-15" },
  { id: "tk-7", title: "የመስቀል በዓል የፎቶ ማህደር ማጠናቀር", description: "", assigneeName: "ናትናኤል ጌታቸው", departmentId: "d-pr", eventId: "ev-meskel", dueDate: "2026-10-10", status: "Completed", priority: "low", createdAt: "2026-09-28" },
  { id: "tk-8", title: "የሲስተም ምትኬ ሙከራ (መልሶ ማግኛ)", description: "", assigneeName: "ሔለን ገብረ ሥላሴ", assigneeUserId: "u-manager", dueDate: "2026-11-30", status: "Pending", priority: "normal", createdAt: "2026-11-16" },
  { id: "tk-9", title: "ለገና የአቅመ ደካሞች ዝርዝር መሰብሰብ", description: "", assigneeName: "ሕይወት ታደሰ", departmentId: "d-charity", eventId: "ev-genna", dueDate: "2026-12-15", status: "Pending", priority: "normal", createdAt: "2026-11-18" },
];

export const announcements: Announcement[] = [
  { id: "an-1", title: "የኅዳር ጽዮን ጉዞ ምዝገባ", body: "ወደ አክሱም ለሚደረገው የኅዳር ጽዮን ጉዞ ምዝገባ እስከ ኅዳር 16 ቀን ድረስ በቢሮ ይከናወናል። የትኬት ዋጋ 600 ብር ነው።", priority: "urgent", targetType: "all", targetIds: [], authorId: "u-manager", authorName: "ሔለን ገብረ ሥላሴ", createdAt: "2026-11-18T09:00:00", readBy: ["u-manager"] },
  { id: "an-2", title: "የመዘምራን ልምምድ ሰዓት ለውጥ", body: "የማክሰኞ ከሰዓት የመዘምራን ልምምድ ከ8፡00 ጀምሮ ይካሄዳል። ሁሉም መዘምራን በሰዓቱ እንዲገኙ።", priority: "normal", targetType: "department", targetIds: ["d-mezmur"], authorId: "u-mezmur", authorName: "ማርታ ደምሴ", departmentId: "d-mezmur", createdAt: "2026-11-20T15:30:00", readBy: [] },
  { id: "an-3", title: "የሩብ ዓመት ፈተና ፕሮግራም", body: "የሕፃናት ክፍሎች የሩብ ዓመት ፈተና ኅዳር 27 ቀን ይሰጣል። ወላጆች ልጆቻችሁን እንድታዘጋጁ።", priority: "normal", targetType: "class", targetIds: ["c-1", "c-2"], authorId: "u-manager", authorName: "ሔለን ገብረ ሥላሴ", createdAt: "2026-11-16T10:00:00", readBy: ["u-teacher"] },
  { id: "an-4", title: "የወርሃዊ መዋጮ ማስታወሻ", body: "የኅዳር ወር መዋጮ 50 ብር ያልከፈላችሁ አባላት እስከ ወሩ መጨረሻ በገንዘብ ያዥ በኩል እንድትከፍሉ እናሳስባለን።", priority: "normal", targetType: "role", targetIds: ["student"], authorId: "u-manager", authorName: "ሔለን ገብረ ሥላሴ", createdAt: "2026-11-12T08:00:00", readBy: [] },
  { id: "an-5", title: "የልማት ክፍል ስብሰባ", body: "የቤተ መጻሕፍት ፕሮጀክት ግምገማ ስብሰባ ቅዳሜ ከቀኑ 8፡00 ይካሄዳል።", priority: "normal", targetType: "department", targetIds: ["d-dev"], authorId: "u-dev", authorName: "ኤልያስ ገበየሁ", departmentId: "d-dev", createdAt: "2026-11-19T18:00:00", readBy: [] },
  { id: "an-6", title: "እንኳን ለ2019 ዓ.ም የትምህርት ዘመን አደረሳችሁ", body: "አዲሱ የትምህርት ዘመን የበረከት፣ የዕውቀትና የአገልግሎት እንዲሆንልን እንመኛለን።", priority: "normal", targetType: "all", targetIds: [], authorId: "u-manager", authorName: "ሔለን ገብረ ሥላሴ", createdAt: "2026-09-13T08:00:00", readBy: ["u-manager", "u-finance", "u-teacher", "u-student"] },
];

export const notifications: AppNotification[] = [
  { id: "n-1", role: "manager", title: "ከገደብ በላይ ወጪ ተመዝግቧል", body: "18,500.00 ብር — ለኅዳር ጽዮን የመዘምራን ነጭ ልብስ ስፌት", kind: "warning", createdAt: "2026-11-10T16:00:00", read: false, link: "/finance" },
  { id: "n-2", role: "finance", title: "4 ግብይቶች ማረጋገጫ ይጠብቃሉ", body: "እባክዎ ደረሰኞቹን አይተው ያረጋግጡ ወይም ውድቅ ያድርጉ።", kind: "info", createdAt: "2026-11-20T17:00:00", read: false, link: "/finance" },
  { id: "n-3", role: "asset", title: "የተመላሽ ጊዜ አልፏል", body: "ድምፅ ማጉያ ስፒከር (ተንቀሳቃሽ) (2) — ሔኖክ ደምሴ", kind: "danger", createdAt: "2026-11-13T08:00:00", read: false, link: "/assets" },
  { id: "n-4", role: "teacher", title: "የዛሬ ክትትል አልተመዘገበም", body: "ሕፃናት ክፍል (5–10) እና ማዕከላውያን ክፍል (10–13) — እሁድ ጠዋት", kind: "warning", createdAt: "2026-11-22T08:00:00", read: false, link: "/attendance" },
  { id: "n-5", role: "manager", title: "ምትኬ በተሳካ ሁኔታ ተጠናቋል", body: "የዕለቱ ራስ-ሰር ምትኬ ተወስዷል።", kind: "success", createdAt: "2026-11-22T02:00:00", read: true, link: "/admin" },
  { id: "n-6", role: "manager", title: "ተደጋጋሚ ያልተሳካ መግቢያ", body: "birhanu — 3 ያልተሳኩ ሙከራዎች", kind: "danger", createdAt: "2026-11-21T21:10:00", read: false, link: "/admin" },
  { id: "n-7", role: "student", title: "አዲስ መዝሙር ታትሟል", body: "ጽዮን ማርያም — የበዓል መዝሙር", kind: "info", createdAt: "2026-11-01T12:00:00", read: false, link: "/mezmur" },
  { id: "n-8", role: "mezmur", title: "የልምምድ ማስታወሻ", body: "ለኅዳር ጽዮን የመዘምራን ልምምድ ማክሰኞ ከሰዓት", kind: "info", createdAt: "2026-11-21T09:00:00", read: false, link: "/mezmur" },
  { id: "n-9", role: "development", title: "የፕሮጀክት ሂደት ሪፖርት ይጠበቃል", body: "የመዝሙር መሣሪያዎች ግዢ — ሳምንታዊ ሪፖርት", kind: "info", createdAt: "2026-11-20T09:00:00", read: false, link: "/development" },
];

const AUDIT_SEEDS: Array<[string, string, string, string, string, string, string]> = [
  ["u-manager", "ሔለን ገብረ ሥላሴ", "ተጠቃሚዎች", "መፍጠር", "ተጠቃሚ", "u-student", "ለተማሪ ሚካኤል ተስፋዬ መለያ ተፈጠረ"],
  ["u-manager", "ሔለን ገብረ ሥላሴ", "ተማሪዎች", "መመዝገብ", "ተማሪ", "s-43", "አዲስ ተማሪ ተመዘገበ"],
  ["u-manager", "ሔለን ገብረ ሥላሴ", "ተማሪዎች", "ማስመጣት", "ተማሪ", "bulk", "6 ተማሪዎች ከCSV ፋይል ገቡ"],
  ["u-finance", "ዳዊት አለማየሁ", "ፋይናንስ", "ማረጋገጥ", "ግብይት", "t-14", "ግብ-0014 ተረጋገጠ"],
  ["u-finance", "ዳዊት አለማየሁ", "ፋይናንስ", "መቀልበስ", "ግብይት", "t-10", "ግብ-0010 ተቀለበሰ — ደረሰኙ በስህተት ሁለት ጊዜ ተመዝግቧል"],
  ["u-finance", "ዳዊት አለማየሁ", "ፋይናንስ", "ውድቅ ማድረግ", "ግብይት", "t-20", "ግብ-0020 ውድቅ ተደረገ — ደረሰኝ አልቀረበም"],
  ["u-asset", "መሠረት ታደሰ", "ንብረት", "መስጠት", "ንብረት", "a-6", "45 የመዘምራን ነጭ ልብስ ተሰጠ"],
  ["u-asset", "መሠረት ታደሰ", "ንብረት", "መመለስ", "ንብረት", "a-7", "9 ቀይ የበዓል አልባሳት ተመለሱ፣ 1 ተበላሽቷል"],
  ["u-teacher", "ቀሲስ ሰሎሞን በቀለ", "ክትትል", "መመዝገብ", "ክትትል", "att-c-1-2026-11-15", "ሕፃናት ክፍል (5–10) — እሁድ ጠዋት"],
  ["u-manager", "ሔለን ገብረ ሥላሴ", "ቅንብሮች", "ማሻሻል", "ቅንብር", "expense_threshold", "የወጪ ግምገማ ገደብ 5,000 ብር ተደረገ"],
  ["u-manager", "ሔለን ገብረ ሥላሴ", "የትምህርት ዘመን", "ማንቃት", "የትምህርት ዘመን", "ay-2019", "2019 ዓ.ም ንቁ ሆነ"],
  ["u-manager", "ሔለን ገብረ ሥላሴ", "ተጠቃሚዎች", "ማገድ", "ተጠቃሚ", "u-old", "የአበበ ከበደ መለያ ታገደ"],
  ["u-mezmur", "ማርታ ደምሴ", "መዝሙር", "ማተም", "መዝሙር", "m-6", "ጽዮን ማርያም ታተመ"],
  ["u-dev", "ኤልያስ ገበየሁ", "ልማት", "ሂደት ማሻሻል", "ፕሮጀክት", "p-library", "ሂደት 35% ደረሰ"],
  ["u-manager", "ሔለን ገብረ ሥላሴ", "ፋይናንስ", "ግምገማ", "ግብይት", "t-14", "ከገደብ በላይ ወጪ ታይቷል"],
];
const AUDIT_DATES = ["2026-09-15T09:10:00", "2026-09-20T11:00:00", "2026-09-21T14:22:00", "2026-11-10T15:05:00", "2026-10-30T10:40:00", "2026-11-11T16:30:00", "2026-11-18T09:45:00", "2026-09-30T17:00:00", "2026-11-15T09:32:00", "2026-11-01T08:00:00", "2026-09-11T07:00:00", "2026-09-05T10:00:00", "2026-11-01T12:00:00", "2026-10-22T19:00:00", "2026-11-12T08:15:00"];

export const auditLogs: AuditLog[] = AUDIT_SEEDS.map(([userId, userName, module, action, entity, entityId, details], i) => ({
  id: `al-${i + 1}`,
  userId,
  userName,
  module,
  action,
  entity,
  entityId,
  details,
  ip: `196.188.${(i * 17) % 255}.${(i * 29) % 255}`,
  createdAt: AUDIT_DATES[i] ?? "2026-11-01T00:00:00",
})).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const defaultSettings: SystemSettings = {
  schoolName: SCHOOL_NAME,
  expenseThreshold: 5000,
  sessionNames,
  defaultCalendar: "et",
  defaultLanguage: "am",
  monthlyContribution: 50,
  lastBackupAt: "2026-11-22T02:00:00",
  backupStatus: "ok",
  acknowledgedExpenseIds: [],
};
