# P71 — Accepted full original three-game and browser consolidation checkpoint

**Accepted:** 2026-11-08. **Branch:** `develop`. **Classification:** **VERIFIED (user-local original DOS fixture execution and live Chrome browser interactions)**, supported by a complete P71 PASS summary supplied by the user and independently checked source commit/tree in GitHub. This is the third complete original three-game accepted checkpoint (after P61 and P66). No original commercial game source, recovered copyrighted media, downloadable ZIP, or private test report is stored in this repository.

## Exact tested source

| Field | Accepted value |
| --- | --- |
| Full original-fixture test runner | `scripts/verify-p71-checkpoint.py` |
| Tested Git commit | `81555874fe931c53c2b4dd56e0486b09c91f7101` |
| Tested Git tree | `f871c5b63b3b0aae91725f1fcb6a117d92173d3e` |
| Source files audited | **2,355** |
| Original source check | Opening/closing source audit required and accepted by P71 PASS |
| Original-source test status | **PASS** |
| Top-level P71 steps | **10 / 10 PASS** |
| GitHub source-only CI | [42483858630](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42483858630) **SUCCESS**, on code/tests SHA `e8bf0d5f83906c88c6de5b53e8c1dd31dd3018aa` |
| Subsequent changes between CI SHA and original-tested commit | Documentation-only: `docs/EXTRACTOR_P71_CONSOLIDATION_CANDIDATE.md`, `PROJECT_STATUS.md` |
| Stable branch `main` | P16 `c84acad696adb3fa2f2ff7433be711e1c5654407`, unchanged |

**Independent GitHub corroboration:** GitHub's commit object for `81555874fe931c53c2b4dd56e0486b09c91f7101` reports tree `f871c5b63b3b0aae91725f1fcb6a117d92173d3e`, an exact match to the user's final P71 output. GitHub Actions separately verifies source/test checks, the tracked-source guard, TypeScript, production Vite build and offline Chrome boot on the preceding implementation code SHA. **The GitHub CI job itself did not execute commercial original DOS game fixtures or original-file browser interaction.**

## Ten accepted original-file and browser groups

The user provided the complete final P71 stdout, showing the following ten groups in this order, followed by `pass:"P71"`, `status:"PASS"`:

| # | Acceptance group | Verified scope |
| --- | --- | --- |
| 1 | `source_build` | TypeScript/source build and original-browser test prerequisites on the tested checkout |
| 2 | `p66_original_three_game` | Existing full nine-group P66 cumulative original MK1/MK2/MK3 regression; inherited P61 17,211-asset baseline and P62–P65 original fixture/refusal controls |
| 3 | `p69_original_mk3_ftr` | MK3 source-backed indexed sprite bundles, 17 FTR files, 6,654 independently reconstructed original frame planes and original compressed source intervals |
| 4 | `p70_original_mk3_cue` | Original MK3 CUE + 46 original Ogg tracks, independent byte-for-byte ZIP and source digest checks |
| 5 | `p67_original_browser` | Original MK1/MK2/MK3 Chrome loading, previews, selections and source-verified downloads in separate browser contexts |
| 6 | `p68_original_browser_switch` | One-tab MK1 → MK2 → MK3 → MK1 replacement, cancellation/permission-denial guards, correct game-specific queue/inspector reset and original ZIP readbacks |
| 7 | `p69_original_browser_ftr` | Real Chrome one-click original BLADE.FTR indexed sprite ZIP and original compressed source/plane readback |
| 8 | `p70_original_browser_cue` | Real Chrome original CUE-linked 46-Ogg download, with independent source-byte parity |
| 9 | `p67_p68_refusal_controls` | Malformed downloaded selection and game-switch/cancel/stale-source controls |
| 10 | `p69_p70_refusal_controls` | Invalid FTR descriptor/index/mask and false CUE/Ogg source evidence refusals |

The source runner emits `status:"PASS"` only after **all** required groups and its matching closing source audit have succeeded. The user-supplied stdout reports `stepsPassed:10`, `originalP66BaselineReproduced:true`, `originalP69AndP70ExportAndIndependentDecodersPassed:true` and `actualP67ThroughP70OriginalChromeWorkflowsPassed:true`.

## Original asset census (unchanged)

| Original DOS game | P71 accepted catalogue |
| --- | ---: |
| Mortal Kombat 1 | **2,656** |
| Mortal Kombat 2 | **5,369** |
| Mortal Kombat 3 | **9,186** |
| **Total** | **17,211** |

This is a **provenance/export/browser completeness and regression checkpoint**. It does not claim that 17,211 newly decoded assets were added in this cycle or that every animation/stage/music interpretation has been recovered.

## Private evidence and reproduction

The original P71 run wrote its structured full report and original-file test logs **outside GitHub**:

`C:\Users\87otl\AppData\Local\Temp\mkdos-p71-84b858ef-e279-496b-be5c-0d481945b65e\report.json`

The final stdout included `sourceCommit:` `81555874fe931c53c2b4dd56e0486b09c91f7101`, `sourceTree:` `f871c5b63b3b0aae91725f1fcb6a117d92173d3e`, `sourceFilesAudited:2355`, `stepsPassed:10`, exact game counts, and `status:"PASS"`. This private report path is recorded for reproducibility only; the report bytes were **not ingested into GitHub** and should not be misrepresented as repository evidence.

Reproduce the test on a **fresh** `develop` checkout at the exact tested source commit, or another separately audited clean source revision. Run in PowerShell using the original local GOG installations:

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd ci --no-audit --no-fund

$driverDir = Join-Path $env:TEMP 'mkdos-p68-driver'
$env:NODE_PATH = Join-Path $driverDir 'node_modules'
python -c "import PIL"

$work = Join-Path $env:TEMP ("mkdos-p71-" + [guid]::NewGuid())
python scripts/verify-p71-checkpoint.py `
  --mk1 "E:\GOG\Games\Mortal Kombat\mk1" `
  --mk2 "E:\GOG\Games\Mortal Kombat 2\mk2" `
  --mk3 "E:\GOG\Games\Mortal Kombat 3\mk3" `
  --work $work
```

Use a fresh nonexistent private work directory on each run. A new revision may change the source commit/tree while preserving the same accepted regression counts; compare evidence against the **actual tested revision**, not the historical P71 SHA. The preceding first P71 run correctly failed closed on a P68 stdout framing mismatch; its 10-case refusal-verified harness fix was accepted under source-only CI before the successful full rerun.

## Explicit confidence limits

**VERIFIED:** original MK1/MK2/MK3 asset census and cumulative original-fixture gates; P69 MK3 original indexed FTR export; P70 MK3 CUE/Ogg export; actual P67–P70 Chrome source-backed previews/selections/downloads; exact source commit/tree reported by the successful local runner and corroborated in GitHub; unchanged source audit.

**VALIDATION PENDING / UNKNOWN:** unique native palette ownership for unresolved fighter/stage sprites; complete gameplay animation grouping, original timing and runtime traversal; original stage camera and compositor/layer positioning; runtime music/voice/effect assignments and hardware-native audio fidelity.

**NOT CLAIMED:** original audible playback (P71 field `audiblePlaybackVerified:false`); native palette/timing/stage membership (`nativePaletteTimingOrStageMembershipAsserted:false`); live Windows native OS picker permission UI (P68 deliberately simulates the cancellation/denial branches); complete physical CD image (P70 audio-only ZIP explicitly excludes the binary data track). The private browser tests verify media **bytes and supported metadata**, not speakers/sound card fidelity.

**Checkpoint policy:** preserve the established forensic research workbench, original indexed data and evidence; do not promote `main` without explicit instruction. This accepted P71 source is now the baseline for the next five-pass cycle (**P72–P76**). Prioritize reliable palette resolution and source-backed visual reconstruction/animation/stage composition over research for its own sake. Reuse established original-data evidence before opening unrelated reverse-engineering lines.

## Publication

This checkpoint is **documentation-only**, published to `develop` after the source commit above was independently confirmed. `main` remains P16. No source extractor functionality, existing asset IDs, tests, downloaded original game data or generated copyrighted media are changed by the acceptance record.
