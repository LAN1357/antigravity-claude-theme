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

# 3. 为内核进程注入代理
# Antigravity 的界面由 Go 语言服务器在 127.0.0.1:随机端口 上提供，而 Go 只读环境变量、
# 不读 macOS 系统代理。代理缺失时它会直连 Google 并卡在 SYN_SENT，本地 UI 端口不再响应，
# Electron 侧表现为 main.log 里的 ERR_TIMED_OUT + 白屏窗口。
if [ -z "$https_proxy" ] && [ -z "$HTTPS_PROXY" ]; then
    SYS_PROXY="$(scutil --proxy | awk -F' : ' '/^  HTTPSProxy/{hs=$2} /^  HTTPSPort/{hp=$2} /^  HTTPProxy/{hh=$2} /^  HTTPPort/{hport=$2} END{if(hs!=""&&hp!="")print "http://"hs":"hp; else if(hh!=""&&hport!="")print "http://"hh":"hport}')"
    if [ -n "$SYS_PROXY" ]; then
        export http_proxy="$SYS_PROXY" https_proxy="$SYS_PROXY"
        echo ">> 已注入系统代理给内核进程: $SYS_PROXY"
    else
        echo ">> ⚠️ 未检测到系统代理，语言服务器可能连不上 Google（表现为白屏）。"
    fi
fi
export no_proxy="localhost,127.0.0.1,::1${no_proxy:+,$no_proxy}"

# 4. 通过二进制直接拉起 Antigravity，确保参数直达 Chromium 内核
echo ">> 正在以调试模式启动 Antigravity (端口: $PORT)..."
"/Applications/Antigravity.app/Contents/MacOS/Antigravity" --remote-debugging-port=$PORT >/dev/null 2>&1 &

# 5. 轮询检测调试接口是否就绪
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

# 6. 启动注入与热更新服务
echo ">> 正在启动注入与监听服务..."
exec "$NODE_BIN" inject.js "$PORT"
