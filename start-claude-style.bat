@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title Antigravity Claude Theme Launcher

echo ==================================================
echo       Antigravity Claude-Style 主题启动脚本 (Windows)
echo ==================================================

set "PORT=9223"
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 1. 查找 Node.js 可执行文件
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未在系统 PATH 中找到 Node.js，请先安装 Node.js (https://nodejs.org)
    echo 或通过 winget 安装: winget install OpenJS.NodeJS.LTS
    pause
    exit /b 1
)

:: 2. 查找 Antigravity.exe 路径
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
    echo [警告] 未在默认路径找到 Antigravity.exe。
    set /p "ANTIGRAVITY_EXE=请输入 Antigravity.exe 的完整绝对路径: "
)

if not exist "%ANTIGRAVITY_EXE%" (
    echo [错误] 找不到文件: %ANTIGRAVITY_EXE%
    pause
    exit /b 1
)

echo >> 找到 Antigravity: "%ANTIGRAVITY_EXE%"

:: 3. 关闭旧的注入服务进程 (仅关闭命令行匹配 inject.js 的 node 进程)
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*node*inject.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 4. 退出正在运行的 Antigravity 确保调试端口生效
tasklist /fi "imagename eq Antigravity.exe" 2>nul | find /i "Antigravity.exe" >nul
if %errorlevel% equ 0 (
    echo >> 检测到正在运行的 Antigravity，正在关闭以开启调试端口...
    taskkill /im Antigravity.exe /f >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: 5. 注入 Windows 系统代理给 Go 内核
if not defined https_proxy if not defined HTTPS_PROXY (
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
            echo >> 已匹配并注入系统代理: !http_proxy!
        )
    ) else (
        echo >> [提示] 系统全局代理未开启。
    )
)
set "no_proxy=localhost,127.0.0.1,::1"

:: 6. 以调试模式启动 Antigravity
echo >> 正在启动 Antigravity (调试端口: %PORT%)...
start "" "%ANTIGRAVITY_EXE%" --remote-debugging-port=%PORT%

:: 7. 等待调试端口就绪
echo >> 正在等待调试端口就绪...
powershell -NoProfile -Command "$ready = $false; for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:%PORT%/json/version' -TimeoutSec 1; if ($res) { $ready = $true; break } } catch { Start-Sleep -Seconds 1 } }; if (-not $ready) { exit 1 }"
if %errorlevel% neq 0 (
    echo [警告] 端口检测超时，尝试直接拉起注入服务...
) else (
    echo >> ✅ 调试端口已就绪！
)

:: 8. 启动 Claude 主题注入守护进程
echo >> 正在启动 Claude 主题实时注入服务...
node inject.js %PORT%
