# MK DOS Extractor — P16 fifth-pass MK2 source consolidation

**Date:** 6 November 2026
**Baseline:** P11 verified main source commit 44cd1264902b8a11a9ed42ffbecddceb2ed1b94d
**Source candidate (CI-qualified):** 70fb67700bc53b2253f952c76810ea35ae4514c7
**Classification:** stable Git-safe source checkpoint after the four focused P12–P15 passes; NOT a completed three-game extractor product or a claim of authentic complete stage scenes.

## Scope and outcome

P16 adds no graphics decoder or asset reinterpretation. Its substantive changes are a **read-only canonical-MK2 original-input hash audit**, a **Git-safe-media CI safeguard**, reusable CI builds for both develop and main, and checkpoint documentation. The P12–P15 decoder and research-workbench source remains unmodified at consolidation.

| Pass | Authentic extraction improvement | Cumulative MK2 assets | Original-fixture cumulative checks |
|---|---|---:|---:|
| P11 | Prior MK2 source checkpoint | 5,053 | 40 |
| P12 | 30 PROBE.GRA plus one ACCLAIM.GRA native indexed intro frames | 5,084 | 47 |
| P13 | 15 native MOUNTAIN.GRA object images; 14 selected and one adjacent unselected | 5,099 | 57 |
| P14 | Seven source-neutral 320-column stage floor viewport projections | 5,106 | 66 |
| P15 | Two screenshot-witnessed Tomb/Portal floor-only RGB previews | **5,108** | **83** |

**Net after P11: 55 representations, all additive.** These are *not* 55 new reconstructed arenas, and counts are not a guarantee of source-resource exhaustion.

## New, directly reproduced P16 checks

1. **Original MK2 ZIP canonical SHA-256** b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2. Canonical original EXE SHA-256 fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65.
2. Original source identity audit: **643 checks PASS** on the canonical ZIP, authenticating **614 case-insensitive-unique source files**, original extension distribution (124 GRA, 312 U8, 165 music-sequence files, 13 other), and **13** source hashes covering EXE, Pit/Fall, seven packed floor families, Probe, Acclaim and Mountain. Extracted-directory mode PASS; one deliberately invalid archive was correctly rejected. Reproducible with **scripts/verify-mk2-p16-fixture-identity.py**; it stores no extracted pixels.
3. Independent P11 baseline headless original-fixture rerun: **5,053 unique assets / 40 checks PASS**. P8/P9/P10 output-archive SHA-256s remain 7832bae102ab952024f8fa2b48f86379d5a519f2302491757027b4568654bdd5, 25abe08f1471a46c9e205bed3693559499afd7b0893bd277c5c51130769f652d and 6aedb63e4b974468c64a2a80afc4270be0815d716fa265cee21278b612ddf79c. P11 result JSON SHA-256 1156178026c7c7cee0c765553e2ca6d6b3e125f0c97add33b4a7443abc01dd90; P16 ZIP input audit JSON SHA-256 267dec5c66348cba9cd63494ff7266fed6c2762e34402b054a81a6430547eb7a. Neither private report nor original game bytes is committed.
4. GitHub comparison against P11 main verified 6 prior source/doc commits plus two P16 CI commits: 27 changed paths before this documentation commit, source/fixture-hash/test/docs/workflow only; no deleted source and no commercial media. Full develop tree at candidate contained **2,069 tracked file blobs**, including **366 source files under src**, **zero** tracked game/media extensions and no node_modules, dist or cache files.
5. **New consolidated CI PASS:** [GitHub Actions 42261497116](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42261497116) on candidate 70fb677. Strict npm 11 / committed lockfile install, source syntax, Git-safe guard, production Vite, TypeScript, Chrome source-offline React startup and static artifact upload all succeeded. The earlier P16 workflow-generation syntax failure was corrected by commit 70fb677 and is not counted as a successful run.

## Previously verified interim evidence (NOT newly rerun P16)

- P12: 524 focused checks, original MK2 5,084 / 47; [P12 CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42109053558).
- P13: 358 focused checks plus 2,198 independently generated original-file checks; original MK2 5,099 / 57; [P13 CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42111392423).
- P14: 409,790 focused checks and independently redecoded 102,400 PNG pixels; original MK2 5,106 / 66; [P14 CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42115022779).
- P15: 28,244 focused checks, exact PNG source/screenshot conditional-colour readback for 28,160 pixels and original MK2 **5,108 / 83**, with P8–P10 archive hashes unchanged; [P15 CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42118510997).

**Important testing boundary:** The full P15 5,108-asset scanner was **not rerun independently in this P16 session**. P16 confidence in the P15 total rests on the previously completed P15 canonical fixture run and no subsequent decoder/runtime change. The new P16 test is input identity, and the independently rerun P11 test is baseline preservation. The source-offline GitHub Chrome smoke does not claim to exercise new P12–P15 assets in a Windows browser.

## Interpretation and release boundaries

- **VERIFIED:** P12 native intro indexed pixels/source masks and qualified conditional source DAC6 conversion; P13 native Mountain images and source list relationships; P14 source-neutral floor projection input; P15 original Tomb/Portal indices and bounded DOSBox screenshot-witnessed colours; historical P15 source/ZIP parity as recorded in corresponding handoffs.
- **USER-VERIFIED:** P11 all-three-game Asset Library preview and export workflow. **VALIDATION PENDING** for user-level browsing of individual P12–P15 graphical additions.
- **UNKNOWN:** Mountain runtime RGB, actual runtime stage palette-bank ownership, camera transforms/placement, final stage compositions, original frame durations, broader background stage relationships. Source-left positions and neutral projection settings must not be described as observed live camera registers. Two Tomb/Portal screenshot RGB previews do not resolve live DAC ownership; native palette-known masks remain zero.
- **P16 is a stable SOURCE checkpoint only.** It does not supersede the commercial original DOS files, original immutable evidence, or the private full-source recovery archive. The GitHub source tree is the durable complete Git-safe application/research checkpoint; original game assets and local raw evidence remain outside GitHub.

## Next development cycle

Return to **MK2-first** work in P17. Prioritize extractor-completeness improvements from existing verified research: realistic stage layer/source composition where source placement and palette are independently grounded, additional original animation grouping and sound/music fidelity where it materially increases usable exports. Favor reusable mechanisms over speculative scene naming or unrelated gameplay reverse engineering. Repeat the five-pass interim/consolidation cadence. Preserve the existing forensic research workbench.
