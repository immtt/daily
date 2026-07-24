import { z } from "zod";

export const locationSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().max(100).optional(),
    capturedAt: z.string().optional(),
  })
  .nullable();

export type EntryLocation = z.infer<typeof locationSchema>;

export function parseLocation(value: unknown): EntryLocation {
  const parsed = locationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function assertLocationForDomain(
  domain: "stock" | "reading" | "life",
  location: unknown
): { ok: true; location: EntryLocation } | { ok: false; message: string } {
  if (domain !== "life") {
    return { ok: true, location: null };
  }
  if (location == null) {
    return { ok: true, location: null };
  }
  const parsed = locationSchema.safeParse(location);
  if (!parsed.success) {
    return { ok: false, message: "位置坐标格式无效" };
  }
  return { ok: true, location: parsed.data };
}
