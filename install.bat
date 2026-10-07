@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title Antigravity Claude Theme - 一键安装程序 (Windows)

echo ========================================================
echo   Antigravity Claude Theme - Windows 一键安装程序
echo ========================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 1. 检查 Node.js 环境
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [❌ 错误] 未检测到 Node.js 环境！
    echo 请先安装 Node.js LTS 版本：https://nodejs.org
    echo 或在 PowerShell/CMD 中运行: winget install OpenJS.NodeJS.LTS
    echo 安装完成后请重新运行本安装程序。
    echo.
    pause
    exit /b 1
)

echo >> [1/3] 正在安装运行时依赖 (puppeteer-core)...
call npm install --silent
if %errorlevel% neq 0 (
    echo [警告] npm 依赖安装可能未完成，尝试再次检查...
)

:: 2. 自动检索 Antigravity 安装路径以绑定图标
echo >> [2/3] 正在检测 Antigravity 程序路径与图标...
set "ANTIGRAVITY_EXE="
if exist "%LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe" (
    set "ANTIGRAVITY_EXE=%LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe"
) else if exist "%LOCALAPPDATA%\Antigravity\Antigravity.exe" (
    set "ANTIGRAVITY_EXE=%LOCALAPPDATA%\Antigravity\Antigravity.exe"
) else if exist "%PROGRAMFILES%\Antigravity\Antigravity.exe" (
    set "ANTIGRAVITY_EXE=%PROGRAMFILES%\Antigravity\Antigravity.exe"
) else if exist "%ProgramFiles(x86)%\Antigravity\Antigravity.exe" (
    set "ANTIGRAVITY_EXE=%ProgramFiles(x86)%\Antigravity\Antigravity.exe"
) else (
    for /f "delims=" %%i in ('where Antigravity.exe 2^>nul') do (
        set "ANTIGRAVITY_EXE=%%i"
    )
)

:: 3. 创建桌面与开始菜单快捷方式
echo >> [3/3] 正在生成桌面快捷方式 [Claude Antigravity]...
powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$desktopPath = [Environment]::GetFolderPath('Desktop'); " ^
    "$shortcutPath = [System.IO.Path]::Combine($desktopPath, 'Claude Antigravity.lnk'); " ^
    "$s = $ws.CreateShortcut($shortcutPath); " ^
    "$s.TargetPath = 'wscript.exe'; " ^
    "$s.Arguments = '\"%SCRIPT_DIR%run-silent.vbs\"'; " ^
    "$s.WorkingDirectory = '%SCRIPT_DIR%'; " ^
    "$s.Description = '以 Claude 风格启动 Google Antigravity'; " ^
    "if ('%ANTIGRAVITY_EXE%' -ne '' -and (Test-Path '%ANTIGRAVITY_EXE%')) { $s.IconLocation = '%ANTIGRAVITY_EXE%,0' }; " ^
    "$s.Save(); " ^
    "$startMenu = [Environment]::GetFolderPath('Programs'); " ^
    "$smShortcutPath = [System.IO.Path]::Combine($startMenu, 'Claude Antigravity.lnk'); " ^
    "$smShortcut = $ws.CreateShortcut($smShortcutPath); " ^
    "$smShortcut.TargetPath = 'wscript.exe'; " ^
    "$smShortcut.Arguments = '\"%SCRIPT_DIR%run-silent.vbs\"'; " ^
    "$smShortcut.WorkingDirectory = '%SCRIPT_DIR%'; " ^
    "if ('%ANTIGRAVITY_EXE%' -ne '' -and (Test-Path '%ANTIGRAVITY_EXE%')) { $smShortcut.IconLocation = '%ANTIGRAVITY_EXE%,0' }; " ^
    "$smShortcut.Save();"

echo.
echo ========================================================
echo 🎉 安装完成！你可以通过以下方式启动 Claude 风格反重力：
echo  1. 双击桌面快捷方式: [Claude Antigravity] (无黑色命令行窗口)
echo  2. 在开始菜单中搜索 [Claude Antigravity] 回车启动
echo  3. 双击运行 start-claude-style.bat
echo ========================================================
echo.
pause
