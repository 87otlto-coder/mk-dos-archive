# MK DOS Archive — Handoff — Pass 1E.3O.16 Kano Animation Exportability Census

**Date:** 2026-09-29 (SAST)  
**Status:** **IMPLEMENTED / DIRECT CANONICAL STRUCTURAL VALIDATION PASSED / NORMAL-APP USER-DIRECTORY EXPORT PENDING**

## Purpose

O16 is the first pass after the project explicitly moved to an **export-first** product direction. EXE write-back remains available as an internal proof technique, but arbitrary relocation/modding is no longer on the critical path unless an extraction question actually requires it.

This pass is read-only. It asks how much of Kano's table-addressable animation structure can already be normalized into a useful export-planning model without pretending that one verified heart-rip fixture proves all MK1 animation semantics.

## Canonical fixture

- `MK1.EXE` size: **1,157,222 bytes** (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- qualified static-data file-image base re-derived in O16: `0x0008CA54`
- established code file-image base used for the already-qualified animation dispatcher: `0x00050A54`

O16 re-derives the static-data base from the reconstructed physical handle-table start minus the Watcom `_handleTable` offset. It does not assume the value solely because earlier passes established it.

## Table boundary established

Watcom symbol evidence bounds:

- `KANO_ANITAB`: `0x00013F6C`
- next same-module DATA symbol: `MSU_KANO` at `0x00014100`
- span: **404 bytes**
- dword cells: **101**
- physical table start: `0x000A09C0`

The 101-cell extent is therefore a bounded KANO.ASM fixture fact. It is not assumed to be the size of other fighter animation tables.

## Animation command grammar rechecked

O16 independently rechecks the canonical code shapes previously established in O1 for `DO_NEXT_A9_FRAME` and handlers 1..6:

- `0` — terminator;
- `1` — A9 stream redirect;
- `2` — `FLIP_MULTI`;
- `3` — signed X adjustment;
- `4` — signed X/Y adjustment;
- `5` — immediate frame assignment / no sleep;
- `6` — callback;
- values `> 6` — ordinary frame target values.

All six handler shapes plus direct-frame and terminator branches matched the canonical executable during direct validation.

## Direct canonical census result

All **101/101** `KANO_ANITAB` cells classify structurally with **0 unresolved cells**:

- **84** animation-stream cells;
  - **72** descriptor-vector stream cells;
  - **10** direct-descriptor stream cells;
  - **2** control-only streams with no image-frame events;
- **4** direct-descriptor table entries;
- **11** zero/unassigned cells;
- **2** small scalar/sentinel cells (`1`) whose semantics remain deliberately unknown.

The 84 stream cells reduce to **79 unique stream starts** because several table cells alias the same payload.

Unique stream termination:

- **69** end-terminated streams;
- **10** looping streams.

## Frame-target normalization

Across the unique reachable streams:

- **168** unique frame targets;
- **156** structurally valid zero-terminated descriptor-pointer vectors;
- **12** direct WITH_XY descriptor targets;
- **0** unresolved frame targets.

The vector records contain:

- **152** one-part records;
- **3** two-part records;
- **1** three-part record.

The three-part record is the already-verified O14 `heart_2` fixture at `0x0000B254`.

The three two-part records occur under table index **64** and combine one `GRAPHICS/KANO.GRA` descriptor with one shared `GRAPHICS/VICTORY.GRA` descriptor. This is **CORROBORATED structural export evidence**, not yet an independently runtime-qualified semantic label for index 64.

## Descriptor/resource census

O16 normalizes **163 unique WITH_XY descriptors** reachable from the classified table structures:

- File ID 35 — `GRAPHICS/KANO.GRA`: **146**
- File ID 0 — `GRAPHICS/STANCE.GRA`: **7**
- File ID 2 — `GRAPHICS/MISC.GRA`: **7**
- File ID 1 — `GRAPHICS/FONTS.GRA`: **2**
- File ID 3 — `GRAPHICS/VICTORY.GRA`: **1**

Two table indices use more than one resource family in their reachable frame targets:

- index **64** — `KANO.GRA` + `VICTORY.GRA`;
- index **80** — `KANO.GRA` + `FONTS.GRA`.

This is exactly the kind of dependency information an export-oriented product needs to avoid dumping unrelated PNGs without composition context.

## Alias evidence

Repeated non-zero table payloads include:

- indices `0` and `100` → `0x000140DC`;
- indices `32` and `49` → `0x00014928`;
- indices `74`, `75`, `76` → `0x00014AFC`;
- indices `85` and `91` → `0x000140C4`;
- scalar indices `90` and `99` both contain `1` (semantic meaning intentionally unresolved).

The normalized census also reports **44** shared frame targets and **13** descriptors reused across more than one normalized frame-target usage.

## O14 anchor and critical scope boundary

`KANO_ANITAB[67]` exactly matches the O14 verified heart-rip PRIMARY sequence pointer.

However, O14 also proves a separate `BEAT_LOOP` at Watcom `0x0000B234` with frame refs `0xB274`, `0xB27C`, `0xB26C`. That substream is not reached merely by parsing the `KANO_ANITAB[67]` PRIMARY stream.

Therefore:

**KANO_ANITAB is not the complete Kano animation universe.**

This counterexample is retained explicitly in the O16 report so future work does not accidentally equate “table-addressable animations” with “all animation data used by Kano.”

## Confidence interpretation

- O14 heart-rip structures: **VERIFIED** from prior accepted closeout evidence.
- repeated grammar-compatible descriptor-vector/direct-descriptor structures: **CORROBORATED** structural/export evidence.
- direct descriptor values stored directly in table cells: **INFERRED** as static exportable descriptors; table-consumer semantics are not yet assigned.
- zero slots and scalar value `1`: semantic meaning **UNKNOWN**.

No runtime claim is made for every table index.

## Source changes

Added:

- `src/games/mk1/research/kanoAnimationExportabilityCensus.ts`
- `scripts/run-kano-animation-exportability-census.mjs`
- this handoff.

Updated:

- `src/components/ResearchQuickActions.tsx` — workflow now **25/25** and exports O16 JSON;
- `src/appMetadata.ts` — O16 milestone label;
- `metadata.json`;
- `package.json` — O16 smoke command;
- `README.md`;
- `docs/CURRENT.md`;
- `docs/RESEARCH.md`.

## Direct validation performed

The O16 core was executed against the byte-identical canonical MK1 executable reconstructed earlier, combined only with authentic directory inventory metadata for resource filenames/sizes. This was a **developer structural validation**, not a replacement for the eventual normal-app user-directory export.

Checks passed:

1. canonical executable SHA;
2. static-data base re-derived exactly;
3. animation command grammar reproduced;
4. KANO_ANITAB symbol span dword-aligned;
5. all 101 table cells classified;
6. all grammar-compatible frame targets resolved;
7. repeated descriptor-vector evidence present;
8. both two-part and three-part vector structures present;
9. O14 heart-rip index 67 matched;
10. scope boundary preserved.

Direct verdict:

`KANO_ANITAB_EXPORTABILITY_CENSUS_ESTABLISHED`

## What O16 does NOT establish

- complete enumeration of every Kano animation/substream;
- semantic names for all 101 table indices;
- runtime qualification of every structurally compatible stream;
- a universal MK1 fighter animation table size;
- a universal MK1 frame-record representation;
- MK2/MK3 compatibility;
- GRA pixel export from the actual original resource bytes in this developer environment;
- any EXE writer.

## Recommended continuation

Do not return to relocation unless an extraction requirement makes it necessary.

The strongest next read-only step is **cross-fighter repetition**: apply the same table-boundary/grammar/exportability census independently to the other MK1 fighter modules and compare what truly repeats versus what is Kano-specific. Only after repeated evidence should any mechanism be promoted toward an MK1-wide animation abstraction.

When actual sprite/frame image export becomes the next requirement, obtain the user's original MK1 installation archive so the `.GRA` bytes can be decoded directly rather than relying only on authenticated inventory metadata.
