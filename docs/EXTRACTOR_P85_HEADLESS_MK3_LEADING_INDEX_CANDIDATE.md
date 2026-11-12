# P85 — headless MK3 leading original indexed source + raw record export

**Date:** 2026-11-12  
**Interim pass:** fourth pass in P82–P86 cycle. **Branch:** `interim/p85-headless-mk3-leading-index`, from accepted P84 merge `0ad3eff58fc0c8be1d44db4993efc87b61d4a886`.  
**Classification:** implementation candidate; P85 hosted Windows source-only and actual original-MK3 CLI outcomes remain **VALIDATION PENDING** until checked.

## Objective / no new reverse engineering

Expand `scripts/mkext.py` beyond the accepted original MK2 Tomb/Portal subset by exposing the **already original-source-accepted P79 MK3 leading interval** as `--game mk3` in the same `scan`, `extract`, `verify` commands. No web UI required. Reuse `scripts/mk3_p79_leading_span.py` for production source-byte export and `scripts/verify_mk3_p79_leading_span.py` as the independent original-byte/Png oracle. Do not copy their decoding or infer new graphics.

**Original source identity:** `DATA.MK3` SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`. P79 isolated original byte interval is `[667866,2508500)`, size **1,840,634 bytes**, with 416 original IFF FORM records in the whole source and 20 source gaps. It contains one **320×200** original indexed base plane (**64,000** index positions) and **216** raw continuation records. Preserve their headers, empty records and payload bytes exactly. The P79 producer writes **220** source parts (4 base components + 216 raw records), **two** clearly labeled grayscale / candidate-RGB previews and a manifest (**223 ZIP members**). The independent oracle reconstructs the whole source interval and compares **128,000** preview PNG pixel positions.

**Critical uncertainty:** These 216 raw source records are NOT decoded animation frames. The 216 P79 continuation records are also NOT the distinct P77/P78 216 source-indexed graphic records. Native original opacity, palette ownership, stage/character associations, animation order, timing, compositing and continuation image/delta semantics remain **UNKNOWN**. Preview opaque alpha is explicitly illustrative; adjacent RGB8 is comparison-only.

## Committed implementation

- `scripts/mk3_p85_cli.py`: thin P79 backend, strict canonical SHA and source interval/FORM identity gate, actual P79 source geometry and record inventory check, safe output refusal, original-independent P79 verification; returns `P85_CLI_MK3_SCAN`, `P85_CLI_MK3_EXTRACT` or `P85_CLI_MK3_VERIFY` **only** after the required checks.
- `scripts/mkext.py`: dispatches `--game mk3` to P85 and preserves original P84 `--game mk2` extraction route (Tomb/Portal). `--stage` applies to MK2 only; P85 rejects MK3 stage switching rather than silently interpreting it.
- `scripts/test-p85-mk3-cli.py` and original P79 `scripts/test_mk3_p79_leading_span.py`: synthetic original-free controls for exact source signature/interval, false palette and animation claims, source-tree/installation/output separation, overwrite refusal, independent verification mismatch, and actual fake `DATA.MK3` command refusal.
- `.github/workflows/p11-build-smoke.yml`: Windows-only hosted source/CLI tests alongside unchanged cumulative P81–P84 regressions. No new artifact upload. No commercial DOS data in GitHub.

P79's existing original export uses a same-filesystem exclusive hard link from a privately built ZIP and refuses existing destinations. The CLI requires a NEW `.zip` path, existing private parent directory and a source path outside GitHub's SOURCE checkout. The separate verifier is mandatory before emitting an extract PASS; a diagnostic archive remains private if verification fails. The source ZIP intentionally contains original-derived raw bytes and **must remain in FIXTURES, never GitHub**.

## Windows original-fixture acceptance — not yet run as P85

Follow the required Windows layout. Use original MK3 installation `F:\Dev\MKEXT\FIXTURES\mk3\mk3` if present, otherwise the correct existing private MK3 source folder under FIXTURES (do not invent an installation). No game assets are uploaded.

```powershell
$ErrorActionPreference = "Stop"
Set-Location "F:\Dev\MKEXT\SOURCE\mkdosext"
if (git status --porcelain) { throw "Protect local uncommitted changes before switching" }
git fetch origin
git switch interim/p85-headless-mk3-leading-index
git pull --ff-only origin interim/p85-headless-mk3-leading-index
$env:PYTHONDONTWRITEBYTECODE = "1"
$mk3 = "F:\Dev\MKEXT\FIXTURES\mk3\mk3"
$validation = "F:\Dev\MKEXT\FIXTURES\VALIDATION"
if (-not (Test-Path -LiteralPath $mk3)) { throw "Choose the actual private original MK3 installation path" }
New-Item -ItemType Directory -Path $validation -Force | Out-Null
git rev-parse HEAD
git rev-parse 'HEAD^{tree}'
python .\scripts\test-p85-mk3-cli.py
if ($LASTEXITCODE -ne 0) { throw "P85 synthetic CLI failed" }
python .\scripts\mkext.py scan --game mk3 --source "$mk3"
if ($LASTEXITCODE -ne 0) { throw "P85 MK3 scan failed" }
$archive = Join-Path $validation ("P85-MK3-" + [guid]::NewGuid().ToString("N") + ".zip")
python .\scripts\mkext.py extract --game mk3 --source "$mk3" --out "$archive"
if ($LASTEXITCODE -ne 0) { throw "P85 MK3 extract or independent oracle failed" }
python .\scripts\mkext.py verify --game mk3 --source "$mk3" --archive "$archive"
if ($LASTEXITCODE -ne 0) { throw "P85 MK3 independent replay failed" }
```

**Acceptance:** `P85_CLI_MK3_SCAN`, `P85_CLI_MK3_EXTRACT`, and `P85_CLI_MK3_VERIFY` all output `status: PASS` against the exact tested Git commit/tree. The nested independent `P79_ORIGINAL` oracle must pass: original 320×200 index base, 216 raw source records, 220 source parts, 223 ZIP members, complete 1,840,634-byte source interval and two pixel-exact PNG previews (**128,000** total preview positions). Require no original palette/opacity/animation/timing assertions. Preserve console JSON evidence and the private new ZIP locally.

## Confidence and next step

- **VERIFIED inherited P79:** original Windows P79 producer and independent complete original source/Png readback (see `docs/EXTRACTOR_P79_MK3_LEADING_SPAN.md` and P81 checkpoint).
- **P85 source-only:** pending hosted Windows CI against the committed P85 code; CI cannot prove original DOS acceptance.
- **P85 original Windows:** **VALIDATION PENDING**; do not infer its success from P79's prior direct tool result.
- **P84:** accepted original DOS MK2 CLI and P83 browser, unchanged.
- **P86:** fifth-pass consolidation should run accepted original MK1/MK2/MK3 regression suites, preserve recoverable source checkpoints and review a small stand-alone CLI distribution. No speculative renderer or unrelated UI redesign.
