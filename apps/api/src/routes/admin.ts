import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { sendError } from "../lib/util.js";

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.requireAdmin);

  app.get("/admin/users", async (req) => {
    const status = (req.query as { status?: string }).status;
    const where =
      status === "pending" || status === "active" || status === "rejected"
        ? { status: status as "pending" | "active" | "rejected" }
        : {};
    const items = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        status: true,
        role: true,
        createdAt: true,
      },
    });
    return {
      items: items.map((u) => ({
        id: u.id,
        username: u.username,
        status: u.status,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  });

  app.post("/admin/users/:id/approve", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { status: "active" },
      });
      return { status: user.status };
    } catch {
      return sendError(reply, 404, "用户不存在", "NOT_FOUND");
    }
  });

  app.post("/admin/users/:id/reject", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { status: "rejected" },
      });
      return { status: user.status };
    } catch {
      return sendError(reply, 404, "用户不存在", "NOT_FOUND");
    }
  });
}
