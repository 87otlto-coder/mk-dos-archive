# MK DOS Archive O210 — The Pit II fatality lower-environment source matching

**Status:** High-confidence visual reconstruction of the fatality's two lower-area backgrounds and two key character poses. Not a complete original game renderer, fatality dispatcher, palette register trace, or byte-perfect animation sequence.

**Inputs:** Original owner-supplied DOS MK2 game ZIP (`MK2.EXE`, `FALL.GRA`) and original owner-recorded DOSBox clip `Recording 2026-10-17 151933.mp4`. No binary has been patched, and the hotkey helper from O209.2 was not used.

## Source facts

- The DOS executable contains 61 source-linked `FALL.GRA` graphics with original resource ID `0x7B` (123). Their packed-draw streams tile all **250,804 bytes** without overlaps or gaps. First 54 descriptor structures begin at physical `0xC39B8` with 12-byte stride; graphics 54–60 use the 16-byte structures beginning `0xC3C40`. The independent O210 reproducer validates original pointer values, bounds, and row-accurate drawing commands.
- Graphics 0–53 consist principally of original falling-character graphics. Graphic 54 is an original rock/crack-themed masked graphic, but its active compositing path and coordinates remain unresolved. Graphics 55–60 are full opaque rocky textures, including the two positively matched below.
- Graphic **60**, original 96×96 indexed, forms a highly repeated *fine texture* directly visible during the descent at approximately 29.3–29.5 s.
- Graphic **55**, original 96×96 indexed, forms the *rocky impact backdrop* visible from approximately 29.8 s onward. Its pattern repeats at a 96-pixel period.
- The original upper fighting-stage setups from O208 belong to `PIT.GRA` (resource 32), while this independently witnessed fatality phase belongs to `FALL.GRA` (resource 123). Do not mislabel Kombat Tomb as The Pit; that correction was made in O205.

## Original source vs video evidence

- Original graphics were decoded from the original compressed sprite streams without geometric scaling. The captured DOSBox viewport was extracted from `(10,25)` size `640×400` and downscaled to native `320×200`.
- Rocky tile 55, at horizontal phase 48 and vertical phase 12 in the post-impact recording, explains **~96.6%** of held-out RGB variation across designated unobstructed areas when palette colors are learned on checkerboard-alternating other pixels. The derived background has ~3.2/255 mean per-channel color error in the scoring area; the 5 alternative later texture sources score drastically worse under phase searches (unconfirmed textures should not be silently treated as the final wall).
- Fine tile 60 at `(0,16)` gives mean per-channel errors ~6.8/255 in a broad unobstructed video mask at 29.3–29.5 s with the video-calibrated palette. The narrow 96×96 witness at 29.5 s previously gave 0.844 color-class-fit R², while the packaged broad-mask held-out R² is approximately 0.62. Both require video palette calibration; no original executable palette table claim is made.
- Frame 29.3: source pose **42** leads the alpha-silhouette test, frame 29.4: pose **44**, frame 29.5: pose **46**, and frame 29.8: pose **42**. The video background transition frames at 29.6–29.7 s do not support a reliable silhouette assignment.
- The frame 29.8 source pose 42 starts at native screen pixel `(133,63)`. Its silhouette F1 is **0.9506**, and 1,768 of the 1,783 thresholded foreground pixels overlap its original opaque silhouette. Checkerboard held-out *RGB* validation gives approximately **6.8/255 MAE** and **0.973 R²**. Shifting the pose 5 pixels or selecting source pose 43 destroys this match.
- The final impact sprite is original source pose **47**. It matches source colors inferred independently from pose 42 at `(117,54)` around 29.9–30.0 s and `(117,50)` from 30.1 s onward. Filtering HUD, red effects and title gives 6–7/255 error over about 1,900 visible body pixels at several points. The fighter is impaled on **nothing**: he hits the flat rocky impact surface. Earlier false claims of spikes are explicitly superseded.
- The assembled scene, consisting solely of original lower-wall tile 55 and original falling pose 42 (with colors and coordinates calibrated from video), has **3.53–3.56/255 full-native-frame mean absolute RGB error** at 29.8 s. A source tile 55 + source pose 47 composite also visually matches the impact; blood/cracks/title are absent and account for the large visible residuals. This is not an independent executable run.
- Source facts and video-derived fitted colors are intentionally distinguished; an exact DOS hardware palette and the actual draw callback have **not** been proven.

## Unresolved / what does not follow

1. Exact original game state machine, fatality dispatcher and transition triggering code.
2. Exact original color palette installation / DAC values; reproduced palettes are **measured from user-supplied video**.
3. Per-frame schedule at native 30 fps including 29.6–29.7 intermediate transition, and camera arithmetic for the fatality.
4. Runtime placement, layering and blend behavior of source graphic 54 (crack/decal), red debris/blood and all winner/fatality lettering. A candidate graphic match is not a verified placement.
5. Original draw order / code camera arithmetic of the upper PIT.GRA arena (O208 already provides strong parallax evidence, but not a complete engine trace).

## Reproduction

`python scripts/verify-o210-pit-fatality.py --game-zip <owner MK2 zip> --video <owner recording mp4> --out <new empty destination>`

This validates input hashes, all 61 original descriptors and full encoded byte tiling; it creates a source-to-video numerical report, original pointer census, and three comparison PNGs without writing or modifying any game files. It rejects altered fixtures. Original game binaries and videos are **not shipped** in the project or research ZIP. Outputs have been reproduced on a second run byte-for-byte.

**Project genealogy:** O210 is strictly additive after O209.2. Preserve all O209.2 source members and earlier handoffs. No React/Vite build asserted.
