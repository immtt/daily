import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

export async function userLifeAccessRequired(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lifeAccessEnabled: true },
  });
  return Boolean(user?.lifeAccessEnabled);
}

export async function userHasLifeAccess(
  userId: string,
  header: string | string[] | undefined
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lifeAccessEnabled: true, lifePasswordHash: true },
  });
  if (!user?.lifeAccessEnabled) return true;
  const pwd = Array.isArray(header) ? header[0] : header;
  if (!pwd || !user.lifePasswordHash) return false;
  return bcrypt.compare(pwd, user.lifePasswordHash);
}

export function serializePublicUser(user: {
  id: string;
  username: string;
  role: string;
  status: string;
  lifeAccessEnabled: boolean;
}) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    lifeAccessEnabled: user.lifeAccessEnabled,
  };
}
