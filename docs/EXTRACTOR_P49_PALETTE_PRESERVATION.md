# P49 preserve explicit MK3 IFF palettes in indexed exports
2026-11-07; third interim after P46, develop only.

## Where we are
A demonstrated omission is fixed: decodeIff returned original indices, mask and embedded CMAP, but scanMK3 discarded those planes when registering images. The registry now retains them with IFF_CMAP_RGB8 / embedded-source provenance and paletteRuntimeOwnershipKnown:false. All 416 existing IFF pictures can therefore use P48's indexed inspector action. No new assets or decoding/preview changes.

The established selected ZIP serializer now writes a paletteRgb sidecar when an asset supplies that typed payload. Both queue ZIP and single indexed export preserve the explicit CMAP. Existing assets without this field retain their prior serialization. Single indexed export rejects malformed or out-of-range embedded tables. No palette is assigned to unresolved fighter sprites, stages or other images.

## Verified
All **416 original IFF images** independently decoded from DATA.MK3: **6,256,633 native pixels / 319,488 original CMAP bytes** match the exported index, mask and palette sidecars exactly. The independent decoder handles original PBM/ILBM and ByteRun row conventions. Source qualification is the explicit CMAP in that FORM, not native gameplay DAC ownership.

MK1 **2,656** and MK3 **9,186** compatibility suites PASS; both decoded visual hashes match P46. Current MK2 acceptance PASS at **5,369**, including cumulative suites, PORTAL/TOWER gates and independent 315-reference / 43-effect checks. P48 source-only export guards pass; **five invalid palette cases rejected**. Local TypeScript/build pass; existing bundle warning retained.

~~~sh
node scripts/verify-mk3-p49-palette-export.cjs <original-MK3-dir> <private-output>
python scripts/verify-mk3-p49-palettes-independent.py <original-MK3-dir> <private-output> --report <private-json>
node scripts/test-p49-palette-export.cjs
~~~

Private output remains outside repository/fixtures. No original CMAP bytes, images or ZIPs are committed. Source/CI associations follow committed verification.

## Uncertainty and next
The inspector button's real browser click/download remains VALIDATION PENDING. Explicit embedded image palette is verified; runtime palette banks, sprite ownership, native timing and full stage composition are not inferred.

Next **P50**: add this palette-aware export path to a repeatable cross-game indexed acceptance gate, retaining legacy archive/preview controls before P51 consolidation. P46 remains consolidated checkpoint; main remains P16. Stop updates state where, verified result, uncertainty and next step.
