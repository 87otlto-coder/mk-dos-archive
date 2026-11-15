@echo off
setlocal EnableExtensions
cd /d "%~dp0"
where python >nul 2>&1
if errorlevel 1 (
  echo P91 CAPTURE BLOCKED: Python 3.11 or later is required.
  echo Nothing was changed in the original MK2 installation.
  pause
  exit /b 2
)
python -B "%~dp0run_private_capture.py" --capture
set "P91_EXIT=%ERRORLEVEL%"
if not "%P91_EXIT%"=="0" (
  echo.
  echo P91 native capture NOT accepted. Preserve the private error/evidence directory.
  echo Do not rerun automatically or modify original game files.
  pause
  exit /b %P91_EXIT%
)
echo.
echo P91 private packet consistency verified. Original framebuffer reconstruction remains pending.
pause
exit /b 0
