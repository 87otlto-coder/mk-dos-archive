# MK DOS Archive — Pass 1E.3O.44 Multi-Stage Fresh-Initial Ordinary BAK Export Handoff

**Status:** VERIFIED (bounded read-only export package)  
**Verdict:** `MK1_MULTI_STAGE_FRESH_INITIAL_ORDINARY_BAK_EXPORT_PACKAGE_ESTABLISHED`

## Scope

O44 renders every O43-qualified fresh ordinary-placement state into deterministic correct-colour RGBA/PNG assets. The result is a library of placement-derived background layers, **not** canonical gameplay screenshots or complete dynamic stages.

Excluded from every composite:

- init-callback/process-created objects;
- shadow and other special lists;
- descriptor-cycle/process evolution;
- later camera/cull/recreate history;
- fighters/gameplay objects;
- HUD/framebuffer state.

## Source-asset reconstruction

Across the 2,153 visible placement instances, O44 requires **370 unique source variants**. Each variant is identified by authentic resource identity, exact GRA byte offset, descriptor dimensions and exact count-prefixed palette-record reference.

For each variant O44:

1. reads the authentic module `HDRS.GRA` resource;
2. decodes the uGRA stream at the exact descriptor GRA offset;
3. reads the exact count-prefixed palette record from canonical `MK1.EXE`;
4. verifies every opaque palette index is in range;
5. generates deterministic RGBA.

No palette is inferred from filename, visual plausibility or dominant resource context.

## Composite package

O44 exports:

- **370** unique correct-colour source-variant PNG/RGBA payloads;
- **24** transparent 320×200 module composites;
- **394 total** RGBA/PNG payloads.

The 24 module composites produce **22 unique raw-RGBA rasters**. The exact duplicate pairs under this bounded ordinary-layer state are:

- `PIT_MOD` = `PIT_MOD386`;
- `GNINJA_MOD` = `GNINJA_MOD386`.

PIT reproduces the independently verified O42 raw-RGBA SHA-256 exactly:

`a0d3f10adf58c9a22dc53898ed618ad07fbb1e5bc0c5a56ce1b877f7d6dbe4bc`

## Independent validation

A separate Python implementation did not import the O44 TypeScript implementation. It independently:

- re-read canonical `MK1.EXE` and authentic GRA resources;
- decoded all 370 unique uGRA source variants;
- colourized them from the exact count-prefixed palette records;
- compared every generated source PNG at raw RGBA level;
- consumed O43's independently verified draw orders;
- independently clipped and composited all 24 320×200 layers;
- compared every module composite at raw RGBA level.

Result:

- source PNG exact matches: **370/370**;
- module composite exact matches: **24/24**;
- unique composite rasters: **22**;
- PIT O42 hash regression: exact match.

## Boundary

O44 is the first broad deterministic ordinary-stage-layer library. It does not collapse already-qualified stage dynamics into these images. ARENA, PILLAR, PIT, CAVE and STRIPPED dynamic/process exports remain separate time/process-state assets. Later camera/cull history and complete gameplay-frame composition remain separate research problems.
