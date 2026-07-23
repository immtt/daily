import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendError } from "../lib/util.js";

const credSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(100),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    if (process.env.OPEN_REGISTRATION !== "true") {
      return sendError(reply, 403, "当前未开放注册", "FORBIDDEN");
    }
    const parsed = credSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(reply, 400, "参数校验失败", "VALIDATION_ERROR");
    }
    const { username, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return sendError(reply, 409, "用户名已存在", "CONFLICT");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, passwordHash, role: "user", status: "pending" },
    });
    return reply.status(201).send({ message: "注册成功，请等待管理员审核" });
  });

  app.post("/auth/login", async (req, reply) => {
    const parsed = credSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(reply, 400, "参数校验失败", "VALIDATION_ERROR");
    }
    const { username, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return sendError(reply, 401, "用户名或密码错误", "UNAUTHORIZED");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return sendError(reply, 401, "用户名或密码错误", "UNAUTHORIZED");
    }
    if (user.status === "pending") {
      return sendError(reply, 403, "账号待审核", "FORBIDDEN");
    }
    if (user.status === "rejected") {
      return sendError(reply, 403, "账号已被拒绝", "FORBIDDEN");
    }
    const token = app.jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      { expiresIn: "7d" }
    );
    return {
      token,
      user: { id: user.id, username: user.username, role: user.role },
    };
  });

  app.get(
    "/auth/me",
    { preHandler: [app.authenticate] },
    async (req) => {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return { id: req.user.id, username: req.user.username, role: req.user.role, status: "active" };
      }
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      };
    }
  );
}
