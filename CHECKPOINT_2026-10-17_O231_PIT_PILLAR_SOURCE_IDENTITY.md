# O231 — Pit II fatality upper-column descent, source identity

Status: original-source-to-video corroborated; research only. No original MK2 file or application source modified.

## Finding

The bridge pillar visible while the camera follows the falling fighter, before the rocky-wall transition, comes from **PIT.GRA's original six-stage-source setup 2**, not from `FALL.GRA` graphic 58 or a newly identified separate column file.

Original setup 2 has a source-local 1400×768 raster and includes the repeated 48×96 column source graphic beginning at original `PIT.GRA` byte offset **56728**. O208 independently authenticated the stage setup in original MK2 executable relationships. The decoded stage image is `pit_investigation/results/pit_six_sources/the_pit_source_setup_2.png`.

One 20×52 source-pixel region at source-local `(269,200)` matches independent recording frames at:

| Original recording frame | Timestamp | Original source patch maps to video (x,y) | Source RGB MAE /255 | Grayscale normalized cross-correlation | horizontal ±4-pixel control |
|---|---|---|---|---|---|
| 864 | 28.8 s | (228,109) | 6.11 | 0.98056 | −0.05 to −0.06 |
| 870 | 29.0 s | (210,79) | 6.17 | 0.97527 | −0.05 to −0.05 |
| 876 | 29.2 s | (198,122) | 5.37 | 0.98523 | −0.03 to −0.04 |

Two other independently sampled original-source patch regions within the same pillar also match each frame at the same native-screen horizontal displacement, normalized correlation 0.970–0.982. The source pattern repeats vertically, so local vertical-match aliases do not establish unique camera displacement.

The capture's background changes from the upper-stage sky at frame 877 (29.233 s) to the new repeating falling texture at frame 878 (29.267 s). This is an observed capture cut, not an instruction-level camera-state trace.

**Graphic 58 is unrelated artwork**: its original `FALL.GRA` descriptor is 96×96 (with an exact 48×48 repeated indexed pattern), and its original palette rendering is rocky texture. O224 independently places it in the **post-cut** 32-selector wall-tile sequence, where five entries reference it. Its unresolved lack of a visible 30 fps witness remains an open investigation, and it cannot be explained by renaming the already-source-authenticated bridge pillar.

## Impact on reconstruction preview

The upper-to-lower transition should preserve/show `PIT.GRA` setup 2's tall pillar, tracking source geometry vertically and horizontally through the pre-cut frames, then switch to `FALL.GRA` lower texture sequence after the recorded cut. Do not approximate the bridge pillar using FALL graphic 58. Exact camera/scene geometry for the transition remains unsolved.

## Evidence files

- `MK2_Pit_II_Pillar_Source_Identity_Evidence.json`: input hashes, source identities, template alignments and negative controls.
- `MK2_Pit_II_Pillar_Original_Source_vs_Recording.png`: original pillar and three video witnesses.
- `MK2_Pit_II_FALL_GRA58_Source_Tile.png`: source-authenticated original separate rocky texture.
- `pit_pillar_o231_probe.py`: local read-only cross-check against supplied original fixture and previous O205/O210 decoded source.

No original game files altered. Original executable palette used directly for the source-58 tile. No new application build or full runtime trace asserted.
