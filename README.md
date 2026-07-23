# 股票复盘日记本

多端同步的股票复盘日记：PWA + 结构化字段 + 富文本 + 自动大盘概况。

## 快速开始（本地开发）

### 前置

- Node.js ≥ 20
- PostgreSQL：Docker / 本机安装 / 或 `npm run dev:db`（嵌入式，无 Docker 时）

### 启动

```bash
cp .env.example .env
npm install

# 终端 1：数据库（三选一）
docker compose up -d postgres
# 或：npm run dev:db
# 或：本机 postgres 已建好 stock_diary

# 终端 2：API
cd apps/api && npx prisma migrate deploy && npm run db:seed && npm run dev

# 终端 3：前端
npm run dev:web
```

- 前端：http://127.0.0.1:5173  
- API：http://127.0.0.1:3000/api/health  
- 默认账号：`admin` / `ChangeMe_Admin_2026`

**当前阶段**：核心代码已落地（鉴权、日记 CRUD、大盘、TipTap、PWA、Compose）。请在本机终端按上面步骤启动联调，交付前跑完自测清单。

### 生产部署

```bash
cp .env.example .env   # 改强密钥与密码
docker compose up -d --build
```

详见 [docs/06-部署指南.md](docs/06-部署指南.md)

## 文档中心

完整文档见 [`docs/README.md`](docs/README.md)

| 类型 | 文档 |
|------|------|
| 需求 | [需求规格说明书](docs/requirements/需求规格说明书.md) · [需求变更记录](docs/requirements/需求变更记录.md) |
| 开发 | [开发文档](docs/development/开发文档.md) |
| 数据库 | [数据库设计规范](docs/database/数据库设计规范.md) · [schema.sql](docs/database/schema.sql) |
| 测试 | [自测文档](docs/testing/自测文档.md)（**交付前必过**） |
| BUG | [BUG记录](docs/bugs/BUG记录.md) |
| 原型 | [prototype/index.html](docs/prototype/index.html) |

## 仓库结构

```
apps/web     React + Vite + TipTap + PWA
apps/api     Fastify + Prisma
docs/        需求 / 开发 / 自测 / 原型
nginx/       反向代理
docker-compose.yml
```
