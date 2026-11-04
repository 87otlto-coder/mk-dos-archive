# O201 Forest runtime visual-witness verification

O201 analyzes the user's approximately 30-second original MK2 Forest gameplay recording. It compares the recording against O197's five independently extracted source layers and O196's original floor. It does not require or edit the MK2 executable. The output is reproducible and explicitly distinguishes measured pixels from camera/placement hypotheses.

## Run

Requires Python 3.10+ and `pillow numpy opencv-python`.

```bat
py -m pip install pillow numpy opencv-python
py scripts\verify-o201-runtime-video.py --video "Recording 2026-10-15 213702.mp4" --o197 "MK2_O197_Forest_Five_Original_Layers_Forensic_Evidence_2026-10-15.zip" --o196 "MK2_O196_Forest_Original_Floor_Forensic_Evidence_2026-10-15.zip" --output O201_runtime_results
```

Use paths to your real locations for all input files. Source release includes the script but not the commercial game assets or user-recorded MP4; O196/O197 evidence bundles must be supplied separately.

## Interpretation

The normalized native game frame is 320×200; the original MP4 is a 642×430 DOSBox window capture with a 640×400 viewport starting at `(1,30)`. For differently framed captures, this version of the script intentionally rejects the video instead of generating invalid scores.

The 5-layer vs 3-layer numeric comparison is a masked fit to a single frame. The video confirms visibly present textures associated with all five recovered layers, but it does not directly disclose the Forest stage mode global or prove the executable's exact camera transform. Refer to `CHECKPOINT_2026-10-15_O201_FOREST_GAMEPLAY_RUNTIME_VISUAL_WITNESS.md` for per-result qualifications.
