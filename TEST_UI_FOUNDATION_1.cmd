@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  call npm ci
  if errorlevel 1 goto failed
)
call npm run verify:ui-foundation
if errorlevel 1 goto failed
call npm run lint
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
echo All source checks, typechecking and Vite build passed.
pause
exit /b 0
:failed
echo A verification stage failed. Review the messages above.
pause
exit /b 1
