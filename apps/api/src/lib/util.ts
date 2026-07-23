import type { FastifyReply } from "fastify";

export function sendError(
  reply: FastifyReply,
  status: number,
  error: string,
  code: string
) {
  return reply.status(status).send({ error, code });
}

export function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseDateOnly(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}
