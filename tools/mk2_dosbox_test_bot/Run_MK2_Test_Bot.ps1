# MK2 DOSBox test automation — Windows PowerShell 5.1+, no extra dependencies.
# Research convenience utility. Not a gameplay AI; stage selection is NOT patched.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

Add-Type @'
using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential)] public struct Mk2Rect { public int Left, Top, Right, Bottom; }
public static class Mk2Keys {
    [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, UInt32 flags, UIntPtr extraInfo);
    [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vk);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hwnd, int command);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out Mk2Rect rect);
}
'@

$script:Vk = @{
  'F1'=0x70; 'F2'=0x71; 'F5'=0x74; 'F11'=0x7A; 'F12'=0x7B;
  'CTRL'=0x11; 'ALT'=0x12; 'SHIFT'=0x10; 'ENTER'=0x0D; 'SPACE'=0x20;
  'UP'=0x26; 'DOWN'=0x28; 'LEFT'=0x25; 'RIGHT'=0x27;
  'SCROLLLOCK'=0x91; 'PAUSE'=0x13;
}
foreach ($letter in 65..90) { $script:Vk[[string][char]$letter] = $letter }
foreach ($digit in 48..57) { $script:Vk[[string][char]$digit] = $digit }

$cfgPath = Join-Path $PSScriptRoot 'mk2-bot-config.json'
$cfg = Get-Content -Raw -LiteralPath $cfgPath | ConvertFrom-Json
$script:StopVk = $script:Vk[([string]$cfg.stopKey).ToUpperInvariant()]
if ($null -eq $script:StopVk) { throw 'Unrecognized stop key in mk2-bot-config.json.' }
$script:StopFlag = $false
$script:ActiveWindow = [IntPtr]::Zero
$script:currentSessionDir = ''
$script:currentVariant = ''
$script:KeysHeld = New-Object 'System.Collections.Generic.HashSet[int]'
$logDir = Join-Path $PSScriptRoot 'run-logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$runStamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$logFile = Join-Path $logDir ("MK2_bot_$runStamp.log")
function Log([string]$message) {
    $stamp = Get-Date -Format 'HH:mm:ss'
    $line = "[$stamp] $message"
    Write-Host $line
    Add-Content -LiteralPath $logFile -Value $line
}
function Stop-IfRequested {
    if ($script:StopFlag) { throw 'STOP: bot has been stopped.' }
    if (([Mk2Keys]::GetAsyncKeyState([int]$script:StopVk) -band 0x8000) -ne 0) {
        $script:StopFlag = $true
        throw 'STOP: emergency stop key pressed.'
    }
}
function Delay([double]$seconds) {
    $totalMs = [math]::Max(0, [math]::Round($seconds * 1000))
    for ($ms=0; $ms -lt $totalMs; $ms+=50) {
        Stop-IfRequested
        Start-Sleep -Milliseconds ([math]::Min(50, ($totalMs - $ms)))
    }
}
function Require-Focus {
    Stop-IfRequested
    if ($script:ActiveWindow -eq [IntPtr]::Zero -or -not [Mk2Keys]::IsWindow($script:ActiveWindow)) {
        throw 'DOSBox window unavailable. Aborting so input cannot reach the wrong application.'
    }
    if ([Mk2Keys]::GetForegroundWindow() -ne $script:ActiveWindow) {
        throw 'DOSBox lost keyboard focus. Aborting instead of typing into another window.'
    }
}
function VirtualKey([string]$name) {
    $n = $name.Trim().ToUpperInvariant()
    if (-not $script:Vk.ContainsKey($n)) { throw "Unknown key '$name' (edit mk2-bot-config.json)." }
    return [int]$script:Vk[$n]
}
function Down([string]$name) {
    Require-Focus
    $n=VirtualKey $name
    if ($script:KeysHeld.Add($n)) { [Mk2Keys]::keybd_event([byte]$n,[byte]0,[uint32]0,[UIntPtr]::Zero) }
}
function Up([string]$name) {
    $n=VirtualKey $name
    if ($script:KeysHeld.Remove($n)) { [Mk2Keys]::keybd_event([byte]$n,[byte]0,[uint32]2,[UIntPtr]::Zero) }
}
function Release-All {
    foreach ($vk in @($script:KeysHeld)) {
        [Mk2Keys]::keybd_event([byte]$vk,[byte]0,[uint32]2,[UIntPtr]::Zero)
    }
    $script:KeysHeld.Clear()
}
function Tap([string]$name, [double]$hold=.14) {
    Down $name
    try { Delay $hold } finally { Up $name }
    Delay .11
}
function Combo([string[]]$names, [double]$hold=.16) {
    foreach ($name in $names) { Down $name }
    try { Delay $hold } finally { foreach ($name in $names) { Up $name } }
    Delay .14
}
function Screenshot([string]$label) {
    # Guaranteed local screenshot *attempt* for the selected live window, independent of DOSBox hotkeys.
    # Screen capture can be black when the emulator uses exclusive fullscreen/hardware output.
    Require-Focus
    $rect = New-Object Mk2Rect
    if ([Mk2Keys]::GetWindowRect($script:ActiveWindow, [ref]$rect)) {
        $w = $rect.Right - $rect.Left; $h = $rect.Bottom - $rect.Top
        if ($w -gt 0 -and $h -gt 0 -and $w -le 7680 -and $h -le 4320) {
            try {
                Add-Type -AssemblyName System.Drawing
                $img = New-Object System.Drawing.Bitmap($w, $h)
                $g = [System.Drawing.Graphics]::FromImage($img)
                try {
                    $g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $img.Size)
                    $shortLabel = ($label -replace '[^a-zA-Z0-9_-]', '_')
                    $png = Join-Path $script:currentSessionDir ($shortLabel + '.png')
                    $img.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
                    Log "Windows screen snapshot: $png"
                } finally { $g.Dispose(); $img.Dispose() }
            } catch { Log "Windows screenshot unavailable: $($_.Exception.Message). Use DOSBox capture." }
        }
    }
    if (([string]$cfg.captureShortcut).ToUpperInvariant() -ne 'NONE') {
        $parts = ([string]$cfg.captureShortcut).ToUpperInvariant().Split('+')
        Log "DOSBox screenshot hotkey for $label ($($cfg.captureShortcut))"
        Combo $parts .18
    }
}
function Identify-Dosbox([System.Diagnostics.Process]$p) {
    for ($sec=0; $sec -lt 40; $sec++) {
        Delay 1
        try {
            $p.Refresh()
            if ($p.HasExited) { throw "DOSBox exited early, code $($p.ExitCode)." }
            if ($p.MainWindowHandle -ne [IntPtr]::Zero) { return $p.MainWindowHandle }
        } catch [System.InvalidOperationException] { throw 'DOSBox process exited.' }
    }
    throw 'DOSBox window did not appear within 40 seconds.'
}
function Test-DosboxExe([string]$candidate) {
    if (-not $candidate -or -not (Test-Path -LiteralPath $candidate -PathType Leaf)) { return $false }
    $item = Get-Item -LiteralPath $candidate -ErrorAction Stop
    if ($item.Extension -ine '.exe') { return $false }
    try {
        $stream = [System.IO.File]::OpenRead($item.FullName)
        try { return ($stream.ReadByte() -eq 0x4d -and $stream.ReadByte() -eq 0x5a) }
        finally { $stream.Dispose() }
    } catch { return $false }
}
function Select-DosboxExe([string]$current) {
    if (Test-DosboxExe $current) { return (Resolve-Path -LiteralPath $current).Path }
    if ($current) { Write-Host "Configured DOSBox executable is invalid: $current" -ForegroundColor Yellow }
    do {
        $value = (Read-Host 'Paste the full path to DOSBox.exe (NOT a folder or shortcut)').Trim().Trim('"')
        if (Test-DosboxExe $value) { return (Resolve-Path -LiteralPath $value).Path }
        Write-Host 'Please provide the actual .exe file, not a folder, .lnk shortcut or Windows Store launcher. Example: C:\DOSBox-0.74-3\DOSBox.exe' -ForegroundColor Yellow
    } while ($true)
}
function Start-DosboxDirect([string]$dosbox, [string]$conf) {
    # Avoid Windows PowerShell Start-Process -PassThru: it can throw after a
    # shell/launcher successfully starts but fails to return a Process handle.
    # Direct Process.Start with UseShellExecute=false requires a real EXE and
    # gives a process object or a specific native startup exception.
    if (-not (Test-DosboxExe $dosbox)) { throw "DOSBox executable check failed: $dosbox" }
    if (-not (Test-Path -LiteralPath $conf -PathType Leaf)) { throw "Generated DOSBox config is missing: $conf" }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $dosbox
    $psi.Arguments = '-conf "' + $conf + '"'
    $psi.WorkingDirectory = Split-Path -Path $dosbox -Parent
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $false
    Log "Launch EXE: $($psi.FileName)"
    Log "Launch args: $($psi.Arguments)"
    try {
        $p = [System.Diagnostics.Process]::Start($psi)
        if ($null -eq $p) { throw 'The executable did not return a process object.' }
        Log "Process started, PID $($p.Id). Waiting for DOSBox window..."
        return $p
    } catch {
        $base = $_.Exception.GetBaseException()
        $detail = $base.Message
        if ($base -is [System.ComponentModel.Win32Exception]) {
            $detail += " (Win32=$($base.NativeErrorCode))"
        }
        throw "DOSBox start failed: $detail. Check the exact EXE path and run DOSBox manually once."
    }
}
function Test-InstallationRoot([string]$candidate) {
    if (-not $candidate -or -not (Test-Path -LiteralPath $candidate -PathType Container)) { return $false }
    $dosDir = Join-Path $candidate 'DOSBOX'
    $gameExe = Join-Path (Join-Path $candidate 'MK2') 'MK2.EXE'
    return ((Test-Path -LiteralPath $dosDir -PathType Container) -and (Test-Path -LiteralPath $gameExe -PathType Leaf))
}
function Find-InstallationRoot([string]$configured) {
    # User's installation: <Mortal Kombat 2>\DOSBOX\... and <Mortal Kombat 2>\MK2\MK2.EXE.
    # Place the bot folder beside DOSBOX and MK2 for zero configuration.
    $roots = New-Object 'System.Collections.Generic.List[string]'
    if ($configured) { [void]$roots.Add($configured) }
    $cursor = $PSScriptRoot
    for ($depth=0; $depth -lt 5; $depth++) {
        if (-not $cursor) { break }
        [void]$roots.Add($cursor)
        $parent = Split-Path -Path $cursor -Parent
        if (-not $parent -or $parent -eq $cursor) { break }
        $cursor = $parent
    }
    foreach ($root in $roots) {
        if (Test-InstallationRoot $root) {
            $resolved=(Resolve-Path -LiteralPath $root).Path
            Log "Detected installed MK2 root: $resolved"
            return $resolved
        }
    }
    do {
        Write-Host "Expected this folder layout: <Mortal Kombat 2>\DOSBOX and <Mortal Kombat 2>\MK2" -ForegroundColor Yellow
        $entered=(Read-Host 'Paste the full path of the MORTAL KOMBAT 2 parent folder').Trim().Trim('"')
        if (Test-InstallationRoot $entered) {
            $resolved=(Resolve-Path -LiteralPath $entered).Path
            Log "Selected installed MK2 root: $resolved"
            return $resolved
        }
        Write-Host 'The folder must contain both DOSBOX and MK2\MK2.EXE. Please select the parent folder.' -ForegroundColor Yellow
    } while ($true)
}
function Find-InstalledDosbox([string]$configured,[string]$installRoot) {
    if (Test-DosboxExe $configured) { return (Resolve-Path -LiteralPath $configured).Path }
    $dosDir = Join-Path $installRoot 'DOSBOX'
    $exes = @(Get-ChildItem -LiteralPath $dosDir -Filter '*.exe' -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^dosbox([-. _]|\.exe)' } |
        Sort-Object @{ Expression = { if ($_.Name -ieq 'dosbox.exe') {0} elseif ($_.Name -imatch '^dosbox-x\.exe$') {1} else {2} } }, FullName)
    foreach ($exe in $exes) {
        if (Test-DosboxExe $exe.FullName) {
            Log "Auto-detected DOSBox EXE: $($exe.FullName)"
            return $exe.FullName
        }
    }
    Write-Host 'Could not automatically identify a DOSBox executable inside the DOSBOX folder.' -ForegroundColor Yellow
    return Select-DosboxExe $configured
}
function Find-ProbeRoot([string]$specified,[string]$installRoot) {
    # Modified full-game variants are optional. With none present, run the user's original install as baseline.
    $candidates = New-Object 'System.Collections.Generic.List[string]'
    if ($specified) { [void]$candidates.Add($specified) }
    [void]$candidates.Add((Join-Path $installRoot 'MK2_Runtime_Probes'))
    [void]$candidates.Add((Join-Path $installRoot 'MK2_O110X_AutoTests\MK2_Runtime_Probes'))
    [void]$candidates.Add((Join-Path $installRoot 'MK2_O110W_Ready_To_Run_DOSBox_Test_Directories_2026-10-10\MK2_Runtime_Probes'))
    [void]$candidates.Add((Join-Path $PSScriptRoot 'MK2_Runtime_Probes'))
    $botParent=Split-Path -Path $PSScriptRoot -Parent
    if ($botParent) {
        [void]$candidates.Add((Join-Path $botParent 'MK2_Runtime_Probes'))
        [void]$candidates.Add((Join-Path $botParent 'MK2_O110X_AutoTests\MK2_Runtime_Probes'))
    }
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath (Join-Path $candidate '01_PAL48_MAGENTA\MK2.EXE') -PathType Leaf) {
            $resolved=(Resolve-Path -LiteralPath $candidate).Path
            Log "Modified test directories available: $resolved"
            return $resolved
        }
    }
    Log 'No modified test directories detected. Baseline mode remains available.'
    return ''
}
function Get-GameDirectory([string]$installRoot, [string]$probeRoot, [string]$variant) {
    # When a complete probe kit is installed, use its byte-identical canonical
    # baseline for a fair A/B comparison against the six modified EXEs.
    # Without a probe kit, baseline falls back to the user's untouched MK2 install.
    if ($variant -eq '00_BASELINE') {
        if ($probeRoot -and (Test-Path -LiteralPath (Join-Path $probeRoot '00_BASELINE\MK2.EXE') -PathType Leaf)) {
            return (Join-Path $probeRoot '00_BASELINE')
        }
        return (Join-Path $installRoot 'MK2')
    }
    if (-not $probeRoot) { throw 'Modified variants are not installed. Extract the O110W test directories or use baseline.' }
    $dir = Join-Path $probeRoot $variant
    if (-not (Test-Path -LiteralPath (Join-Path $dir 'MK2.EXE') -PathType Leaf)) {
        throw "Missing modified game variant: $dir"
    }
    return $dir
}
function Fight-Sequence {
    # Reproducible, generic inputs. Does not observe health, enemy position, round end or scene identity.
    $key = $cfg.playerKeys
    Combo @([string]$key.down, [string]$key.highPunch) .22  # uppercut
    Combo @([string]$key.forward, [string]$key.highKick) .20
    Combo @([string]$key.back, [string]$key.lowKick) .20
    Combo @([string]$key.down, [string]$key.block) .20
    Tap ([string]$key.forward) .25
    Combo @([string]$key.forward, [string]$key.lowPunch) .16
    Combo @([string]$key.down, [string]$key.highPunch) .18
}
function Launch-Variant([string]$dosbox, [string]$installRoot, [string]$probeRoot, [string]$variant) {
    $dir = Get-GameDirectory $installRoot $probeRoot $variant
    $exe = Join-Path $dir 'MK2.EXE'
    if (-not (Test-Path -LiteralPath $exe)) { throw "Missing game EXE $exe" }
    $sessionDir = Join-Path $logDir ("$runStamp`_$variant")
    New-Item -ItemType Directory -Path $sessionDir -Force | Out-Null
    $script:currentSessionDir = $sessionDir
    $script:currentVariant = $variant
    $captureDir = Join-Path $sessionDir 'captures'
    New-Item -ItemType Directory -Path $captureDir -Force | Out-Null
    $conf = Join-Path $sessionDir 'mk2_autostart.conf'
    # DOSBox 0.74 supports [dosbox] captures=... and [autoexec].
    # Screenshot location is implementation/version-dependent: inspect DOSBox capture dir if empty.
    $lines = @('[dosbox]', ('captures=' + $captureDir), '', '[autoexec]', ('mount c "' + $dir + '"'), 'c:', 'mk2')
    [System.IO.File]::WriteAllLines($conf, [string[]]$lines, [System.Text.Encoding]::ASCII)
    Log "Starting $variant ($exe)"
    $process = Start-DosboxDirect $dosbox $conf
    try {
        $script:ActiveWindow=Identify-Dosbox $process
        Log "DOSBox window found, handle $($script:ActiveWindow)."
        [Mk2Keys]::ShowWindow($script:ActiveWindow, 9) | Out-Null
        [Mk2Keys]::SetForegroundWindow($script:ActiveWindow) | Out-Null
        Log "Waiting for MK2 startup ($($cfg.startDelaySeconds) s)..."
        Delay ([double]$cfg.startDelaySeconds)
        # Foreground focus is guarded so key presses never go into another app.
        # Some Windows builds reject SetForegroundWindow unless the user clicks
        # the DOSBox window; allow a bounded period to do that.
        for ($focusTry = 0; $focusTry -lt 12; $focusTry++) {
            if ([Mk2Keys]::GetForegroundWindow() -eq $script:ActiveWindow) { break }
            if ($focusTry -eq 0) { Log 'DOSBox is not focused. Click the DOSBox window within 12 seconds.' }
            [Mk2Keys]::SetForegroundWindow($script:ActiveWindow) | Out-Null
            Delay 1
        }
        Require-Focus
        Log 'Capturing title / ready screen before inputs.'
        Screenshot "$variant before inputs"
        Log 'Sending configured start key.'
        Tap ([string]$cfg.playerKeys.start)
        Delay ([double]$cfg.characterSelectDelaySeconds)
        Log 'Sending configured character confirm key.'
        Tap ([string]$cfg.playerKeys.confirmCharacter)
        Delay ([double]$cfg.fightLoadDelaySeconds)
        Log 'Attempting first fight screenshot.'
        Screenshot "$variant initial fight/stage"
        Delay ([double]$cfg.firstCaptureDelaySeconds)
        $elapsed = 0.0
        $interval = [math]::Max(1.0,[double]$cfg.captureIntervalSeconds)
        $next = $interval
        $start = [System.Diagnostics.Stopwatch]::StartNew()
        while ($start.Elapsed.TotalSeconds -lt [double]$cfg.runFightSeconds) {
            Fight-Sequence
            $elapsed = $start.Elapsed.TotalSeconds
            if ($elapsed -ge $next) {
                Screenshot "$variant elapsed $([int]$elapsed)s"
                $next += $interval
            }
        }
        Screenshot "$variant final"
        Log "$variant complete. Capture directory candidate: $captureDir"
    }
    finally {
        Release-All
        $script:ActiveWindow = [IntPtr]::Zero
        if (-not $process.HasExited) {
            # Closing only the DOSBox process launched by THIS script, never other user sessions.
            $process.CloseMainWindow() | Out-Null
            Start-Sleep -Milliseconds 600
            if (-not $process.HasExited) { $process.Kill() }
        }
        $process.Dispose()
    }
}
try {
    Write-Host ''
    Write-Host 'MK2 DOSBox O110X.4 — complete seven-test kit with your MK2 controls' -ForegroundColor Cyan
    Write-Host 'Note: It does NOT patch stage selection or adapt to on-screen gameplay.'
    Write-Host 'FIRST TEST: choose 1 for unchanged baseline; do not run all until valid screenshots.'
    Write-Host 'Emergency stop: HOLD SCROLL LOCK until it exits; loss of DOSBox focus also stops the run.'
    Write-Host 'MK2 control profile: arrows to move; Q/A punches; W/S kicks; SPACE block.'
    Write-Host 'Important: if MK2 is showing the key-assignment screen, finish/exit and SAVE settings manually before testing.'
    $installationRoot = Find-InstallationRoot ([string]$cfg.installationRoot)
    $dosbox = Find-InstalledDosbox ([string]$cfg.dosboxExecutable) $installationRoot
    Log "Selected DOSBox executable: $dosbox"
    $probeRoot = Find-ProbeRoot ([string]$cfg.probeRoot) $installationRoot
    $available = @()
    foreach ($candidate in @($cfg.tests)) {
        $name = [string]$candidate
        if ($name -eq '00_BASELINE') { $available += $name; continue }
        if ($probeRoot -and (Test-Path -LiteralPath (Join-Path (Join-Path $probeRoot $name) 'MK2.EXE') -PathType Leaf)) {
            $available += $name
        }
    }
    if (@($available).Count -eq 0) { throw 'No baseline game found in configuration.' }
    Write-Host ''
    Write-Host "Original installation (untouched): $(Join-Path $installationRoot 'MK2')"
    if ($probeRoot) { Write-Host "Packaged test installation: $probeRoot" }
    if (@($available).Count -eq 1) {
        Write-Host 'Only baseline installed. For patched comparisons, extract MK2_Runtime_Probes beside this bot.' -ForegroundColor Yellow
    }
    for ($i=0; $i -lt @($available).Count; $i++) { Write-Host ("  {0,2}. {1}" -f ($i+1),$available[$i]) }
    Write-Host '   A. Run all variants'
    $choice=(Read-Host 'Choose a variant number or A for all').Trim().ToUpperInvariant()
    if ($choice -eq 'A') { $chosen=@($available) }
    else {
        $index=0
        if (-not [int]::TryParse($choice,[ref]$index) -or $index -lt 1 -or $index -gt @($available).Count) { throw "Invalid selection: $choice" }
        $chosen=@($available[$index-1])
    }
    Log "EXE control: No files are modified. Variant(s): $($chosen -join ', ')"
    $passed = 0
    foreach ($test in $chosen) {
        try {
            Launch-Variant $dosbox $installationRoot $probeRoot ([string]$test)
            $passed++
            Log "COMPLETE $test ($passed of $(@($chosen).Count) scheduled)."
        } catch {
            Log "FAILED $test : $($_.Exception.Message)"
            Log "Source line: $($_.InvocationInfo.ScriptLineNumber); command: $($_.InvocationInfo.Line.Trim())"
            throw 'ABORT: stopping the batch after the first failure. Fix launch/inputs before trying more variants.'
        }
        Delay ([double]$cfg.afterTestDelaySeconds)
    }
    if ($passed -ne @($chosen).Count) { throw 'Batch ended before all selected tests completed.' }
    Log "DONE: $passed of $(@($chosen).Count) attempted runs completed. Inspect screenshots; automatic completion does not prove that gameplay advanced."
}
catch {
    Log "STOPPED/FAILED: $($_.Exception.Message)"
    Write-Host 'No game EXEs were modified.' -ForegroundColor Yellow
}
finally {
    Release-All
    Write-Host "Log: $logFile"
}
