import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializePublicUser } from "../lib/lifeAccess.js";
import { sendError } from "../lib/util.js";

const credSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(100),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z.string().min(6).max(100),
});

const lifePasswordSchema = z.string().min(4).max(100);

const lifeAccessSchema = z.object({
  enabled: z.boolean(),
  password: lifePasswordSchema.optional(),
  currentPassword: z.string().min(1).max(100).optional(),
  newPassword: lifePasswordSchema.optional(),
});

const lifeVerifySchema = z.object({
  password: z.string().min(1).max(100),
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
      user: serializePublicUser(user),
    };
  });

  app.get(
    "/auth/me",
    { preHandler: [app.authenticate] },
    async (req) => {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          status: "active",
          lifeAccessEnabled: false,
        };
      }
      return serializePublicUser(user);
    }
  );

  app.patch(
    "/auth/password",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(reply, 400, "参数校验失败", "VALIDATION_ERROR");
      }
      const { currentPassword, newPassword } = parsed.data;
      if (currentPassword === newPassword) {
        return sendError(reply, 400, "新密码不能与当前密码相同", "VALIDATION_ERROR");
      }
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return sendError(reply, 404, "用户不存在", "NOT_FOUND");
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return sendError(reply, 401, "当前密码不正确", "UNAUTHORIZED");
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      return { ok: true };
    }
  );

  app.patch(
    "/auth/life-access",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const parsed = lifeAccessSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(reply, 400, "参数校验失败", "VALIDATION_ERROR");
      }
      const body = parsed.data;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return sendError(reply, 404, "用户不存在", "NOT_FOUND");
      }

      if (body.enabled) {
        if (body.newPassword) {
          if (!user.lifeAccessEnabled || !user.lifePasswordHash) {
            return sendError(reply, 400, "请先启用生活栏目密码", "VALIDATION_ERROR");
          }
          if (!body.currentPassword) {
            return sendError(reply, 400, "请提供当前生活栏目密码", "VALIDATION_ERROR");
          }
          const ok = await bcrypt.compare(body.currentPassword, user.lifePasswordHash);
          if (!ok) {
            return sendError(reply, 401, "当前生活栏目密码不正确", "UNAUTHORIZED");
          }
          const lifePasswordHash = await bcrypt.hash(body.newPassword, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { lifePasswordHash },
          });
        } else if (body.password) {
          if (user.lifeAccessEnabled && user.lifePasswordHash) {
            return sendError(
              reply,
              400,
              "生活栏目密码已启用，请使用修改密码",
              "VALIDATION_ERROR"
            );
          }
          const lifePasswordHash = await bcrypt.hash(body.password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { lifeAccessEnabled: true, lifePasswordHash },
          });
        } else {
          return sendError(reply, 400, "请提供生活栏目密码", "VALIDATION_ERROR");
        }
      } else {
        if (!user.lifeAccessEnabled) {
          return sendError(reply, 400, "生活栏目密码未启用", "VALIDATION_ERROR");
        }
        if (!body.currentPassword || !user.lifePasswordHash) {
          return sendError(reply, 400, "请提供当前生活栏目密码", "VALIDATION_ERROR");
        }
        const ok = await bcrypt.compare(body.currentPassword, user.lifePasswordHash);
        if (!ok) {
          return sendError(reply, 401, "当前生活栏目密码不正确", "UNAUTHORIZED");
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { lifeAccessEnabled: false, lifePasswordHash: null },
        });
      }

      const updated = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      return serializePublicUser(updated);
    }
  );

  app.post(
    "/auth/life-access/verify",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const parsed = lifeVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(reply, 400, "参数校验失败", "VALIDATION_ERROR");
      }
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return sendError(reply, 404, "用户不存在", "NOT_FOUND");
      }
      if (!user.lifeAccessEnabled) {
        return { ok: true, required: false };
      }
      if (!user.lifePasswordHash) {
        return { ok: false, required: true };
      }
      const ok = await bcrypt.compare(parsed.data.password, user.lifePasswordHash);
      return { ok, required: true };
    }
  );
}
