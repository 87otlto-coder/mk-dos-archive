# MK DOS Archive — O182–O185 Portal original-effect visual runtime-test preflight

**2026-10-13. Authoritative source checkpoint: O185.** This continues O181, without altering the original game installation or assigning an unverified MK2 effect FPS, final draw positions or active stage objects. The immediate goal is to create a **visible, narrowly scoped and reversible** native runtime probe that a user can test in their own DOSBox environment. The game has **not** been executed in DOSBox during these passes.

## O182 — canonical two-track original Portal graphics index remap

- Inputs are the precise user's original `MK2.EXE` (861,133 bytes; SHA256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`), `PORTAL.GRA` (92,756 bytes; SHA256 `cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82`) and independently sourced O136 original frame manifest.
- Only `portal_swaying` 7 frames and `portal_hanging` 7 frames are touched. `portal_electric` all 6 frames remain untouched. Source descriptor offsets, geometry and GRA file IDs are checked directly against the original EXE before patch discovery.
- Exact original **palette-index remaps** are **55 -> 64** and **54 -> 63**. They change **4,633 opaque source pixels** across 14 frames. The remap requires exactly **4,110 physical byte differences** including original literal source bytes and original constant-color RLE command bytes. Run lengths, RLE command kinds, source frame ends, masks and total `.GRA` length remain identical.
- Full proposed edited-resource SHA256: `02afc72ba2a2bbab5da3c9eee2863d561fcb5c569ddb63eae631a7baac771ce7`. The untouched source is recovered exactly by reversal. No modified commercial `.GRA` is included in any release: only checked byte-delta metadata is published in the separate runtime-test kit.
- Source: `tools/mk2_o177/compile_o182_portal_visual_witness.py`; output `research_outputs/O182_REPORT.json` (only metadata and changed old/new bytes, not original graphic streams).

## O183 — independent source-byte, sprite geometry and mask check

- `tools/mk2_o177/verify_o183_portal_visual_witness_independent.py` independently parses original `.GRA` command words, EXE sprite descriptors and O136 manifests without importing the O182 compiler.
- **8,389 independent assertions passed**, including complete 4,110-byte patch accounting, re-decoding every changed frame, no electric-frame changes, exact edited GRA hash and original-resource restoration.
- `tools/mk2_o177/test_o183_portal_witness_adversarial.py`: **20 falsified input reports rejected**, including forged runtime certainty, frame geometry, hashes, changed-pixel counts, patch reordering/duplication, other-track edits, or incorrect resource identity.

## O184 — user-operable clone-only Windows DOSBox test kit

- Separate ZIP `MK2_O182_O185_PORTAL_BLUE_DOSBOX_TEST_KIT_2026-10-13.zip` contains `O182_PATCH.json` (byte deltas), `MAKE_TEST_COPY.cmd`, `Make-Test-Copy.ps1`, a source-only reference preview and instructions. **No game executable, resource or driver is distributed.**
- The launcher asks for, or accepts drag-and-drop of, an original MK2 installation folder. It verifies the original `MK2.EXE`, original `PORTAL.GRA`, and the exact patch JSON bytes via SHA256, then creates **a new sibling test installation folder**. If a destination with that name exists, it refuses to overwrite it. It applies changes **only to the copied `PORTAL.GRA`**, and verifies the full output hash before and after writing. The original game remains untouched.
- `tools/mk2_o177/verify_o184_test_copy_preflight.py`: **PASS** for a cross-platform clone-and-byte-delta model using real original resource bytes, including original/edited hashes and no-overwrite requirement.
- **Important limitation:** Actual Windows PowerShell 5.1 script execution, DOSBox launching, game asset use and gameplay appearance are **NOT VERIFIED** here. We cannot claim tested Windows UI behavior or a working blue figure in the game.

## O185 — source-palette preview evidence, not gameplay colors

- The original Portal electric frame includes source index 63 at RGB `(4,93,239)` and index 64 at RGB `(150,190,255)` in the authenticated O177 RGBA export. These colors are source-palette candidate values, not an independently measured live VGA palette.
- `tools/mk2_o177/verify_o185_portal_source_preview.py` checks the source-palette entries and all 14 indexed/RGBA frame mappings, verifying exactly **4,633 candidate RGB pixel changes**. Its report is `research_outputs/O185_REPORT.json`.
- `BEFORE_AFTER_SOURCE_PREVIEW.png` in the standalone kit is plainly marked as original-source reconstruction, **not DOSBox gameplay**. The candidate pale-blue / saturated-blue remap should be much more conspicuous than O179's one-pixel test if original rendering selects these same source colors.

## Overall verification and regression boundaries

- **O183: 8,389 independently checked assertions, 20 negative cases rejected.**
- **O184: portable clone model passed**; native Windows PowerShell unexecuted.
- **O185: source-index/RGBA consistency passed** on all 14 modified frames.
- Original O139–O175 Python regression suite rerun: **235/235 methods passed** on canonical `MK2.EXE` and original `RM.DRV`.
- No existing application `.ts` or `.tsx` implementation was changed in O182–O185, so the inherited O181 browser comparison evidence remains historically valid, **not newly rerun** here. Full React/Vite build remains unverified due to absent npm dependencies.
- The 24 inherited source-repository PNGs are checked byte-identical to O181 at release packaging.

## Runtime observation requested **only when user is ready**

1. Run the clone-only Windows test-kit script against the unmodified original MK2 directory, then run the **copied** game in DOSBox and visit the Portal stage.
2. Compare hanging/swaying figures with an **unmodified** game run. Save a short clip or screenshot, ideally plus any debugger mapping/logs if available.
3. A visible, altered in-game figure would establish the particular edited GRA reached a runtime renderer under that observed condition; it would **not** by itself establish frames-per-second or exact layer order.
4. An unchanged image is **inconclusive** without confirmation that the effect object was activated and present; the script, version, palette, trigger and selected stage may all matter.

Priority after the observation: derive runtime-specific object activation and timing using O175 source-relative breakpoints plus actual loaded mappings and observed task-counter/descriptor/presentation transitions. Continue MK2 extractor/compiler work first; MK1 and MK3 afterward; bot and enhanced wrapper deferred.
