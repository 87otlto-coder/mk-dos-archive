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

Private output remains outside repository/fixtures. No original CMAP bytes, images or ZIPs are committed. Complete source and CI are verified below.

## Uncertainty and next
The inspector button's real browser click/download remains VALIDATION PENDING. Explicit embedded image palette is verified; runtime palette banks, sprite ownership, native timing and full stage composition are not inferred.

Next **P50**: add this palette-aware export path to a repeatable cross-game indexed acceptance gate, retaining legacy archive/preview controls before P51 consolidation. P46 remains consolidated checkpoint; main remains P16. Stop updates state where, verified result, uncertainty and next step.

## Committed source and CI

Source candidate **ba5ac3aa69f1b6a592b2bef33d55c8cbefea0a5d**, tree **52392386e250d2682fb82e2832937d2e4d04eebf**: all **2,264 blobs / 386 src files** match (98 raw / 2,166 checkout-newline-normalized), zero missing/mismatched/unsafe paths. Inventory SHA-256 **051b3bac9a8af3ef2b133466d3847b72fcebda71747b755110a170d3ae10c7da**. Runtime changes are limited to retaining already-decoded MK3 image planes and the shared exporter palette sidecar/validation path. Existing decoders and rendered pixels are unchanged.

[CI run 42379265733](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42379265733) completed SUCCESS on that exact source candidate, including five malformed-palette refusals on dummy data, independent verifier load, existing export/source controls, build/TypeScript and source-only Chrome startup. Original-fixture acceptance is recorded separately. Subsequent evidence-only commit changes this handoff, status and validation JSON; runtime/verification source remains identical to the audited CI candidate. Actual browser interaction remains pending; main stays P16.
