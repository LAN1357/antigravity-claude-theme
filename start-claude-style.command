#!/bin/bash

# 确保在任何非终端或守护进程环境下都能找到 node
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
NODE_BIN="$(which node 2>/dev/null || echo '/usr/local/bin/node')"

# 获取当前脚本所在目录
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "      Antigravity Claude-Style 主题启动脚本"
echo "=================================================="

PORT=9223

# 1. 清理可能残留的注入进程
pkill -f "node inject.js" 2>/dev/null

# 2. 温和退出当前运行的 Antigravity
echo ">> 正在通知 Antigravity 退出..."
osascript -e 'tell application "Antigravity" to quit' 2>/dev/null

echo ">> 等待 Antigravity 进程完全释放..."
for i in {1..15}; do
    if ! pgrep -f "/Applications/Antigravity.app/Contents/MacOS/Antigravity" >/dev/null 2>&1; then
        echo ">> Antigravity 已完全退出。"
        break
    fi
    sleep 1
done

if pgrep -f "/Applications/Antigravity.app/Contents/MacOS/Antigravity" >/dev/null 2>&1; then
    echo ">> 提示：检测到 Antigravity 仍在关闭中，正在等待其彻底结束..."
    killall "Antigravity" 2>/dev/null
    sleep 2
fi

# 3. 通过二进制直接拉起 Antigravity，确保参数直达 Chromium 内核
echo ">> 正在以调试模式启动 Antigravity (端口: $PORT)..."
"/Applications/Antigravity.app/Contents/MacOS/Antigravity" --remote-debugging-port=$PORT >/dev/null 2>&1 &

# 4. 轮询检测调试接口是否就绪
echo ">> 正在等待调试端口 http://127.0.0.1:$PORT 开放..."
READY=0
for i in {1..25}; do
    if curl -s "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
        READY=1
        echo ">> ✅ 调试端口已就绪！"
        break
    fi
    sleep 1
done

if [ $READY -eq 0 ]; then
    echo ">> ⚠️ 端口检测超时，尝试启动注入服务..."
fi

# 5. 启动注入与热更新服务
echo ">> 正在启动注入与监听服务..."
exec "$NODE_BIN" inject.js "$PORT"
