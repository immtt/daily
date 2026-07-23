/**
 * 本地无 Docker 时启动嵌入式 PostgreSQL（开发用）
 * 用法: npx tsx scripts/dev-db.ts
 */
import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = path.join(root, "data/pg");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "stock",
  password: "stock_secret",
  port: 5432,
  persistent: true,
});

async function main() {
  console.log("Initialising embedded Postgres at", databaseDir);
  await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase("stock_diary");
    console.log("Created database stock_diary");
  } catch {
    console.log("Database stock_diary already exists (ok)");
  }
  console.log("Postgres listening on 5432 — keep this process running");
  console.log(
    "DATABASE_URL=postgresql://stock:stock_secret@127.0.0.1:5432/stock_diary?schema=public"
  );

  const stop = async () => {
    console.log("\nStopping Postgres…");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
