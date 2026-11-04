# MK DOS Archive — O187: Portal original seven-pose runtime witness

**Date:** October 14, 2026. **Status:** visually verified from user-supplied DOSBox gameplay recording, then independently reproducible from supplied recording and authenticated O177 source index planes. **Scope:** the `portal_swaying` seven-pose source sequence in the Portal stage. **Base source:** O185 + independently distributed O186 root-folder F9 cheat-menu kit; no source game executable or graphics resource is included here.

## Observed runtime evidence

User supplied `recording.mp4`, an approximately **102.47-second** Windows Snipping Tool capture of MK2 running in DOSBox at reduced emulated CPU cycles. Video properties read from the file: **642×426**, **30 captured video frames/s**, **3,074 captured frames**. The video contains visible blue hanging/swaying Portal figures, which change poses as gameplay continues. An earlier approximately 13-second recording and gameplay screenshot also showed blue Portal figures. The precise source or patched EXE/GRA hashes **cannot** be read from those recordings; selection of O186 option 11 is inferred from the visually matching modified palette, not independently verified by a filesystem read from the user's Windows installation.

Original O177 frame export includes six original MK2 effect sequences totaling 43 source frames. For the large Portal swaying figures, its `portal_swaying` track includes seven 41×63 source-index and opacity planes. O182 had remapped source indices **54→63** and **55→64** on these seven frames and seven smaller `portal_hanging` frames. O186 combined that graphics patch with the original game's verified 11-byte F9 cheat-menu unlock, in a clone-only test kit.

The source pixel patterns from the seven large figure frames, enlarged exactly **2×** by nearest-neighbor, match cropped regions of the video. The classifier for the selected blue pixels uses OpenCV **BGR** channel values: `B > 180`, `B-R > 35`, `B-G > 20`; arithmetic is evaluated with signed 16-bit channel differences, avoiding accidental `uint8` wrapping. The source templates use authenticated index values **54 and 55**; background is not subtracted except by that color mask. Candidate placement search is bounded to video X **98–112** and Y **140–187**, inclusive. The F1 score for each candidate is `2 × intersection / (source blue pixel count + captured blue pixel count)`. All seven independent source candidates are scored at every sampled instant.

### Seven screenshot/source pose matches

| O177 source pose | Video timestamp (s) | Zero-based 30 FPS capture frame | Source-to-video blue-mask F1 | Second best F1 | Margin | Match top-left (video pixels) |
|---:|---:|---:|---:|---:|---:|---|
| 0 | 57.50 | 1725 | 0.915907 | 0.767911 | 0.147996 | (105,162) |
| 1 | 58.00 | 1740 | 0.918227 | 0.802176 | 0.116051 | (105,160) |
| 2 | 56.00 | 1680 | 0.914883 | 0.801190 | 0.113693 | (105,178) |
| 3 | 49.75 | 1492 | 0.901296 | 0.775238 | 0.126058 | (105,174) |
| 4 | 95.00 | 2850 | 0.904260 | 0.784483 | 0.119777 | (105,174) |
| 5 | 98.75 | 2962 | 0.921245 | 0.800364 | 0.120881 | (105,178) |
| 6 | 101.75 | 3052 | 0.906139 | 0.774287 | 0.131852 | (105,158) |

**Every expected pose was the highest-scoring of all seven candidates at its selected timestamp**; each scored above 0.90 and exceeded the next-best candidate by more than 0.11. These are **purpose-selected observations** for source-pose identity, not randomly sampled independent validation or a complete temporal tracking study. The timestamps are deliberately not in source-playback order; they cannot establish actual presentation order, playback frequency, per-frame durations, or whether cycles/frameskip affected presentation.

An earlier on-screen comparison used `uint8` color-channel subtraction, which could wrap for negative values and slightly inflate some scores (earlier reported roughly 0.91–0.93). O187 reruns with signed subtraction and supersedes those scores with the exact 0.901–0.921 values above. The underlying visual seven-pose conclusion survives the stricter scoring.

## Verification and artifact handling

- **User video SHA-256:** `adf158729ae8cb6dfc5eff38a8aa918fcb3de477667c8bbf22113e4595f1e139` (not distributed).
- **Original O177 43-frame ZIP SHA-256:** `68f99207aa5b9963c3d0ecb551680a9edb227f8f8969cfbe596b2c314d28be72` (not duplicated in source release).
- **New metadata:** `research_outputs/O187_RUNTIME_POSE_WITNESS.json`. Contains original source descriptor identities/hashes, selected video timestamps, pose classifications, confidence margins and explicit uncertainty booleans. Contains no original `.GRA`, executable, recording, or binary indexed frame arrays.
- **Visual evidence:** `research_evidence/O187_PORTAL_SEVEN_POSE_COMPARISON.png`. Generated from authenticated user-owned source-frame export + capture; scores are from corrected channel arithmetic. This comparison includes excerpted gameplay crops and source-derived pose previews, but no complete game file.
- **Producer:** `tools/mk2_o187/analyze_o187_portal_recording.py` (uses cv2 + numpy).
- **Independent verifier:** `tools/mk2_o187/verify_o187_runtime_pose_witness_independent.py` recomputes from original source and video with **2-D correlation + integral-image sums** rather than the producer's scalar template window loop. Passes **63 behavioral comparisons** for positions, scores, ranking and margins, in addition to exact source/video hashes and metadata constraints.
- **Adversarial verifier:** `tools/mk2_o187/test_o187_runtime_witness_adversarial.py` rejects **10 intentionally forged reports**, including fabricated native-FPS claims, swapped poses, invented scores/positions and source hashes.
- **Comparison renderer:** `tools/mk2_o187/render_o187_portal_comparison.py` reproduces visual evidence using authenticated O177 indexed/PNG data and captured frames. The left-hand source-palette preview is not a measured runtime DAC trace.

Reproduce with the same source O177 ZIP and the user's local `recording.mp4` (no special game installation access required):

```sh
python tools/mk2_o187/analyze_o187_portal_recording.py --video /path/to/recording.mp4 --frames-zip /path/to/MK2_O177_All_43_Original_Stage_Effect_Frames_2026-10-13.zip --out /new/O187_RUNTIME_POSE_WITNESS.json
python tools/mk2_o187/verify_o187_runtime_pose_witness_independent.py --video /path/to/recording.mp4 --frames-zip /path/to/MK2_O177_All_43_Original_Stage_Effect_Frames_2026-10-13.zip --report /new/O187_RUNTIME_POSE_WITNESS.json
python tools/mk2_o187/test_o187_runtime_witness_adversarial.py --video /path/to/recording.mp4 --frames-zip /path/to/MK2_O177_All_43_Original_Stage_Effect_Frames_2026-10-13.zip --report /new/O187_RUNTIME_POSE_WITNESS.json
```

## Promoted vs unresolved

**Promoted to visually observed:** the original Portal stage displays blue modified large hanging figures that animate during the game, and the recovered `portal_swaying` seven-source-pose imagery has seven individually matched on-screen examples. This strengthens O182/O186's *specific source-color remap* plausibility at runtime; it does not provide a byte-for-byte readback of the edited Windows game files.

**Still unknown:** the `portal_hanging` small figure seven source poses individually; Portal electric six source poses as they display; displayed frames per second and stage effect update timing; frame-order/timing from a complete recording timeline; task-object activation flags, final renderer draw order, all possible stage camera coordinates; exact live VGA palette register selection for each draw; general replacement of arbitrary source sprites, format growth/relocation, or safe full resource/compiler repacking. The full React/Vite build remains unverified.

**Next:** controlled small-figure source pose matching with appropriately isolated capture, then a separate (not conflated) real timer/renderer instrumentation experiment. The user's requested root-folder clone kit format with original F9 cheat-menu stage selection (O186) remains the distribution standard. No further test input is required merely to preserve this O187 evidence.

## O187 release regression check

The inherited `tools/mk2_animation_continuation/test_*.py` suite was independently rerun using the canonical original MK2 executable and original `RM.DRV` supplied by the user. All **14 regression scripts** passed, totaling **235 named test methods**. These checks exercise previously qualified source paths; they are not additional runtime observations. No original game binaries are included in this source release. The O187 scripts were bytecode-compiled; the entire React application build was not attempted or claimed. The pre-existing project source modules and 24 pre-existing PNGs remain unchanged except for explicitly listed documentation banners.
