# MK DOS Archive O198 — Original Forest conditional mode roots

O198 follows O197. It preserves all five source-local Forest setup layers but adds the original stage-index dispatch→root→setup linkage. In the Laboratory, the three original root variants appear as switchable, **separate** groups of local source assets. They are *not* a reconstructed fight background.

## Windows application test

1. Extract the complete O198 project source ZIP outside the game directory. Do not place the commercial MK2 files inside the source project.
2. In a terminal opened at `MK-DOS-Archive`, run `npm ci`, `npm run build`, `npm run dev`. Open `http://localhost:3000` in the browser.
3. Select the unmodified original MK2 installation with the canonical `MK2.EXE` and `FOREST.GRA`. The original resource SHA-256 IDs are documented in the O198 checkpoint.
4. Go to **Laboratory → Compile & hypotheses → O198 Forest conditional configuration graph**. Click **Trace conditional Forest roots**. Change among **mode equals 2**, **mode equals 1**, and **mode other**. Only source-root-referenced independent layers will appear.
5. Export the **O198 complete forensic ZIP**. It should contain `MANIFEST.json`, source-reference evidence, a conditional-mode schematic, five original index planes, five opacity planes, five candidate-color preview PNGs and reproduction instructions. The export records no live-selected mode.

## Independent original-fixture verification

Run from `MK-DOS-Archive` with the original MK2 folder on your computer:

```sh
node scripts/verify-o198-fixture.cjs "C:/path/to/MK2"
python scripts/verify-o198-export.py "C:/path/to/MK2" "C:/path/to/MKDOS_O198_Forest_Conditional_Root_Graph_Forensic.zip"
```

Also run `node scripts/verify-o197-fixture.cjs "C:/path/to/MK2"` to check inherited graphics decoding. Source-original hashes are strict; patched or modified files are refused. No test alters the original files.

## What to look for

Mode 2 references original Forest source layers 1–5. Mode 1 and the fallback root each reference layers 1, 2, and 5. Mode 1 and fallback have **byte-identical root payloads** at distinct addresses. The setup references also map to original renderer accumulator channels (layer 1 → 5, layer 2 → 4, layer 3 → 2, layer 4 → 1, layer 5 → 0). These structural results are source-verified, but the executable's **live** mode, relative positions, actual parallax, palette application and final layering have not been observed.

If the UI doesn't load, provide its browser console/log and npm build output. Keep the original research source and evidence export separately for future checkpoint handoff.
