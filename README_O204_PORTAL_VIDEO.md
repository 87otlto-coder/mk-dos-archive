# O204 — Original Portal frames against DOSBox gameplay

O204 adds two read-only Python research scripts to O203. It does not change the React application, UI, executable decoders, or commercial game resources.

**Prerequisites:** Python 3, `opencv-python`, `numpy`, `Pillow` and FFmpeg. Inputs are your original Portal video (`Recording 2026-10-15 220325.mp4`) and the O188 source-derived frame ZIP (`MK2_O188_Portal_Fixture_Extract_With_Hypothesis_GIF_2026-10-14.zip`). In the O204 forensic evidence ZIP the O188 frame archive is provided under `reference/` for reproducibility.

```bat
mkdir portal_frames_4fps
ffmpeg -i "Recording 2026-10-15 220325.mp4" -vf "fps=4,crop=638:400:0:26,scale=320:200:flags=area" -pix_fmt bgr24 "portal_frames_4fps/%%04d.png"
python scripts/verify-o204-portal-video.py --video "Recording 2026-10-15 220325.mp4" --o188 "MK2_O188_Portal_Fixture_Extract_With_Hypothesis_GIF_2026-10-14.zip" --frames-dir portal_frames_4fps --out o204_results --step 0.25
python scripts/verify-o204-portal-shift-control.py --results o204_results/portal_pose_matches.json --frames-dir portal_frames_4fps --o188 "MK2_O188_Portal_Fixture_Extract_With_Hypothesis_GIF_2026-10-14.zip" --output o204_results/full_alpha_mask_and_shifted_controls.json
```

**Read results:** `portal_pose_matches.csv` (every pose match), `full_alpha_mask_and_shifted_controls.json` (independent all-opaque-pixel location control), `pose_match_timeline.png` and annotated gameplay frames. The samples are 0.25 seconds apart, which is insufficient to measure source animation rates hypothesized as 0.05–0.10 seconds per frame.

**For Pit II:** the O203 `PIT.GRA` resource and 39.8-second recording are ready for source-specific layer decoding. No Pit II composition or parallax model has been verified by O204.
