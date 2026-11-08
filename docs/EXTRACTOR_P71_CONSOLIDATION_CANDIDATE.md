# P71 — Fifth-pass original three-game and browser consolidation candidate

**SUPERSEDED BY ACCEPTED P71 CHECKPOINT:** The full original DOS and Chrome P71 run subsequently returned **PASS**, all **10** groups, **17,211** original asset representations, exact tested commit `81555874fe931c53c2b4dd56e0486b09c91f7101`, Git tree `f871c5b63b3b0aae91725f1fcb6a117d92173d3e`, and **2,355** tracked files audited. These source identities match the independently verified GitHub commit object. See [the authoritative accepted P71 checkpoint](EXTRACTOR_P71_ACCEPTED_CHECKPOINT_2026-11-08.md). Earlier pending statements in this *candidate document* record implementation chronology and are no longer current. `main` remains P16; audio playback and native palette/timing/stage membership were not verified.

**Date:** 2026-11-08. **Branch:** `develop` only; `main` remains P16. **Status:** P71 source-only checkpoint/refusal CI **PASS** on exact source/workflow SHA `a1e6a2bb058bd67c908763f1a648154539870518`; **complete P71 original-fixture plus all four Chrome browser gates VALIDATION PENDING**. [Source-only GitHub Actions 42482028581](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42482028581) completed successfully, including P71 synthetic source refusal controls, tracked commercial-file guard, TypeScript, production build and offline Chrome startup. GitHub CI does **not** contain the original DOS game fixtures. P66 is the last **accepted full original three-game checkpoint** until a fresh P71 run succeeds on exactly identified source.

## P71 first original-run harness failure and narrow fix (2026-11-08)

**OBSERVE:** The user reran the complete original P71 runner on a clean Windows checkout. Its progress reached `source_build`, `p66_original_three_game`, `p69_original_mk3_ftr`, `p70_original_mk3_cue`, `p67_original_browser` and then `p68_original_browser_switch`. The outer P71 process raised `ValueError: P71: p68_original_browser_switch did not output standalone JSON: Expecting value: line 1 column 1`. The P68 subprocess returned exit code zero (P71 checks exit code before JSON parsing) but did **not** become an accepted P71 step. P71 recorded a failed/incomplete checkpoint, as required. No P69/P70 browser steps or closing cumulative audit were run.

**ROOT CAUSE — verified against committed producers:** P68's original-source ZIP readback is performed by `check-p68-switch-download.py`, whose successful output consists of **three** separate `mk1`, `mk2`, `mk3` original-file verification lines. The P68 Chrome runner intentionally inherits those Python stdout lines and then prints its final JSON result. The P71 generic `read_json_stdout` helper assumed the **entire** P68 stdout was one JSON object. The mismatch was **in the P71 harness**, not evidence of a failed original-game decoder or browser step.

**NARROW FIX — committed on `develop`:** `scripts/verify-p71-checkpoint.py` now uses `check_p68_browser_stdout` to require the three exact original-source verification messages in **MK1/MK2/MK3 order**, then parse **exactly one** final JSON object with all existing `check_p68` strict acceptance fields. Unknown extra log lines, omitted/duplicated/reordered readbacks, extra JSON, malformed JSON and falsified counters/status still fail closed. The general parser and all original-source checks were left unchanged; **no validation was bypassed**. `scripts/test-p71-checkpoint.py` adds a successful realistic mixed-stdout fixture and **10 malformed/false-output refusal cases**.

**VERIFIED after fix:** [GitHub source-only CI 42483858630](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42483858630) **SUCCESS** on exact source/test SHA `e8bf0d5f83906c88c6de5b53e8c1dd31dd3018aa`, including P71 source-only refusal controls, previous controls, source guard, TypeScript, production build and offline Chrome boot. GitHub CI did **not** rerun original DOS fixtures or full browser interactions.

**Next acceptance:** pull the fixed `develop` source and use a **new private `$work` path**, because the previous P71 run created a `report.json` with `status:"FAIL"`. Rerun the complete ten-group original three-game/Chrome P71 suite; passing previous subgroups separately does not qualify as a P71 same-source checkpoint. A final P71 original PASS and exact tested source/tree must still be observed before accepting and publishing the checkpoint.

## Goal and scope

P71 is **consolidation, not a new decoder, palette-assignment or game-format research pass**. P67–P70 have already been individually accepted against original DOS installations. P71 must reproduce those checks **on the same complete, audited source commit and tree**, alongside the accepted P66 full original three-game regressions, before becoming a new checkpoint.

The accepted separate interim evidence:

- **P67** — original MK1/MK2/MK3 Chrome fixture loading, 2,656 / 5,369 / 9,186 library assets, original WAV/MIDI selected ZIPs, MK1 P65 indexed animation package versus O60 original indexed planes, 739 original executable ANITAB cells (original download readback); original PNG/audio artifacts were never committed.
- **P68** — same Chrome tab MK1 → MK2 → MK3 → MK1, cancelled and denied picker branches preserve old queue, mixed input refused, accepted switch clears old game state, three original-file selected ZIPs independently verified. OS permission/error paths are simulated intentionally, not native Windows shell dialog acceptance.
- **P69** — **17 original MK3 FTRs, 6,654 source-indexed sprite frames**, 32,675,690 native index positions and 11,689,513 opaque mask pixels, exact FHDS/FDAT compressed source intervals, original SHA and independent Python source bitstream reconstruction. An actual browser one-click BLADE.FTR export passed **363** original index/mask frames.
- **P70** — original DOS MK3 **9,186** assets, original CUE **3,014 bytes**, **46** CUE-linked Ogg tracks totaling **43,367,491** original bytes, independent ZIP/source readback and real Chrome download. Preserves original `MP3` CUE declarations despite `OggS` source signatures; audio-only ZIP excludes the separate binary `MK3.GOG` data track.

P66 accepted original source commit `2f911b7961a706022927bd0db187f9cf2cba555c`, Git tree `04b2ee39313b655232e719f32ec63a525ebd14a1`, all 17,211 asset representations and the cumulative P61/P62–P65 tests. The authoritative current branch includes the newer P67–P70 source: do **not** substitute historical focused PASS screenshots for a new P71 PASS.

## Consolidated implementation

`scripts/verify-p71-checkpoint.py` is the single **fail-closed** P71 runner. It adds no registered assets or new commercial data dependencies and leaves existing extractor and research workbench intact.

- Requires **clean tracked and untracked `develop` checkout**, all 3 original DOS executable SHA identities, no overlapping source/original/private work directories and a **fresh, nonexistent private output path outside Git and game installations**.
- Records exact opening Git commit, recursive tree SHA, all tracked blob matches and source inventory SHA via the already accepted P31/P66 source audit. A closing identical audit is mandatory.
- Checks TypeScript and builds the production app from that same source, then verifies that Chrome Playwright Core and Python Pillow are available.
- Runs existing `scripts/verify-p66-checkpoint.py` **unaltered**. Its nine nested acceptance groups include full P61 original three-game regression, P62 MK1 WAV, P63 MK3 WAV, P64 MK2 score, P65 MK1 indexed ANITAB, their synthetic refusals and their source audits. P71 requires P66 PASS, all nine exact groups, nested P61 nine groups, **17,211 = 2,656 / 5,369 / 9,186**, and exact source commit/tree equality with P71 opening audit.
- Runs **new focused original P69 and P70 source/ZIP verifiers** as separate original-fixture gates: independent MK3 packed fighter pixel/mask decoder and CUE/OGG source reader.
- Opens **actual Google Chrome** and replays the original-fixture P67 fresh-context browsing/download, P68 same-tab cancellation/selection/download, P69 BLADE.FTR indexed-ZIP download, and P70 46-OGG CUE ZIP download. Checks all original-source byte readbacks and explicitly qualified unknowns; does not equate headless startup with real user actions.
- Reruns dedicated P67/P68 and P69/P70 source-only falsification controls, including invalid downloaded ZIP provenance, game identity mismatches, 15 incorrect P69 FTR joins, and 15 incorrect P70 CUE/OGG joins.
- Requires **all ten** top-level P71 groups and an unchanged closing source audit before emitting final `pass:"P71", status:"PASS"`. Records the exact tested commit/tree, audit, every group result, private stdout/stderr logs and test limitations in `<private-work>/report.json`. A failed run retains `status:"FAIL"` and the last completed group; it does **not** publish a checkpoint.
- `scripts/test-p71-checkpoint.py` tests accepted synthetic checkpoint shapes, source/fixture mismatch and missing-group refusals, falsified CUE/FTR counts, false Chrome evidence and illegal paths **without any original game files**. CI cannot prove original-fixture or interactive-browser acceptance.

P71 source/checkpoint implementation changes are confined to `scripts/verify-p71-checkpoint.py`, `scripts/test-p71-checkpoint.py` and `.github/workflows/p11-build-smoke.yml`, plus documentation. There is no reason to add an extractor feature, modify asset IDs, alter previous verification reports or promote `main`.

## Reproduce in Windows PowerShell

Use the **actual GOG DOS installation directories**, not a secondary extracted copy inside the Git repository. The P68 external Playwright driver is reused. Use `npm.cmd` to avoid Windows PowerShell's execution-policy restriction on `npm.ps1`.

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd ci --no-audit --no-fund

$driverDir = Join-Path $env:TEMP 'mkdos-p68-driver'
npm.cmd install --prefix $driverDir --no-audit --no-fund playwright-core@1.62.1
$env:NODE_PATH = Join-Path $driverDir 'node_modules'

python -c "import PIL"

$work = Join-Path $env:TEMP ("mkdos-p71-" + [guid]::NewGuid())
python scripts/verify-p71-checkpoint.py `
  --mk1 "E:\GOG\Games\Mortal Kombat\mk1" `
  --mk2 "E:\GOG\Games\Mortal Kombat 2\mk2" `
  --mk3 "E:\GOG\Games\Mortal Kombat 3\mk3" `
  --work $work
```

Use a fresh path each run. The P71 runner re-runs `npm.cmd run lint` and `npm.cmd run build` itself, runs all original-fixture regressions, and performs actual Chrome interactions. The output may be substantial; **do not weaken checks or disable whole suites to obtain a PASS**. All source/game media and copyright-sensitive ZIP exports remain in the private run directory.

**Acceptance shape, only once observed:** JSON with `pass:"P71"`, `status:"PASS"`, `stepsPassed:10`, `census:{mk1:2656,mk2:5369,mk3:9186}`, `totalOriginalAssetRepresentations:17211`, `originalP66BaselineReproduced:true`, `originalP69AndP70ExportAndIndependentDecodersPassed:true`, `actualP67ThroughP70OriginalChromeWorkflowsPassed:true`, and an exact `sourceCommit` and `sourceTree`.

**Do not call P71 accepted until the original-source/full-browser test actually passes.** If the result fails, inspect the private work folder's `report.json` and group-specific `.stderr.txt/.stdout.txt` logs. Fix only verified source/harness errors, commit the replacement, rerun source CI and the full original gate on the replacement exact source, then document the accepted checkpoint. A documentation-only acceptance commit may follow the tested source commit after validation; `main` stays P16.

## Remaining non-claims

Even on a fully accepted P71 regression: this source work does **not** establish native VGA fighter palette ownership, complete stage composition, gameplay animation timing/ordering, original hardware audio rendering, stage-to-music assignments, authentic native loop duration or audible headphone playback. P68 simulates the OS picker cancellation/denial while using real original folder uploads for game loading. P69 FTR source order is not a gameplay animation timeline. P70 audio-only export is not a complete game CD image. Research confidence classifications remain separate from implementation completeness, fixture completeness and Chrome interaction completeness.

After P71 acceptance, begin a new five-pass cycle concentrating on **palette-resolved sprites, verified animation reconstruction and stage-composition completeness**, not cosmetic UI work or uncontrolled reverse-engineering research. Only generalize stage/game mechanisms after repeated independent original DOS verification.
