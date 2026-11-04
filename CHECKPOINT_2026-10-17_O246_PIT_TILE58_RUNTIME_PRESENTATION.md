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
