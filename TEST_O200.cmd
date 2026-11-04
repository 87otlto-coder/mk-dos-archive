@echo off
setlocal
cd /d "%~dp0"
if "%~1"=="" (
  echo Usage: TEST_O200.cmd "C:\path\to\original\MK2"
  echo Requires Node.js, local TypeScript, Python and canonical unmodified MK2.EXE.
  exit /b 2
)
call npm run test:syntax || exit /b 1
set "O200_ZIP_PATH=%TEMP%\mkdos-o200-forensic-test.zip"
node scripts\verify-o200-fixture.cjs "%~1" || exit /b 1
python scripts\verify-o200-export.py "%~1" "%O200_ZIP_PATH%" || exit /b 1
echo O200 fixture and forensic export verification passed.
endlocal
