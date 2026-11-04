# MK DOS Archive — Handoff — Pass 1E.3O.27 Stage/Background Resource Graph Census

**Date:** 2026-09-30  
**Status:** VERIFIED / AUTHENTIC-INSTALL READ-ONLY CENSUS COMPLETE

## Purpose

O27 starts the stage/background export branch after O25/O26. It does not write the executable and does not assume arcade stage names. The pass reconstructs the canonical `BGND.ASM` top-level module records consumed by `INIT_BAKMODS`, resolves their HDRS.GRA roots through the verified MK1 handle table, follows scene-list references into `BGNDTBL.ASM`, binds referenced BMODs to exact `BGNDPAL.ASM` palette tables, and validates the shared NO_XY descriptor prefixes against the user's authentic MK1 GRA resources.

## Authentic source

- `MK1.EXE` size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- Watcom static-data physical base: `0x0008CA54`
- Source kind: user-loaded authentic installation

## Static `INIT_BAKMODS` grammar

The top-level background record begins with a 28-byte fixed header followed by a variable scene list.

Statically verified fields:

- `+0x00`: packed GRA root reference consumed before the `INIT_BAKMODS` body;
- `+0x04..+0x0F`: six 16-bit words, preserved raw because their individual meanings are not yet promoted;
- `+0x10`: indirect initialization callback;
- `+0x14`: auxiliary data pointer, semantics intentionally unresolved;
- `+0x18`: destination background-module list pointer;
- `+0x1C+`: variable scene list:
  - dword `1` = literal control marker;
  - dword `0xFFFFFFFF` = terminator;
  - otherwise an 8-byte entry `[BMOD ref][packed signed-pair argument]`.

## Direct authentic-install result

O27 recovered:

- **24** top-level `BGND.ASM` background-module records;
- **15** unique HDRS.GRA resource contexts/files;
- **68** scene BMOD references;
- **41** unique referenced `BGNDTBL.ASM` BMOD records;
- **4** literal-one scene control markers;
- **15** exact BGNDPAL palette-table bindings;
- **548** contiguous NO_XY descriptors across the 15 contexts;
- **548/548** successful authentic-GRA uGRA decodes;
- **0** descriptor decode failures.

Every one of the 41 referenced BMOD placement tables terminates with `0xFFFF` exactly at its count-bounded endpoint.

## Resource contexts

The 15 verified resource/palette contexts are:

- `S1HDRS.GRA` / `S1PALS` — 16 descriptor prefix records
- `T1HDRS.GRA` / `T1PALS` — 20
- `T2HDRS.GRA` / `T2PALS` — 20
- `NG1HDRS.GRA` / `NG1PALS` — 17
- `NG2HDRS.GRA` / `NG2PALS` — 17
- `S2HDRS.GRA` / `S2PALS` — 16
- `FU2HDRS.GRA` / `FU2PALS` — 55
- `FU4HDRS.GRA` / `fu4PALS` — 66
- `FU1HDRS.GRA` / `FU1PALS` — 93
- `FU5HDRS.GRA` / `FU5PALS` — 85
- `FU7HDRS.GRA` / `fu7PALS` — 49
- `FU8HDRS.GRA` / `fu8PALS` — 44
- `PAGEHDRS.GRA` / `PAGEPALS` — 16
- `ACT1HDRS.GRA` / `ACT1PALS` — 17
- `ORE1HDRS.GRA` / `ORE1PALS` — 17

## BMOD structure established at O27

Each referenced BMOD is exactly 18 bytes in canonical data and contains:

- three initial 16-bit words;
- a dword placement-table reference;
- a dword descriptor-table reference;
- a dword palette-table reference.

At O27 only the third initial word is promoted as the placement-record count because its table contains exactly `count` 8-byte records followed by `0xFFFF`. The first two words and the four placement-record words remain raw at this pass. O28 is the intended consumer-analysis follow-up.

## PIT fixture selected for the next pass

`PIT_MOD` is a clean bounded fixture:

- root resource: `GRAPHICS/FU5HDRS.GRA` (file ID 27);
- palette table: `FU5PALS`;
- destination list: `BAK0MODS`;
- scene list:
  - `bridge0BMOD`, packed argument `0x02D1000E` (signed pair 14, 721)
  - `bridge1BMOD`, packed argument `0x00590000` (signed pair 0, 89)
- `bridge0BMOD` placement count: 25
- `bridge1BMOD` placement count: 333
- shared descriptor table: `0x000023A4`, 85 verified NO_XY descriptors.

The packed-pair values are preserved as a signed pair here; O27 does not yet promote their spatial meaning.

## Validation

All 14 O27 checks passed, including:

- canonical authentic source;
- verified handle-table prerequisite;
- valid Watcom permanent classes;
- 24 BGND module records;
- 15 stage resource contexts;
- 41 unique BMODs / 68 scene BMOD entries;
- 4 literal-one markers;
- all 41 placement terminators;
- exact palette-table symbol binding;
- 548 descriptor prefixes;
- 548 successful authentic stage-resource decodes;
- no semantic overclaim of layout fields;
- no arcade-stage-name overclaim;
- no write path.

A fresh rerun from the packaged O27 source is semantically identical to the original direct report after excluding run-specific timestamp/operation IDs.

## Verdict

`MK1_BACKGROUND_MODULE_RESOURCE_GRAPH_ESTABLISHED`

## Boundaries retained

O27 does **not** yet establish:

- individual placement-record field semantics;
- final object position equations;
- palette selector bit packing inside placement records;
- descriptor selector bit packing inside placement records;
- renderer z-order;
- clipping/scroll transform;
- full scene pixel composition;
- arcade stage-name equivalence for the internal module labels;
- any write path.

## Continuation

Proceed to O28 by following the BMOD records into the canonical `BAKGND.ASM` consumer, then validate the derived selector/position grammar over all O27 placement records. Use `PIT_MOD` as the first bounded product-facing scene IR fixture. Do not promote a canonical full-stage raster unless render order and scroll/clipping semantics are independently established.
