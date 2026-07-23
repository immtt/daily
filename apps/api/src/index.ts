import "dotenv/config";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { registerAuthGuards } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { entryRoutes } from "./routes/entries.js";
import { marketRoutes } from "./routes/market.js";
import { stockRoutes } from "./routes/stocks.js";
import { uploadRoutes } from "./routes/uploads.js";
import { adminRoutes } from "./routes/admin.js";
import { prisma } from "./lib/prisma.js";
import { purgeExpiredTrash } from "./services/trash.js";
import bcrypt from "bcryptjs";

async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe_Admin_2026";
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: "admin",
      status: "active",
    },
  });
  console.log(`Created seed admin: ${username}`);
}

async function main() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set (≥16 chars)");
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
  await mkdir(uploadDir, { recursive: true });

  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(jwt, { secret });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(fastifyStatic, {
    root: uploadDir,
    prefix: "/uploads/",
    decorateReply: false,
  });

  await registerAuthGuards(app);

  await app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(entryRoutes);
      await api.register(marketRoutes);
      await api.register(stockRoutes);
      await api.register(uploadRoutes);
      await api.register(adminRoutes);
      api.get("/health", async () => ({ ok: true }));
    },
    { prefix: "/api" }
  );

  await ensureAdmin();
  await purgeExpiredTrash();
  setInterval(
    () => {
      void purgeExpiredTrash();
    },
    24 * 60 * 60 * 1000
  );

  const port = Number(process.env.API_PORT || 3000);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
