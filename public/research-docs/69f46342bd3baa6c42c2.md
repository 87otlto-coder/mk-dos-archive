# MK DOS Archive — Pass 1E.3O.50 Corrected Product-Facing Stage Export Package

**Status:** VERIFIED  
**Verdict:** `MK1_CORRECTED_PRODUCT_FACING_STAGE_EXPORT_PACKAGE_ESTABLISHED`

O50 rebuilds the product-facing stage package after O49 established the missing horizontal-orientation rule and the CHOP/STATUE static moon.

Implementation rule:
- original uGRA source sprites remain unmodified;
- each fresh-visible placement carries its original control word;
- control bit `0x0010` is applied as horizontal flip only when rasterizing the placement instance;
- existing renderer draw order and palette/descriptor selection are unchanged;
- the CHOP/STATUE moon is independently decoded and drawn at screen `(72,15)` on plane 4 before those stages' lower ordinary planes.

Corrected package contents:
- 24 corrected fresh-initial ordinary stage PNGs;
- 7 normalized combined background PNGs: ARENA_MOD, CAVE_MOD, CHOP_MOD, PILLAR_MOD, PIT_MOD, STATUE_MOD and STRIPPED_MOD;
- 1 shared moon PNG;
- 24 time-aware scene-IR JSON documents;
- 24 corrected coverage JSON documents;
- 32 total PNG payloads and 48 per-stage structured documents.

Regression behavior:
- exactly the 14 O49-affected module variants change at the ordinary-raster level;
- the remaining 10 ordinary rasters stay exact;
- PIT_MOD and PIT_MOD386 remain unchanged;
- O50 raises directly rendered combined fixtures from five to seven by resolving CHOP_MOD and STATUE_MOD.

Independent Python verification rebuilt all 24 ordinary rasters from authentic EXE/GRA bytes using O43 fresh draw-order evidence and O31 control words, then independently rebuilt all seven combined fixtures. The moon was re-derived directly from its EXE setup/descriptor/palette record. Audit result: 122/122 checks passed.

Final evidence:
- `mk1_corrected_stage_export_package_o50_final.json` SHA-256 `51725dee2143dc507b5e46f5f1e3b3239526b61a516353552c63969b3cd303b9`
- `mk1_o50_independent_audit_final.json` SHA-256 `cce2b9d4f638f5e6d6f1e81d9d399503a64c520afc548bcc96ff9b103e4284e8`

Boundary: the package remains a bounded background export system. Normalized combined fixtures are not canonical gameplay screenshots, and unresolved RNG/process phase, shadow state, sibling dynamic variants, fighters and HUD are not invented.
