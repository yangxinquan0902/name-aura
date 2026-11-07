#!/usr/bin/env bash
set -u
ROOT="C:/Users/15016/WorkBuddy/2026-11-07-09-23-27/name-aura"
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
BASE="file:///C:/Users/15016/WorkBuddy/2026-11-07-09-23-27/name-aura/_cap_only.html"
OUT="$ROOT/promo/assets"
cd "$ROOT" || exit 1

run() {
  local s=$1 i=$2 name=$3
  local url="$BASE?src=$s&i=$i&n=%E4%B8%80%E5%8F%AA%E9%B9%BF&fast=1"
  local h
  h=$("$E" --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files \
      --user-data-dir="C:/Users/15016/AppData/Local/Temp/cap-$s$i-m" \
      --window-size=1040,900 --virtual-time-budget=9000 --dump-dom "$url" 2>/dev/null \
      | grep -oE "<title>CLONE [0-9]+" | grep -oE "[0-9]+" | head -1)
  if [ -z "${h:-}" ]; then echo "  $name 测量失败"; return 1; fi
  "$E" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=2 --user-data-dir="C:/Users/15016/AppData/Local/Temp/cap-$s$i-s" \
    --window-size=1040,"$h" --virtual-time-budget=9000 \
    --screenshot="$OUT/$name.png" "$url" 2>/dev/null
  echo "  $name  1040x$h"
}

echo "开始渲染卡片素材："
run solo 0 hero
run solo 2 disc
run solo 3 radar
run solo 4 moral
run solo 5 deep
run duo 0 duo
echo "完成"
