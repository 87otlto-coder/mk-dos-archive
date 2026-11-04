# O196 — MK2 Forest original packed floor and source-linked palette candidate

**Date:** 2026-10-15. **Predecessor:** O195 cross-stage floor-control experiment. **Status:** 28,672 source pixels and original Forest setup/palette-pointer relationships authenticated against user-supplied original resources; colored rendering is a static source-linked **candidate**, not verified live gameplay output.

## First authenticated Forest visual-source result

The canonical `FOREST.GRA`, SHA-256 `8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9`, contains an **uncropped, native 896×32-pixel packed floor** at byte offset **198,116 (`0x305E4`)**, occupying all 28,672 final resource bytes. Its plane SHA-256 is `04b8d6b67c89d83aa2514edd0107690e0812f399da2f32f2e60367c3fad5b688`. The source histogram contains **37** unique index values, ranging **2–76**. No index-zero assumption or palette interpolation is necessary. Original Forest renderer configuration 4, resource ID 27, physically located source command `0xB795C`, Y=172/rows=32, and the packed suffix pointer were previously established by O131/O195.

The original canonical `MK2.EXE` (SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`) holds a **counted 80-word Forest-associated palette source record at physical `0x89324`**, record SHA-256 `d1f3800877bb1556784b284ecdef9eefb723488f5cd526f05ff153ea462b864f`. All eight pointers in Object-2 table `0x171D0`, including **slot 2 at `0x171D8`**, have authenticated original typed LE relocations to Object-1 record `0x89324 - 0x61C54`. The pointer table is linked from five authenticated Forest setup structures: `0x16F8C`, `0x16F9E`, `0x16FB0`, `0x16FC2`, `0x16FD4`. These contain **18, 10, 13, 15, and 4** control records respectively (**60** total), every one selecting palette slot 2 and resolving original graphics descriptors to **resource ID 27, FOREST.GRA**. The setup association is stronger source evidence than borrowing Portal colors; it does NOT observe the selected live DOSBox palette bank/handle nor prove the exact packed-floor RGB presentation.

The source-linked *candidate* RGB8 image applies the original O118/O71 DAC6 conversion of each word, using index N -> counted palette word N−1 and bit replication `(v << 2) | (v >> 4)`. The render is visually useful but its coloring **must remain candidate-qualified** until an independently matched original-game screenshot, live palette trace, or controlled runtime palette-edit perturbation verifies that mapping on the displayed Forest floor. Pixel source geometry and color-source provenance are stored separately.

## Implementation

- `src/core/experiments/o196.ts`: read-only, original SHA-256-guarded Forest source extraction; O195/O131 renderer cross-check; five Forest setup pointer/control/descriptor checks; palette candidate; byte-accurate histogram; deterministic PNG and forensic ZIP export.
- `src/components/O196ForestFloorWorkbench.tsx`: Laboratory viewer with source-linked color and original-index visualization, 896-wide uncropped view, exact source record information, expandable evidence and export.
- `src/components/O194Workbench.tsx`: integrates Forest tool above existing cross-stage O195 hypothesis (both preserved).
- `scripts/verify-o196-fixture.cjs`: browser TS fixture bridge, source-index hash/length, 5× setup/control validation, color/ZIP output, tampered EXE/GRA, missing/duplicate-resource rejection.
- `scripts/verify-o196-export.py`: independent standard-library verifier reparsing original DOS LE relocation records and pixel-by-pixel validating the two browser-generated PNGs and export package. Uses original user fixture, not imported TS code.
- `package.json`, `src/appMetadata.ts`, research index/document mirror updated for new checkpoint. No preexisting MK1/MK2 research-engine files modified.

**Forensic ZIP** includes original 28,672-byte raw source index plane; full native candidate-color RGBA PNG and grayscale index PNG; 80 source palette words and candidate RGB; 60 control descriptor links; source offsets/hashes; original source histogram; limitations and reproduction instructions. This downloadable *derived-asset research package* contains source-derived pixels but no complete original commercial EXE/GRA. The project's development-source ZIP contains no game files or derived-asset bundle.

## Verification executed

1. `node scripts/verify-o196-fixture.cjs <original-MK2-folder>`: **PASS** all original source identities, 28,672 indices, five setup records/60 controls, 80 words, 37-bin histogram, forensic ZIP, and deliberately altered/missing/duplicate input rejection.
2. `python scripts/verify-o196-export.py <original-MK2-folder> <evidence ZIP>`: **PASS**, independently reparses **27,004 relocation entries** (26,994 unique source locations) and validates every Forest pointer, control record, color word, index byte and PNG pixel.
3. O195 original MK2 regression **PASS** (seven authentic streams/77 tokens); O194 original MK2 regression **PASS** (43 original stage-effect frames; strict altered Portal rejection). UI foundation structural checks **PASS** (407 inherited checks prior to archive refresh).
4. Full Vite/React browser build **unverified**: dependency cache lacks `yallist-3.1.1.tgz` and npm install is unavailable here; source-level syntax and fixture checks do not substitute for a real compiled/live UI test.
5. Byte-for-byte source preservation audit against complete O195 release accompanies O196. Original game fixtures were staged only for tests and are excluded from source ZIP.

## Next research target

Cross-check the Forest candidate palette against a controlled Forest runtime screenshot or a reversible palette-record perturbation using a DOSBox test kit. Then investigate the **five Forest source-backed setup variants** for independent foreground/background layers (keeping setup-local sizes and descriptors distinct) and compare their native pixels against runtime observations. Do not collapse hypotheses into verified scene placement, parallax, FPS or palette selection. No additional user gameplay capture is required for the static findings above.
