# O210 Pit II fatality — quick start

The Pit II's fatality has an independent lower environment stored in `FALL.GRA`. Its 61 original source graphics include **55** (large rock impact backdrop), **60** (fine descent texture), **42/44/46** (falling poses visible in intermediate frames), **47** (final impact pose), and **54** (candidate crack artwork, placement not proven). We constructed visuals from these source graphics and used the user's DOSBox recording to align them and calibrate colors.

The most useful image to inspect is `o210_original_source_vs_runtime_29.8s.png` in the O210 evidence ZIP: the source-only composite has ~3.56 RGB levels of average error per channel across the entire 320×200 image. The source-to-video evidence does NOT establish a matching original executable renderer or complete fatality scheduler. See full checkpoint for caveats.

### Run

Install Python with numpy, Pillow, and opencv-python. Download/unzip the complete O210 project source. With your original unmodified MK2 game ZIP and your original `Recording 2026-10-17 151933.mp4` in accessible paths, run:

```bash
python scripts/verify-o210-pit-fatality.py --game-zip '/path/to/mk2.zip' --video '/path/to/Recording 2026-10-17 151933.mp4' --out '/path/to/new-output-dir'
```

Use a new output directory; existing evidence will not be overwritten. Input hashes are pinned and changed binaries or other recordings are rejected. No original game files, patch or full video are distributed with this checkpoint.

### Research next steps

Identify and prove the cracked-wall decal drawing primitive and original compositing coordinates; correlate original soundtrack/sfx & precise frame scheduling, if needed. O208 upper-stage parallax is already sourced and video-verified but its exact camera arithmetic remains unresolved.
