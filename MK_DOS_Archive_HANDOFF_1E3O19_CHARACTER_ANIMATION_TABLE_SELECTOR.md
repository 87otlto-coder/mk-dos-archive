# MK DOS Archive — Handoff — Pass 1E.3O.19 Character Animation Table Selector

Date: 2026-09-29

## Status

**STATICALLY VERIFIED AGAINST CANONICAL MK1.EXE / AUTHENTIC-INSTALL PREREQUISITE CHAIN / NORMAL-APP INTEGRATION IMPLEMENTED**

Direct verdict:

`MK1_CHARACTER_ID_TO_ANITAB_SELECTOR_ESTABLISHED`

O19 is a read-only export-organization pass. It mechanically establishes the runtime bridge from the game's already-qualified character identity field to the eight `_ANITAB` tables discovered in O17. It does not write the executable, does not assign gameplay names to individual animation-table indices, and does not claim an ANITAB is the complete animation universe for a character.

## Why this pass exists

O17/O18 can say that eight animation-table families exist and that all 1,102 reached descriptors decode from authentic GRA payloads. For an exporter, however, filenames such as `VANDAN.ASM` and `LIZ.ASM` are not an acceptable substitute for proving which runtime character selects which table.

O19 therefore asks:

> What executable mechanism maps the runtime character identity to the selected ANITAB, and what is the exact nine-slot mapping?

## Canonical fixture

- `MK1.EXE`: 1,157,222 bytes
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Prerequisite evidence is bound to:

- O17 ANITAB structural comparison;
- established fighter/roster identity evidence;
- established special opponent IDs for Goro/EMP.

## GET_CHAR_ANI

Watcom Segment-1 code symbol:

- symbol: `GET_CHAR_ANI`
- Watcom offset: `0x00009CA6`
- physical file offset: `0x0005A6FA`

Canonical bytes:

`8B 47 48 8B 14 85 14 99 00 00 A1 54 4B 02 00 8B 04 82 A3 54 4B 02 00 C3`

The bounded instruction shape establishes:

1. `mov eax,[edi+0x48]` — read the already-qualified object character-identity field;
2. `mov edx,[eax*4+0x9914]` — select one of nine ANITAB base pointers by character ID;
3. `mov eax,[0x24B54]` — read Watcom Segment-2 symbol `A9`;
4. `mov eax,[edx+eax*4]` — index the selected character table by A9;
5. `mov [0x24B54],eax` — replace A9 with the selected table payload;
6. `ret`.

This is the mechanically established character -> ANITAB -> table-index bridge needed to organize exports by character identity.

## Selector table

The selector table is a contiguous nine-dword structure:

- Watcom Segment-2 offset: `0x00009914`;
- physical file offset: `0x00096368`;
- entries: 9.

Exact mapping:

| Character ID | Qualified identity | Selected ANITAB | Module |
|---:|---|---|---|
| 0 | CAGE | `VANDAN_ANITAB` | `VANDAN.ASM` |
| 1 | KANO | `KANO_ANITAB` | `KANO.ASM` |
| 2 | RAYDEN | `RAIDEN_ANITAB` | `RAIDEN.ASM` |
| 3 | LIU KANG | `KANG_ANITAB` | `KANG.ASM` |
| 4 | SCORPION | `NINJA_ANITAB` | `NINJA.ASM` |
| 5 | SUB-ZERO | `NINJA_ANITAB` | `NINJA.ASM` |
| 6 | SONYA | `LIZ_ANITAB` | `LIZ.ASM` |
| 7 | GORO | `GORO_ANITAB` | `GORO.ASM` |
| 8 | EMP | `EMP_ANITAB` | `EMP.ASM` |

The shared `NINJA_ANITAB` selection for character IDs 4 and 5 is explicit executable structure, not a filename inference.

All eight O17-discovered ANITAB symbols are reachable through this nine-character selector; the reason there are nine slots but eight unique tables is precisely the shared Scorpion/Sub-Zero table.

## A9 bridge

Watcom Segment-2 symbol:

- `A9`
- offset `0x00024B54`.

`GET_CHAR_ANI` uses its current value as the dword index into the selected ANITAB and stores the selected table payload back into A9.

This proves the selector/indexing mechanism. It does **not** by itself establish a semantic name for every possible A9 index.

A broad raw scan shows many code writes to A9, including hundreds of immediate values. Those writes must not be naively converted into animation names. Future semantic labeling requires bounded code/call-site attribution and, where necessary, runtime or source-level contextual evidence.

## What O19 establishes

**STATICALLY VERIFIED:**

- `GET_CHAR_ANI` exists at the stated canonical code location;
- it reads the established +0x48 character identity field;
- it indexes a nine-entry table at Watcom `0x9914`;
- every selector entry resolves to an O17 ANITAB;
- all eight O17 ANITABs are reachable;
- IDs 4 and 5 share `NINJA_ANITAB`;
- `A9` is the selected-table index/input-output cell in this bounded routine;
- the character identity -> animation table bridge is suitable for export organization.

**Not established:**

- semantic gameplay names for every ANITAB index;
- that ANITAB alone contains every substream used by a character;
- a complete animation timing/export schema;
- palette binding for every animation/effect context;
- MK2/MK3 selector parity.

## Source changes

Added:

- `src/games/mk1/research/characterAnimationTableSelector.ts`
- `scripts/run-character-animation-table-selector.mjs`
- this handoff

Integrated as stage:

`28/28 — Binding runtime character identities to the discovered ANITAB tables through GET_CHAR_ANI (1E.3O.19)`

Normal-app export format:

`mk1_character_animation_table_selector_v1`

The application milestone is:

`Milestone 1 — Pass 1E.3O.19 — MK1 Character Animation Table Selector`

## Validation

Direct execution against the canonical executable and authentic prerequisite chain passed all ten checks:

1. canonical provenance;
2. GET_CHAR_ANI symbol;
3. instruction shape;
4. +0x48 character identity field match;
5. A9 symbol match;
6. nine selector entries;
7. all character IDs resolve to O17 ANITABs;
8. all O17 ANITABs reachable;
9. shared NINJA table for IDs 4/5;
10. scope boundary preserved.

No runtime test is necessary for the bounded byte-level selector claim.

## Current export boundary

O17 established the cross-character animation structure, O18 proved its resource/decode backing, and O19 binds that graph to stable runtime character identities.

The next critical correctness problem for useful visual exports is **palette context**.

Do not assign one palette per GRA resource. Known evidence already contradicts that model: `RAIDEN.GRA` contains body sprites and the qualified lightning effect, but the effect uses `MORPH_P`; the Kano heart effect uses `MISC.GRA` with `BLOOD_P`.

The recommended next pass should therefore recover and classify palette selection/setup context for animation/effect roots, preserving unresolved cases instead of emitting plausibly colored but semantically unsupported PNGs.
