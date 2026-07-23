#!/usr/bin/env bash
# 更新股票代码库（可扩展为 akshare / 东方财富导出）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/api"
npx tsx ../../scripts/update-stock-catalog.ts
