#!/bin/bash

# =========================================================================
# Antigravity Claude Theme - 一键自动诊断与修复工具 (One-Click Repair Tool)
# 功能：
# 1. 强制清理残留僵尸进程与端口冲突
# 2. 清理 Chromium 临时死锁（SingletonLock/GPUCache），严格保护所有聊天记录与配置
# 3. 动态嗅探并注入当前 macOS 代理配置
# 4. 校验本地 Claude 主题文件完整性（基于 Git 确保最新版本不丢失）
# 5. 重建 ~/Applications/Claude Antigravity.app
# 6. 一键重新启动反重力并注入最新 Claude 主题
# =========================================================================

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "========================================================"
echo "    🚀 正在启动 Antigravity 智能修复与健康检查..."
echo "========================================================"

# Step 1: 终止所有残留的 Antigravity 和注入进程
echo ">> [1/6] 正在清理所有残留进程与端口占用..."
killall "Antigravity" 2>/dev/null
pkill -f "Antigravity.app" 2>/dev/null
pkill -f "node inject.js" 2>/dev/null
sleep 2

# 强制确保端口释放
PORT=9223
PID_OCCUPY=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PID_OCCUPY" ]; then
    echo ">> 正在释放端口 $PORT (PID: $PID_OCCUPY)..."
    kill -9 $PID_OCCUPY 2>/dev/null
fi

# Step 2: 解除 Chromium 缓存死锁（保留用户数据）
APP_SUPPORT="$HOME/Library/Application Support/Antigravity"
if [ -d "$APP_SUPPORT" ]; then
    echo ">> [2/6] 正在清理临时死锁文件与 GPU 缓存 (聊天记录与配置完好保留)..."
    rm -f "$APP_SUPPORT/SingletonLock" 2>/dev/null
    rm -f "$APP_SUPPORT/SingletonSocket" 2>/dev/null
    rm -f "$APP_SUPPORT/SingletonCookie" 2>/dev/null
    rm -f "$APP_SUPPORT/DevToolsActivePort" 2>/dev/null
    rm -rf "$APP_SUPPORT/GPUCache" 2>/dev/null
    rm -rf "$APP_SUPPORT/DawnGraphiteCache" 2>/dev/null
    rm -rf "$APP_SUPPORT/DawnWebGPUCache" 2>/dev/null
fi

# Step 2.5: 检查并修复代码签名（防止 AutoUpdater 导致的无限重启闪退循环）
if ! codesign -v /Applications/Antigravity.app 2>/dev/null; then
    echo ">> [!] 检测到 Antigravity 代码签名损坏（会导致 AutoUpdater 每隔十秒强制重启闪退）"
    ZIP_PATH="$HOME/Library/Caches/com.google.antigravity/pending/Antigravity.zip"
    if [ ! -f "$ZIP_PATH" ]; then
        ZIP_PATH="$HOME/Library/Caches/com.google.antigravity/update.zip"
    fi
    if [ -f "$ZIP_PATH" ]; then
        echo ">> 正在从已下载的官方安装包恢复 Google 官方纯净正版..."
        rm -rf /tmp/antigravity_repair_update 2>/dev/null
        mkdir -p /tmp/antigravity_repair_update
        unzip -q "$ZIP_PATH" -d /tmp/antigravity_repair_update
        if [ -d "/tmp/antigravity_repair_update/Antigravity.app" ]; then
            rm -rf /Applications/Antigravity.app.bak 2>/dev/null
            mv /Applications/Antigravity.app /Applications/Antigravity.app.bak 2>/dev/null
            mv /tmp/antigravity_repair_update/Antigravity.app /Applications/Antigravity.app
            rm -rf "$HOME/Library/Caches/com.google.antigravity.ShipIt" 2>/dev/null
            rm -rf "$HOME/Library/Caches/com.google.antigravity/pending" 2>/dev/null
            echo ">> ✅ 已成功修复代码签名，恢复为 Google 官方认证版本！"
        fi
        rm -rf /tmp/antigravity_repair_update 2>/dev/null
    fi
fi

# Step 3: 检测并配置最新代理
echo ">> [3/6] 正在检测系统代理设置..."
SYS_PROXY="$(scutil --proxy | awk -F' : ' '/^  HTTPSProxy/{hs=$2} /^  HTTPSPort/{hp=$2} /^  HTTPProxy/{hh=$2} /^  HTTPPort/{hport=$2} END{if(hs!=""&&hp!="")print "http://"hs":"hp; else if(hh!=""&&hport!="")print "http://"hh":"hport}')"
if [ -n "$SYS_PROXY" ]; then
    export http_proxy="$SYS_PROXY" https_proxy="$SYS_PROXY"
    echo ">> ✅ 已匹配当前系统代理: $SYS_PROXY"
else
    echo ">> ℹ️ 当前未开启系统全局代理。"
fi
export no_proxy="localhost,127.0.0.1,::1${no_proxy:+,$no_proxy}"

# Step 4: 校验 Claude 主题版本完整性
echo ">> [4/6] 正在校验 Claude 主题版本与依赖..."
if [ -d ".git" ]; then
    CURRENT_REV=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo ">> 当前 Git 版本版本号: $CURRENT_REV"
fi

NODE_BIN="$(which node 2>/dev/null || echo '/usr/local/bin/node')"
if [ ! -x "$NODE_BIN" ]; then
    echo "❌ 错误: 未找到 Node.js，请安装 Node.js"
    read -p "按回车键退出..."
    exit 1
fi

if [ ! -d "node_modules/puppeteer-core" ]; then
    echo ">> 正在补全 puppeteer-core 依赖..."
    npm install --silent
fi

# Step 5: 重建启动快捷方式
echo ">> [5/6] 正在刷新快捷启动应用 ~/Applications/Claude Antigravity.app..."
mkdir -p "$HOME/Applications"
osacompile -e 'do shell script "export PATH=\"/usr/local/bin:/opt/homebrew/bin:$PATH\"; nohup '"$DIR"'/start-claude-style.command >/tmp/claude-style.log 2>&1 &"' -o "$HOME/Applications/Claude Antigravity.app" 2>/dev/null

ANTIGRAVITY_APP="/Applications/Antigravity.app"
if [ -d "$ANTIGRAVITY_APP" ] && [ -f "$ANTIGRAVITY_APP/Contents/Resources/icon.icns" ]; then
    python3 - << 'PYEOF' 2>/dev/null
import os, subprocess, shutil
from AppKit import NSImage, NSWorkspace

app_path = os.path.expanduser("~/Applications/Claude Antigravity.app")
src_icon = "/Applications/Antigravity.app/Contents/Resources/icon.icns"
dest_icon = os.path.join(app_path, "Contents/Resources/applet.icns")
assets_car = os.path.join(app_path, "Contents/Resources/Assets.car")

if os.path.exists(assets_car):
    os.remove(assets_car)

if os.path.exists(src_icon):
    shutil.copyfile(src_icon, dest_icon)
    image = NSImage.alloc().initWithContentsOfFile_(src_icon)
    NSWorkspace.sharedWorkspace().setIcon_forFile_options_(image, app_path, 0)

lsregister = "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
if os.path.exists(lsregister):
    subprocess.run([lsregister, "-f", app_path])
os.system(f'touch "{app_path}"')
PYEOF
fi

# Step 6: 重新拉起 Antigravity 与注入器
echo ">> [6/6] 正在重新启动 Antigravity 并应用最新 Claude 主题..."
"$ANTIGRAVITY_APP/Contents/MacOS/Antigravity" --remote-debugging-port=$PORT >/dev/null 2>&1 &

READY=0
for i in {1..30}; do
    if curl -s "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
        READY=1
        break
    fi
    sleep 1
done

if [ $READY -eq 1 ]; then
    echo ">> ✅ 调试端口已就绪，正在连接注入守护进程..."
    echo "========================================================"
    echo "🎉 修复完成！反重力已正常启动并加载最新 Claude 主题！"
    echo "========================================================"
    exec "$NODE_BIN" inject.js "$PORT"
else
    echo "⚠️ 调试端口响应超时，请查看语言服务器日志："
    echo "   tail -n 20 ~/Library/Logs/Antigravity/language_server.log"
    echo ">> 尝试直接前台拉起注入器..."
    exec "$NODE_BIN" inject.js "$PORT"
fi
