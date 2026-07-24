import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { sendError } from "../lib/util.js";
import { thumbFilename, writeImageWithThumb } from "../lib/imageThumb.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX = 5 * 1024 * 1024;

export async function uploadRoutes(app: FastifyInstance) {
  app.post(
    "/uploads",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const file = await req.file();
      if (!file) {
        return sendError(reply, 400, "缺少文件", "VALIDATION_ERROR");
      }
      if (!ALLOWED.has(file.mimetype)) {
        return sendError(reply, 400, "仅支持 JPG/PNG/WebP", "VALIDATION_ERROR");
      }
      const buf = await file.toBuffer();
      if (buf.length > MAX) {
        return sendError(reply, 400, "图片不能超过 5MB", "VALIDATION_ERROR");
      }

      const uploadRoot = process.env.UPLOAD_DIR || "./uploads";
      const userDir = path.join(uploadRoot, req.user.id);
      await mkdir(userDir, { recursive: true });
      const baseId = randomUUID();
      const filename = `${baseId}${EXT[file.mimetype]}`;
      const destPath = path.join(userDir, filename);
      const thumbName = thumbFilename(baseId);
      await writeImageWithThumb(buf, destPath, path.join(userDir, thumbName));
      const url = `/uploads/${req.user.id}/${filename}`;
      const thumbUrl = `/uploads/${req.user.id}/${thumbName}`;
      return reply.status(201).send({ url, thumbUrl });
    }
  );
}
