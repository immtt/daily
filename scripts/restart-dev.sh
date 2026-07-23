#!/usr/bin/env bash
# 本地开发：SQLite + API + 前端（无需单独启动数据库进程）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

wait_port_free() {
  local port="$1"
  local max="${2:-15}"
  for _ in $(seq 1 "$max"); do
    if ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "端口 $port 仍被占用"
  return 1
}

stop_port() {
  local port="$1"
  local pids
  pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "停止端口 $port (PID $pids)"
    kill $pids 2>/dev/null || true
    wait_port_free "$port" 15
  fi
}

stop_port 5173
stop_port 3000

mkdir -p "$ROOT/data" "$ROOT/.logs"

echo "初始化 SQLite 数据库…"
cd "$ROOT/apps/api"
npx prisma generate
npx prisma db push --accept-data-loss
npm run db:seed

echo "同步股票代码库（东方财富生产接口）…"
if npm run update-stocks -- --if-empty >>"$ROOT/.logs/stocks.log" 2>&1; then
  echo "代码库已就绪"
else
  echo "代码库同步失败，见 .logs/stocks.log（可先使用种子 21 条）"
fi

echo "启动 API…"
nohup npm run dev > "$ROOT/.logs/api.log" 2>&1 &
echo $! > "$ROOT/.logs/api.pid"

for _ in {1..20}; do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
  echo "API 启动失败，见 .logs/api.log"
  tail -20 "$ROOT/.logs/api.log" || true
  exit 1
fi

echo "启动前端…"
cd "$ROOT"
nohup npm run dev:web > "$ROOT/.logs/web.log" 2>&1 &
echo $! > "$ROOT/.logs/web.pid"
sleep 2

echo ""
echo "=== 服务已重启 ==="
echo "前端  http://127.0.0.1:5173"
echo "API   http://127.0.0.1:3000/api/health"
echo "数据库 data/stock-diary.db （SQLite，无需单独进程）"
echo "账号  admin / 123456"
echo "日志  .logs/api.log  .logs/web.log"
