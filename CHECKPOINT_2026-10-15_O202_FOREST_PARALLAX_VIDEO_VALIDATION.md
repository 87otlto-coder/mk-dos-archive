# O202 — Forest O198 renderer-channel movement ratios compared with runtime video

**Baseline:** O201. **Input:** same original MK2 Forest video `Recording 2026-10-15 213702.mp4`, O196 floor evidence, O197 all-five-source-layer evidence and O198 original motion-input forensic package. **Classification:** read-only reproducible visual runtime analysis; source-level renderer ratio predictions supported by gameplay witness. Not an authenticated trace of the runtime camera code.

## Why this experiment

O198 identified source-linked Forest rendering channels **5, 4, 2, 1, 0**, and the original 16.16 input values **1.5, 1.125, 0.9375, 0.75, 0** for Forest layers 1–5. These inputs are original-source facts. Their meaning as parallax motion relative to layer 1 was previously an unverified interpretation. O201 recovered t=0 source-to-screen alignments, but manually fitted the horizontal origins. O202 tests whether relative layer movement from the rest of the recording follows these original ratios.

| Source layer | O198 original input | Original input / 1.5 | Video movement status |
|---|---:|---:|---|
| 1 large trees | 1.5 | 1.0 | Reference movement measured at every timestamp (not independent evidence for its ratio) |
| 2 | 1.125 | 0.75 | Strongly corroborated by new video samples |
| 3 | 0.9375 | 0.625 | Strongly corroborated by new video samples |
| 4 | 0.75 | 0.5 | Corroborated, fewer distinct features |
| 5 distant trees | 0 | 0.0 | Consistent with stationary source layer, sparse/repeated features |

## Test method

1. Verify the O198 original `evidence/original_motion_inputs_16_16.json` record and retain its `runtimeTransformVerified=false` qualification. It lists all nine values in source-order, with duplicates; they are **not** nine distinct layers.
2. Use the O201 measured/calibrated **t=0** layer source-image horizontal and vertical origins (not fitted again at each sampled frame).
3. Crop the user's 642×430 DOSBox capture to the original 640×400 viewport at x=1, y=30, and resize to the 320×200 native picture using area averaging.
4. Match the O197 original source pixels to each of **30 one-second samples** using source-masked SIFT. Independently estimate layer 1's image-to-video displacement at each sample.
5. Predict each other layer's displacement using **only** the O198 original input ratio. Do not optimize its per-timestamp offset. Count source feature matches whose observed translation is within 2 x pixels and 1 y pixel of the prediction.
6. Report odd-second timestamps independently from O201's earlier even-second source-match table: t=1,3,...29, 15 samples. These are held-out **timestamps, not an independent recording**; the fixed origins still came from O201's opening-frame fitting.
7. Compare the fixed-ratio model against identical-position controls with all layers moving together, all layers stationary, and a three-layer source variant; keep all other reconstruction assumptions and a candidate floor shift equal. Score native-pixel RGB differences on rows 36..197 with mean absolute per-pixel RGB error capped at 40, to mitigate outliers from sprites/HUD. These are **diagnostic** scores, not independent gameplay fidelity ratings.

## Odd-second feature-match results

| Layer | Original-ratio inlier votes | Uniform-motion inlier votes | Stationary inlier votes |
|---|---:|---:|---:|
| 2 | 530 | 0 | 3 |
| 3 | 257 | 0 | 0 |
| 4 | 76 | 2 | 4 |
| 5 | 29 | 0 | 29 |

Layer 1 itself supplies the reference shifts, so its own matches are not an independent model test. Layer 5 shares the stationary hypothesis; it cannot distinguish the source-predicted zero ratio from that same stationary control. Source feature votes are **not** independent statistical samples because one asset contains spatially correlated image patches and repeating texture motifs.

### Odd-second pixel-control scores

| Candidate scene | Mean capped RGB absolute error (lower better) |
|---|---:|
| O198 source-ratio, five original layers | **10.0400** |
| Same source ratios, three original layers | 11.5092 |
| All five layers moving at nearest layer rate | 15.9431 |
| All five layers stationary (floor candidate still scrolls) | 21.7320 |

Source-ratio five-layer model scores better than all three controls **at each of the 15 odd-second samples**. All versions use the SAME starting source-image offsets and the SAME candidate floor horizontal movement. Their differences are due to the tested layer movement and layer selection rules. Results still include fighter, HUD, video-compression and camera uncertainties.

## Other observed behavior

The nearest-tree reference shifts from starting position by approximately +270 native pixels near t=4–8, and -249 near t=15–18 (sign is source-image translation, not player-facing camera movement). There is a common 12-pixel vertical shift on sampled frames near t=19 and t=24–25. Neither source camera mode value, palette-bank activation sequence, floor-scroll equation, true runtime render order nor O199 conditional callback activation is proven.

## Exports and limits

The forensic ZIP includes source/verifier scripts, the original source hash for each input ZIP/video, every SIFT integer translation vote, a 150-record match table, 60 pixel-control scores, a 30-frame reference-motion summary, eight side-by-side comparison PNGs, source-derived motion SVG/PNG and a visual GIF. No source game executable/GRA file or full MP4 is bundled. Evidence can be independently re-audited from exported integer votes without running SIFT again; source images/videos remain needed to independently repeat pixel extraction.

**Assessment:** Forest's five-layer **relative parallax ratios** are strongly verified by a new temporal video test against original executable values. The complete camera equations remain a separate verification target. The expected next video targets are MK2 Portal and Kombat Pit, using the same source-vs-video pixel-measurement protocol but their **own** stage assets and source motion inputs. Forest-specific coordinates must not be copied across stages.
