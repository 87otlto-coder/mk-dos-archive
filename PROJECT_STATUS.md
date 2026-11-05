# MK DOS Extractor — project status

**Last status reconciliation:** 2026-11-05
**Project:** ChatGPT Project “MK Dos Extractor”  
**GitHub:** https://github.com/87otlto-coder/mk-dos-archive

## Current P11 release gate — 2026-11-05

The user verified MK1, MK2 and MK3 sprite previews and Pit II resource navigation. From a fresh checkout of `develop` at `240de32`, the canonical MK1 scan produced 24 normalized module previews, 24 ordinary rasters and one shared moon layer. The modified MK1 fixture used the read-only fallback. MK3 returned zero stage-classified assets. The original MK2 cumulative scan passed 40 checks with 5,053 unique assets.

In local Chrome the new batch action above the grid downloaded all 24 MK1 module previews. ZIP integrity, PNG dimensions and manifest order passed independent inspection. MK1 Stage Gallery links to normalized module previews independently of the header-resource cards. See the [source pass and release handoff](docs/P11_MK1_STAGE_AND_BATCH_EXPORT_2026-11-05.md) for fixture identities, coverage and remaining browser gates. P11 stays on `develop`.

## P11 local consolidation verified — GitHub source import confirmed (2026-11-04)

- Local full-source P11 ZIP: `MK_DOS_Extractor_P11_Cumulative_Full_Source_2026-11-04.zip`, SHA-256 `7889917a4e8678c5e625f92a90b9ecb42ea80286a37358392a99d2578b7f00f4`. Not in GitHub.
- P11 cumulative original-MK2 fixture scan: **5,053 assets**, 40 cross-pass source/package checks plus 225 P10 integration checks and 61 independent O220/O221 checks. Independent P8 O210 and P9 O205 suites and cross-stage O195 regression also passed.
- Strictly filtered Git-safe source imports prepared: **P6 2,011 ZIP entries** (includes audit manifest), **P11 2,033 entries** (includes audit manifest and 4 interim patches). All application `src` and source scripts retained; original binary/extracted game media and raw evidence omitted with hashes documented. The P11 *filtered* source was re-tested successfully against the canonical local MK2 fixture.
- Import kit filename `MK_DOS_GitHub_Import_Kit_P6_to_P11_2026-11-04.zip`, SHA-256 `1dda3165ab6d71a110360690a59763492c23e3d080cd86d6b28ae8919bdfcd95`, available in the project conversation (not committed to GitHub).
- **GitHub import completed and directly verified:** `main` source commit `eb9691510ce57dd1a7670fcf404de0c0dbd6941b`; `develop` P11 source commit `65023df71d20eb049a571d6a0d1672d670cddf92`. GitHub file trees include 358 and 362 `src` files respectively, with 2,070 and 2,094 total tree entries (directories included). Expected P7–P10 and P11 scripts are present on `develop`. No tracked files matching reviewed commercial game/archive/media extensions were found in either GitHub tree. Fresh checkout builds, fixture reruns and UI verification remain pending.
- Browser build and interactive UI remain **validation pending**; no gameplay-stage assembly/palette/timing overclaims.

## P11 source regression update — 2026-11-04

**GitHub code identity and local source testing passed:** all **1,068** P6 source/test/tool files and **1,080** P11 source/test/tool files match their audited Git-safe ZIP snapshots via Git blob identity summaries. From clean ZIP extraction against the original local MK2 fixture, P6 passed **5,016 assets / 121 tests** and P11 passed **5,053 assets / 40 tests**. P10 integration **225**, P8 O210 independent **68**, P9 O205 independent **205**, and P10 O220/O221 independent **61** checks also passed, and all three regenerated P8–P10 ZIP hashes match reference.

**Release gate still open:** the ZIP import omitted root `package-lock.json`, so reproducible `npm ci` and the browser build are not qualified; dependencies are not cached and online installation stalled in this environment. Full browser UI inspection/export and MK1/MK3 regressions remain unverified. An old P8 standalone test hardcodes its interim 5,033 census; the proper P11 cumulative suite and independent P8 parity pass. See [the full validation record](docs/P11_GITHUB_SOURCE_REGRESSION_2026-11-04.md), [Issue #3](https://github.com/87otlto-coder/mk-dos-archive/issues/3) and [P11 release Issue #2](https://github.com/87otlto-coder/mk-dos-archive/issues/2).

## P11 production build and browser boot qualified — 2026-11-04

P11 `develop` now **passes GitHub Actions strict `npm ci`, Vite production build, full TypeScript check, source syntax check, and headless Chrome source-offline onboarding**. Verified run: [41920807431](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/41920807431). The compiled static artifact passed ZIP integrity checking; the original game binaries were not added to GitHub.

A reproducible **new npm 11-generated lockfile** is committed on `develop` (it differs from the archived original P11 lockfile, which remains in local custody). The older O198 Forest typing issue was corrected without any change to its deterministic forensic ZIP. Low-risk Asset Library navigation and independent-scroll changes were committed and built, with the original-MK2 **5,053 assets / 40 cumulative checks** preserved.

**Open at the November 4 checkpoint:** browser interactions with actual original game files, particularly Stage Gallery resource filters, asset previews and export, plus MK1/MK3 regression. Local browser navigation was blocked by this tool environment's Chromium administrator policy, which is not an application test failure. See [P11 build / browser QA record](docs/P11_BUILD_BROWSER_QA_2026-11-04.md) and [Issue #4](https://github.com/87otlto-coder/mk-dos-archive/issues/4). **P11 remains on `develop`; `main` stays P6.**

## Governing objective

The first major milestone is a sophisticated extractor for original DOS **MK1, MK2 and MK3**, capable of showing and exporting original resources with correct index pixels, palettes where evidenced, sprite/background animation groups, stage construction information, sound, speech and music. Investigate executable behavior only when it serves that extractor. Gameplay, control, combat and damage logic are not current work.

**Maintain the existing research workbench.** Do not simplify or separate source destructively. Consider an extractor-only copy/branch once coverage is mature enough.

## Verified source and development checkpoint

| Item | Status |
|---|---|
| Original frozen application source | O270 (2026-10-31) |
| Last *full source* checkpoint | **P6 committed on `main`; P11 consolidation candidate committed on `develop`** (2026-11-04) |
| P6 ZIP SHA-256 | `49cf14b72475189bcb8be53fe6ad1d11e4b145205b9e4012c4c2320235a7735e` |
| MK2 original EXE SHA-256 | `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` |
| P6 canonical MK2 headless scanner | **5,016 unique assets** |
| Most recent interim pass | **P10** |
| P10 cumulative MK2 headless scanner | **5,053 unique assets** |
| Next planned pass | **Real-game browser QA on local MK2/MK1/MK3; P11 promotion gate** |
| Browser / full React + Vite verification | **Build and onboarding passed; see current release gate above for fixture and browser results** |
| Full P6 app source uploaded to GitHub | **Yes — `main` source commit `eb96915`** |

The original P6 ZIP and unfiltered P11 archive remain in the project conversation. GitHub contains the **audited, Git-safe application and research source**, not commercial game installations or all raw forensic evidence. Verify fresh-clone source and runtime behavior before the final P11 promotion.

## P7–P10 cumulative work (headless and fixture verified)

| Pass | Asset improvement | MK2 census |
|---|---|---:|
| P6 | Consolidated P1–P5 | 5,016 |
| P7 | Five Living Forest source-local layers, index and provisional-color previews (+10) | 5,026 |
| P8 | Seven Pit II lower-wall/crack original graphics (+7) | 5,033 |
| P9 | Six Pit II upper-stage source-local background layers (+6) | 5,039 |
| P10 | Fourteen Pit II bridge-actor frames in two authenticated seven-frame source loops (+14) | **5,053** |

Keep confidence boundaries: source-local layers are **not** completed full stages; palette candidates are not runtime-confirmed DAC selection; source frame order and loop-backs do not imply known milliseconds or world placement.

**P10 tested:** 225 integration checks, 61 independent parity checks, original O221 mutation controls; exported 14 original frame records. Previous headless MK2 asset groups remained available. P7–P10 changes are consolidated in the local P11 full archive and the **GitHub `develop` source tree**, with all four interim patch files preserved. Independent browser/UI verification remains pending.

## Near-term next steps

1. Use the November 4 source comparison and November 5 fixture handoff as the baseline for release testing.
2. Complete the remaining interactive preview, inspector and download checks in Issue #4.
3. Record the tested game, source mode and exported payload for each gate.
4. Keep P11 on `develop` until release gates pass. At that point merge or fast-forward appropriately into `main`, document checkpoint hashes, and close relevant issues.
5. Review, but do not automatically prioritize, the deferred interface requests in [docs/UI_BACKLOG.md](docs/UI_BACKLOG.md).
6. Continue extractor-relevant research for MK1/MK2/MK3 after release validation, testing cross-stage mechanisms before generalization and avoiding gameplay reverse engineering.

## Scope discipline

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION.**

A verified source relationship is not automatically verified runtime timing, ownership or final scene composition. A research pass should contribute to extraction completeness, accuracy or usability; otherwise record the unknown and move on.

## Release conventions

- P6 = source checkpoint, **headless verified**.
- P7–P10 = headless-verified changes incorporated in the **P11 consolidated source on `develop`**.
- P11 = source imported and local headless-verified, **not promoted to `main` pending fresh-clone/browser gates**.
- Never describe code that is not actually committed to GitHub as “uploaded” or “tracked in GitHub.”

Update this file whenever the authoritative baseline or release status changes.
