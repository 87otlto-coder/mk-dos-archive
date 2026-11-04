# MK DOS Archive — Handoff through O247

**Latest authoritative source: O247**, strictly additive to O246. O246 source ZIP is retained in full and every inherited member must be byte-identical. O247 adds source-to-video proof that the *original, unrecolored* FALL.GRA graphic 58 is visible at positive-control capture frame 452 (previously unconfirmed). All source/value/time/caveats in the two checkpoints below remain applicable. Full earlier genealogy is carried inside the inherited project source ZIP; O246 is not discarded.

## O247 checkpoint

# MK DOS Archive — O247 original graphic-58 source-to-runtime corroboration

**Date:** 2026-10-17. **Predecessor:** O246. **Status:** verified original source image cross-control against real recorded DOSBox test; selector timing / old O214 discrepancy not fully resolved.

## New result

In the O245 *graphic-59 positive control* only `FALL.GRA` sprite 59 is recolored. The original graphic 58 is **byte-identical to the canonical original**. At video frame **452** (15.0667 s), immediately following the recolored graphic-59 frames 449–451, the original graphic 58 is the source-palette template winner: **10.1261/255 training RGB MAE**, **13.0322/255 mean error over four independent holdout areas**. The next-best source graphic (57) is **19.0804/255 training, 22.3447/255 held-out**. Its phase in the approximated normalized 320×200 viewport is (0,15). This is evidence of *original, unrecolored graphic 58* being displayed.

In the separate O245 *graphic-58 experiment*, original graphic 59 appears on frames **498–500**, followed by directly detected recolored graphic 58 on **501–502**, then original graphic 57. The two modified recordings therefore independently corroborate the correct relative order.

Recovered neighboring identities in the graphic-59 positive control at 30-fps capture:

| Video frame | Observed original source graphic |
|---|---|
| 442–448 | 60 |
| 449–451 | diagnostic altered graphic 59 (not source-palette classifiable) |
| **452** | **58, original untouched indexed source pixels** |
| 453–454 | 57 |
| 455–457 | 56 |
| 458–459 | 55 |

This agrees with the original selector's **source order** 60 → 59 → 58 → 57 → 56 → 55 (O224), but **not** with treating source selector entry counts as exact 30-fps capture-frame counts. O246's positive-color detection for 59 and 58 is preserved independently.

## Evidence and caveats

Verifier `scripts/verify-o247-pit-original-tile58-cross-control.py` fresh-reads the hash-guarded original owner `MK2.EXE` and `FALL.GRA`, decodes all 61 packed sprite streams to the exact 250804-byte boundary, obtains the original source-linked 81-color Pit palette at physical `0x895AC`, checks original bytes of sprite 58 in the positive-control kit, normalizes the two Windows recordings to native 320×200 coordinates and ranks all six sources on a training region and four separate holdouts. It analyzes 18 frames from the positive control and 17 from the graphic-58 diagnostic; 5 altered frames are deliberately excluded from normal-source classification. Nonaltered winning sources also win in independent holdouts across the sampled frames. Two complete reruns produced byte-identical JSON report SHA-256 `6308e9ad4f2227b65e26aa4d5de3d4e8efb321b024d1ac740d7a6b8157f998af`.

The capture-to-native normalization `[y30:H, x4:W-4] → 320×200` is an empirical test-window crop, **not** proven DOSBox viewport coordinates. Lossy video and scaling affect color residuals; the held-out texture-identity gap is much stronger than the raw pixel match. The original video from O214 still selected graphic 57 immediately after 59. That O214 capture remains a genuine exceptional observation; no explanation of its absent graphic-58 witness is claimed. O233's rejection of a uniform direct-display selector model in that earlier clip is not falsified, but must not be interpreted as a universal nonpresentation claim.

The approximately 50-fps presentation behavior independently measured in earlier Portal research and a hypothetical ~60 Hz tick scheduler are **distinct** and should not be silently equated. A 30-fps capture cannot prove exact source selector stepping or rendered duration.

No original game binaries or video were modified. This is additive research, not a new UI feature, DOS patch, or complete fatality camera/state simulation.

## Reproduce

```bash
python scripts/verify-o247-pit-original-tile58-cross-control.py \
 --game-zip <canonical-owner-mk2.zip> \
 --kit <MK2_Pit_II_O245_Runtime_Test.zip> \
 --known <known-visible.mp4> \
 --test58 <sprite_58.mp4> \
 --out <new-file.json>
```

---

## Inherited O246 checkpoint

# MK DOS Archive — O246 controlled runtime presentation witness

**Date:** 2026-10-17. **Status:** REAL DOSBOX CAPTURE VERIFIED for visual presentation of `FALL.GRA` source graphic 58; previous absence-of-witness claim superseded.

## Inputs

- User-supplied O245 diagnostic runtime kit `MK2_Pit_II_O245_Runtime_Test.zip`.
- User-recorded O245 positive-control video `known-visible.mp4` (30fps; 732 frames; 652×430).
- User-recorded O245 experimental video `sprite 58.mp4` (30fps; 738 frames; 638×418).
- Inherited project source O244, whose baseline verification is not changed.

Exact SHA-256 of all three inputs is recorded in `research_outputs/O246_PIT_GRAPHIC58_RUNTIME_WITNESS.json`.

## First direct visual presentation witness

O245 patches preserve all graphic streams' command geometry, encoded lengths and all other graphic bytes. Only source indices of graphic 59 or 58 are changed to alternating horizontal bands of palette indices 61 and 79. The diagnostic kit's original, graphic 59 and graphic 58 `fall.gra` member hashes match its package manifest.

Video bands detected by requiring substantial simultaneous orange and pale-blue pixel coverage in an exposed ROI (`x=30..154, y=60..404`) in each encoded frame. The thresholds and code are in `scripts/verify-o246-pit-runtime-video.py`.

| Video | Encoded frames containing test tile | Frame presentation timestamps |
|---|---|---|
| Graphic 59 control | 449, 450, 451 | 14.966667, 15.000000, 15.033333 s |
| Graphic 58 test | 501, 502 | 16.700000, 16.733333 s |

No other frame in either recording meets the combined diagnostic-band detection threshold. Adjacent encoded frames before and after each contiguous group show no diagnostic bands. The two videos depict different player/opponent combinations and have different recording start times, so absolute timestamps should not be used as stage-script synchronization anchors.

**Conclusion (VERIFIED):** graphic 58's source sprite is drawn and actually presented in a recorded DOSBox runtime, not just selected by internal code. The prior unmarked-video search was a **false negative for nonpresentation**, and the O233 assertion that simple timing cannot explain this omission should not be used to claim nonpresentation.

The source selector values (graphic 59: six, graphic 58: five) would correspond to 100 ms and approximately 83 ms if each step follows a ~60 Hz scheduler tick. Three and two 30fps capture frames are compatible with those intervals. **This consistency does not prove** selector frequency, presentation cadence, or the relationship to independently witnessed ~50 fps animation behavior.

## Reproduction

```sh
python scripts/verify-o246-pit-runtime-video.py \
  --known '/path/to/known-visible.mp4' \
  --graphic58 '/path/to/sprite 58.mp4' \
  --kit '/path/to/MK2_Pit_II_O245_Runtime_Test.zip' \
  --out '/path/to/new-report.json'
```

Reproduced twice; JSON was byte-identical (SHA-256 `a9919f41af46b2eb13c687a0ca41240ad766603a43ba6ae192e7de962280da9a`). No input files were modified.

## Remaining problems (unchanged)

1. Original, unmodified graphic 58 texture image is not uniquely identified in the 30fps original video color/palette comparison; a controlled striped tile proves runtime presentation, not per-frame original visual classification.
2. Camera trajectory, exact tile-update-to-present schedule, and original object compositor semantics remain partial.
3. Some impact splatter overlays and original fatality dispatcher remain unresolved.
4. ~50 fps observed presentation and ~60 Hz timer source must not be conflated.

## Provenance and file policy

The O246 evidence ZIP contains only analysis script, report, checkpoint and a limited visual witness contact sheet. It deliberately excludes O245 bundled DOS game files and the user's full gameplay recordings. This is strictly additive to the inherited O244 source ZIP; O245 runtime test remains a separate controlled local test kit.
