# MK DOS Archive — O96V / O96W MOUNTAIN Palette Record and Allocator Path

**Date:** 2026-10-09 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** INDEPENDENTLY VERIFIED / MK2 RESEARCH OPEN

## Authority

- Immediate source: `MK-DOS-Archive-2026-10-09-O96U-source.zip`, SHA-256 `449d6de6cf4cb1a206e84fe7bb707cb6621511b67461dce216cb5ef6329f8fdb`.
- Authentic `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Authentic `MOUNTAIN.GRA` SHA-256 `0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6`.
- Parent O96T and O96U research reports remain unchanged. Original game files were never edited.

## O96V — Relocation-backed shared palette candidate

The previously uninterpreted `0x0002B52A` DWORD at `+0x0C` in **all 15** consecutive 16-byte `MOUNTAIN.GRA` descriptor records is **not** an arbitrary scalar or another packed GRA offset. Every such source is an exact **Type-7, 32-bit, Object-1 LE relocation** to Object-1 offset `0x2B52A`, file physical `0x8D17E` (Object-1 file-backed base `0x61C54`). The eight adjacent DWORDs at Object-2 `0x1C5BC` (physical `0xBD210`) likewise contain the same relocation. There are **exactly 23** such typed references in the independently reconstructed full 27,004-record LE fixup corpus.

At physical `0x8D17E`, the authentic byte record parses **exactly** as the MK2 allocator's O71 `[u16le colourCount][colourCount × u16le packedColour]` grammar. Important correction to a tempting false assumption: the `0x000000CF` initial DWORD contains a **u16 count `207` followed by the first u16 colour `0`**; it is not a 32-bit count preceding the palette. The record spans **416 bytes**, with **207** valid 15-bit colour words, **180 distinct** source words. Record SHA-256: `79e1cd5f0bbe8c1daebc30140b43c8627749b38f2205743dc3cc078e9179f5e4`.

All 15 independently decoded Mountain images use source indices at or below **96**; their entire index domain fits this 207-colour record. This resolves the previously observed **63-colour size incompatibility structurally**, without requiring a guessed index remap. The data does **not** establish which palette handle each O96S object receives in an actual scene, nor an observed correct-colour final render.

## O96W — Conditional allocator consumer join

Two separate file-backed Object-2 setup records at offsets `0x1C31E` and `0x1C330` each carry an authenticated relocated **`+0x0E` pointer to Object-2 `0x1C5BC`**. There are also exact relocated sources pointing to both setup records. That common table contains eight typed pointers to the O96V Object-1 207-colour record.

At physical executable `0x81DD5..0x81DDF`, machine code explicitly reads `DWORD [ESI+0x0E]` as the pointer-array base, adds a computed four-byte slot displacement, dereferences the resulting record pointer into EAX, calls the established allocator `0x7B439`, and writes the resulting handle into object field `+0x30`. The allocator's instruction path at `0x7B489/0x7B48C` reads a 16-bit colour count and skips two bytes to reach the colours, exactly matching the O96V palette record.

**Qualification boundary:** the two setup records and this allocator consumer have a file-backed structural path and a compatible exact pointer-table contract, but the current bounded pass does **not** prove that ESI actually points to either setup record on any specific runtime invocation. It also does not prove that the O96S 14 selected Mountain-image objects receive this handle. Thus `correctColorStageExportReady` remains **false**.

## Hypotheses and decisions

| Hypothesis | Result |
|---|---|
| Mountain trailing `+0x0C` DWORD is a real Object-1 pointer | **SUPPORTED** (typed LE relocation for all 15) |
| Target has a 207-colour MK2-compatible palette record grammar | **SUPPORTED** (count, bounds, packed words and allocator grammar) |
| An unchanged 63-entry palette directly covers all 15 sprites | **REJECTED** (indices reach 96) |
| An unchanged 207-entry record can address every observed sprite source index | **SUPPORTED structurally** |
| Eight palette-array entries alias this same record | **SUPPORTED** (eight more typed relocations) |
| Setup records connect to the table and allocator accesses `[ESI+0x0E]` | **SUPPORTED**, conditional on ESI's runtime binding |
| Actual object-to-palette runtime handle or correct colours are established | **UNPROVEN** |

## Verification

- TypeScript/Node producer against original fixture: **PASS**, full LE fixup reconstruction **27,004**.
- Separate Python independent verifier: **58,159 checks / 0 failures**, reparsing the full fixup corpus, independently decoding all 15 graphics streams for the index maximum, and authenticating allocator machine bytes.
- Fresh prior regressions: O96S **54,611/0**; O96T **4,007/0**; O96U **957/0**.
- Three falsifications correctly rejected: changed Object-1 target offset, fabricated 63-colour count, and unsupported claim of proven runtime palette-handle ownership.

New evidence:

- `mk2_mountain_shared_palette_relocation_o96v_2026-10-09.json`
- `mk2_mountain_palette_allocator_setup_o96w_2026-10-09.json`
- `scripts/run-mk2-o96v-o96w-mountain-palette.mjs`
- `scripts/verify-mk2-o96v-o96w-mountain-palette.py`

## Next bounded research target — O96X

Trace the actual ESI setup-record selection into `0x81DD5`, and the palette-handle flow into the Mountain object creation path, with explicit branch/state provenance. If no executable or runtime proof emerges, retain `UNKNOWN` and move to the **168,724-byte MOUNTAIN.GRA prefix**, other uncovered MK2 GRA families, stage layers or non-MID audio. Do not equate palette index compatibility with observed RGB ownership.

**Historical completion metrics are unchanged:** 7 bounded fixed-identity animations, 210/253 terminal-qualified pointer routes, 239/253 strong consumers, 14 held, 9/17 proven correct-colour identity slots, 94/124 exact-full GRA resources. No complete stage or RGB-ready Mountain arrangement is claimed.

**Mandatory sequence:** complete MK2 → complete MK1 → complete MK3 → user UI/usability discussion → extractor implementation.
