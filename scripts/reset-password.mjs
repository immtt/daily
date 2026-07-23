/**
 * 重置用户密码
 * 用法:
 *   node scripts/reset-password.mjs <用户名> <新密码>
 *   RESET_USERNAME=admin RESET_PASSWORD=xxx node scripts/reset-password.mjs
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prisma = new PrismaClient();

const username = process.argv[2] || process.env.RESET_USERNAME || "admin";
const password = process.argv[3] || process.env.RESET_PASSWORD;

if (!password || password.length < 6) {
  console.error("用法: node scripts/reset-password.mjs <用户名> <新密码>（至少 6 位）");
  process.exit(1);
}

function syncEnvPassword(next) {
  for (const rel of [".env", "apps/api/.env"]) {
    const p = path.join(root, rel);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    const updated = text.replace(
      /^ADMIN_PASSWORD=.*$/m,
      `ADMIN_PASSWORD=${next}`
    );
    if (updated !== text) writeFileSync(p, updated);
  }
}

async function main() {
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({
    where: { username },
    data: { passwordHash: hash },
  });
  if (username === (process.env.ADMIN_USERNAME || "admin")) {
    syncEnvPassword(password);
  }
  console.log(`已更新用户 "${user.username}" 的密码`);
  console.log(`登录: ${username} / ${password}`);
}

main()
  .catch((e) => {
    if (String(e).includes("Record to update not found")) {
      console.error(`用户 "${username}" 不存在，请先启动 API 或执行 npm run db:seed`);
    } else {
      console.error(e);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
