#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "    正在回滚 Antigravity 主题至 v1.2.0-stable 稳定版"
echo "=================================================="

BACKUP_DIR="$DIR/backups/backup-20261007_1850"

if [ -d "$BACKUP_DIR" ]; then
    cp -fv "$BACKUP_DIR/claude-style.css" "$DIR/claude-style.css"
    cp -fv "$BACKUP_DIR/claude-enhancer.js" "$DIR/claude-enhancer.js"
    cp -fv "$BACKUP_DIR/inject.js" "$DIR/inject.js"
    echo ">> ✅ 已从本地备份恢复核心文件。"
else
    git checkout v1.2.0-stable -- claude-style.css claude-enhancer.js inject.js
    echo ">> ✅ 已从 Git 标签恢复核心文件。"
fi

echo ">> 正在触发热更新..."
touch "$DIR/claude-style.css"
touch "$DIR/claude-enhancer.js"

echo "=================================================="
echo "🎉 回滚完成！当前已恢复至 v1.2.0 稳定版本。"
echo "=================================================="
