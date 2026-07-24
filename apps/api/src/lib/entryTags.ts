export const READING_TAG_IDS = ["study_note", "postgrad"] as const;
export const LIFE_TAG_IDS = ["mtt", "other"] as const;

export type ReadingTagId = (typeof READING_TAG_IDS)[number];
export type LifeTagId = (typeof LIFE_TAG_IDS)[number];

export function isReadingTag(v: string): v is ReadingTagId {
  return (READING_TAG_IDS as readonly string[]).includes(v);
}

export function isLifeTag(v: string): v is LifeTagId {
  return (LIFE_TAG_IDS as readonly string[]).includes(v);
}

export function assertTagForDomain(
  domain: "stock" | "reading" | "life",
  tag: string | null | undefined
): { ok: true; tag: string | null } | { ok: false; message: string } {
  if (domain === "stock") {
    return { ok: true, tag: null };
  }
  if (domain === "reading") {
    if (!tag || !isReadingTag(tag)) {
      return { ok: false, message: "请选择读书标签：学习心得或考研" };
    }
    return { ok: true, tag };
  }
  if (!tag || !isLifeTag(tag)) {
    return { ok: false, message: "请选择生活标签：MTT或其他" };
  }
  return { ok: true, tag };
}
