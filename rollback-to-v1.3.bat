@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==================================================
echo     正在回滚 Antigravity 主题至 v1.3.1-unboxed 版本
echo ==================================================

git checkout v1.3.1-unboxed -- claude-style.css claude-enhancer.js
echo >> 已从 Git 标签恢复至 v1.3.1-unboxed。

echo >> 正在触发热更新...
powershell -NoProfile -Command "(Get-Item 'claude-style.css').LastWriteTime = Get-Date; (Get-Item 'claude-enhancer.js').LastWriteTime = Get-Date" >nul 2>&1

echo ==================================================
echo 🎉 回滚完成！当前已恢复至 v1.3.1-unboxed 版本。
echo ==================================================
pause
