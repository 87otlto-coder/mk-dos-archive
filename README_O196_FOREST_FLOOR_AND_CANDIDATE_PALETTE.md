# O196 — Forest original floor and source-palette experiment

This is a **research** view, not the original game's full Forest stage. Only native-source indexed floor pixels are verified. The colored floor preview uses a **Forest source-linked candidate** 80-color palette without a gameplay/runtime DAC witness.

## Run in the UI

1. Launch MK DOS Archive O196 from its normal Vite Windows setup.
2. Load an unchanged DOS MK2 directory containing original `MK2.EXE` and `FOREST.GRA` (plus optional other stages for earlier experiments).
3. Navigate to **Laboratory → Compile & hypotheses → O196 Forest source floor & palette candidate**.
4. Select **Inspect Forest original floor**; compare the original-index and source-linked candidate-color view.
5. Select **Full forensic ZIP + source index plane** to download the complete evidence. It includes source hashes and offsets, all 80 palette words, 60 Forest control descriptors, raw pixel index bytes and two deterministic PNGs.

The original image is 896×32. Only UI display height is enlarged; exports remain native 896×32. No game files are modified by the source reader or preview.

## Independent CLI verification

```sh
node scripts/verify-o196-fixture.cjs "C:/path/to/original/MK2"
python scripts/verify-o196-export.py "C:/path/to/original/MK2" "C:/path/to/MKDOS_O196_Forest_Native_Floor_Forensic.zip"
```

For the full UI, first run `npm ci` (network/local dependencies required), then `npm run build` and `npm run dev`. The source package does not contain original commercial game resources. Original resources should not be patched for this read-only experiment. A changed original EXE or Forest graphics file intentionally fails strict qualification.

The O195 cross-stage floor-control experiment and O194 Compile All Knowns remain in the same Laboratory section. O196 is a source-backed *research preview* and is **not** added to the trusted compilation asset catalogue as a verified live-color image.
