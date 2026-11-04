@echo off
setlocal EnableExtensions EnableDelayedExpansion

:: ============================================================
:: Generic Local Source Launcher
:: ------------------------------------------------------------
:: Put this BAT file in the root of a Node/Vite project
:: (the same folder as package.json) and double-click it.
::
:: Optional:
::   Launch_Source.bat 3001
:: will use port 3001 instead of the default 3000.
::
:: For the extractor/research apps built with Vite, no editing
:: should normally be required.
:: ============================================================

cd /d "%~dp0"

:: ------------------------------------------------------------
:: 0. Project-specific values are derived automatically
:: ------------------------------------------------------------
for %%I in ("%CD%") do set "APP_NAME=%%~nxI"

set "PORT=3000"
if not "%~1"=="" set "PORT=%~1"

set "HOST=127.0.0.1"
set "APP_URL=http://%HOST%:%PORT%/"
set "DEV_SCRIPT=dev"

:: Default arguments are appropriate for Vite projects.
set "DEV_ARGS=--host %HOST% --port %PORT% --strictPort"

set "PROFILE_DIR=%LOCALAPPDATA%\LocalSourceLauncher\Profiles\%APP_NAME%"
set "SERVER_PID="
set "SERVER_STARTED=0"

title %APP_NAME% Launcher

echo ============================================================
echo  %APP_NAME%
echo  Local Source Launcher
echo ============================================================
echo.
echo Project : %CD%
echo URL     : %APP_URL%
echo.

:: ------------------------------------------------------------
:: 1. Prerequisite checks
:: ------------------------------------------------------------
echo [%APP_NAME%] Checking prerequisites...

if not exist "package.json" (
    echo.
    echo ERROR: package.json was not found.
    echo.
    echo Put this BAT file in the project's root folder
    echo ^(the folder containing package.json^) and run it again.
    goto :fail
)

where node.exe >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js was not found in PATH.
    echo Install Node.js and run this launcher again.
    goto :fail
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: npm was not found in PATH.
    echo Reinstall or repair Node.js and run this launcher again.
    goto :fail
)

where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Windows PowerShell was not found.
    goto :fail
)

:: Confirm that package.json actually contains the requested npm script.
node.exe -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['%DEV_SCRIPT%'] ? 0 : 1)" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: package.json does not contain an npm "%DEV_SCRIPT%" script.
    echo.
    echo This launcher expects a project that can be started with:
    echo     npm run %DEV_SCRIPT%
    goto :fail
)

:: ------------------------------------------------------------
:: 2. Install/update npm dependencies only when needed
:: ------------------------------------------------------------
set "NEED_INSTALL=0"

if not exist "node_modules\" (
    set "NEED_INSTALL=1"
) else (
    call npm.cmd ls --depth=0 --silent >nul 2>&1
    if errorlevel 1 set "NEED_INSTALL=1"
)

if "!NEED_INSTALL!"=="1" (
    echo [%APP_NAME%] Dependencies are missing or out of date.
    echo [%APP_NAME%] Running npm install...
    echo.

    call npm.cmd install
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed.
        goto :fail
    )
) else (
    echo [%APP_NAME%] npm dependencies are ready.
)

:: ------------------------------------------------------------
:: 3. Make sure the requested port is free
:: ------------------------------------------------------------
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo ERROR: Port %PORT% is already in use.
    echo.
    echo Close the program using port %PORT%, or launch this BAT
    echo with a different port, for example:
    echo.
    echo     "%~nx0" 3001
    echo.
    goto :fail
)

:: ------------------------------------------------------------
:: 4. Start the local development server
:: ------------------------------------------------------------
echo [%APP_NAME%] Starting local server...

start "%APP_NAME% Dev Server" /min cmd.exe /d /s /c ^
    "call npm.cmd run %DEV_SCRIPT% -- %DEV_ARGS%"

set "SERVER_STARTED=1"

:: ------------------------------------------------------------
:: 5. Wait for the server to answer, maximum 60 seconds
:: ------------------------------------------------------------
echo [%APP_NAME%] Waiting for %APP_URL% ...
set /a "WAITED=0"

:wait_server

where curl.exe >nul 2>&1
if not errorlevel 1 (
    curl.exe --silent --fail --max-time 1 "%APP_URL%" >nul 2>&1
    if not errorlevel 1 goto :server_ready
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
        "try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%' -TimeoutSec 1; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }" ^
        >nul 2>&1
    if not errorlevel 1 goto :server_ready
)

timeout /t 1 /nobreak >nul
set /a "WAITED+=1"

if !WAITED! GEQ 60 (
    echo.
    echo ERROR: The local server did not respond within 60 seconds.
    echo.
    echo Check the minimized "%APP_NAME% Dev Server" window for
    echo any npm/Vite error messages.
    goto :cleanup_fail
)

goto :wait_server

:server_ready

:: ------------------------------------------------------------
:: 6. Capture the process listening on the selected port
:: ------------------------------------------------------------
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    if not defined SERVER_PID set "SERVER_PID=%%P"
)

if not defined SERVER_PID (
    echo.
    echo ERROR: The server responded, but its process ID could not
    echo be determined.
    goto :cleanup_fail
)

echo [%APP_NAME%] Server ready. PID: !SERVER_PID!

:: ------------------------------------------------------------
:: 7. Find Chrome, with Microsoft Edge as fallback
:: ------------------------------------------------------------
set "BROWSER="
set "BROWSER_NAME="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    set "BROWSER_NAME=Google Chrome"
)

if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    set "BROWSER_NAME=Google Chrome"
)

if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
    set "BROWSER_NAME=Google Chrome"
)

if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
    set "BROWSER_NAME=Microsoft Edge"
)

if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    set "BROWSER_NAME=Microsoft Edge"
)

if not defined BROWSER (
    echo.
    echo ERROR: Google Chrome or Microsoft Edge could not be found.
    goto :cleanup_fail
)

if not exist "%PROFILE_DIR%" (
    mkdir "%PROFILE_DIR%" >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ERROR: Could not create the dedicated browser profile:
        echo %PROFILE_DIR%
        goto :cleanup_fail
    )
)

:: ------------------------------------------------------------
:: 8. Launch the project as a dedicated browser app
:: ------------------------------------------------------------
echo [%APP_NAME%] Launching with !BROWSER_NAME!...
echo.
echo Close the app window when finished.
echo The local development server will then be stopped automatically.
echo.

start "" /wait "%BROWSER%" ^
    --app="%APP_URL%" ^
    --window-size=1400,900 ^
    --user-data-dir="%PROFILE_DIR%" ^
    --no-first-run ^
    --no-default-browser-check ^
    --disable-background-mode

:: ------------------------------------------------------------
:: 9. Browser app closed -> stop server -> exit
:: ------------------------------------------------------------
echo.
echo [%APP_NAME%] App closed. Stopping local server...

if defined SERVER_PID (
    taskkill /PID !SERVER_PID! /T /F >nul 2>&1
)

endlocal
exit /b 0


:: ============================================================
:: Failure cleanup
:: ============================================================

:cleanup_fail

if defined SERVER_PID (
    taskkill /PID !SERVER_PID! /T /F >nul 2>&1
) else if "!SERVER_STARTED!"=="1" (
    :: The requested port was verified free before startup, so a
    :: listener that appeared afterward should belong to this run.
    for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
        taskkill /PID %%P /T /F >nul 2>&1
    )
)

:fail
echo.
echo Press any key to close.
pause >nul
endlocal
exit /b 1
