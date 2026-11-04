# O197 — Forest original five-layer browser experiment

This checkpoint extends O196 by rendering **all five separate original indexed Forest layer canvases**. The byte sources, descriptor offsets, opaque indices and mask are verified. The candidate-color preview uses the Forest-linked original executable palette, but **has not been checked against a gameplay palette witness**. No final scene placement or inter-layer positioning is claimed.

## Windows usage

1. Extract the source ZIP so that its root is `MK-DOS-Archive`.
2. Install dependencies with `npm ci`, then verify with `npm run build` and launch with `npm run dev`; the existing Windows UI launch script may also be used.
3. Load an unchanged original MK2 directory containing at least `MK2.EXE` and `FOREST.GRA` (the regular full original installation is recommended).
4. Open **Laboratory → Compile & hypotheses → O197 Forest's five original indexed layers**.
5. Press **Decode original Forest layers**. Select layers 1–5 and toggle color candidate, source-index grayscale with alpha, and independent opacity mask.
6. Export **complete five-layer forensic ZIP**; every original control record and graphics run, byte range, output plane and clipping statistic is included. These are five **independent** setup-local canvases, not an automatic stitched scene.

## Fixture verification without npm packages

```sh
node scripts/verify-o197-fixture.cjs "C:/path/to/your/MK2"
python scripts/verify-o197-export.py "C:/path/to/your/MK2" "C:/path/to/MKDOS_O197_Forest_Five_Original_Layers_Forensic.zip"
```

Optional test export from the fixture command:

```sh
# PowerShell example
$env:O197_ZIP_PATH="C:\\temp\\O197_test.zip"
node scripts/verify-o197-fixture.cjs "C:/path/to/your/MK2"
```

The independent Python script uses only the standard library and redecodes all 43 unique original sprite streams. It checks every `*.bin`, PNG pixel, placement JSON, command trace and per-layer SHA-256 against your original files; it does not trust the app's decoder results. The source reader never modifies original game files. Modified or duplicate originals are deliberately rejected by the write-protecting qualification gate.

## Related inherited features

O196's original Forest native floor remains separate. O195's cross-stage command comparison, O194 experimental research export/import and Compile All Knowns, the MK1 research and the Museum asset library remain present. The Forest layer experiment does **not** promote candidate-colored Forest PNGs into the trusted game compiler catalogue.

**Runtime caveat:** The full Vite/React browser build was not runnable in the research environment because `npm ci --offline` failed for an uncached registry package (`yallist@3.1.1`). Run `npm ci` and `npm run build` on Windows and report any errors from the actual browser UI.
