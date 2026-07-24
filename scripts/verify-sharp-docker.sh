#!/usr/bin/env bash
# 在 Alpine API 镜像内验证 sharp 缩略图链路（需本机已安装 Docker）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "错误: 未找到 docker 命令，请先安装并启动 Docker Desktop。" >&2
  exit 1
fi

echo "==> 构建 API 镜像（含 Alpine sharp smoke test）..."
docker compose build api --progress=plain

echo "==> 在运行中的 API 容器环境再次执行 smoke test..."
docker compose run --rm --no-deps --entrypoint "" api node scripts/test-image-thumb.mjs

echo "==> sharp Docker 验证通过"
