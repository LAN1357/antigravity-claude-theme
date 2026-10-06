#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "========================================================"
echo "  Antigravity Claude Theme - One-Click Installer"
echo "========================================================"

# 1. 检查 Node.js 环境
if ! command -v node >/dev/null 2>&1; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js (推荐通过 brew install node 或官网下载)。"
    exit 1
fi

echo ">> 正在安装依赖 (puppeteer-core)..."
npm install --silent

echo ">> 赋予脚本执行权限..."
chmod +x "$DIR/start-claude-style.command"

# 2. 编译 macOS 原生快捷启动应用
echo ">> 正在生成 ~/Applications/Claude Antigravity.app..."
mkdir -p "$HOME/Applications"

osacompile -e 'do shell script "export PATH=\"/usr/local/bin:/opt/homebrew/bin:$PATH\"; nohup '"$DIR"'/start-claude-style.command >/tmp/claude-style.log 2>&1 &"' -o "$HOME/Applications/Claude Antigravity.app"

# 3. 提取原版 Antigravity 图标赋予快捷应用
ANTIGRAVITY_APP="/Applications/Antigravity.app"
if [ -d "$ANTIGRAVITY_APP" ] && [ -f "$ANTIGRAVITY_APP/Contents/Resources/icon.icns" ]; then
    echo ">> 正在应用 Antigravity 原生反重力图标..."
    python3 - << 'PYEOF'
import os, subprocess, shutil
from AppKit import NSImage, NSWorkspace

app_path = os.path.expanduser("~/Applications/Claude Antigravity.app")
src_icon = "/Applications/Antigravity.app/Contents/Resources/icon.icns"
dest_icon = os.path.join(app_path, "Contents/Resources/applet.icns")
assets_car = os.path.join(app_path, "Contents/Resources/Assets.car")

if os.path.exists(assets_car):
    os.remove(assets_car)

shutil.copyfile(src_icon, dest_icon)

image = NSImage.alloc().initWithContentsOfFile_(src_icon)
NSWorkspace.sharedWorkspace().setIcon_forFile_options_(image, app_path, 0)

lsregister = "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
if os.path.exists(lsregister):
    subprocess.run([lsregister, "-f", app_path])

os.system(f'touch "{app_path}"')
PYEOF
fi

echo ""
echo "========================================================"
echo "🎉 安装完成！您可以选择以下任意方式启动 Claude 风格："
echo " 1. 按 Cmd + 空格 搜索 [Claude Antigravity] 回车启动"
echo " 2. 将 ~/Applications/Claude Antigravity.app 拖入程序坞点按启动"
echo " 3. 双击运行 start-claude-style.command"
echo "========================================================"
