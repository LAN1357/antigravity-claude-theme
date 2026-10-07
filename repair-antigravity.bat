@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title Antigravity 一键自动诊断与修复工具 (Windows)

echo ========================================================
echo    🚀 正在启动 Antigravity 智能修复与健康检查 (Windows)
echo ========================================================

set "PORT=9223"
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Step 1: 终止所有残留的 Antigravity 和注入进程
echo >> [1/6] 正在清理所有残留进程与端口占用...
taskkill /f /im Antigravity.exe >nul 2>&1
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*node*inject.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
timeout /t 2 /nobreak >nul

:: Step 2: 解除 Chromium 缓存死锁（保留用户聊天记录与设置）
echo >> [2/6] 正在清理临时死锁文件与 GPU 缓存 (聊天记录与配置完好保留)...
for %%D in ("%APPDATA%\Antigravity" "%LOCALAPPDATA%\Antigravity") do (
    if exist "%%~D" (
        del /f /q "%%~D\SingletonLock" 2>nul
        del /f /q "%%~D\SingletonSocket" 2>nul
        del /f /q "%%~D\SingletonCookie" 2>nul
        del /f /q "%%~D\DevToolsActivePort" 2>nul
        rd /s /q "%%~D\GPUCache" 2>nul
        rd /s /q "%%~D\DawnGraphiteCache" 2>nul
        rd /s /q "%%~D\DawnWebGPUCache" 2>nul
    )
)

:: Step 3: 检测并配置最新 Windows 系统代理
echo >> [3/6] 正在检测系统代理设置...
for /f "tokens=3" %%A in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable 2^>nul ^| find "ProxyEnable"') do (
    set "PROXY_ENABLED=%%A"
)
if "!PROXY_ENABLED!"=="0x1" (
    for /f "tokens=2,*" %%A in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer 2^>nul ^| find "ProxyServer"') do (
        set "SYS_PROXY=%%B"
    )
    if defined SYS_PROXY (
        if "!SYS_PROXY:~0,7!" neq "http://" (
            set "http_proxy=http://!SYS_PROXY!"
            set "https_proxy=http://!SYS_PROXY!"
        ) else (
            set "http_proxy=!SYS_PROXY!"
            set "https_proxy=!SYS_PROXY!"
        )
        echo >> ✅ 已匹配并注入系统代理: !http_proxy!
    )
) else (
    echo >> ℹ️ 当前未开启系统全局代理。
)
set "no_proxy=localhost,127.0.0.1,::1"

:: Step 4: 校验 Node.js 与依赖
echo >> [4/6] 正在校验运行环境与依赖完整性...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [❌ 错误] 未找到 Node.js，请安装 Node.js (https://nodejs.org)
    pause
    exit /b 1
)

if not exist "node_modules\puppeteer-core" (
    echo >> 正在补全 puppeteer-core 依赖...
    call npm install --silent
)

:: Step 5: 检索 Antigravity 安装路径
echo >> [5/6] 正在定位 Antigravity 程序...
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

if not defined ANTIGRAVITY_EXE (
    echo [错误] 未找到 Antigravity.exe 安装位置。
    pause
    exit /b 1
)

:: Step 6: 重新拉起 Antigravity 与注入器
echo >> [6/6] 正在以调试端口 %PORT% 重新拉起 Antigravity...
start "" "%ANTIGRAVITY_EXE%" --remote-debugging-port=%PORT%

echo >> 正在等待调试端口就绪...
powershell -NoProfile -Command "$ready = $false; for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:%PORT%/json/version' -TimeoutSec 1; if ($res) { $ready = $true; break } } catch { Start-Sleep -Seconds 1 } }; if (-not $ready) { exit 1 }"

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo 🎉 修复完成！反重力已正常启动并正在加载最新 Claude 主题！
    echo ========================================================
    node inject.js %PORT%
) else (
    echo [警告] 端口连接超时，尝试直接前台拉起注入服务...
    node inject.js %PORT%
)
