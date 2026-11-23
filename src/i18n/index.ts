import { am } from "./am";

/** Amharic is the source dictionary; other languages (om, en) must match its shape. */
export type Dict = typeof am;
export type Language = "am" | "om" | "en";

const dictionaries: Partial<Record<Language, Dict>> = { am };

export function getDict(lang: Language = "am"): Dict {
  return dictionaries[lang] ?? am;
}

export function useT(): Dict {
  return getDict("am");
}

export const t = am;
