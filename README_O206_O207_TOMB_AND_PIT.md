# MK DOS Archive O207: Tomb/Pit evidence workflows

O207 is an additive research-script checkpoint. The existing Museum/Laboratory UI was **not changed**; a new browser build is neither required by the new Python scripts nor claimed.

## Required original local inputs

Original matching MK2 DOS installation: `MK2.EXE`, `TOMB.GRA`, `PIT.GRA`, and **the Tomb gameplay video** `Recording 2026-10-15 215828.mp4`. Commercial inputs are not included in source or forensic archives. Install Python packages `numpy`, `opencv-python`, `Pillow` if not installed.

In your project root, use an empty output folder name, then run:

```bash
python scripts/verify-o206-tomb-pit-runtime-source.py --exe /path/to/MK2.EXE --tomb /path/to/TOMB.GRA --pit /path/to/PIT.GRA --video /path/to/Tomb-recording.mp4 --project . --out /new/O206
python scripts/verify-o207-tomb-floor-video.py --exe /path/to/MK2.EXE --tomb /path/to/TOMB.GRA --video /path/to/Tomb-recording.mp4 --project . --o206 /new/O206 --out /new/O207
```

Outputs include original-derived source planes, 39 sampled-feature rows, full raw SIFT match positions, floor candidate offsets and wrong-placement controls, training/holdout splits, source pointer/relocation trace, source hashes, and a partial preview. Neither input files nor original game installations are modified.

If fixture hashes differ, the tests fail closed; use the original verified installation and video. Video resolution/crop is also guarded. This version is specific to the actual uploaded Tomb footage, not a general-purpose automatic gameplay analyzer.

**Limitations:** Original-source numbers and runtime-observed positions are separately labeled. The ~0.8275 coefficient is video-calibrated, not yet authenticated as original EXE computation. There is no authentic Pit runtime record. Live mode selection, exact camera equations and full draw order remain unresolved.
