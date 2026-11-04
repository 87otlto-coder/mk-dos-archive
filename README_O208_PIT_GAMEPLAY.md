# O208 — Authentic The Pit recording, source-frame matches and parallax

This research-only checkpoint starts from **O207** source. All inherited original files are byte-identical. The new scripts create derived evidence without writing to commercial MK2 files.

## Command-line reproduction

Install Python 3 with `numpy`, `Pillow`, and `opencv-python` (SIFT enabled). From the project root, with your own original MK2 game folder and the original recording:

```bat
python scripts\verify-o208-pit-gameplay-parallax.py --exe "D:\MK2\MK2.EXE" --pit "D:\MK2\PIT.GRA" --video "D:\Captures\Recording 2026-10-17 140419.mp4" --project . --out "D:\Reports\O208-primary"
python scripts\verify-o208-pit-pixel-models.py --evidence "D:\Reports\O208-primary" --video "D:\Captures\Recording 2026-10-17 140419.mp4" --out "D:\Reports\O208-pixel"
python scripts\verify-o208-pit-thin-layers.py --evidence "D:\Reports\O208-primary" --video "D:\Captures\Recording 2026-10-17 140419.mp4" --out "D:\Reports\O208-thin"
```

The exact supplied recording and verified original MK2 files are hash-pinned. The analysis will intentionally reject different installations/videos. Input files are never edited.

Outputs include all six original source setup PNGs; sampled source-video feature correspondence arrays; 35 timestamped motion records; four illustrative compositions; stage identity report; independent pixel-model scores; and a separate inconclusive thin-layer motion check.

**Interpretation:** Setup 4 being visible supports the six-setup source root, and source values 1.5 vs 0.1875 predict the observed strong 8:1 near-to-distant parallax. This does not prove the live stage mode number or original arithmetic instruction sequence. The reconstructed images omit separately drawn fighters and may use candidate order/anchors.

No original game executables, `PIT.GRA` or full recording are included in the distributed source/evidence archives.
