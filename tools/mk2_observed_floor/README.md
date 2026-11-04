# O116 — Screenshot-observed MK2 packed-stage floor previews

## Capability

This bounded preview tool renders original `TOMB.GRA` and `PORTAL.GRA` packed **floor regions**, using the **conditional** original source-byte-to-displayed-RGB associations authenticated from the user's O115 gameplay screenshots. It can render the authentic source or an O111-receipt-authenticated bounded edit. The browser app has a companion `MK2ObservedStageFloorPanel` with the same measured palette data and a source X selector. Pixel outputs from both implementations match byte-for-byte.

This is NOT a complete stage preview, authenticated live palette-bank identity, dynamic camera-state reconstruction, or native VGA DAC extraction. In particular **O112 `camera_x=292` does not give the Portal screenshot mapping**. Do not exchange the image-space source crop `sourceLeft=292` with a hypothetical game camera register. The observed Portal constant-crop model pixel-matches 4,420 unoccluded image pixels in the original user screenshot, and the Tomb preview lacks a separate unmodified Tomb gameplay control.

## Requirements

- Python 3 and Pillow; no DOSBox needed for the static preview.
- Your *own legally obtained* original MK2 game files (not packaged in this source archive).
- The precise O115 report in `research_outputs/O115_PORTAL_26_RAMP.json` or `O115_TOMB_23_RAMP.json` (SHA-256 pinned).

Run from the project root:

```sh
python tools/mk2_observed_floor/mk2_observed_floor.py \
  --resource /your/MK2/PORTAL.GRA \
  --ramp-report research_outputs/O115_PORTAL_26_RAMP.json \
  --source-left 292 --scale 3 \
  --png /tmp/portal_floor.png --manifest /tmp/portal_floor.json

python tools/mk2_observed_floor/mk2_observed_floor.py \
  --resource /your/MK2/TOMB.GRA \
  --ramp-report research_outputs/O115_TOMB_23_RAMP.json \
  --source-left 290 --scale 3 \
  --png /tmp/tomb_floor.png --manifest /tmp/tomb_floor.json
```

The tool refuses existing output files, modified originals without an O111/O112-style reversible receipt, bytes outside the source-index witness domain, unsupported stages, partial reports and changed evidence digests. For a modified source, provide `--receipt /path/to/edit_receipt.json`. Source files are read-only. Preview PNGs are exported nearest-neighbor at native 320 pixels wide (scale=1) or 2–8×.

## Reproduce / verify

Set `MK2_ORIGINAL_ZIP` to your personal canonical `mk2.zip` in environments other than this research host.

```sh
MK2_ORIGINAL_ZIP=/path/to/mk2.zip python -m unittest discover -s tools/mk2_observed_floor -p 'test_*.py' -q

python tools/mk2_observed_floor/verify_o116_independent.py \
  --original-mk2 /path/to/mk2.zip --project . --demos /path/to/generated/pngs-and-manifests

python tools/mk2_observed_floor/adversarial_o116.py \
  --original-mk2 /path/to/mk2.zip --project . --demos /path/to/generated/pngs-and-manifests

node --experimental-strip-types scripts/run-mk2-o116-observed-floor-bridge.mjs /path/to/original_GRA_directory
```

The independent verifier requires both `portal.png`, `portal.json`, `tomb.png`, `tomb.json` inside `--demos`. All original resources and stage SHA-256 identities are checked, 3× output PNG pixels are recomputed independently, and the O114 original Portal screenshot is checked against O115 RGB witnesses with no fitting performed.

## Browser app

`src/games/mk2/research/observedStageFloorPreviewO116.ts` is the pure evidence-locked browser decoder. `src/components/MK2ObservedStageFloorPanel.tsx` is included in the MK2 section of `src/App.tsx`. Load your original MK2 directory, expand **Advanced research & file inventory**, and choose Portal or Tomb in the bounded observed-floor panel. The browser UI **accepts only canonical unedited** resources; receipt-authenticated previews remain in the Python CLI.

The renderer TS compiles in isolation and the Node-based bridge test passes. A full React/Vite build could not be completed in the offline research environment because the project's React dependency tree is not installed; the UI integration awaits validation in a normal dependency-equipped build. Do not report this UI as fully validated.

## Checks and evidence

- 50 distinct Python regression scenarios executed (security boundaries, geometry, edits, deterministic output).
- 26 browser/Node bridge assertions passed; both RGBA outputs exactly equal the independent Python output digests.
- 253,440 output PNG pixels independently compared for scale=3 (Portal 115,200; Tomb 138,240).
- 4,420 Portal unoccluded screenshot pixels exactly reconstructed; four nearby wrong alignments rejected.
- 9 deliberate preview metadata/image forgeries rejected by independent verifier.
- 79 earlier O111–O115 Python tests retained and passed, total 129 Python tests.

**Qualification:** 50 targeted *development verification scenarios*, not 50 newly reverse-engineered runtime discoveries or gameplay sessions.
