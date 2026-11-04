# MK DOS Archive — O95N Generic Unresolved-Route Continuation Census

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN

## Scope

O95N addresses exactly the **31** O95H routes previously classified `UNRESOLVED`. The other held/problematic route classes from O95M are intentionally excluded.

No fighter names, move/effect names, gameplay meanings, or wall-clock timing are inferred.

## Result

All 31 target routes are now partitioned:

- **23 terminal-qualified** selected-pointer routes;
- **3 strong nonterminal consumer-qualified** routes;
- **5 structural-only** routes.

Coverage therefore advances from O95M:

- strict terminal-qualified: **208 / 253** (185 + 23);
- strong selected-pointer consumer-qualified: **237 / 253** (211 + 26);
- without any strong qualified consumer: **16 / 253**.

## Terminal-qualified routes

### Dynamic dispatcher `0x6435A`

Twenty routes preserve the selected pointer into authenticated dynamic dispatcher `0x6435A`, which is already bounded to the standard composition interpreter or specialized direct-descriptor consumer for nonzero tokens.

Seventeen reach `0x6435A` directly in the bounded continuation. Three use authenticated continuation jumps first:

- `0x721E9` -> cadence loop `0x721B3` -> `0x6435A`;
- `0x7B5B6` -> continuation `0x71937` -> `0x6435A`;
- `0x7DDBB` -> continuation `0x71659` -> `0x6435A`.

### Standard composition wrapper

Two routes reach the already-qualified standard wrapper:

- Family A `0x92839` -> `0x86825`;
- Family B `0x930DC` -> entry `0x86822`, falling into `0x86825`.

### New custom cursor-record walker

Family-A route `0x85000` reaches a distinct consumer at `0x83ECD`.

The bounded code repeatedly:

1. reads a DWORD from `0x75A78`;
2. advances the cursor by 4 bytes;
3. terminates if that DWORD is zero;
4. otherwise reads bounded 16-bit fields and advances the cursor further;
5. continues until the zero DWORD terminator.

This establishes a terminal cursor-record grammar for the route, but the record fields' gameplay/render semantics remain **UNKNOWN**.

## Strong nonterminal consumers

Three routes reach first-DWORD object construction at `0x64019`:

- Family B `0x67F3B` directly;
- Family A `0x9520F` after authenticated segment skipping at `0x63360`;
- Family A `0x95D2F` after the same bounded segment-skipping mechanism.

`0x64019` consumes the selected cursor's first DWORD to construct a related render object. This is a strong selected-pointer consumer, but not a claim that the entire selected stream is terminally decoded.

## Five structural-only routes

- Family A `0x63901` and Family B `0x63910` are branches inside the generic selector wrapper `0x638F9..0x63935`; the selected cursor is returned to the wrapper caller without a bounded semantic consumer inside that wrapper.
- Family A `0x71579` is superseded by a later Family-A lookup at `0x7159E` before a qualified consumer of the original cursor.
- Family A `0x73F8A` is superseded by a later Family-A lookup at `0x73FBB` before a qualified consumer of the original cursor.
- Family A `0x918DD` establishes a selected cursor, runs identity-indexed scalar helper `0x64ECA`, then tail-enters cadence helper `0x6433F`; no selected-pointer semantic consumer is established in that bounded routine.

## Remaining 16 routes without a strong qualified consumer

O95N leaves exactly **16 / 253** without a strong consumer. They are deliberately not mixed into this pass:

- 1 O95H `CURSOR_TRANSFORM_UNRESOLVED` route;
- 3 O95J cursor-replaced routes;
- 4 O95L structural-only routes;
- 2 O95L conditional routes;
- 1 O95M reselection-overwrite route;
- 5 O95N structural-only routes above.

## Validation

- authentic MK2 fixture only;
- `MK2.EXE` SHA-256 authenticated;
- TypeScript O95N pass: **PASS**;
- independent Python verifier: **72 checks / 0 failures**;
- O95M regression: **75 checks / 0 failures**.

## Boundary

O95N does **not** establish move names, fighter names for dynamic routes, timing/FPS, or universal semantics for the new `0x83ECD` record fields.

MK2 animation research remains **OPEN**.

## Next bounded pass

**O95O — final 16 held/problematic selected-pointer routes.** Treat each uncertainty class separately and attempt to reduce the remaining 16 without cross-class inference. If a route cannot be closed from executable data flow, preserve it explicitly and move to the next MK2 closure blocker rather than forcing a semantic interpretation.
