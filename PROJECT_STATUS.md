# MK DOS Extractor — project status

**Last status reconciliation:** 2026-11-05
**Project:** ChatGPT Project “MK Dos Extractor”  
**GitHub:** https://github.com/87otlto-coder/mk-dos-archive

## P15 MK2 screenshot-witnessed packed floors — interim `develop` pass, 2026-11-05

**MK2 remains the development priority.** The P11 source checkpoint is preserved on `main`; P12–P15 are interim, recoverable changes on `develop`.

- **Canonical original MK2: 5,108 unique assets** (P11 5,053 + P12 intro 31 + P13 Mountain 15 + P14 native floor projections 7 + **P15 two screenshot-witnessed RGB floor previews**).
- **VERIFIED:** Original TOMB.GRA 320×48 floor at conditional source-left 291 and PORTAL.GRA 320×40 floor at conditional source-left 292, original index planes and bounded O115 screenshot colour mappings. O117 Tomb unmodified screenshot **12,222/12,222** disjoint holdout matches; O115B/O116 Portal original screenshot **4,420/4,420** qualified matches. These are **floor-only**, not full scenes.
- **Original fixture testing PASS:** independently pinned O115 witness JSON report hashes, original resource hashes and Python reference produce **28,160 exact source pixels**; P15 adapter/ZIP **28,244 focused checks**, **83 cumulative checks** with 5,108 unique assets; original P8/P9/P10 evidence ZIP SHA256 identities are unchanged. Private PNG ZIP readback verified every one of the 28,160 source/witnessed-RGB pixels and CRCs.
- **Important distinction:** observed screenshot RGB is *not* verified live DAC-bank ownership; the source-index and opacity masks are retained, while the **native palette-known masks remain zero**. No runtime camera, layer placement, animation timing or complete stage is inferred.
- **Git-safe P15 source and tests:** [P15 original MK2 witnessed-floor handoff](docs/EXTRACTOR_P15_MK2_SCREENSHOT_WITNESSED_PACKED_FLOORS.md). Browser build/TypeScript/Chrome CI and user in-app interactions are separate from original-file parity.
- **Development cadence:** P15 is the fourth interim pass; **P16 is the fifth-pass consolidation candidate**, not an automatic completed-product release. Preserve the research workbench and do not commit copyrighted game resources or screenshot-media captures.

## P14 MK2 native packed-floor viewport projections — interim `develop` pass, 2026-11-05

**P11 is still the stable `main` source checkpoint.** P12–P14 are recoverable interim source changes on `develop`; preserve all original research code and prior decoder paths.

- **Original MK2 assets: 5,106 unique** (P11 5,053 + P12 intro 31 + P13 Mountain 15 + **P14 seven native packed-stage floor viewport projections**). Every earlier registered source family remained discoverable.
- **Original-file O110C projection VERIFIED:** the seven native 896-column packed resource suffixes (`TOMB`, `BATTLE`, `TOWER`, `FOREST`, `ARMORY`, `PORTAL`, `ARENA.GRA`) each yield one original-source-backed **320 × source-row-count** viewport using exact neutral input x=288 and hypothetical palette-bank base 1. This is **NOT** a full 320×200 scene nor a verified live gameplay camera/palette.
- **Independent test evidence PASS:** original O110C producer and independent native DWORD/row verifier; **409,790 new focused pixel/metadata/ZIP/negative checks**, **102,400 PNG pixels independently redecoded** against exported indices and masks, **66 P14 cumulative checks**. The P8/P9/P10 forensic archive SHA-256 hashes stayed byte-identical to their source references.
- **Palette scope UNKNOWN:** grayscale is diagnostic numeric index values. Runtime RGB selection, palette ownership, camera placement, parallax and stage composition remain unqualified; source index/opacity/colour-known masks and provenance are retained in exports.
- The focused, reproducible handoff is [P14 MK2 packed-floor native viewport integration](docs/EXTRACTOR_P14_MK2_PACKED_FLOOR_NATIVE_VIEWPORTS.md). **Browser UI and CI are separate gates from source fixture verification.**

**Next:** P15 MK2-first, prioritize source-verified palette/placement joins or another reusable extractor improvement; avoid speculative scene assembly. Do not create a full source archive at every interim pass.

## P13 MK2 MOUNTAIN.GRA original indexed graphics — interim `develop` pass, 2026-11-05

**P11 remains the stable `main` checkpoint.** P12 and P13 are focused, recoverable interim changes on `develop`.

- **Original MK2 asset census: 5,099 unique assets** (P11 5,053 + P12 31 + P13 **15 original indexed MOUNTAIN.GRA graphics**). P13 source commit: [`9ea61f3`](https://github.com/87otlto-coder/mk-dos-archive/commit/9ea61f358a6c940cdb0462343a76131068183be5).
- **Source relationship VERIFIED:** 14 original 35×41 graphics are reached through source pointer table records, plus **one adjacent original 35×41 graphic not selected by that table**. All 15 native streams tile exactly the 23,024-byte original MOUNTAIN.GRA suffix. The 168,724-byte prefix remains outside this qualification.
- **Source-list interpretation VERIFIED / bounded:** six original conditional selection orders, five distinct, source token 14 aliases record 13. The selected runtime variant, object activation, coordinates, animation timing and stage identity are **UNKNOWN**.
- **Palette boundary:** original indices span 1–96; a direct unmodified 63-colour palette cannot represent them. The new previews are **diagnostic grayscale only**, never reconstructed runtime RGB. Source indices, paint masks and all-zero palette-known masks are available in the selected ZIP and a separate 15-image forensic package.
- **Original-file tests PASS:** 2,198 independent Python checks; 358 TypeScript adapter/export/negative-fixture parity checks; **57 P13 cumulative checks** at 5,099 assets. P8/P9/P10 source evidence ZIP hashes are unchanged. Focused P13 source ZIP SHA-256: `e7eabb5d6444d249b7b08a1197c7cc7767a8e70df668f661d5d0eff762d67c86`.
- **Production build and Chrome startup are a separate gate.** Source-binary parity and headless fixture tests do not prove P13 interactive browsing. See [P13 integration handoff](docs/EXTRACTOR_P13_MK2_MOUNTAIN_ORIGINAL_INDEXED_GRAPHICS.md).

Next pass should prioritize **reusable MK2 palette/placement attribution backed by original evidence**, or integrate another already independently qualified original graphical family if palette/placement cannot be proven without speculation. Do not spend time on gameplay mechanics unrelated to extraction.

## P12 MK2 intro LZW integration — interim `develop` pass, 2026-11-05

**P11 remains the stable checkpoint on `main`.** New P12 source was committed to `develop` at [`576d2d2`](https://github.com/87otlto-coder/mk-dos-archive/commit/576d2d28fea53ee5463bb5fd46b907d4f7b361b8). The previous P11 workbench and P7–P10 registrations are retained.

- **Original MK2 assets:** **5,084 unique** (P11 5,053 + **31 newly exposed original intro LZW frames**: 30 `PROBE.GRA`, one `ACCLAIM.GRA`). These are 320×200 indexed images, **not gameplay stage backgrounds**.
- **Independent original-binary evidence:** O110B and O110E independently qualified LZW source pixels and source DAC6 palette equations. New P12 targeted verifier passed **524 checks**, including exact independent index/conditional-colour/mask hashes, selected ZIP index/known-mask preservation and altered/missing/ambiguous negative fixtures.
- **P12 cumulative scanner:** **47 checks passed** against the canonical original MK2 fixture, all P7–P10 stage asset counts preserved, and historical P8/P9/P10 generated package SHA-256 values unchanged.
- **Interpretation boundary:** a diagnostic source-DAC6 colour preview does **not** establish runtime palette bank, actual index-zero colour, event timing, sprite placement or full stage composition. The exporter preserves original pixel indices plus explicit palette-known masks.
- The focused research and test record is [EXTRACTOR_P12_MK2_PROBE_ACCLAIM_LZW_INTEGRATION.md](docs/EXTRACTOR_P12_MK2_PROBE_ACCLAIM_LZW_INTEGRATION.md). **Production build/browser verification of P12 is separate from the completed original-fixture tests.**
- This is an **interim pass**, not a full source-package release and not a reason to move away from MK2.

## Current source checkpoint — P11 (2026-11-05)

**P11 is the stable source checkpoint on `main`**, promoted after GitHub CI, full MK2 cumulative regression and local user acceptance of all three game's asset previews and exports. Development continues on `develop` after this checkpoint; preserve the earlier P6 commit in Git history. See [P11 promotion / acceptance record](docs/P11_PROMOTION_2026-11-05.md).

- **Production / source:** GitHub Actions latest candidate `350b44a` passed locked `npm ci`, syntax, Vite build, TypeScript and Chrome startup.
- **MK2:** Original-fixture **5,053 unique assets / 40 checks**; independent P8–P10 pixel/package parity retained.
- **MK1:** Canonical fixture 24 normalized and 24 ordinary module backgrounds plus one moon PNG; a source-pass Chrome ZIP of 24 320×200 normalized modules was independently validated. `*HDRS.GRA` stage tiles are source candidates, **not full scene reconstructions**.
- **MK3:** Original-fixture 9,186 assets, including 416 images; none are yet established as stages.
- **User acceptance:** MK1/MK2/MK3 previews, Pit II Gallery navigation, requested Asset Library interaction and exports were confirmed in Windows. Exports are **USER-VERIFIED**, not every game/format permutation independently checksum-verified.
- **Known limitations:** Stage associations, full compositions and runtime palette/timing qualifications remain separate from P11 correctness. Additional optional browser/regression checks are in [Issue #5](https://github.com/87otlto-coder/mk-dos-archive/issues/5).

P11 source promotion is **not** a complete extractor product release; no original game binaries or extracted artwork are in GitHub.

## Historical P11 source-import record — 2026-11-04

The statements below describe the earlier November 4 release gate; the November 5 source checkpoint above supersedes their pending-build status.

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
| Last *full source* checkpoint | **P11 source checkpoint committed to `main`** (2026-11-05; earlier P6 preserved in Git history) |
| P6 ZIP SHA-256 | `49cf14b72475189bcb8be53fe6ad1d11e4b145205b9e4012c4c2320235a7735e` |
| MK2 original EXE SHA-256 | `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` |
| P6 canonical MK2 headless scanner | **5,016 unique assets** |
| Most recent interim pass | **P10** |
| P10 cumulative MK2 headless scanner | **5,053 unique assets** |
| Next planned pass | **P16 fifth-pass consolidation, MK2 cumulative regression and source checkpoint gate** |
| Browser / full React + Vite verification | **Build, onboarding, and user-tested core 3-game previews/exports passed; stage coverage incomplete** |
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

**P10 tested:** 225 integration checks, 61 independent parity checks, original O221 mutation controls; exported 14 original frame records. Previous headless MK2 asset groups remained available. P7–P10 changes are consolidated in the local P11 full archive and the **GitHub P11 source checkpoint**, with all four interim patch files preserved. Core Windows browser preview/export validation has since passed; detailed remaining QA is in Issue #5.

## Near-term next steps

1. Continue from the **P11 GitHub `main` checkpoint**, branching focused interim changes through `develop`. Always inspect committed source and the latest handoff before altering extraction code.
2. Prioritize extraction accuracy and completeness: verified MK1 normalized background access, MK3 stage-image provenance, palette/index preservation, and sound/music export usability.
3. Address only useful targeted UI and regression follow-ups in [Issue #5](https://github.com/87otlto-coder/mk-dos-archive/issues/5). User-confirmed export testing is not an open request.
4. Preserve original DOS binary fixtures offline; keep copyrighted assets out of GitHub and avoid speculative full-scene/timing/palette claims.
5. Return to the five-pass development cycle. Consolidate, independently regress and checkpoint after another meaningful series of extractor improvements; do not package full source every pass.

## Scope discipline

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION.**

A verified source relationship is not automatically verified runtime timing, ownership or final scene composition. A research pass should contribute to extraction completeness, accuracy or usability; otherwise record the unknown and move on.

## Release conventions

- P6 = source checkpoint, **headless verified**.
- P7–P10 = headless-verified changes incorporated in the **P11 consolidated source on `main`**.
- P11 = consolidated, GitHub CI qualified, source-fixture regressed and core-user-browser-verified **source checkpoint on `main`** (2026-11-05); not a claim of full stage reconstruction.
- Never describe code that is not actually committed to GitHub as “uploaded” or “tracked in GitHub.”

Update this file whenever the authoritative baseline or release status changes.
