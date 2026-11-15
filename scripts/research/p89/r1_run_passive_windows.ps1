# P89 R1 private first-record return witness; PowerShell 5.1+.
# Intentionally runs normal MK3, NOT DEBUGBOX; no remote breakpoints.
# Requires a previously compiled, separate and SHA-pinned patched DOSBox-X.
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$ExePath,
    [Parameter(Mandatory=$true)][string]$ExpectedExeSha256,
    [string]$Game = 'F:\Dev\MKEXT\FIXTURES\VALIDATION\P89-R1-MK3-DEBUG-COPY',
    [string]$ValidationRoot = 'F:\Dev\MKEXT\FIXTURES\VALIDATION',
    [ValidateRange(10,240)][int]$TimeoutSeconds = 120
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Require([bool]$Passed, [string]$Why) {
    if (-not $Passed) { throw "P89 passive original-run: $Why" }
}

$exe = (Resolve-Path -LiteralPath $ExePath -ErrorAction Stop).ProviderPath
$game = (Resolve-Path -LiteralPath $Game -ErrorAction Stop).ProviderPath
$root = (Resolve-Path -LiteralPath $ValidationRoot -ErrorAction Stop).ProviderPath
Require ($root.EndsWith('\FIXTURES\VALIDATION', [StringComparison]::OrdinalIgnoreCase)) 'validation root incorrect'
Require ($game.Equals((Join-Path $root 'P89-R1-MK3-DEBUG-COPY'),
                      [StringComparison]::OrdinalIgnoreCase)) 'must use disposable canonical MK3 debug copy'
Require ($exe -match '(?i)\\TOOLS\\DOSBOX_X_P89_PASSIVE[^\\]*\\') 'must use separately installed passive build in TOOLS'
Require ((Split-Path $exe -Leaf) -ieq 'dosbox-x.exe') 'expected compiled DOSBox-X executable'
Require ($ExpectedExeSha256 -match '^[0-9a-fA-F]{64}$') 'expected binary SHA256 must be supplied'
$actualExeSha = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash
Require ($actualExeSha -ieq $ExpectedExeSha256) 'compiled test EXE fingerprint mismatch'

$mk3 = Join-Path $game 'MK3.EXE'
$data = Join-Path $game 'DATA.MK3'
Require ((Test-Path -LiteralPath $mk3) -and (Test-Path -LiteralPath $data)) 'original private executable/data missing'
Require ((Get-FileHash -LiteralPath $mk3 -Algorithm SHA256).Hash -ieq '8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0') 'original MK3.EXE fingerprint mismatch'
Require ((Get-FileHash -LiteralPath $data -Algorithm SHA256).Hash -ieq '72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517') 'original DATA.MK3 fingerprint mismatch'
Require ((Test-Path -LiteralPath (Join-Path $game 'image\mk3.cue')) -and
         (Test-Path -LiteralPath (Join-Path $game 'image\mk3.gog'))) 'original GOG CD image missing'

$evidence = Join-Path $root ('P89-PASSIVE-RETURN-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $evidence -ErrorAction Stop | Out-Null
$conf = Join-Path $evidence 'dosbox-p89-normal.conf'
$log = Join-Path $evidence 'dosbox-fileio.log'
$stderr = Join-Path $evidence 'dosbox-stderr.txt'
$binary = Join-Path $evidence 'p89-record0-return.bin'
$tsv = Join-Path $evidence 'p89-record0-read-return.tsv'
$report = Join-Path $evidence 'p89-record0-return-acceptance.json'
@"
[log]
logfile=$log
fileio=true
files=debug
int21=true
[autoexec]
mount c "$game"
imgmount d c:\image\mk3.cue -t cdrom
c:
mk3
exit
"@ | Out-File -LiteralPath $conf -Encoding ascii -ErrorAction Stop

$previous = [Environment]::GetEnvironmentVariable('MKEXT_P89_CAPTURE_DIR', 'Process')
$process = $null
$captured = $false
try {
    [Environment]::SetEnvironmentVariable('MKEXT_P89_CAPTURE_DIR', $evidence, 'Process')
    $args = "-conf " + ('"{0}"' -f $conf) + ' -nopromptfolder -console -log-fileio -log-int21'
    $process = Start-Process -FilePath $exe -ArgumentList $args -WorkingDirectory $evidence -RedirectStandardError $stderr -PassThru
    $clock = [Diagnostics.Stopwatch]::StartNew()
    while ($clock.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        if ((Test-Path -LiteralPath $binary) -and (Test-Path -LiteralPath $tsv)) {
            if (((Get-Item -LiteralPath $binary).Length -eq 1506) -and
                ((Get-Item -LiteralPath $tsv).Length -gt 0)) {
                $captured = $true
                break
            }
        }
        $process.Refresh()
        if ($process.HasExited) { break }
        Start-Sleep -Milliseconds 250
    }
}
finally {
    [Environment]::SetEnvironmentVariable('MKEXT_P89_CAPTURE_DIR', $previous, 'Process')
    if ($null -ne $process) {
        $process.Refresh()
        if (-not $process.HasExited) {
            # Only the new process started by this one script is terminated.
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
        }
        $process.Dispose()
    }
}
Write-Host "P89 passive private evidence: $evidence"
Write-Host "Compiled DOSBox-X SHA256: $actualExeSha"
Require $captured ('record-0 original return not observed; inspect private log: ' + $log)

$validator = Join-Path (Split-Path -Parent $PSCommandPath) 'r1_validate_passive_record0_return.py'
& python $validator --data "$data" --capture-dir "$evidence" --report "$report"
if ($LASTEXITCODE -ne 0) {
    throw "P89 passive original-return byte-for-byte acceptance FAILED; private evidence: $evidence"
}
Write-Host "P89 ordinal-0 original DOS guest read return accepted; no decoder/output pixels proven."
Write-Host "Private metadata report: $report"
