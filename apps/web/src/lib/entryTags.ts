import type { EntryDomain } from "./domain";

export type ReadingTagId = "study_note" | "postgrad";
export type LifeTagId = "mtt" | "other";
export type EntryTagId = ReadingTagId | LifeTagId;

export const READING_TAGS: Array<{ id: ReadingTagId; label: string; hint: string }> = [
  { id: "study_note", label: "学习心得", hint: "读书摘录与思考" },
  { id: "postgrad", label: "考研", hint: "考研相关记录" },
];

export const LIFE_TAGS: Array<{ id: LifeTagId; label: string; hint: string }> = [
  { id: "mtt", label: "MTT", hint: "MTT 相关" },
  { id: "other", label: "其他", hint: "其他生活记录" },
];

export function tagLabel(domain: EntryDomain, tag: string | null | undefined) {
  if (domain === "reading") {
    return READING_TAGS.find((t) => t.id === tag)?.label ?? "";
  }
  if (domain === "life") {
    return LIFE_TAGS.find((t) => t.id === tag)?.label ?? "";
  }
  return "";
}

export function isReadingTag(v: string): v is ReadingTagId {
  return v === "study_note" || v === "postgrad";
}

export function isLifeTag(v: string): v is LifeTagId {
  return v === "mtt" || v === "other";
}

export function isValidTagForDomain(domain: EntryDomain, tag: string | null | undefined) {
  if (domain === "reading") return tag != null && isReadingTag(tag);
  if (domain === "life") return tag != null && isLifeTag(tag);
  return tag == null || tag === "";
}

export function tagsForDomain(domain: EntryDomain) {
  if (domain === "reading") return READING_TAGS;
  if (domain === "life") return LIFE_TAGS;
  return [];
}
