export type BookInput = { title: string };

export function normalizeBooks(books: BookInput[]): BookInput[] {
  const seen = new Set<string>();
  const result: BookInput[] = [];
  for (const b of books) {
    const title = b.title.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ title: title.slice(0, 128) });
  }
  return result;
}
