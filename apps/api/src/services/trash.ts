export const TRASH_RETENTION_DAYS = Number(
  process.env.TRASH_RETENTION_DAYS || 7
);

export function purgeCutoffDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - TRASH_RETENTION_DAYS);
  return d;
}

export async function purgeExpiredTrash() {
  const { prisma } = await import("../lib/prisma.js");
  const cutoff = purgeCutoffDate();
  const result = await prisma.diaryEntry.deleteMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
    },
  });
  if (result.count > 0) {
    console.log(
      `Purged ${result.count} trash entries older than ${TRASH_RETENTION_DAYS} days`
    );
  }
  return result.count;
}

export function purgeAt(deletedAt: Date): string {
  const d = new Date(deletedAt);
  d.setDate(d.getDate() + TRASH_RETENTION_DAYS);
  return d.toISOString();
}
