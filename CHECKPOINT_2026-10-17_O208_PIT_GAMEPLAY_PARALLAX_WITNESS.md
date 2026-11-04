# O208 — Actual The Pit gameplay source-to-video verification

Date: 2026-10-17. **Research-only checkpoint.** Supersedes no O207 graphics claims and retains every O207 source file unchanged.

## Input identity

- Recording: `Recording 2026-10-17 140419.mp4`; duration **35.133s**, 30 fps, 638×426 capture. Native-game analysis viewport extracted and resampled to 320×200.
- Recording SHA-256: `3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94`.
- Original `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Original `PIT.GRA` SHA-256: `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96`.
- Stage is **The Pit**, not Kombat Tomb. The video shows original blue moonlit scenery matching `PIT.GRA`.

## Original-executable facts, retained from O206/O207

- Six authentic source-local graphics setups: 1 (1400×64), 2 (1400×768), 3 (832×24), 4 (376×120), 5 (504×120), 6 (320×120); O205 renderer independently decodes from original `PIT.GRA`.
- Mode-2 source root references all six setups; reduced root references 1, 2, 6. No runtime mode-byte witness has yet been collected.
- The setup source vertical values are `[182, 150, 150, 32, 130, 32]`.
- Renderer input values for setup 1–6 are `[1.5, 1.5, 0.375, 0.1875, 0.09375, 0]`, associated with channels `[7, 6, 5, 3, 2, 1]`.
- Ratios predicted from these input *values*: setup 2 vs setup 4 = **8:1**; this does not itself prove execution semantics.

## Independent recording observations

- **35 one-second-spaced video samples** analyzed (0.5 through 34.5 seconds); strict content hash and viewport checks.
- At the opening camera position the original setup 2 (bridge foreground) aligns at approximately row **147** and setups 4 (side rocks/bridge) and 6 (moon/clouds) at row **29**. Those are all three rows below their authenticated source vertical operands, a common capture-coordinate adjustment.
- Setup 4 was localized with ≥5 feature votes in **25** samples, directly supporting material absent from the reduced three-setup root.
- Relative vertical separation between setup 2 and setup 6 is **118** rows, source-predicted (150 − 32), and between setup 4 and setup 6 is **0** rows in **35** sampled moments with both matches.
- Jump sequences yield a shared **12-row** vertical displacement. Exact triggering and camera equations not recovered.

## Motion experiment (source-predicted ratios, NOT fitted ratios)

- First-frame anchors: setup 2 source X = −261, setup 4 source X = −30. Near setup pixels repeat every 280 source columns, so candidate near X positions are compared modulo that source motif, not claimed to be unique world coordinates.
- Models `0:1, 2:1, 4:1, 8:1, 12:1` were tested on the same original source/video feature matches.
- Across **15 moving samples** with ≥5 confident setup-4 correspondences, observed setup-2 feature votes under 8-pixel X and 2-pixel Y tolerance were: {'0': 262, '2': 285, '4': 25, '8': 3496, '12': 0}. The original **8:1** ratio wins. These are correlated feature votes, not independent trials.
- Independent **per-pixel** check on those 15 moving samples (single source-plane opaque pixels, fighters may occlude): mean RGB MAE /255 was {'0': 41.503661, '12': 42.603355, '2': 40.163364, '4': 42.589565, '8': 29.646542}. The source-derived 8:1 model wins on this distinct metric.

## Additional thin-layer control

The original source predicts setup 3 / setup 4 motion ratio 2:1 and setup 5 / setup 4 ratio 0.5:1. On the same 15 moving-frame samples, a single-layer RGB test favors **2:1 for setup 3** (17.49/255 versus 19.77–23.18 for tested alternatives). For **setup 5**, the lowest tested error is at 1:1 (12.10), not at the original source 0.5:1 candidate (12.68). This is **inconclusive**, given the small, low-texture translucent pixel plane, and does not disprove the original mechanism. Both fitted first-frame source X anchors are experimental. The separate script and report retain the negative result.

## Candidate visual reconstruction and its boundaries

- Candidate scene renders original decoded six source setups in assumed back-to-front order `[6,5,4,3,2,1]`, plus shared vertical camera offset and a motion model based on source ratio 8:1.
- Thin setups 3 and 5 use *visually fitted* initial horizontal anchors (−613, −284); they are not externally verified source positions. This is why reconstruction PNGs are **experimental illustrations**.
- Main fighters/HUD and small fighters on the far bridge are not part of the six recovered source setups. Source palette is EXE-linked and visually close, but no live DAC capture has proved the selected palette bank.
- The full-scene camera arithmetic, exact draw order, runtime stage-mode variable, and independently decoded animated distant fighters remain **open**.

## Replication

Use the supplied O208 script in `scripts/verify-o208-pit-gameplay-parallax.py` with the original `MK2.EXE`, `PIT.GRA`, recording, project source directory and a clean output directory. Then run `scripts/verify-o208-pit-pixel-models.py` and `scripts/verify-o208-pit-thin-layers.py` using the first output and recording. File hashes are checked before decoding; scripts never modify original inputs.

See `README_O208_PIT_GAMEPLAY.md` and the separate O208 forensic evidence package for all raw matches, PNGs, control scores and complete reports.
