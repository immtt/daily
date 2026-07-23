import type { FastifyInstance } from "fastify";
import { getMarketSnapshot } from "../services/market.js";
import { sendError } from "../lib/util.js";

export async function marketRoutes(app: FastifyInstance) {
  app.get(
    "/market/indices",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const q = req.query as { date?: string };
      const date = q.date || new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return sendError(reply, 400, "日期格式错误", "VALIDATION_ERROR");
      }
      return getMarketSnapshot(date);
    }
  );
}
