# O229 — Blood177 eleven-slot source-to-video verification at three captured times

Original MK2.EXE, BLOOD.GRA and owner-recorded fatality video independently passed SHA-256 guards. The original descriptor 177 is source-linked directly to original palette record `0x88918` (O228). Its original 11-object placement table and source instruction transform X/Y := v − floor(v/4) are independently established (O228).

Read-only `scripts/verify-o229-pit-blood-full-11-position-video.py` reconstructs the original 14×9 indexed, 73-opaque-pixel sprite, applies original EXE 48-color palette, crops the owner's DOSBox recording from `(10,25)` 640×400 to native 320×200, and tests all eleven actual source-coded positions translated by `(0,-4)`.

**Results:** at capture frames **895, 903, 930** ten of eleven placements match original sprite/palette pixels at RGB MAE below 16/255. At frame 930 the ten unobstructed positions average **10.6941/255**. The eleventh (x=192,y=44) has a high RGB error (116.3/255 at frame930) where a blue **WINS** lettering overlay visibly covers the area. We cannot confirm whether the predicted red blob is actually drawn behind that overlay without a runtime draw-order or framebuffer trace; record it as visually occluded/unconfirmed, not source missing.

**Negative controls** at frame930: original `(0,-4)` placement gets 10 RGB matches; candidate `(0,0)`, `(-3,-4)`, `(3,-4)`, `(0,-1)`, `(0,-7)` get **zero** qualifying matches. Thus the common 4px displacement cannot be written off as a loose shape fit. The original source-transformed positions and native recorded pixels are specifically aligned.

Both independent verifier runs created **byte-identical** `research_outputs/O229_PIT_BLOOD177_ALL_POSITIONS_VIDEO_TEST.json`, SHA-256 **`016e95d630f50f515807e4beeb96f59471a3718c3ec7ee4e7d6ee09c93f167fb`**. No original game files modified; no app changes, DAC trace or code-level cause for the 4px shift claimed.

```
python scripts/verify-o229-pit-blood-full-11-position-video.py --game-zip /path/to/original-mk2.zip --video '/path/to/Recording 2026-10-17 151933.mp4' --project . --out /new/nonexistent/directory
```
