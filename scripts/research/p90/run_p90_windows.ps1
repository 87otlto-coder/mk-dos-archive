param(
  [string]$SourceRoot = 'F:\Dev\MKEXT\SOURCE\mkdosext',
  [string]$OriginalMk2 = 'F:\Dev\MKEXT\FIXTURES\mk2\mk2',
  [Parameter(Mandatory=$true)][string]$Archive
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $SourceRoot
if ($PSVersionTable.PSVersion.Major -lt 5) { throw 'Windows PowerShell 5 or later required' }
if ($env:OS -ne 'Windows_NT') { throw 'Windows only' }
$resolvedSource = (Resolve-Path -LiteralPath $SourceRoot).Path
$resolvedOriginal = (Resolve-Path -LiteralPath $OriginalMk2).Path
$resolvedArchive = (Resolve-Path -LiteralPath $Archive).Path
if (-not $resolvedSource.StartsWith('F:\Dev\MKEXT\SOURCE\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Source must remain under canonical SOURCE' }
if (-not $resolvedOriginal.StartsWith('F:\Dev\MKEXT\FIXTURES\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Originals must remain under canonical FIXTURES' }
if (-not $resolvedArchive.StartsWith('F:\Dev\MKEXT\FIXTURES\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Private archive must remain under canonical FIXTURES' }
$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0 -or $dirty.Count -ne 0) { throw 'Clean verified source checkout required; no automatic branch changes' }
$head = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Cannot identify Git HEAD' }
$tree = git rev-parse 'HEAD^{tree}'
if ($LASTEXITCODE -ne 0) { throw 'Cannot identify Git tree' }
$out = Join-Path 'F:\Dev\MKEXT\FIXTURES\VALIDATION' ('P90-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $out -ErrorAction Stop | Out-Null
$env:PYTHONDONTWRITEBYTECODE = '1'
function Run-Checked([string[]]$Arguments, [string]$LogName) {
  $result = @(& python @Arguments 2>&1)
  $exit = $LASTEXITCODE
  $result | Set-Content -LiteralPath (Join-Path $out $LogName) -Encoding UTF8
  if ($exit -ne 0) { throw "P90 failed ($exit): $LogName. Evidence retained at $out" }
}
@{ head=$head;tree=$tree;source=$resolvedSource;original=$resolvedOriginal;archive=$resolvedArchive;originalGameExecuted=$false } |
  ConvertTo-Json | Set-Content -LiteralPath (Join-Path $out 'source-identity.json') -Encoding UTF8
$exe = Join-Path $OriginalMk2 'MK2.EXE'
$layout = Join-Path $out 'root-layout.json'
$camera = Join-Path $out 'camera-source.json'
Run-Checked @('-B','scripts/research/p90/test_p90.py','--exe',$exe,'--source-root',$SourceRoot) 'tests.txt'
Run-Checked @('-B','scripts/verify-mk2-p82-native-stage-independent.py','--original-mk2',$OriginalMk2,'--archive',$resolvedArchive) 'p82-independent.json'
Run-Checked @('-B','scripts/research/p90/root_layout.py','--exe',$exe,'--source-root',$SourceRoot,'--out',$layout) 'root-layout-stdout.txt'
Run-Checked @('-B','scripts/research/p90/verify_root_layout.py','--exe',$exe,'--report',$layout) 'root-layout-independent.json'
Run-Checked @('-B','scripts/research/p90/camera_source.py','--exe',$exe,'--source-root',$SourceRoot,'--out',$camera) 'camera-stdout.txt'
Run-Checked @('-B','scripts/research/p90/verify_camera_source.py','--exe',$exe,'--report',$camera) 'camera-independent.json'
Run-Checked @('-B','scripts/research/p90/projection_audit.py','--exe',$exe,'--layout',$layout,'--archive',$resolvedArchive,'--private-out',(Join-Path $out 'partial-projections')) 'projection-stdout.json'
Write-Output "P90 static source/layout and partial projection checks passed. Full native stage/runtime verification remains INCOMPLETE. Evidence: $out"
