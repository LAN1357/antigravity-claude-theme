# Antigravity Claude Theme (Claude Minimal for Antigravity 2.x)

[English](#english) | [中文说明](#中文说明)

---

## 中文说明

为 **Google Antigravity 2.x** 桌面客户端（macOS & Windows 双平台）量身打造的 Claude Minimal 主题方案。

通过 Chromium 远程调试端口进行无损内存注入，**不修改任何应用本体文件、不解包 `app.asar`、不依赖第三方社区修补工具、不破坏代码签名**。随时可 100% 还原官方出厂默认外观。

### ✨ 核心特性

- **🖥️ macOS & Windows 双平台无缝支持**：针对各平台（Mac 访达 / Win 文件资源管理器、系统字体渲染、路径格式）自动动态适配。
- **🛡️ 纯净无损与完全可逆**：零 Patch，零文件篡改。正常打开客户端即可秒回官方原版。
- **🔄 官方无缝更新**：Antigravity 随意自动更新或覆盖安装，绝对不报错、不冲突。
- **⚡ 实时热重载 (Hot-Reload)**：修改 `claude-style.css` 或 `claude-enhancer.js` 保存后，毫秒级推送到运行中的窗口，无需重启应用。
- **📄 文件交互与上下文菜单 (v1.4)**：
  - **左键单击**：直接使用系统默认程序即时打开文件。
  - **右键单击**：唤起 Apple / Claude 原质毛玻璃菜单，支持「在访达中显示 / 在资源管理器中显示」、「复制完整路径」、「复制文件名」。
- **🎨 细腻的 Claude 设计语言**：
  - **中性微暖底色**：背景采用极轻微暖调中性浅色（`#FAFAF8`），纯白卡片（`#FFFFFF`），告别偏黄偏暗。
  - **彻底去光圈输入框**：消除原生多层描边与常亮橙色外发光，以优雅的 1px 细线（`#E6E5E0`）呈现，聚焦时自然变为加深灰（`#B8B6B0`）。
  - **克制的陶土橙强调色**：`#D97757` 仅保留在发送按钮与正文超链接上。
  - **跨平台精选字体**：全离线字体栈（Mac: 苹方 + SF Pro，Win: Segoe UI + 微软雅黑 UI，代码: Cascadia / SF Mono）。
  - **双模式支持**：浅色模式中性微暖，深色模式炭黑沉浸。
- **📁 默认日常工作区路由与三段侧边栏**：
  - 全局点击左上角「`+ 新建对话`」时，自动绑定到默认日常工作区。
  - 置顶 / 项目 / 最近 三段式折叠布局，整洁收纳。

---

### 🚀 极速上手

#### 🍎 macOS 用户

1. **环境准备**：已安装 [Node.js](https://nodejs.org/) (`brew install node`)
2. **一键安装**：
   ```bash
   git clone https://github.com/LAN1357/antigravity-claude-theme.git ~/claude-style
   cd ~/claude-style
   ./install.sh
   ```
3. **日常启动**：
   - 按 `Cmd + 空格` 搜索 `Claude Antigravity` 回车启动；
   - 或双击运行 `~/claude-style/start-claude-style.command`。

---

#### 🪟 Windows 用户

1. **环境准备**：已安装 [Node.js](https://nodejs.org/)（或运行 `winget install OpenJS.NodeJS.LTS`）
2. **一键安装**：
   在 CMD 或 PowerShell 中运行：
   ```cmd
   git clone https://github.com/LAN1357/antigravity-claude-theme.git "%USERPROFILE%\claude-style"
   cd /d "%USERPROFILE%\claude-style"
   install.bat
   ```
3. **日常启动**：
   - **方式一（推荐）**：双击桌面上自动生成的 **`Claude Antigravity`** 快捷方式（无黑色命令行窗口，直接启动）；
   - **方式二**：在开始菜单搜索 `Claude Antigravity` 回车启动；
   - **方式三**：双击运行目录下的 `start-claude-style.bat`。

---

### 🛠️ 故障排查与一键修复

如果哪次 Antigravity 因僵尸进程、代理变化或缓存异常打不开，只需运行专属一键修复工具：
- **macOS**：双击运行 `repair-antigravity.command`
- **Windows**：双击运行 `repair-antigravity.bat`

自动清理残留死锁，重新探测代理并重启注入，**严格保留全部聊天记录与设置**。

---

### ⏪ 版本回滚

- **回滚到 v1.3.1 (无框折叠版)**：运行 `rollback-to-v1.3.command` (Mac) 或 `rollback-to-v1.3.bat` (Win)
- **回滚到 v1.2.0 (经典稳定版)**：运行 `rollback-to-v1.2.command` (Mac) 或 `rollback-to-v1.2.bat` (Win)

---

## English

A minimalist Claude-style theme for **Google Antigravity 2.x** desktop client on macOS & Windows.

Implemented via non-destructive Chromium Remote Debugging Port injection. **Zero binary patching, zero `app.asar` unpacking, zero third-party community tools, zero signature breakage**. Fully reversible at any time.

### ✨ Highlights

- **Cross-Platform**: Seamlessly works on both macOS and Windows 10/11.
- **100% Non-Destructive**: Leaves original application files untouched. Open Antigravity normally to instantly revert to the stock look.
- **Update-Proof**: Official auto-updates work seamlessly without conflict.
- **Live Hot Reload**: Edits to CSS/JS reflect in active client windows instantly without restart.
- **File Interactions (v1.4)**: Single-click to open files; right-click context menu to reveal in Finder (macOS) / File Explorer (Windows).
- **Refined Claude Aesthetics**: Neutral warm paper background (`#FAFAF8`), 1px non-glowing input borders, Terracotta Orange accents, and native system typography.

### 📦 Quick Start

#### macOS
```bash
git clone https://github.com/LAN1357/antigravity-claude-theme.git ~/claude-style
cd ~/claude-style
./install.sh
```

#### Windows
```cmd
git clone https://github.com/LAN1357/antigravity-claude-theme.git "%USERPROFILE%\claude-style"
cd /d "%USERPROFILE%\claude-style"
install.bat
```

---

### 📁 Project Structure

```text
├── claude-style.css           # Core stylesheet (macOS & Windows typography)
├── claude-enhancer.js         # Enhancer logic (file click, context menu, recents)
├── inject.js                  # Cross-platform Puppeteer CDP injector
├── install.sh                 # macOS one-click installer
├── install.bat                # Windows one-click installer (creates desktop shortcut)
├── run-silent.vbs             # Windows silent background launcher
├── start-claude-style.command # macOS launcher
├── start-claude-style.bat     # Windows launcher
├── repair-antigravity.command # macOS one-click diagnostic & repair tool
├── repair-antigravity.bat     # Windows one-click diagnostic & repair tool
├── rollback-to-v1.3.*         # Checkpoint rollback scripts
└── rollback-to-v1.2.*         # Checkpoint rollback scripts
```

---

### 📄 License

[MIT License](LICENSE) © 2026 LAN1357
