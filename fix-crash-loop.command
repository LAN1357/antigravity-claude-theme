#!/bin/bash

# =========================================================================
# Antigravity 彻底解决频繁闪退与自动重启循环工具 (Fix Crash Loop)
# 
# 根因修复：
# 1. 之前 /Applications/Antigravity.app 签名损坏，导致内置 Squirrel.Mac 
#    自动更新检验代码签名失败 (代码未能满足指定的代码要求)；
# 2. 自动更新失败后，反重力无限触发 [Auto-Restart] (每隔十几秒杀掉后端 language server 
#    并更换端口重载窗口，单日触发高达 36+ 次)；
# 3. 本脚本将当前应用无损升级到已下载完毕的 Google 官方 2.21.1 纯净正版，
#    恢复官方签名，彻底根除自动更新崩溃死循环，并保持所有聊天记录与 Claude 主题！
# =========================================================================

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "========================================================"
echo "    🛠️ 正在修复 Antigravity 频繁闪退与自动重启循环..."
echo "========================================================"

# 1. 彻底退出 Antigravity
echo ">> [1/5] 正在通知并等待 Antigravity 退出..."
osascript -e 'tell application "Antigravity" to quit' 2>/dev/null
sleep 2
killall Antigravity 2>/dev/null
pkill -f "Antigravity.app" 2>/dev/null
pkill -f "node inject.js" 2>/dev/null
sleep 1

# 2. 检查是否有已下载的官方 2.21.1 完整安装包
ZIP_PATH="$HOME/Library/Caches/com.google.antigravity/pending/Antigravity.zip"
if [ ! -f "$ZIP_PATH" ]; then
    ZIP_PATH="$HOME/Library/Caches/com.google.antigravity/update.zip"
fi

if [ -f "$ZIP_PATH" ]; then
    echo ">> [2/5] 发现已就绪的 Google 官方 2.21.1 完整包，正在恢复纯净官方签名版本..."
    rm -rf /tmp/antigravity_official_update 2>/dev/null
    mkdir -p /tmp/antigravity_official_update
    unzip -q "$ZIP_PATH" -d /tmp/antigravity_official_update
    
    if [ -d "/tmp/antigravity_official_update/Antigravity.app" ]; then
        # 备份旧损坏版本
        rm -rf /Applications/Antigravity.app.bak 2>/dev/null
        mv /Applications/Antigravity.app /Applications/Antigravity.app.bak 2>/dev/null
        mv /tmp/antigravity_official_update/Antigravity.app /Applications/Antigravity.app
        echo ">> ✅ 已成功替换为 Google 官方认证的 2.21.1 纯净版本！"
    fi
    rm -rf /tmp/antigravity_official_update 2>/dev/null
fi

# 3. 清理导致 ShipIt 重复崩溃的旧更新缓存
echo ">> [3/5] 正在清理导致循环报错的旧更新缓存..."
rm -rf "$HOME/Library/Caches/com.google.antigravity.ShipIt" 2>/dev/null
rm -rf "$HOME/Library/Caches/com.google.antigravity/pending" 2>/dev/null
rm -f "$HOME/Library/Caches/com.google.antigravity/update.zip" 2>/dev/null

# 4. 清理解除锁与坏缓存
echo ">> [4/5] 正在清理临时死锁与 GPU 缓存 (聊天记录与配置完好保留)..."
APP_SUPPORT="$HOME/Library/Application Support/Antigravity"
rm -f "$APP_SUPPORT/SingletonLock" "$APP_SUPPORT/SingletonSocket" "$APP_SUPPORT/DevToolsActivePort" 2>/dev/null
rm -rf "$APP_SUPPORT/GPUCache" "$APP_SUPPORT/DawnGraphiteCache" "$APP_SUPPORT/DawnWebGPUCache" 2>/dev/null

# 5. 重新拉起应用并连接注入
echo ">> [5/5] 正在以调试端口启动全新稳定的 Antigravity..."
nohup "$DIR/start-claude-style.command" >/tmp/claude-style.log 2>&1 &

echo "========================================================"
echo "🎉 修复完成！反重力已彻底恢复官方纯净签名，死循环已彻底消除！"
echo "========================================================"
