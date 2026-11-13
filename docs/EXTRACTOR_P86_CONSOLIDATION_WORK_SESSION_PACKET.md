# P86 — fifth-pass original DOS and Windows consolidation candidate

**Created:** 2026-11-13. **Branch:** interim/p86-consolidation, based on accepted P85 merge 9ad7f9bde06ce4d1b2562197202bf4e2bca13318. **Main/develop unchanged.**
**Status:** Source-only hosted Windows CI **VERIFIED PASS** on executable candidate commit `1878cd54cda5874b882c28054c1e07bc296f54b8` / tree `d4572ba8911278d6428778ef7e308db6782c5325`; [GitHub Actions #43381002723](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43381002723). Full original DOS/real Chrome P86 **subsequently ACCEPTED** from the user's complete original-machine report, see the newer acceptance section.

## P86 ORIGINAL WINDOWS ACCEPTANCE — PASS (2026-11-13)

**FIFTH-PASS CONSOLIDATION ACCEPTED.** The user's new Windows original-fixture/real-Chrome checkpoint returned `pass:P86`, `status:PASS`, with **4/4 ordered P86 groups PASS** on branch `interim/p86-consolidation`. Exact tested Git commit `1864bc2412bd3b39b5820a56b5d5c2bf2c4990bd` and tree `34416a05966fce9d0b470a6f58d8b86eb6f9c900` independently matched the GitHub Git commit API. GitHub [Windows Actions #43498534235](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43498534235) independently returned **SUCCESS on that exact commit** with no commercial game inputs. P61, P66/P81, P86 runner, P86 negative tests, headless extractor, and Windows workflow are unchanged Git blobs at the accepted commit.

**OBSERVE/RECORD:** The user provided the runner's `summary.json` final JSON and uploaded full `report.json`, inspected directly. The full report records:
- `p81_original_three_game_and_chrome: PASS`: original three DOS games and real Chrome P81 checkpoint, with all **nine** nested original acceptance groups passed; original three-game default catalogue **17,211** (MK1 2,656; MK2 5,369; MK3 9,186). It reports `sourceThreeGameOriginalAndChrome:true`.
- `p84_original_mk2_cli_source: PASS`: original source-backed Tomb/Portal **115** independently verified source PNGs and **939,425** indexed positions; two stage source sets.
- `p83_original_mk2_real_chrome: PASS`: optional MK2 stage-source Asset Library catalog **5,484** and **three byte-exact original Chrome PNG downloads**.
- `p85_original_mk3_cli_source: PASS`: original MK3 leading source **64,000** indexed base positions, **216 RAW** continuation stored records (explicitly **NOT** decoded animation frames), and **128,000** independently checked preview PNG positions.

**Exact unchanged source audit:** `originalSourceAuditAtStart == originalSourceAuditAtEnd`, both `status:PASS`, commit/tree as above, **2,435 file blobs**, 405 source files, 2,435 checkout-normalized matches, zero missing, zero mismatches, zero unsafe paths. Source inventory SHA256 `5257d65240e75c331c95b5aa729c31ae5a5ac06fff835253a9d2351c10570ef7`. `remoteAssociationVerifiedByThisScript:false` is an explicit limitation of the local runner, **not** a failure: GitHub Git API separately confirmed the commit/tree and source blob equality.

**Time/evidence:** `startedUtc:2026-11-13T20:33:58.604361+00:00`; `finishedUtc:2026-11-13T20:45:16.023758+00:00`. Full `report.json` and nested original/Chrome logs and private source ZIPs remain under `F:\Dev\MKEXT\FIXTURES\VALIDATION\P86-57f7c081e54a4f1dbf2eb3476667e20a`, excluded from GitHub. The assistant inspected the supplied report, **not** the commercial original files nor the nested private ZIP contents. The previous failed P86 directory `P86-ae85b2e9c2ff48c9a53ee4420b82f642` is retained independently as historical failure evidence; the P61 allowlist issue is resolved and its source-only Windows regression accepted.

**CLASSIFY:** **VERIFIED from user-run original DOS/real Chrome results and source-oracle gates**: the already qualified extractor scopes and consolidated runtime gates. **SOURCE-ONLY VERIFIED:** hosted Windows CI on exact commit. **UNKNOWN/not claimed:** full game headless extraction catalogues, native palette/opacity ownership, stage composite/camera alignment, animation timing/frame order, decoded MK3 continuation images, complete sound export. `originalGameExecutablesUploaded:false`, `privateSourceExportsUploaded:false`, `nativePaletteCameraStageOrAnimationOwnershipClaimed:false`. No promotion of commercial media to Git; do not present the research workbench as a finished standalone extractor.

**Checkpoint decision:** Fifth pass may be consolidated by merging PR #27 into the accepted **interim** P83/P84/P85 development branch after recording acceptance and passing source-only regression. **Do not promote `main` or `develop` or publish full source/release ZIP without a separate planned promotion review.** Keep tested P86 branch/commit recoverable because historical acceptance runners intentionally branch-gate P86 original replay.

## P61 targeted correction — hosted Windows source-only PASS (2026-11-13)

**VERIFIED:** [Windows Actions #43498047520](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43498047520) completed **SUCCESS** on exact executable/test commit `a44e2dfc1fdb788cc017fd3f55d3a1e1248fb1b6`. This includes P61 exact-branch allowlist source regression, the earlier P86 counterfeit-result/dirty-tree refusals, all inherited original-data-free source checks, Vite production build, TypeScript and offline Chrome smoke. The subsequent P86 documentation-only commits did not modify P61, the CLI, tests or workflow. This is **not** a new real original-file or real original-Chrome acceptance.

**Next original gate:** On a fresh clean fast-forwarded `interim/p86-consolidation` checkout, run the entire `verify-p86-checkpoint.py` with **a new private P86 work directory**; preserve historical `P86-ae85b2e9c2ff48c9a53ee4420b82f642` unchanged. Record exact `git rev-parse HEAD` and `git rev-parse 'HEAD^{tree}'` and attach `summary.json` only if four groups complete; if any group fails, inspect its nested stderr and existing private `report.json` before further source changes. Do not mark P86 accepted from CI alone.

## First original Windows attempt — FAIL at inherited P61 branch guard (2026-11-13)

**OBSERVED/CONFIRMED from user's private PowerShell logs**, on candidate source commit `b76b383ed21c31b7e593bfba1ab4ccf3ee46c955`, tree `ca5eae3e7d4dd1fb94f5670d3a33e09f30f8c83a`. New private diagnostics directory: `F:\Dev\MKEXT\FIXTURES\VALIDATION\P86-ae85b2e9c2ff48c9a53ee4420b82f642`. The P86 runner reached `P81_full_three_game_original` but returned a nonzero child status and correctly did **not** create a success `summary.json`. Nested logs trace the exact path `P86 → P81 → P76 → P71 → P66 → P61`. The P66 error log contains `AssertionError [ERR_ASSERTION]: P61 requires clean develop or explicitly approved P79–P81 interim branch, not interim/p86-consolidation`, at `scripts/verify-p61-checkpoint.cjs:58`. This **directly proves** the first original P86 failure was an outdated branch allowlist in inherited P61; it does **not** demonstrate any corrupted game bytes or extractor regression. The separate `SyntaxWarning` from the P86 docstring's Windows path escape was nonfatal.

**SOURCE CORRECTION:** The existing P66/P81 allowlists already explicitly permit the P86 branch, but P61's separate JavaScript branch guard did not. The *only* P61 change is to admit exact `interim/p86-consolidation` alongside the two historically accepted branches; retaining its clean-Git/source media and file separation checks. `scripts/test-p86-source-audit-allowlist.py` additionally checks the actual P61 source guard's exact three branches and source safeguards. No P61 extraction behavior, commercial source bytes, P81/P76/P71 verification assertions or original fixture paths were changed. The original failure directory must be preserved for reproducibility.

**Confidence:** Root cause of the **observed first P86 failure VERIFIED**. A future full P86 run may reveal further independent issues; do not assert the entire checkpoint is repaired until a new original Windows P86 report returns all four groups PASS on its exact Git tree. Hosted Windows source-only CI is a separate gate.

## Objective

Consolidate accepted extraction and browser milestones rather than pursue new reverse engineering. Preserve the full browser research workbench. The current lean headless CLI covers original **MK2 Tomb/Portal native source layers** and **MK3 P79 leading indexed source plus 216 raw source records**. MK1 CLI support, palette ownership, opacity, stage compositing and animation timing are not claimed.

### Preflight and narrow inherited branch audit fix

Historical P66/P81 source auditors only permitted develop or interim/p79-original-extraction, and would reject a clean P86 checkout. P86 permits only the exact additional branch interim/p86-consolidation and shares the same allowlist between P66 and P81. Unapproved branches, dirty checkout/source changes, noncanonical original DOS EXEs, overlapping private fixture/work paths and failed source-tree audits still refuse. Source-only test scripts test the branch restrictions and false evidence paths.

The historically VERIFIED P81 runner remains otherwise unchanged, and its previous acceptance cannot be substituted for a fresh same-tree P86 original run.

## P86 implementation

- scripts/verify-p86-checkpoint.py — Windows CLI coordinator, reusing the existing original P81/P83/P84/P85 checkpoint runners rather than implementing new decoders.
- scripts/test-p86-source-audit-allowlist.py — no-game source guard for exact approved branches and dirty-source refusals.
- scripts/test-p86-checkpoint.py — no-game synthetic controls for missing group evidence, source SHA/tree mismatches, source-index/PNG parity changes, falsely assigned palettes and false animation-frame counts.
- .github/workflows/p11-build-smoke.yml — Windows-only source tests plus inherited original-free regressions, TypeScript, Vite and offline Chrome.

Four ORIGINAL-DOS/CHROME acceptance groups must all pass:
1. **P81**: all nine inherited original MK1/MK2/MK3 and real-Chrome groups, on the same new P86 commit/tree. Original catalogue baseline MK1 2,656; MK2 5,369; MK3 9,186; optional MK3 9,205/9,402/9,619.
2. **P84**: original MK2 CLI scan/extract/verify; four original source hashes, 115 independently qualified PNGs, two 896-wide floors (Tomb 48 high, Portal 40), 29 uncropped sprites, eight setup-local groups and 939,425 original indexed positions. Creates a NEW private ZIP.
3. **P83**: real Chrome MK2 opt-in import of that same NEW P84 ZIP, 5,369→5,484 catalogue, two native floor previews and three independently byte-exact downloaded PNGs.
4. **P85**: original MK3 CLI scan/extract/verify, 320×200 original indexed base, 64,000 index positions, 216 **RAW** continuation records, 220 source parts, two source comparison previews, 223 ZIP members, complete 1,840,634-byte original interval and 128,000 independent preview pixel checks.

The runner requires unchanged source audit after all groups and writes a private P86 summary only after all four groups complete. Failure preserves logs/diagnostics. No commercial originals or original-derived ZIP/PNG/media enter GitHub.

## Hosted Windows source-only acceptance — PASS

**VERIFIED:** [Actions run #43381002723](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43381002723) completed SUCCESS on `windows-latest` for exact P86 source/test/workflow commit `1878cd54cda5874b882c28054c1e07bc296f54b8` (Git tree `d4572ba8911278d6428778ef7e308db6782c5325`, GitHub-confirmed). The new P86 exact-branch and dirty-source refusal tests, counterfeit P81/P83/P84/P85 group evidence refusals, full inherited source-control suite, Vite production build, TypeScript checks and offline Chrome smoke all passed. No original DOS binaries, original-derived PNGs or private ZIPs were supplied to CI. Artifact uploads were skipped for the PR.

This verifies the committed P86 orchestration **source**, not original-fixture/real-Chrome runtime acceptance. The complete original Windows P86 checker has **not** yet run, and its four groups remain PENDING.

## Windows original acceptance procedure

Canonical repository: F:\Dev\MKEXT\SOURCE\mkdosext
Private originals and validation outputs: F:\Dev\MKEXT\FIXTURES
Tools: F:\Dev\MKEXT\TOOLS

Ensure Python 3.11+, Pillow, Node/npm, Chrome and externally installed playwright-core are available. Paths below are project-layout examples: check actual game paths rather than assuming they exist. Only a new, clean source checkout is eligible. In PowerShell:

    $ErrorActionPreference = "Stop"
    Set-Location "F:\Dev\MKEXT\SOURCE\mkdosext"
    if (git status --porcelain) { throw "Preserve local source changes before switching." }
    git fetch origin
    git switch interim/p86-consolidation
    git pull --ff-only origin interim/p86-consolidation

    $mk1 = "F:\Dev\MKEXT\FIXTURES\mk1\mk1"
    $mk2 = "F:\Dev\MKEXT\FIXTURES\mk2\mk2"
    $mk3 = "F:\Dev\MKEXT\FIXTURES\mk3\mk3"
    $validation = "F:\Dev\MKEXT\FIXTURES\VALIDATION"
    $env:NODE_PATH = "F:\Dev\MKEXT\TOOLS\playwright-driver\node_modules"
    $env:PYTHONDONTWRITEBYTECODE = "1"
    foreach ($source in @($mk1,$mk2,$mk3)) {
        if (-not (Test-Path -LiteralPath $source -PathType Container)) {
            throw "Original game directory missing; correct path: $source"
        }
    }
    if (-not (Test-Path -LiteralPath $validation -PathType Container)) {
        throw "Private validation root missing."
    }

    git rev-parse HEAD
    git rev-parse 'HEAD^{tree}'

    $work = Join-Path $validation ("P86-" + [guid]::NewGuid().ToString("N"))
    python .\scripts\verify-p86-checkpoint.py --mk1 "$mk1" --mk2 "$mk2" --mk3 "$mk3" --work "$work"
    if ($LASTEXITCODE -ne 0) { throw "P86 original checkpoint FAIL; inspect private report/logs." }
    Get-Content -LiteralPath (Join-Path $work "summary.json") -Raw

The original P81 nested suite is deliberately included; do not bypass it to obtain a quick status. On failure, preserve the private report and stdout/stderr, correct only the verified cause and rerun against a new fresh work directory/committed tree.

## Consolidation acceptance boundaries

- **SOURCE-ONLY VERIFIED** only after real hosted Windows CI passes exact candidate sources, including all synthetic refusal tests. A green no-game CI run does NOT establish original DOS acceptance.
- **ORIGINAL VERIFIED** only after a new user-supplied P86/PASS report with exact source commit/tree and all four ordered groups, including inherited nine P81 original/Chrome groups and separate P83 three-download parity and P84/P85 independent source-byte oracle checks.
- Only then consider a full source checkpoint, regression reconciliation and carefully chosen stable development-branch merge. Keep commercial originals, exported media and fixtures out of GitHub. No automatic full source ZIP/release just because P86 is fifth pass.
- **UNKNOWN/DEFERRED:** native MK1 CLI extraction, complete MK2/MK3 CLI catalog coverage, native stage compositing, animation timing/ordering, original palette ownership and broader audio coverage beyond individually verified source mechanisms.

Preserve accepted P81–P85 research and provenance. Use OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION.
