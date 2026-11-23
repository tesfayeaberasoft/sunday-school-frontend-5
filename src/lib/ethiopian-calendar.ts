/**
 * Ethiopian (Amete Mihret) <-> Gregorian conversion via Julian Day Numbers.
 * 12 months of 30 days + Pagume (5 days, 6 in leap years where year % 4 === 3).
 */
export interface EthDate {
  year: number;
  month: number; // 1..13
  day: number; // 1..30 (Pagume 1..5/6)
}

const ETH_EPOCH = 1723856;

export const ETH_MONTHS = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ",
] as const;

export const ETH_WEEKDAYS = ["እሑድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ"] as const;

export const GREG_MONTHS_AM = [
  "ጃንዩወሪ",
  "ፌብሩወሪ",
  "ማርች",
  "ኤፕሪል",
  "ሜይ",
  "ጁን",
  "ጁላይ",
  "ኦገስት",
  "ሴፕቴምበር",
  "ኦክቶበር",
  "ኖቬምበር",
  "ዲሴምበር",
] as const;

export function isEthLeapYear(year: number): boolean {
  return ((year % 4) + 4) % 4 === 3;
}

export function daysInEthMonth(year: number, month: number): number {
  if (month < 13) return 30;
  return isEthLeapYear(year) ? 6 : 5;
}

function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

function ethToJdn(year: number, month: number, day: number): number {
  return ETH_EPOCH + 365 + 365 * (year - 1) + Math.floor(year / 4) + 30 * month + day - 31;
}

function jdnToEth(jdn: number): EthDate {
  const r = (jdn - ETH_EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  return {
    year: 4 * Math.floor((jdn - ETH_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460),
    month: Math.floor(n / 30) + 1,
    day: (n % 30) + 1,
  };
}

export function toEthiopian(y: number, m: number, d: number): EthDate {
  return jdnToEth(gregorianToJdn(y, m, d));
}

export function toGregorian(year: number, month: number, day: number) {
  if (month < 1 || month > 13 || day < 1 || day > daysInEthMonth(year, month)) {
    throw new RangeError("ልክ ያልሆነ የኢትዮጵያ ቀን");
  }
  return jdnToGregorian(ethToJdn(year, month, day));
}

/** Parses "YYYY-MM-DD" (or an ISO datetime) without timezone drift. */
export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { year: y ?? 1970, month: m ?? 1, day: d ?? 1 };
}

export function isoToEth(iso: string): EthDate {
  const g = parseIsoDate(iso);
  return toEthiopian(g.year, g.month, g.day);
}

export function ethToIso(e: EthDate): string {
  const g = toGregorian(e.year, e.month, e.day);
  return `${g.year}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}`;
}

export function weekdayOf(iso: string): number {
  const g = parseIsoDate(iso);
  return new Date(Date.UTC(g.year, g.month - 1, g.day)).getUTCDay();
}

export function formatEthDate(iso: string, opts: { weekday?: boolean; short?: boolean } = {}): string {
  const e = isoToEth(iso);
  const month = ETH_MONTHS[e.month - 1] ?? "";
  const base = opts.short ? `${month} ${e.day}` : `${month} ${e.day} ቀን ${e.year} ዓ.ም`;
  return opts.weekday ? `${ETH_WEEKDAYS[weekdayOf(iso)]}፣ ${base}` : base;
}

export function formatGregDate(iso: string, opts: { weekday?: boolean; short?: boolean } = {}): string {
  const g = parseIsoDate(iso);
  const month = GREG_MONTHS_AM[g.month - 1] ?? "";
  const base = opts.short ? `${month} ${g.day}` : `${month} ${g.day}፣ ${g.year} እ.ኤ.አ`;
  return opts.weekday ? `${ETH_WEEKDAYS[weekdayOf(iso)]}፣ ${base}` : base;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysIso(iso: string, days: number): string {
  const g = parseIsoDate(iso);
  const dt = new Date(Date.UTC(g.year, g.month - 1, g.day + days));
  return dt.toISOString().slice(0, 10);
}
