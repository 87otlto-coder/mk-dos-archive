# MK DOS Archive — P7 Extractor-first Forest source layer integration

**Date:** 2026-11-04
**Baseline:** P6 cumulative source, left unchanged. P7 remains an interim working-copy change; the next full checkpoint is P11.
**Scope:** expose independently source-authenticated O197 Living Forest setup-local layers in the existing MK2 asset library, with no gameplay investigation and no UI/navigation refactor.

## Qualified material

O197 qualifies five independent Forest setup canvases, 60 placement records, and 43 unique encoded sprites. Original indexed pixels, alpha masks, and source-local signed positions are verified. The setup-local candidate RGB palette comes from an original 80-word EXE record, **not a runtime DAC observation**. Inter-layer offsets, parallax, final render order, runtime timing, and a complete composited screen remain unqualified. Floor is separately available through P4.

| Setup | Dimensions | Placements | Unique streams | Clipped opaque writes |
|--|--:|--:|--:|--:|
| 1 | 968×184 | 18 | 14 | 4,080 |
| 2 | 728×160 | 10 | 10 | 0 |
| 3 | 640×112 | 13 | 9 | 0 |
| 4 | 616×96 | 15 | 9 | 0 |
| 5 | 384×56 | 4 | 1 | 6,144 |

## Source implementation

- `src/core/assets/mk2ForestLayersP7.ts`: source-verified O197 adapter, five grayscale transparent index previews + five candidate-color PNG previews. Every asset exposes original index plane and transparency mask as metadata for selected export. Qualifiers prevent claimed runtime palette, final screen positions or stage completion.
- `src/core/assets/collection.ts`: calls the new adapter, includes its full original 40-member evidence ZIP, and records P7 verification status/limitation.
- `scripts/verify-mk2-p7-forest-integration.cjs`: fixture-backed cumulative scan + source byte/PNG parity + reject tampered/missing/duplicate sources + independent missing-Portal check + selected ZIP export.
- `docs/EXTRACTOR_UI_FEEDBACK_BACKLOG_P7.md`: user feedback for the future consolidation, intentionally unimplemented this pass.
- Existing O196/O197/O195 research modules were not modified.

## Results

- **P6 scanner baseline: 5,016 unique assets**.
- **P7 scanner: 5,026 unique assets** (five source-index previews, five explicitly candidate-color previews).
- All 312 U8→WAV exports, 43 effect frames, 8 Tomb/Portal setup layers, 15 native floor assets remain discoverable.
- O197 independent Python verifier confirmed all five canvases, 60 placements, 43 streams, 12,842 trace tokens, 15 PNGs and 40 forensic ZIP entries against original MK2.EXE and FOREST.GRA.
- O195 regression independently confirmed **7 stage sources / 77 original packed-floor tokens** as shared grammar evidence; reuse of parser mechanics is justified, shared artwork/color/camera behavior is not.
- Full scan and focused integration verifier: **115 checks PASS**; negative cases include missing/corrupt/duplicate Forest and modified MK2.EXE, while a missing Portal resource does not affect independently valid Forest.
- Targeted TypeScript checking PASS (Node `process` shim needed only because installed Node type packages are absent).
- Full React/Vite browser build/interactive navigation remain untested in this environment; this is a headless-verified interim source change, **not a new full release**.

## Reproduce

```bash
node scripts/verify-mk2-p7-forest-integration.cjs /path/to/original/mk2 /tmp/P7.json /tmp/P7_selected.zip
O197_ZIP_PATH=/tmp/O197_Forest.zip node scripts/verify-o197-fixture.cjs /path/to/original/mk2
python scripts/verify-o197-export.py /path/to/original/mk2 /tmp/O197_Forest.zip
node scripts/verify-o195-fixture.cjs /path/to/original/mk2
```

## Next

P8 should continue extractor-first integration, ideally focusing on another authenticated stage source set or existing animation-group relationship useful for previews/exports, then retest shared mechanisms on independent resources. Do not spend a pass on framebuffer internals absent a specific extraction blocker.
P11 should review the deferred interface feedback (independent asset scrolling, fixed inspector/navigation, restore all-assets view, evidence-based stage coverage, and meaningful stage preview) without endangering the research application.
