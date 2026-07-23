import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sendError } from "../lib/util.js";

export type JwtUser = {
  id: string;
  username: string;
  role: "admin" | "user";
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function registerAuthGuards(app: FastifyInstance) {
  app.decorate("authenticate", async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return sendError(reply, 401, "未登录或令牌无效", "UNAUTHORIZED");
    }
  });

  app.decorate("requireAdmin", async (req, reply) => {
    try {
      await req.jwtVerify();
      if (req.user.role !== "admin") {
        return sendError(reply, 403, "需要管理员权限", "FORBIDDEN");
      }
    } catch {
      if (reply.sent) return;
      return sendError(reply, 401, "未登录或令牌无效", "UNAUTHORIZED");
    }
  });
}
