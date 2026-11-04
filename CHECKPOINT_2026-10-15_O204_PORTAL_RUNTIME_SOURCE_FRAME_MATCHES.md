# MK DOS Archive — O204 Portal source-frame / gameplay-video correspondence

Date: 2026-10-15. Previous authoritative checkpoint: O203. Research-only continuation, **no existing application, research engine or decoder code changed**.

## Inputs

- User's `Recording 2026-10-15 220325.mp4`: 638×426, 30 fps, 1,099 frames; SHA-256 `18290d9850dc4a6f936aadd6086b03dd95bc43df6541ab97baa7bb280957963c`.
- Previously authenticated O188 original decoded Portal sprite frames: seven `portal_swaying` and seven `portal_hanging` RGBA images, from `MK2_O188_Portal_Fixture_Extract_With_Hypothesis_GIF_2026-10-14.zip`. Original frame recovery and binary-source provenance are inherited from O136–O188, not newly established by video matching.
- O203 intake evidence and Pit II recording remain unchanged.

## New observations

1. The two large hanging figures in the actual Portal gameplay match the original `portal_swaying` source frames at approximately **x=51 and x=226** in the 320×200 native viewport. The two smaller figures match `portal_hanging` frames at **x=128 and x=175**. Vertical placement changes with the displayed view, and the script searches bounded y ranges rather than imposing a fixed game camera equation.
2. 147 native-resolution video samples at **4 frames per second**, matched against seven sprite candidates per object. RGB matching uses a deterministic fixed-seed selection of up to 96 opaque pixels per sprite and searches all placements in declared bounds. `portal_pose_matches.csv` and `.json` retain every best candidate, second-best candidate, gap and position.
3. **Full-opacity-mask cross-check**, using *all* opaque sprite pixels at the selected placement, compared with the same candidate displaced by 19 pixels horizontally:

| Object | Median full-mask mean absolute BGR/255 error | Median 19px displaced error | Frames better than displaced control |
|---|---:|---:|---:|
| Large left | 0.0544 | 0.2067 | 145/147 |
| Large right | 0.0369 | 0.2085 | 147/147 |
| Small left | 0.0662 | 0.1108 | 133/147 |
| Small right | 0.0474 | 0.1093 | 147/147 |

4. The seven recovered large-figure pose variants all appear among candidate best matches somewhere in both side sequences. **Do not equate every winner with an independently verified frame identity.** The median margin over the second-best source pose is small, especially for the smaller silhouettes; 4 fps undersamples previous 50–100 ms/frame timing hypotheses.
5. The control is a shifted-position sanity check, **not** a statistical null distribution. Fighter overlap, video compression, anti-aliasing/capture downscaling, source-palette differences and repeated scenery limit the inference. No exact cycle order, phase, tick rate or viewport-camera formula has been confirmed by this experiment.

## Pit II status

- `Recording 2026-10-15 215828.mp4` is available and analyzed in O203 (39.833 s); the stage resource is `PIT.GRA` (69,384 bytes, SHA-256 `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96`).
- O203 reports several plausible feature-motion groups amid repeated architectural patterns. **No Pit II source layer has been matched to gameplay by O204**, and no Portal or Forest rendering assumption has been transferred to Pit II.
- Next objective: recover Pit II source-specific stage-root/descriptor/palette linkages (analogous in method, not assumed structure, to O196–O198) and establish independent source-image-to-video matches; preserve competing alignment candidates.

## Evidence package and reproduction

`MK2_O204_Portal_Original_Frames_Runtime_Matches_Forensic_2026-10-15.zip` includes matching tables, the off-target cross-check, annotated native-frame visuals, input hashes, scripts and O188 original derived-frame package. The full proprietary game installation and original gameplay video are **not** included.

Run `ffmpeg -i <Portal video> -vf "fps=4,crop=638:400:0:26,scale=320:200:flags=area" -pix_fmt bgr24 <frames-dir>/%04d.png`, then `python scripts/verify-o204-portal-video.py --video <video> --o188 <O188 zip> --frames-dir <frames-dir> --out <result-dir> --step 0.25`, then `python scripts/verify-o204-portal-shift-control.py --results <result-dir>/portal_pose_matches.json --frames-dir <frames-dir> --o188 <O188 zip> --output <result-dir>/full_alpha_mask_and_shifted_controls.json`.

## Boundaries / integrity

This is a **video-evidence checkpoint only**. No full browser build or game runtime binary patch is claimed. No original MK2 data is modified. All old source files must compare byte-for-byte with O203. Public preview images must be labeled "annotated gameplay footage"; no inferred composited Portal stage is generated here.
