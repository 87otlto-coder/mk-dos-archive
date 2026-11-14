# P89 private original-DOS research evidence collection.
# Read-only for original game files. The launcher safely switches and fast-
# forwards the Git checkout; it never edits original binaries or rewrites source.
# New ZIPs and JSON evidence go under a fresh FIXTURES\VALIDATION directory.
# This does not decode MK3 continuation images or claim native MK1/MK2 runtime.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext'
git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'P89 git fetch failed' }
git switch research/p89-extraction-unknowns
if ($LASTEXITCODE -ne 0) { throw 'P89 git switch failed; source checkout was not changed safely' }
git pull --ff-only origin research/p89-extraction-unknowns
if ($LASTEXITCODE -ne 0) { throw 'P89 git fast-forward failed' }

Write-Host 'P89 source commit:'
git rev-parse HEAD
Write-Host 'P89 source tree:'
git rev-parse 'HEAD^{tree}'

python scripts/research/p89/test_structures.py
if ($LASTEXITCODE -ne 0) { throw 'P89 synthetic tests failed; original tests not started' }

$mk1 = 'F:\Dev\MKEXT\FIXTURES\mk1\mk1'
$mk2 = 'F:\Dev\MKEXT\FIXTURES\mk2\mk2'
$mk3 = 'F:\Dev\MKEXT\FIXTURES\mk3\mk3'
$p87 = 'F:\Dev\MKEXT\FIXTURES\VALIDATION\P87-d779725fb21a4a31af69f0cc624d03ca\mk1-indexed-anitab-source.zip'

foreach ($item in @($mk1, $mk2, $mk3, $p87)) {
    if (-not (Test-Path -LiteralPath $item)) { throw "P89 missing original/private input: $item" }
}
python -c "from PIL import Image; print('Pillow available')"
if ($LASTEXITCODE -ne 0) { throw 'P89 original independent PNG check needs Pillow' }

$work = Join-Path 'F:\Dev\MKEXT\FIXTURES\VALIDATION' ('P89-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $work -ErrorAction Stop | Out-Null
Write-Host "P89 new private evidence directory: $work"

python scripts/research/p89/preflight.py --mk1 "$mk1" --mk2 "$mk2" --mk3 "$mk3" --require-original --require-windows --report (Join-Path $work 'preflight.json') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'P89 original fixture preflight failed (nothing overwritten)' }
Write-Host 'P89 original fixture hashes + clean source preflight: PASS'

$p79 = Join-Path $work 'p79-source.zip'
$p82 = Join-Path $work 'p82-source.zip'
python scripts/mk3_p79_leading_span.py "$mk3" "$p79" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'P89 failed to produce original P79 private source ZIP' }
python scripts/export-mk2-p82-native-stage-pack.py --original-mk2 "$mk2" --out "$p82" --stage both | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'P89 failed to produce original P82 private source ZIP' }

python scripts/research/p89/structures.py r1 --archive "$p79" --original "$mk3" --report (Join-Path $work 'r1-mk3-raw-records.json') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'P89 R1 structural/original independent verification failed' }
Write-Host 'P89 R1 MK3 P79 raw continuation structural inventory: PASS (not decoded frames)'

python scripts/research/p89/r1_payload_discriminators.py --original (Join-Path $mk3 'DATA.MK3') --report (Join-Path $work 'r1-mk3-payload-discriminators.json') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'P89 R1 original compressed-record marker/naive-grammar discriminator failed' }
Write-Host 'P89 R1 original marker and bounded negative-codec inventory: PASS (no new decoded frames)'

python scripts/research/p89/structures.py r2 --archive "$p87" --original "$mk1" --report (Join-Path $work 'r2-mk1-source-graph.json') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'P89 R2 structural/original independent verification failed' }
Write-Host 'P89 R2 MK1 P65 ANITAB source-graph inventory: PASS (not native playback)'

python scripts/research/p89/structures.py r3 --archive "$p82" --original "$mk2" --report (Join-Path $work 'r3-mk2-stage-layers.json') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'P89 R3 structural/original independent verification failed' }
Write-Host 'P89 R3 MK2 P82 stage-layer evidence inventory: PASS (not stage composition)'

Write-Host 'P89 original DOS test inputs and outputs verified. No new codec or native runtime claim.'
Write-Host "Private evidence: $work"
