# O232 — Pit II fatality column-descent motion, independent background holdout

**Status: original-source-to-video qualification, bounded. No patch, no completed camera formula.**

Inherit O230 and O231 unchanged. The original **PIT.GRA** setup 2 has the vertically repeated pillar sprite at `PIT.GRA` byte offset 56728. During the owner’s fatality recording the intact near pillar remains displayed through **frame 877 (29.233 seconds)**; frame **878 (29.267 seconds)** begins the distinct `FALL.GRA` texture scene. This video cut is not proof of a particular executable switch instruction.

## New verification

- Rerenders all six original Pit setups from the canonical `MK2.EXE` and `PIT.GRA` with the preserved original O205 decoder. Original fixture SHA-256 guards: `MK2.EXE fa93afdc...`, `PIT.GRA af6c10b6...`, original fatality recording `198b5ecc...`.
- Three independent native source-pixel strips at `(269,200,20,52)`, `(270,300,19,42)`, `(273,400,14,55)` are matched against native `320×200` DOSBox frames in fixed search window `(170,70,265,196)`.
- Of the 17 sampled frames 861–877, **12 frames** pass the strict 2-or-more patch gate: normalized grayscale correlation >=0.93, identical horizontal offset and consistent 96-pixel vertical residue. Several unqualified frames are deliberately retained rather than coerced into matches.
- Frame 861 (28.700s): source-to-screen X offset `−32`; frame 874 (29.133s): `−71`, a **−39 native-pixel** movement over 13 recorded frame intervals (~0.433s). Video sampling repeats some frames; this cannot be directly translated into unique original game update counts.
- The original source patches have **exact 96-pixel vertical repetition** with pixel equality 100%. Their 48-pixel-shifted images are **not identical**. Earlier provisional modulo-48 alias assumptions are corrected here. Vertical camera displacement remains unresolved modulo 96 rather than uniquely measurable.
- Every accepted source-to-video match defeats deliberately displaced ±4-pixel horizontal controls (highest control normalized correlation `−0.033`).
- An independent distant-stage region `(x20..89,y70..119)` comprising **3,500 native pixels** is **pixel-identical** in the recorded frames 864, 870 and 876. Shifting this region 4 pixels worsens RGB error to 14.083/255. Thus the distant stage image is stationary while the near column moves.
- Fresh reproducibility: two independent runs have identical **SHA-256 `88fde8f5ed936102f85112dc37676ad71556e97ab8bbffb659b93033c738f046`** for `O232_PIT_PILLAR_DESCENT_PARALLAX.json`; all six newly regenerated stage-source raster outputs are also byte-identical.

## Classification and limitations

Verified *within the sampled recorded frames:* source asset identity, near-column X displacement, an exact 96-pixel repeat in original indexed source, independent far-background stationarity, and pre-cut column visibility.

Unverified: absolute world-camera position, unique vertical scroll distance, exact active stage root/camera control flow, draw order over all layers, 50fps frame/timer alignment, graphic 58's missing visible witness, and exact pre-fall gameplay-fighter animation. Do not claim these are solved by the 30fps recordings. Frame 878 is the first observed new scene, not necessarily the runtime instruction's execution timestamp.

## Reproduce read-only

`python scripts/verify-o232-pit-pillar-descent-motion.py --game-zip <original MK2 fixture zip> --video <original owner recording> --project <MK-DOS-Archive source dir> --out <new empty output path>`

Requires Python, NumPy, Pillow, OpenCV. Verifier rejects mismatching fixture SHA-256 and overwriting existing output. Never edits source binaries. Runtime framebuffer and actual camera opcode trace remain possible future follow-ups.
