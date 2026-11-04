@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required. Install Node.js LTS and rerun.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Installing this project's npm dependencies...
  call npm ci
  if errorlevel 1 goto failed
)
call npm run verify:ui-foundation
if errorlevel 1 goto failed
echo.
echo Starting the MK DOS Archive Museum and Laboratory at http://localhost:3000
call npm run dev
exit /b %ERRORLEVEL%
:failed
echo Startup checks did not pass. No original game files were modified.
pause
exit /b 1
