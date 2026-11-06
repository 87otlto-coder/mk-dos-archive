# MK DOS Extractor — project status

**Last status reconciliation:** 2026-11-06
**Project:** ChatGPT Project “MK Dos Extractor”  
**GitHub:** https://github.com/87otlto-coder/mk-dos-archive

## P24 BATTLE images and duplicate descriptor provenance — interim develop pass, 2026-11-06

**Fresh MK2 collection: 5,205 unique representations**, adding **20 original BATTLE.GRA images from 40 descriptor witnesses**. Both byte-identical original records per image are retained in metadata, not counted as separate artwork. P24 is the third interim pass after P21; main remains P16.

- Original **[0,59436)** image prefix: **20 distinct intervals / 85,188 pixels**. The original **35,840-byte floor [59436,95276)** and all three previous BATTLE floor representations are preserved. No new palette, timing or stage-composition claim.
- **432 focused adapter/export checks**, **511,492 independent original-file PNG/sidecar/provenance checks**, eight source-negative cases and four valid-CRC false export/claim controls PASS. Removing a duplicate witness is rejected. Full current collection: **5,205 / 826 cumulative checks PASS**.
- **12 current MK2 suites PASS**, including CAVE/ARMORY parity and unchanged source ZIP hashes, seven older focused suites (**818,695 checks**) and original package identities. The native row decoder and prior adapters/research implementation remain unchanged.
- Local 369-file TypeScript syntax, typecheck and production build PASS. Runner defaults to `--through p24`. MK1/MK3 were explicitly not rerun; P21 results remain historical. Browser interaction remains **VALIDATION PENDING**; native palette/timing/placement/full scenes remain **UNKNOWN**.
- [P24 handoff](docs/EXTRACTOR_P24_MK2_BATTLE_DEDUPLICATED_IMAGES.md), [results](docs/validation/P24_BATTLE_REGRESSION_2026-11-06.json). Next: **P25 original ARENA descriptor coverage and qualified missing-image integration**. P26 is the next consolidation candidate; no main promotion or full-source release now.

## P23 original ARMORY.GRA image integration — interim develop pass, 2026-11-06

**Fresh MK2 collection: 5,185 unique representations**, adding **18 original ARMORY.GRA indexed images** to P22's 5,167. All three previous ARMORY floor records and raw floor bytes are preserved. P23 is the second interim pass after P21; main remains P16.

- Original eight-byte descriptor family: **18 images / 156,767 pixels**, exact **116,608-byte prefix [0,116608)**. The 59,904 remaining bytes lie outside this image-family claim; existing floors begin at 126336. No new palette, animation or stage-composition interpretation.
- **335 focused adapter/export checks**, **940,912 independent original-file PNG/sidecar checks**, eight negative input cases and three valid-CRC false export/claim controls PASS. Full collection: **5,185 / 734 cumulative checks PASS**.
- Native row decoding is shared only after independent CAVE/ARMORY repetition. CAVE's **862 checks** and original evidence ZIP hash remain unchanged. **11 current MK2 suites PASS**, retaining seven earlier focused suites (**818,695 checks**) and package identities.
- Local 368-file TypeScript syntax, typecheck and production build PASS. Current checkpoint runner defaults to `--through p23`. MK1/MK3 were explicitly not freshly rerun; P21 results remain historical. Browser interaction is **VALIDATION PENDING**; native palette, timing, placement and complete scenes remain **UNKNOWN**.
- [P23 handoff](docs/EXTRACTOR_P23_MK2_ARMORY_ORIGINAL_IMAGES.md), [results](docs/validation/P23_ARMORY_REGRESSION_2026-11-06.json). Next: **P24 BATTLE descriptor deduplication and qualified missing-image integration**. Keep develop work recoverable; no main promotion or full-source release.
- Committed P23 source **`a12dc75`** passed [CI 42287079604](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42287079604): strict install, syntax/media guard, Vite, TypeScript, source-offline Chrome and build upload. All sixteen changed/added file blobs verified, no removals or tracked game media. Main is unchanged.

## P22 original CAVE.GRA image integration — interim develop pass, 2026-11-06

**Fresh MK2 collection: 5,167 unique representations**, adding **49 original CAVE.GRA indexed images** to P21's 5,118. The source-backed family was absent from the registry. P21 remains the consolidated develop checkpoint; main remains P16.

- Native eight-byte descriptor geometry and original index/opacity data: **49 images / 49,765 pixels**, exact **57,192-byte suffix [120,57312)**. The first 120 bytes remain outside image qualification. Diagnostic grayscale is not an original palette; table order is not animation order.
- **862 focused adapter/export checks**, **299,427 independent original-file PNG/sidecar checks**, eight source-negative cases and three re-CRC'd false export/claim controls PASS. Full current collection: **5,167 / 689 cumulative checks PASS**. All seven earlier focused suites (**818,695 checks**) and original package identities are retained.
- Current checkpoint runner defaults to P22 and accepts `--through p22`; **10 MK2 suites PASS**. Optional MK1/MK3 were explicitly not rerun this pass; their P21 evidence remains valid historical evidence. TypeScript, 366-file syntax and production build PASS locally.
- New images use existing Asset Library preview/PNG/selected-ZIP workflows; Coverage & evidence includes the 49-image source bundle. Actual original-data browser interaction remains **VALIDATION PENDING**. Runtime palette, stage ownership, placement, native timing and full scenes remain **UNKNOWN**.
- [P22 handoff](docs/EXTRACTOR_P22_MK2_CAVE_ORIGINAL_IMAGES.md), [results](docs/validation/P22_CAVE_REGRESSION_2026-11-06.json). Next: **P23 original ARMORY descriptor coverage audit and qualified missing-image integration**. No main promotion or full-source release.
- Committed P22 source **`2272c00`** passed [CI 42285496421](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42285496421), including strict install, build, TypeScript, syntax/media guard and source-offline Chrome startup. All 14 changed/added file blobs verified; no removals or tracked game media.

## P21 fifth-pass source consolidation — develop checkpoint, 2026-11-06

**P21 is the current consolidated source checkpoint on develop; main remains P16.** P17–P20 are preserved together. No decoder/research implementation, asset count, or runtime interpretation changed. Full checkpoint: [P21 handoff](docs/EXTRACTOR_P21_SOURCE_CHECKPOINT_2026-11-06.md).

- New repeatable checkpoint runner: **11 suites PASS**, including MK2 input identity, full **5,118 unique assets / 536 cumulative checks**, all seven focused P12–P19 suites (**818,695 checks**), and MK1/MK3 compatibility. Invalid input fails closed and writes FAIL.
- **MK1 fresh regression:** **2,656 assets** (2,363 sprites, 244 audio, 49 stage PNGs), **2,615 checks PASS**. All 49 stage PNG exports read back against collection pixels; 24 normalized module previews retained.
- **MK3 fresh regression:** **9,186 assets** (6,654 sprites, 1,046 raw, 1,024 audio, 416 images, 46 music), **7,110 checks PASS**. Ten representative exports across all five kinds preserve payloads/order/sidecars. No new stage ownership inferred.
- P20 parent complete source tree: **2,085 blobs / 369 src files**, no reviewed commercial-game/media/archive extensions. P21 retains the full workbench and adds test/CI/docs only.
- P21 committed candidate **`2d7410b`**: **2,089 tracked files**, all 369 src files unchanged, no removals or reviewed game-media paths. [CI 42283644918](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42283644918) **PASS**: strict install, syntax/media guard, Vite, TypeScript, Chrome source-offline startup and build upload. Main is unchanged.
- Browser interaction with original P12–P19 data remains **VALIDATION PENDING**; source-offline CI is separate. Fresh MK2 ZIP hash/re-extraction remains unverified; existing extracted fixture identity is qualified as recorded in P20. Runtime palette, native timing and complete stage composition remain **UNKNOWN**.
- [Machine-readable P21 results](docs/validation/P21_CHECKPOINT_REGRESSION_2026-11-06.json). Next: **P22 MK2 coverage reconciliation and one evidence-backed missing-family integration**. No main promotion in this continuation.

## P20 full current-source MK2 cumulative regression — interim `develop` pass, 2026-11-06

**Freshly VERIFIED: 5,118 asset representations / 5,118 unique IDs** from the existing original MK2 extracted fixture on the complete P16–P19 source at `17af1a5`. The earlier P17–P19 cumulative validation gap is closed; P16 remains on `main` and P21 is not started.

- New reproducible P20 cumulative gate: **536 checks PASS**, including retained P15 export/archive checks, P17 mosaics and all eight P19 source-order queues / 57 original frames, with exact exported index/opacity parity. Existing P18 default full-source gate: **40 checks PASS / 5,118**.
- Seven focused P12–P19 suites freshly passed **818,695 checks**. Historical P8–P10 and P13–P15 evidence ZIP hashes are unchanged. No extractor implementation failure or decoder change was needed; research functionality is preserved.
- Original extracted input: **614-file census / 13 critical resource hashes / 642 identity checks PASS**. Fresh attached ZIP download failed with DNS, so its archive-level hash/re-extraction was **not rerun in this continuation**. See the explicit input confidence boundary in the handoff.
- Local 365-file source syntax, TypeScript and production build PASS. Browser clicking with original game data remains **VALIDATION PENDING**; native palette ownership, timing and final stage composition remain **UNKNOWN**. No new MK1/MK3 fixture regression is claimed.
- Committed P20 candidate `504cb05` passed [GitHub CI 42281991079](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42281991079): strict locked install, syntax/media guard, production build, TypeScript, source-offline Chrome startup and build upload. Verifier and evidence are recoverably committed on `develop`.
- [P20 handoff](docs/EXTRACTOR_P20_MK2_FULL_CUMULATIVE_REGRESSION.md) and [machine-readable results](docs/validation/P20_MK2_REGRESSION_2026-11-06.json). Keep changes on `develop`; no promotion or P21 consolidation.

## P19 MK2 direct source-order animation preview — interim `develop` pass, 2026-11-06

**P16 remains the stable main checkpoint.** P19 is the third MK2-first interim improvement, extending P18's eight original source-order animation groups into a one-click user presentation workflow. It adds no new extracted asset records and makes no new native timing or palette claims.

- **Practical usability:** Each P18 contact sheet now offers **Load verified source order into animation queue** in Asset Library Inspect. The existing Preview chain, APNG, sprite-sheet and selected ZIP tools work directly with the **57 existing original frames across eight verified source groups**; original frame order, original loop/end markers and source provenance are preserved.
- **Explicit timing boundary:** Preview/APNG interval is **user-selected**, not native MK2 milliseconds/FPS. The generic APNG presentation loops *even original zero-terminated* source lists; this is clearly marked as convenience, not original playback scheduling. Native runtime palette-bank selection, actor placement and trigger/timing remain **UNKNOWN**.
- **Original-fixture focused checks PASS:** **280 P19 checks** on all eight authentic O136/O177 and O220/O221 source groups, queue integrity, selected ZIP sidecars, APNG 137 ms user interval and negative source-list controls. Independently reran P18 original binary parity **379,422 checks PASS**.
- **Compatibility rerun PASS:** preserved P11+P17+P18 source with P19's no-census-change UI/helper: **5,063 original MK2 asset representations / 32 checks**, P8–P10 evidence ZIP hashes unchanged. **The full current P16+P17+P18+P19 total is expected to remain 5,118, NOT freshly verified**; the local compatibility source lacks P12–P15 adapters and is not a substitute for a full current-source regression.
- **GitHub CI VERIFIED:** [P19 source build 42277356338](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42277356338) **PASS** on committed code `4844a84` (strict npm install, source syntax, media guard, Vite production, TypeScript, headless Chrome source-offline boot, static build artifact). User MK2 in-browser clicking the new queue action still **VALIDATION PENDING**.
- **Handoff:** [P19 source-order presentation queue](docs/EXTRACTOR_P19_MK2_SOURCE_ORDER_TO_PRESENTATION_QUEUE.md). Keep P16 unchanged on main, original DOS game binaries/artwork outside GitHub, and research workbench untouched.

P20 should prioritize closure of the full current-source original-fixture cumulative scan and further MK2 extraction completeness. P21 is the next fifth-pass consolidation candidate only if verified.

## P18 MK2 original source-ordered animation ZIPs — interim `develop` pass, 2026-11-06

**P16 remains the stable `main` checkpoint.** P18 is the second MK2-first interim pass after P16. It applies verified O136/O177 (43 stage effect frames in six lists) and O220/O221 (14 Pit II bridge sprites in two seven-frame lists) to a practical export workflow.

- **Eight original-list contact-sheet previews plus eight directly downloadable source-ordered frame ZIPs** now group **57 existing original indexed frames**. Each frame ZIP includes independent original PNGs, indexed planes, transparency masks, a versioned source list/control manifest and explicitly unknown timing. Contact-sheet cell spacing is diagnostic, **NOT** source world placement.
- **VERIFIED original-fixture tests:** P18 focused adapter/export parity **379,422 checks PASS**, including 63,112 exact source-frame pixel-cell comparisons, independent eight-contact-sheet PNG readback, original frame ZIP byte/index/mask parity and negative source order/loop/timing controls.
- **VALIDATED compatibility only:** original MK2 original-fixture scan on frozen P11 + P17 + P18 **5,063 assets / 32 checks PASS**, P8–P10 source ZIP hashes unchanged. The latest P16+P17+P18 cumulative is **EXPECTED 5,118** but **VALIDATION PENDING**. Reproduce through `scripts/verify-mk2-p18-cumulative.cjs` in the complete current source; the `--p11-p17-baseline` option is deliberately not this full gate.
- **No speculative animation:** original source loop/zero-end markers and frame order are retained. Live DAC palette ownership, native millisecond timing, frame activation, layer composition, cameras and screen placement are unknown. Original indexed frames remain unchanged.
- **CI VERIFIED:** [P18 GitHub Actions 42273807258](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42273807258) passed for committed extractor source `6c4cd8e`: strict npm install, syntax, Git-safe-media guard, Vite, TypeScript, headless Chrome source-offline onboarding and build artifact upload. This is **not** a full original-game Chrome interaction test.
- **Handoff:** [P18 source-ordered animation export integration](docs/EXTRACTOR_P18_MK2_SOURCE_ORDERED_SEQUENCE_EXPORTS.md). GitHub build/TypeScript/Chrome verification and user in-app action checks are separate from original binary parity.

Continue MK2-first in P19. Do not promote P18 to `main`, issue a full source archive, or alter original copyrighted assets during an interim pass.

## P17 MK2 original IMAGES.GRA indexed setup-local mosaics — interim `develop` pass, 2026-11-06

**P16 remains the stable `main` source checkpoint.** P17 is a narrow, additive MK2 extractor improvement applying the independently original-file-verified O121/O122 research; it does not modify the research workbench.

- **Two newly exposed 320 × 200 original source-local indexed composites** from `IMAGES.GRA` Object-2 setups `0x2E7E4` and `0x2E720`, each using ten 64 × 100 original tiles. Their twenty original indexed streams form one exact, gapless `IMAGES.GRA [351472,460192)` chain.
- **VALIDATED:** independently reran the original O122 Python producer, which found all ten original setup mosaics and supplied SHA-256 goldens for both newly integrated index/opacity planes. New P17 TypeScript focused parity, selected ZIP mask exports and eight mutation/missing/synthetic controls: **77 checks PASS**.
- **VALIDATED on frozen P11 source plus P17:** canonical original-fixture full scan **5,055 unique assets / 28 compatibility checks PASS**, with unchanged P8–P10 original evidence ZIP hashes. This confirms source additive behaviour but is **not** the complete current P16+P17 regression.
- **EXPECTED, VALIDATION PENDING:** current P16 was previously 5,108 original MK2 asset representations; P17 should yield **5,110**, but the full P16+P17 cumulative scanner has **not been rerun** in this pass. `scripts/verify-mk2-p17-cumulative.cjs` provides the current full-source gate and an explicit `--p11-baseline` diagnostic mode.
- **No runtime palette inference:** source family labels `tomb79`/`portal79` refer to unverified alternative 79-colour setups, **not authenticated arena identity or native DAC selection**. Previews show diagnostic index-value grayscale; source `indices`, opacity and all-zero native palette-known masks are preserved. No final stage composition, activation, draw order or timing is claimed.
- **Source handoff:** [P17 original unassigned indexed mosaic integration](docs/EXTRACTOR_P17_MK2_UNASSIGNED_IMAGES_SETUP_MOSAICS.md). Source/browser build verification is separate from original-file parity.

Continue MK2-first in P18; preserve P16 `main`, commercial game files remain outside GitHub, and return to a consolidation gate after further verified interim passes.

## Current P16 consolidated source checkpoint — 2026-11-06

**P16 is the stable Git-safe source checkpoint on main**, superseding P11 after four additive MK2 extractor passes (P12–P15). The existing research workbench, original indices/masks, fixture provenance and earlier Git history remain preserved. Read the [P16 full source checkpoint and test record](docs/EXTRACTOR_P16_CUMULATIVE_CHECKPOINT_2026-11-06.md).

- **MK2 source extraction:** **5,108 unique original-fixture asset representations**, P15 83 cumulative checks passed in the prior pass, versus P11 5,053 / 40. P12 added 31 intro images; P13 added 15 Mountain graphics; P14 added seven neutral source-floor projections; P15 added two screenshot-witnessed Tomb/Portal floor previews.
- **P16 independent tests:** canonical DOS original ZIP plus **13 critical resource hashes and full 614-file census: 643 input-identity checks PASS**; source-preserving P11 baseline original-fixture rerun **5,053 / 40 PASS**, with identical P8–P10 evidence ZIP hashes.
- **Code/CI:** no P16 decoder changes; consolidated source candidate **70fb677** passed locked npm installation, syntax, Git-safe tracked-media audit, Vite build, TypeScript and headless Chrome startup in [P16 CI run 42261497116](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42261497116). CI now builds source on both main and develop.
- **Test confidence boundary:** the full 5,108 / 83 P15 scanner was **not freshly rerun in P16**; its prior original-fixture results and successful source-build evidence remain valid since P16 changes only audit/CI/docs. Real-game P12–P15 Asset Library browser interaction is not yet separately verified.
- **Incomplete extraction:** no claim that the 55 additions are complete stage scenes; runtime palette ownership, live camera mapping, final stage composition and native animation timing remain unknown or conditional. The original MK1/MK3 coverage limitations remain unchanged.

No commercial game files, indexed artwork, original audio or screenshot captures are committed to GitHub. Next focus remains **MK2 extraction completeness** in P17.

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

## Historical P11 stable source checkpoint — 2026-11-05

**Historical November 5 state:** P11 was promoted to `main` after GitHub CI, full MK2 cumulative regression and local user acceptance of all three game's asset previews and exports. Development continues on `develop` after this checkpoint; preserve the earlier P6 commit in Git history. See [P11 promotion / acceptance record](docs/P11_PROMOTION_2026-11-05.md).

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
| Last *full source* checkpoint | **P21 consolidated on develop; P16 accepted on main** (2026-11-06; prior checkpoints preserved) |
| P6 ZIP SHA-256 | `49cf14b72475189bcb8be53fe6ad1d11e4b145205b9e4012c4c2320235a7735e` |
| MK2 original EXE SHA-256 | `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` |
| P6 canonical MK2 headless scanner | **5,016 unique assets** |
| Most recent interim pass | **P24** after P21 develop consolidation |
| Latest full MK2 original-fixture cumulative result | **P24: 5,205 unique assets / 826 cumulative checks**, plus earlier suites and CAVE/ARMORY/BATTLE parity |
| Next planned pass | **P25 ARENA descriptor coverage and qualified missing-image integration** |
| Browser / full React + Vite verification | **Build, onboarding, and user-tested core 3-game previews/exports passed; stage coverage incomplete** |
| Full Git-safe source tracked on GitHub | **Yes — current main P16; P6 and P11 retained in history** |

The original P6 ZIP and unfiltered P11 archive remain in the project conversation. GitHub contains the **audited, Git-safe application and research source**, not commercial game installations or all raw forensic evidence. P11 was promoted on November 5; P16 source checkpoint preserves the P11 baseline and adds source-only pass evidence.

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

1. Begin P25 from committed P24 on develop; verify its handoff and preserve the P21 checkpoint.
2. Remain MK2-first: audit ARENA descriptor coverage before exposing independently verified missing originals. Preserve native floors, descriptor witnesses, source indices and uncertainty labels; do not inflate image counts from duplicate witnesses.
3. Use `scripts/verify-p21-checkpoint.cjs --through p24` for the current fixture gate. Historical P20/P21 scripts retain their frozen census; input identity alone does not prove decoder correctness.
4. Keep native timing, live palette ownership, full stage assembly and real-data browser interaction separately qualified. Existing UI follow-up remains [Issue #5](https://github.com/87otlto-coder/mk-dos-archive/issues/5).
5. Preserve the full research workbench and commercial-media exclusion. Accumulate four recoverable interim passes, then assess the next fifth-pass checkpoint. Main promotion requires separate acceptance; P21 does not promote automatically.

## Scope discipline

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION.**

A verified source relationship is not automatically verified runtime timing, ownership or final scene composition. A research pass should contribute to extraction completeness, accuracy or usability; otherwise record the unknown and move on.

## Release conventions

- P6 = source checkpoint, **headless verified**.
- P7–P10 = headless-verified changes incorporated in the **P11 consolidated source on `main`**.
- P11 = consolidated, GitHub CI qualified, source-fixture regressed and core-user-browser-verified **source checkpoint on `main`** (2026-11-05); not a claim of full stage reconstruction.
- P12–P15 = original-fixture-tested additive MK2 extraction passes, consolidated in **P16 Git-safe source checkpoint on main (2026-11-06)**. P16 itself has no decoder changes; its fresh fixture checks cover input identity and P11 baseline. New-asset browser interaction remains validation pending.
- Never describe code that is not actually committed to GitHub as “uploaded” or “tracked in GitHub.”

Update this file whenever the authoritative baseline or release status changes.
