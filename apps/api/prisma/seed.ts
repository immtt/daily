import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_STOCKS: Array<{ code: string; name: string; market: string }> = [
  { code: "000021", name: "深科技", market: "SZ" },
  { code: "600519", name: "贵州茅台", market: "SH" },
  { code: "601318", name: "中国平安", market: "SH" },
  { code: "600036", name: "招商银行", market: "SH" },
  { code: "601166", name: "兴业银行", market: "SH" },
  { code: "600276", name: "恒瑞医药", market: "SH" },
  { code: "601888", name: "中国中免", market: "SH" },
  { code: "600900", name: "长江电力", market: "SH" },
  { code: "601012", name: "隆基绿能", market: "SH" },
  { code: "688981", name: "中芯国际", market: "SH" },
  { code: "688041", name: "海光信息", market: "SH" },
  { code: "000001", name: "平安银行", market: "SZ" },
  { code: "000002", name: "万科A", market: "SZ" },
  { code: "000858", name: "五粮液", market: "SZ" },
  { code: "002594", name: "比亚迪", market: "SZ" },
  { code: "300750", name: "宁德时代", market: "SZ" },
  { code: "300059", name: "东方财富", market: "SZ" },
  { code: "002475", name: "立讯精密", market: "SZ" },
  { code: "000063", name: "中兴通讯", market: "SZ" },
  { code: "002415", name: "海康威视", market: "SZ" },
  { code: "300760", name: "迈瑞医疗", market: "SZ" },
];

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe_Admin_2026";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash: hash,
      role: "admin",
      status: "active",
    },
    create: {
      username,
      passwordHash: hash,
      role: "admin",
      status: "active",
    },
  });

  for (const s of SEED_STOCKS) {
    await prisma.stockCatalog.upsert({
      where: { code: s.code },
      update: { name: s.name, market: s.market },
      create: s,
    });
  }

  console.log(`Seeded admin "${username}" and ${SEED_STOCKS.length} stocks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
