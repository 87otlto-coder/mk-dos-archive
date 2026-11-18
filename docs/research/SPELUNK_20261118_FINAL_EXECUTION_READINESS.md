# Final spelunking checkpoint — from P91 research to executable extraction (2026-11-18)

**Purpose:** close this research-only series with an actionable, evidence-graded transition to the next working pass. **No game launched, fixture inspected, executable rebuilt, tests rerun, installed tools changed, or accepted app/source branch modified during this pass.** The research record contains no copyrighted binaries, pixel/audio packets or game assets.

## Audited current baseline (do not mix claims)

| Scope | Authoritative committed evidence | Confidence |
| --- | --- | --- |
| Stable asset extractor | [`main` `PROJECT_STATUS.md`](https://github.com/87otlto-coder/mk-dos-archive/blob/main/PROJECT_STATUS.md) — P16 stable checkpoint (2026-11-06), prior original-fixture MK2 census **5,108** unique representations; CI source build checks; prior P11 user-tested preview/export across MK1/2/3 | Documentation and committed stable source exist; P16's 5,108 original-fixture census is a previously reported test, **not rerun here** |
| MK2 stage composition | [P90 source-backed Tomb/Portal/Tower setup](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p90-mk2-stage-reconstruction/docs/research/P90_MK2_STAGE_RECONSTRUCTION.md) — roots, conditional objects, origins, accumulator/camera semantics and synthetic indexed projections | Static source checks passed at earlier checkpoint; no verified native completed stage viewport |
| Native Tomb oracle | [P91 native capture branch](https://github.com/87otlto-coder/mk-dos-archive/tree/research/p91-native-observer-smoke) — committed normal-core adapter, four-phase guard, private package builder, launcher and verifier; [Windows workflow 43753635156](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43753635156) originally succeeded at SHA `9d890e4ed0ed05e8e2216380dfe02b64847f57ca` | **VERIFIED prior original-free portability only**; original MK2 runtime, DAC, framebuffer/stage accuracy **VALIDATION PENDING** |
| Extra spelunking | [2026-11-17 scanout](SPELUNK_20261117_MK2_P91_SCANOUT_AND_REACHABILITY.md), [2026-11-18 CPU aperture](SPELUNK_20261118_P91_VGA_APERTURE_OBSERVER.md), [2026-11-18 target filter / rawshot](SPELUNK_20261118_P91_TARGET_PREFILTER_RAW_SCANLINE.md) | Pinned source observations, not original game tests |

**Important:** historical [`P91_STANDARD_CHAT_HANDOFF.md`](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/docs/research/P91_STANDARD_CHAT_HANDOFF.md) describes a pre-adapter status. Newer P91 native-integration and `PROJECT_STATUS.md` records supersede that dated claim. Verify actual files in a branch, not just documentation.

## Finding 1 — the previous packaged executable artifact is no longer retained

**VERIFIED LIVE API (2026-11-18):** `GET /repos/87otlto-coder/mk-dos-archive/actions/runs/43753635156/artifacts` returned **`{"total_count":0,"artifacts":[]}`**. The [workflow file at original commit](https://github.com/87otlto-coder/mk-dos-archive/blob/9d890e4ed0ed05e8e2216380dfe02b64847f57ca/.github/workflows/p91-portable-capture-windows.yml) specifies `retention-days: 1`. The prior successful run originally uploaded a verified ten-file `P91-Private-Windows-Capture-Kit`, artifact ID `14177863632`. Zero currently retained artifacts is **consistent with expiry**, not proof of any CI failure or vanished source.

Original historical fingerprints:
- portable ZIP `dbfef25aa9c77c0f78fc267840da340a8252b51f5428d8459038ed89300f8f4b`
- instrumented EXE `3962316035d95d581e35bdfe09b8ae84daa6e5644853c04d91708f17d49b78bd`
- source patch `c9ad618064755fe887d74ad39a87f6264901cb9815219691643d86f782c6d334`

**UNKNOWN:** whether the user already copied that exact verified kit to `F:\Dev\MKEXT\TOOLS\P91Capture`. **Do not rebuild or download until local inventory is checked.**

## Finding 2 — exact workflow can be rerun without changing source (preferred recovery)

**VERIFIED:**
- Repository default branch is `main`. The file `.github/workflows/p91-portable-capture-windows.yml` exists on `research/p91-native-observer-smoke` and this spelunking descendant, but **not** `main` or `develop` (direct file fetch). Although it declares `workflow_dispatch`, GitHub requires a manually dispatched workflow's file to exist on the default branch; therefore **do not assume the "Run workflow" button is available or can dispatch this research-only workflow**. Official GitHub docs: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch
- GitHub allows a workflow run to be **rerun within 30 days** of the original, keeping the **same `GITHUB_SHA` and `GITHUB_REF`**. This successful run originated 2026-11-15, so rerunning it is within that documented window as of 2026-11-18. Official docs: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs
- The previous run's original `head_sha` is `9d890e4ed0ed05e8e2216380dfe02b64847f57ca` and `head_branch` is `research/p91-native-observer-smoke` (live run metadata). Source code is retained on GitHub; previously uploaded artifact bytes are not.
- The accepted workflow's push trigger is limited to that research branch and selected source/workflow paths. An empty commit or a documentation-only push would **not** be a trustworthy way to regenerate this package. Prefer **rerun the actual existing successful workflow** rather than altering stable source or merging a research build workflow into main.

Suggested operator-only steps for a later Work session: check exact local `TOOLS\P91Capture` contents and hashes first. If absent, use [original run](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43753635156), GitHub Actions **Re-run all jobs** with permitted write access (or authenticated `gh run rerun 43753635156 --repo 87otlto-coder/mk-dos-archive`). Monitor for full success; download the fresh one-day artifact promptly to a **new private local directory**, inspect ZIP members and binary SHA independently, then install under `TOOLS\P91Capture` with existing-file safeguards. **No rerun was initiated by this research.** If GitHub disables rerun or permissions are absent, document that blocker and choose an explicitly isolated source-pinned Windows build as a separate plan; do not pretend `workflow_dispatch` is available.

## Finding 3 — original SHA/ref pinned; binary output is *not* byte-reproducible by construction

**VERIFIED SOURCE** in workflow at the exact original SHA:
- `runs-on: windows-latest`, `msys2/setup-msys2@v2` with `update: true`, live MinGW package installation.
- If libslirp is absent, `git clone --depth 1 https://github.com/msys2/MINGW-packages.git` (no revision pin) and build package. Compiler/dependencies/runner image can change independently of our pinned DOSBox-X revision.
- In contrast, the source checkout explicitly detaches at DOSBox-X `029bd65c5dcc7cdc7f2e14e35278620d9707d969`, and the patch source is generated from committed research files with strict placement checks.

**INFERRED:** A rerun can pass source/no-game checks while creating a different EXE or ZIP SHA. If the EXE hash differs from historical `39623160...`, this is **neither automatic acceptance nor proof of compromise**. Require (a) exact current per-build `P91_CAPTURE_BUILD_ID.json`, (b) upstream/patch identities and original-free negative gates, (c) independent fresh EXE hash, (d) portable DLL closure and restricted PATH test, and (e) explicit *new* binary identity. Never alter the old historical hashes in-place or claim bit-identical reproduction without evidence.

## Ranked execution plan for next session

### Gate 0 — quick, non-destructive local installation inventory

- Local scope: `F:\Dev\MKEXT\SOURCE`, `TOOLS`, `FIXTURES`; do not relocate source or originals.
- Check whether `F:\Dev\MKEXT\TOOLS\P91Capture` has `dosbox-x.exe`, `P91_CAPTURE_BUILD_ID.json`, `P91_CAPTURE_SOURCE_PLAN_20261115.json`, Python verifier/launcher, CMD and runtime DLLs. Verify executable SHA against the **installed identity**. Distinguish missing, matching, corrupt, and independently rebuilt packages; do not overwrite the user's existing tools.
- If complete and trusted, skip GitHub rerun. Otherwise execute Finding 2's rebuild/reacquisition gate and separately verify the new package.

### Gate 1 — source-safe preflight, then one bounded private MK2 run

- Launcher: `F:\Dev\MKEXT\TOOLS\P91Capture\Run-P91-Private-Capture.cmd` or `python -B ...\run_private_capture.py` preflight without `--capture`. Exact supported original fixture is `F:\Dev\MKEXT\FIXTURES\mk2\mk2` (read from committed launcher; **not verified to exist locally**) and `FIXTURES\VALIDATION` must already exist. Three private original input fingerprints must match P91 plan.
- **Only after preflight** execute a single bounded original-game run from the launcher's **disposable GAMECOPY**. No commercial assets uploaded to GitHub. The launcher uses a visible DOSBox-X GUI but does **not automate reaching Tomb mode 2**; no guaranteed attract-mode route is established.
- Native code checks full Object1/Object2 and a 64,000-byte buffer before finishing target stage/mode filtering ([adapter](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp#L263-L286), [sample](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp#L404-L457)). **Prior spelunk proved a potential pre-target refusal** if the unrelated stage has an invalid source buffer; real-game occurrence UNKNOWN. Do not prematurely patch P91, but recognize this exact failure path if reported.
- A 600-second launcher timeout, by itself, is **not** proof the stage is wrong; native target reachability and observer activation are unobserved. Preserve private `dosbox-stdout.log`, `dosbox-stderr.log`, `capture-launcher-error.txt`, and any `p91-capture-refusal.json`, with source/input identities and no fabricated success.

### Gate 2 — independent packet acceptance

- Require the raw `P91NAT02` four-phase packet, exclusive complete marker, exact byte counts/hash, original EXE and GRA input fingerprints, each code window/mapping verified per phase, original RET opcode/stack/ESP witness, frame-generation buffer parity, palette-slot consistency, DAC snapshot and **64,000 exact aperture/index positions**. Run the existing committed reader, Collector and `verify_snapshot.py` without weakening checks.
- Split **PASS_P91_PACKET_CONSISTENCY** (synthetic/packet invariant) from **VERIFIED native original-game run provenance** (observed exe, actual input source and event lifecycle). A green packet alone is not a finished stage or a true scanout oracle.
- **If refusal or timeout:** fix *the observed, categorized first blocker only* with a no-game negative test and a new isolated patch/executable identity. Target filtering, VGA read mode, bank mapping, timing effects and rawshot are **investigation candidates**, not known root causes.

### Gate 3 — the smallest authentic rendering result

- Apply the already independently qualified **P82 original indexed layers** plus **P90 mode-qualified Tomb root, origin, list and camera** logic to the captured draw-entry object state. Preserve source-index/opacity/palette-known masks and original provenance; do not infer palette record ownership or frame timing.
- Reconstruct **one** original Tomb mode-2 framebuffer by replaying source-backed ordering/flags/clip transforms. Compare **all 64,000 indexed positions** against P91 DRAW_COMPLETE, and report unknown or mismatched regions. Then independently qualify RGB and any scanline discrepancy. No UI redesign or second-stage generalization until first holdout.
- DOSBox-X raw indexed screenshot can be used as a second, nonidentical oracle only after controlled same-frame matching. The pinned upstream renderer has indexed `.raw1.png` path, but its additional private `rPAL` chunk is appended **after IEND**, so ordinary PNG decoders need not preserve it ([rawshot research note](SPELUNK_20261118_P91_TARGET_PREFILTER_RAW_SCANLINE.md)). A same-looking screenshot is not equal to a matched original frame.

### Independent progress if native capture is genuinely blocked

- Do not spend all the next session on emulator debugging. Existing **P16 stable source already extracts assets across MK1/MK2/MK3** and reports prior MK2 5,108 asset coverage. Recheck clean Windows source build/asset-browser exports and choose the highest-value qualified source index/mask representation for extractor integration while preserving the validated workbench.
- Treat research completeness, implementation completeness, private original-input parity and browser runtime verification as separate gates. Avoid new broad game-mechanics research.

## Immediate next-pass stop/go table

| Observation | Next action | Do not claim |
| --- | --- | --- |
| Verified installed portable kit exists | Preflight, then one bounded run | That a Tomb frame has been captured |
| Local kit missing, original workflow has 0 artifacts | Rerun original GitHub workflow; download/verify fresh artifact | That old ZIP bytes are still downloadable |
| Rerun returns new EXE SHA | Validate fresh identity / no-game gates, record provenance | Byte-for-byte identical old binary |
| Preflight fails original fixture/path | Fix only local canonical prerequisites, no originals overwritten | Original game executed |
| Timeout, no native refusal | Investigate target reachability and hook activation | Bad decoder, bad palettes or broken engine |
| `source/memory/list capture failure` before target | Investigate proposed minimal target prefilter in isolated branch with no-game regressions | That MK2 definitely uses a malformed buffer |
| Raw packet accepted | Verify native provenance, then build one indexed Tomb framebuffer oracle | Stage completeness or runtime RGB/timing |
| Capture genuinely unavailable | Continue qualified P16 source-to-export work | Block entire extractor project |

## Preservation and exit criteria

All findings are source-safe text on an isolated spelunking branch. No accepted P16, P90, P91 or P89 source was edited, and the original one-day workflow was **not** rerun. Do not package or publish a full source checkpoint for this research note. We have enough evidence to **stop spelunking and start the next execution pass**: local kit inventory -> original-code rerun only if needed -> private original MK2 preflight/capture -> independent indexed Tomb reconstruction. Keep source research only as a response to exact runtime evidence.
