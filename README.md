# Antigravity Claude Theme (Claude Minimal for Antigravity 2.x)

[English](#english) | [中文说明](#中文说明)

---

## 中文说明

为 macOS 上的 **Google Antigravity 2.x** 桌面客户端量身打造的 Claude Minimal 主题方案。

通过 Chromium 远程调试端口进行无损内存注入，**不修改任何应用本体文件、不解包 `app.asar`、不依赖第三方社区修补工具、不破坏代码签名**。随时可 100% 还原官方出厂默认外观。

### ✨ 核心特性

- **🛡️ 纯净无损与完全可逆**：零 Patch，零文件篡改。正常从启动台打开客户端即可秒回官方原版。
- **🔄 官方无缝更新**：Antigravity 随意自动更新或覆盖安装，绝对不报错、不冲突。
- **⚡ 实时热重载 (Hot-Reload)**：修改 `claude-style.css` 保存后，毫秒级推送到运行中的窗口，无需重启应用。
- **🎨 细腻的 Claude 设计语言**：
  - **中性微暖底色**：背景采用极轻微暖调中性浅色（`#FAFAF8`），纯白卡片（`#FFFFFF`），告别偏黄偏暗。
  - **彻底去光圈输入框**：消除原生多层描边与常亮橙色外发光，以优雅的 1px 细线（`#E6E5E0`）呈现，聚焦时自然变为加深灰（`#B8B6B0`）。
  - **克制的陶土橙强调色**：`#D97757` 仅保留在发送按钮与正文超链接上。
  - **系统级精选字体**：全离线字体方案（界面 SF Pro，对话正文 New York / Georgia 衬线体，代码统一为 SF Mono）。
  - **双模式支持**：浅色模式中性微暖，深色模式炭黑沉浸。

---

### 🚀 极速上手

#### 1. 前置要求
- macOS 系统
- [Node.js](https://nodejs.org/) (建议通过 `brew install node` 安装)

#### 2. 一键安装
```bash
git clone https://github.com/LAN1357/antigravity-claude-theme.git ~/claude-style
cd ~/claude-style
./install.sh
```

安装脚本将自动配置依赖，并在 `~/Applications/` 目录下生成带有 Antigravity 原生反重力图标的快捷启动器 **`Claude Antigravity.app`**。

#### 3. 日常启动方式（任选其一）
- **方式一（推荐）**：按 `Cmd + 空格` 呼出聚焦搜索（Spotlight / Raycast），输入 `Claude Antigravity` 回车。
- **方式二**：将 `~/Applications/Claude Antigravity.app` 拖入程序坞（Dock）直接点按。
- **方式三**：双击运行 `~/claude-style/start-claude-style.command`。

#### 4. 自定义微调样式
直接使用任意编辑器编辑 `~/claude-style/claude-style.css` 并保存，样式会自动在窗口中实时热更新。

#### 5. 如何彻底恢复原版
退出客户端后，**正常从程序坞或启动台点击官方原版 Antigravity** 即可，没有任何残留。

---

## English

A minimalist Claude-style theme for **Google Antigravity 2.x** desktop client on macOS.

Implemented via non-destructive Chromium Remote Debugging Port injection. **Zero binary patching, zero `app.asar` unpacking, zero third-party community tools, zero signature breakage**. Fully reversible at any time.

### ✨ Highlights

- **100% Non-Destructive**: Leaves original application files untouched. Open Antigravity normally to instantly revert to the stock look.
- **Update-Proof**: Official auto-updates and DMG overrides work seamlessly without conflict.
- **Live Hot Reload**: Edits to `claude-style.css` reflect in the active client window instantly without restart.
- **Refined Claude Aesthetics**:
  - Neutral warm paper background (`#FAFAF8`) & clean surfaces (`#FFFFFF`).
  - No glowing rings: Smooth 1px border (`#E6E5E0`) that gracefully deepens (`#B8B6B0`) on focus.
  - Curated Terracotta Orange (`#D97757`) strictly scoped to send button and text links.
  - Native typography: SF Pro for UI, New York / Georgia for reading, SF Mono for code.
  - Full support for both light and dark modes.

---

### 📦 Quick Start

```bash
git clone https://github.com/LAN1357/antigravity-claude-theme.git ~/claude-style
cd ~/claude-style
./install.sh
```

Then simply press `Cmd + Space`, search for **`Claude Antigravity`**, and press Enter!

---

### 📁 Project Structure

```text
├── claude-style.css          # Core stylesheet (calibrated for Antigravity Tailwind v4)
├── inject.js                 # Puppeteer-core CDP injector & file watcher
├── inspect.js                # DOM & CSS variable inspector
├── start-claude-style.command # Launcher script (port handling & process bridge)
├── install.sh                # One-click installer & macOS App generator
└── package.json              # Node dependencies (puppeteer-core)
```

---

### 📄 License

[MIT License](LICENSE) © 2026 LAN1357
