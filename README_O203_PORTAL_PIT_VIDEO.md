# O203 — Portal & Pit II original-game video intake

Two DOSBox user recordings were ingested and compared as **new runtime witnesses**, using a conservative motion-feature analysis. Portal (36.63s) and The Pit II (39.83s) both provide usable reference frames.

## Evidence contents

- `pit/` and `portal/` `report.json`: clip metadata, source hashes, motion candidates and caveats.
- `raw_feature_pairs.json` and `.csv`: descriptor-level coordinates and displacements for 7 timestamp comparisons per stage.
- `video_contact_sheet.png`: eight authentic user-recorded sample images per stage.
- `video_native_opening_frame.png`: 320×200 normalized first frame.
- `motion_modes_comparison.png`: top motion candidates by screen region, with motif aliasing caveat.
- `reproduce/verify-o203-portal-pit-video.py`: independent local regenerating script.
- `MANIFEST.json`: packaged content SHA-256 hashes, including source-script checksum.

## Boundaries

This checkpoint does **not** prove the source compiler, graphics decoding, sprite/frame alignment, renderer speed, specific palette bank or camera equation for Portal or Pit II. It establishes the reliability and content of two new runtime references with an exportable transparent intake. Background-source matching and genuine parallax verification are next research steps.

Run using Python 3.10+, `opencv-python`, `numpy`, `Pillow`:

```powershell
py verify-o203-portal-pit-video.py --pit "Recording 2026-10-15 215828.mp4" --portal "Recording 2026-10-15 220325.mp4" --fixture "MK2_GAME_DIR" --output O203_results
```

Videos and original commercial game files are intentionally not bundled. Compare hashes in the report to ensure the same inputs.
