#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "    正在回滚 Antigravity 主题至 v1.3.1-unboxed 版本"
echo "=================================================="

git checkout v1.3.1-unboxed -- claude-style.css claude-enhancer.js
echo ">> ✅ 已从 Git 标签恢复至 v1.3.1-unboxed。"

echo ">> 正在触发热更新..."
touch "$DIR/claude-style.css"
touch "$DIR/claude-enhancer.js"

echo "=================================================="
echo "🎉 回滚完成！当前已恢复至 v1.3.1-unboxed 版本。"
echo "=================================================="
