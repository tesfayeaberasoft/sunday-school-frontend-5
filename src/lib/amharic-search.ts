/**
 * Amharic search normalization: phonetically equivalent Ge'ez letter families
 * (ሀ/ሐ/ኀ, ሰ/ሠ, አ/ዐ, ጸ/ፀ) compare equal. Display text is never modified.
 */
const FAMILY_MAP: Array<[number, number]> = [
  [0x1210, 0x1200], // ሐ -> ሀ
  [0x1280, 0x1200], // ኀ -> ሀ
  [0x1220, 0x1230], // ሠ -> ሰ
  [0x12d0, 0x12a0], // ዐ -> አ
  [0x1340, 0x1338], // ፀ -> ጸ
];

const CHAR_MAP = new Map<string, string>();
for (const [from, to] of FAMILY_MAP) {
  for (let i = 0; i < 8; i++) {
    CHAR_MAP.set(String.fromCodePoint(from + i), String.fromCodePoint(to + i));
  }
}
// Common labialized/vowel spelling variants
CHAR_MAP.set("ዓ", "አ");
CHAR_MAP.set("ኣ", "አ");
CHAR_MAP.set("ሃ", "ሀ");
CHAR_MAP.set("ሓ", "ሀ");
CHAR_MAP.set("ኃ", "ሀ");

export function normalizeAmharic(input: string): string {
  let out = "";
  for (const ch of input.normalize("NFC").toLowerCase()) {
    out += CHAR_MAP.get(ch) ?? ch;
  }
  return out.replace(/[\s፡።፣፤]+/g, " ").trim();
}

export function amharicIncludes(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  if (!haystack) return false;
  return normalizeAmharic(haystack).includes(normalizeAmharic(needle));
}

export function matchesAny(fields: Array<string | null | undefined>, needle: string): boolean {
  if (!needle.trim()) return true;
  return fields.some((f) => amharicIncludes(f, needle));
}
