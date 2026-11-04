@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run_MK2_Test_Bot.ps1"
echo.
echo Finished. Press any key to close this window.
pause >nul
