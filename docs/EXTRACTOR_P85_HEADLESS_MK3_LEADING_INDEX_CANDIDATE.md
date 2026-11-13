# P85 — headless MK3 leading original indexed source + raw record export

**Date:** 2026-11-12  
**Interim pass:** fourth pass in P82–P86 cycle. **Branch:** `interim/p85-headless-mk3-leading-index`, from accepted P84 merge `0ad3eff58fc0c8be1d44db4993efc87b61d4a886`.  
**Classification:** P85 limited original DOS MK3 CLI source extraction **ACCEPTED** on the user's original Windows installation, with exact source/tree and independent original-byte/PNG oracle verification. Hosted Windows source-only regression also **PASS**. No MK1 implementation or unverified native animation/palette claims.

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

## P85 original DOS MK3 acceptance — PASS, 2026-11-13

**OBSERVE:** The user supplied four private Windows-run acceptance reports: `source_identity.txt`, `scan.json`, `extract.json`, and `verify.json`. All files were successfully parsed; JSON results are positive. The original locally tested source commit was `146c16817849aefea133afe7ef4a2b9e9e714f71`, Git tree `40f98e35b6f07633f2141d8ce9d35f91e6c48083`. GitHub Git API independently confirmed the exact commit/tree pair, and the P85 CLI entry point, MK3 adapter, P79 source exporter, independent P79 verifier, original-free regression suites and Windows workflow are **identical Git blobs** at the tested commit and prior-to-documentation P85 candidate HEAD.

**TESTS:**
- `P85_CLI_MK3_SCAN / PASS`: canonical `DATA.MK3` SHA256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`; source `CANONICAL_P79_DATA_MK3`. The leading source consists of a 320×200 indexed base, **64,000 original index positions**, **216 raw continuation records**, 220 source parts, two preview PNGs, and 223 ZIP members if extracted. `fullGameAssetCatalogScanned: false`, `nativePaletteOrOpacityVerified: false`, `continuationFramesDecoded: 0`, and no original stage/animation-timing ownership assertion.
- `P85_CLI_MK3_EXTRACT / PASS`: created a new private ZIP in `F:\Dev\MKEXT\FIXTURES\VALIDATION\P85-b7319b5c841740269fb4854e4d014be9`. Nested **independent `P79_ORIGINAL / PASS`** checked the 1,840,634-byte leading interval, 64,000 original index positions, **128,000** total RGBA PNG preview positions, all 216 raw continuation records, **220** source parts and **223** ZIP members. Raw record payload bytes total **1,772,828**, plus 216 × 14-byte headers = **1,775,852** original stored header-and-payload bytes; six header-only records remain raw. No native opacity, palette, stage or animation claim.
- `P85_CLI_MK3_VERIFY / PASS`: a separate CLI invocation repeated the independent `P79_ORIGINAL / PASS` against the same private ZIP with all counts unchanged, without the browser. This is independent source/preview verification on the CLI path—not just a preexisting P79 acceptance result.

**RECORD / CONFIDENCE:** P85's *implemented narrow MK3 original indexed-base plus raw source-record commands* are **VERIFIED** from complete user-supplied original-Windows execution results, independent verifier assertions, independently matched source identity, and source-only hosted Windows CI [#43311764581](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43311764581). The assistant did **not** directly read the user's commercial game or private ZIP, so direct file-content inspection beyond the reports is not claimed. All copyrighted raw exports stay under FIXTURES and are **never added to GitHub**.

**LIMITS:** This does not mean 216 decoded animation frames, native palette ownership, native opacity, timing, stage membership, complete MK3 9,186-asset catalog extraction or any MK1 CLI support. P85 is the fourth interim pass; retain a recoverable Git commit/PR and defer full source packaging and broader consolidated original-fixture regression to P86.

## Windows original-fixture acceptance — ACCEPTED; command retained for reproduction

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
- **P85 source-only VERIFIED:** Hosted [Windows Actions #43311764581](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43311764581) completed SUCCESS on exact tested commit `146c16817849aefea133afe7ef4a2b9e9e714f71` (no commercial game inputs). Source-only tests, inherited P84/P83 regression, production build, TypeScript and offline Chrome passed.
- **P85 original Windows VERIFIED from user-supplied private acceptance files:** P85 CLI scan, extract, verify all independently returned PASS against the GitHub-matched original commit/tree, and the nested original-byte/PNG oracle passed twice. The assistant reviewed the four result files, but did not directly open the commercial original DATA.MK3 or private exported ZIP. Evidence records are local/private.
- **P84:** accepted original DOS MK2 CLI and P83 browser, unchanged.
- **P86:** fifth-pass consolidation should run accepted original MK1/MK2/MK3 regression suites, preserve recoverable source checkpoints and review a small stand-alone CLI distribution. No speculative renderer or unrelated UI redesign.
