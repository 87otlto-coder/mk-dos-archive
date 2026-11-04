# O201 — Original MK2 Forest: gameplay-video pixel witness and stage-layer calibration

**Date:** 2026-10-15. **Baseline:** O200. **Input:** user-supplied `Recording 2026-10-15 213702.mp4` (30.133 s; 642×430 H.264 window capture), plus the intact O197 source-layer evidence ZIP and O196 original floor/palette evidence ZIP. No MK2 source binaries or commercial graphics are rewritten. No runtime program-memory trace has been collected.

## Distinct observations and what they establish

1. **Real gameplay witness**: The video shows a DOS MK2 Forest fight involving Liu Kang and Jax. The background moves horizontally while the fighters move, and at around 24 seconds the visible stage contents move down approximately 12 native pixels and return afterward. This is a recording-derived observation, not a recovered camera-equation proof.
2. **Source-to-game pixel agreement**: The O197 recovered source images independently register at unscaled 320×200 game resolution. Example 24×24 opaque windows match with mean absolute RGB difference of roughly 3.5–4.2 per channel after normalization of the compressed recording. The O196 source-linked candidate palette closely reproduces the video samples. These scores are diagnostic evidence, not proof of the precise runtime palette-bank programming sequence.
3. **Five layers individually witnessed**: SIFT descriptor correspondences locate credible source patterns from all five O197 layers in multiple video frames. Their nominal source-to-screen vertical image offsets at most sampled timestamps are approximately: layer 1 `0`, layer 2 `−2`, layer 3 `+44`, layer 4 `+49/+50`, layer 5 `+68` (native pixels). Layer 5 has fewer keypoints and must be interpreted with commensurately lower per-frame confidence. At t≈24 s, all five exhibit a common vertical +12-pixel shift. The five-layer mode structure from O198 is therefore supported by visual evidence, **but the value of the executable's stage-mode global has not been measured at runtime**.
4. **Original floor correspondence**: Source texture templates locate the O196 896×32 floor in the recording with its top at game row `168` at the start, and around row `180` during the vertical shift near 24s. The earlier O195/O196 `Y=172` is a **source draw operand**, not necessarily the final displayed top row; don't conflate these.
5. **Fitted source-only composition**: A deliberately simple alpha composition, using original indexed-layer exports, source-linked candidate RGB, a black background and chosen t=0 offsets, is visually close to the game without fighters/HUD. For a **heuristically masked, same-frame** comparison excluding the main sprite/HUD areas, the five-layer composition gives mean absolute per-channel difference **5.6186**, while a controlled three-layer alternative (same offsets, omitting layers 3 and 4) gives **9.4605**. These numbers measure a single test frame after candidate fitting. They are **not** independent holdout scores or universal accuracy figures. Horizontal offsets are ambiguous because Forest contains repeated tree patterns, and compositing order is still a hypothesis.

## Reproducible measurement procedure

The added **optional**, stand-alone Python script `scripts/verify-o201-runtime-video.py` takes the user's DOSBox MP4 plus the O196 and O197 ZIPs. It extracts the viewport (`x=1,y=30,w=640,h=400`) and averages it to the original `320×200` resolution, compares SIFT features and source texture patches across 15 sampled times, and emits a machine-readable report, CSV, and multiple comparison images. It does not modify the application's TypeScript, source decoders or game files. Python dependencies are `Pillow`, `numpy`, `opencv-python`. On other capture sizes, adjust the documented normalization procedure rather than pretending this script handles them automatically.

Example:

```bash
python -m pip install pillow numpy opencv-python
python scripts/verify-o201-runtime-video.py \
  --video "Recording 2026-10-15 213702.mp4" \
  --o197 MK2_O197_Forest_Five_Original_Layers_Forensic_Evidence_2026-10-15.zip \
  --o196 MK2_O196_Forest_Original_Floor_Forensic_Evidence_2026-10-15.zip \
  --output O201_runtime_results
```

The forensic ZIP includes: `REPORT.json`, `runtime_match_table.csv`, timestamped 320×200 witness PNGs, O201 five-layer and three-layer PNGs, the illustrated comparison, a byte-identical analysis script, and reproduction notes. Source ZIP file SHA-256 identifiers are recorded; the input MP4 and original source ZIPs are **not bundled**.

## Honest limits and next steps

- **Confirmed by supplied video:** original source texture presence, placement relationships (with per-layer confidence), five-layer scenery visibly consistent with gameplay, original floor texture appearance.
- **Still inferred or fitted:** particular horizontal camera offsets, image order, live mode variable, exact palette-bank activation, the causal path of the +12 screen-pixel vertical shift and whether O199's conditional callback drew an object. The recording is not identified as the O199 control or patched test; do not infer a callback difference from it.
- **Next research step:** trace channel accumulators 5/4/2/1/0 against video-derived per-layer horizontal motion. Use deliberately distinct visual landmarks to resolve repeated-tree translation aliasing. If the user can capture both control and patched DOSBox O199 installs at matched camera/character poses, test callback visibility separately.
- **Release status:** additive, source-level research checkpoint; **no React UI changes, no new Vite-build claims**. Retain the complete O200 source history intact.
