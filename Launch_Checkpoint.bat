@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install Node.js, then run this launcher again.
  pause
  exit /b 1
)
node.exe scripts\serve-checkpoint.cjs 3001
pause
