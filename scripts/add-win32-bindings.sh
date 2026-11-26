#!/usr/bin/env bash
# devcontainer（Linux）で入れた node_modules に、Windows 用のネイティブモジュールを追加で展開する。
# npm の依存解決を通さないため、Linux 用のモジュールは削除されず、devcontainer と Windows の両方で使える。
#
# 使い方（Windows の Git Bash で、Node 20 以上を使う）:
#   volta run --node 24 bash scripts/add-win32-bindings.sh
#
# devcontainer と Windows のどちらかで npm install / npm ci を実行すると、
# もう一方の OS 用のモジュールは削除される。そのときはこのスクリプトを再実行する。
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# check・build・テストで使うネイティブモジュールだけを対象にする
# （sharp・@napi-rs/lzma は PWA アイコンの生成ツール専用のため対象外）
PACKAGES=(
  "@rolldown/binding-win32-x64-msvc"
  "@rollup/rollup-win32-x64-msvc"
  "@tailwindcss/oxide-win32-x64-msvc"
  "lightningcss-win32-x64-msvc"
)

for name in "${PACKAGES[@]}"; do
  # バージョンは package-lock.json に記録されたものに合わせる
  version="$(node -e "console.log(require(process.argv[1]).packages['node_modules/' + process.argv[2]].version)" "$REPO/package-lock.json" "$name")"
  dest="$REPO/node_modules/$name"
  if [ -f "$dest/package.json" ] && grep -q "\"version\": \"$version\"" "$dest/package.json"; then
    echo "skip   $name@$version（展開済み）"
    continue
  fi
  tgz="$(cd "$WORK" && npm pack --silent "$name@$version")"
  rm -rf "$dest"
  mkdir -p "$dest"
  tar -xzf "$WORK/$tgz" --strip-components=1 -C "$dest"
  echo "added  $name@$version"
done
