# MK DOS Archive — O95C MK2 Selected-Pointer Stream Interpreter / Bounded Frame-Sequence Anchor

**Date:** 2026-10-07 SAST  
**Status:** VERIFIED STRUCTURAL GRAMMAR ANCHOR / UNIVERSAL ANIMATION GRAMMAR STILL OPEN

O95C continues the MK2 animation blocker from O95B. Its scope is deliberately narrow: authenticate the executable routine that consumes selected pointers from the two O95B identity-indexed lookup families, establish its token/control geometry, establish the frame-composition record geometry it calls, and close one fully bounded caller -> lookup -> stream -> composition -> O69 descriptor witness.

It does **not** assign gameplay move names, wall-clock timing, universal animation ownership, or complete animation coverage.

## 1. Shared selected-pointer interpreter

Canonical `MK2.EXE` authenticates a shared interpreter at:

- physical: `0x63E79`
- Object-1 offset: `0x2225`
- authenticated `0x105`-byte slice SHA-256: `6f0826bdac12e9f51ac2fc3af55bc915dea9fccfeedfd784ead73a41bea300cf`

The routine reads a DWORD from the cursor stored in global `0x75A78`, advances the cursor by four bytes, and applies a bounded dispatch:

- token `0`: return;
- tokens `1..9`: dispatch through the 10-entry Object-2 jump table at `0x7A4`;
- token `>9`: pass the token value to the frame-composition builder at physical `0x640DF`, then return after one renderable step.

The 10 jump-table entries are all source-type-7 internal LE fixups into Object-1 and are independently verified.

Structural handler behavior only:

- `0`: return;
- `1`: replace cursor with a DWORD target and continue;
- `2`: call helper, no inline operand, continue;
- `3`: consume one signed i16, call common helper, continue;
- `4`: consume two signed i16 values, call common helper, continue;
- `5`: consume one DWORD composition pointer, build composition, return/yield;
- `6`: consume one DWORD code pointer, indirect-call it, continue;
- `7`: consume one DWORD argument, call helper, continue;
- `8`: consume one u16 plus conditional DWORD branch/skip structure, continue;
- `9`: call helper, no explicit inline operand, continue.

These are machine-level structural effects. The gameplay semantics of the helpers/conditions are still **UNKNOWN**.

## 2. Direct O95B lookup -> interpreter joins

A strict callsite census establishes lookup calls immediately followed by a call to `0x63E79`:

- Family A (`0x918F1`): **11** direct-next interpreter callsites;
- Family B (`0x91909`): **17** direct-next interpreter callsites.

Adjacent immediate nested-index values in only those direct-next routes:

- Family A: `0, 6, 7, 16, 38, 60`;
- Family B: `0, 1, 2, 3, 4, 5, 7`.

The interpreter is **not** claimed to be the exclusive consumer of O95B selected pointers. Other consumers exist and remain for later classification.

## 3. Frame-composition builder

Canonical frame-composition builder:

- physical: `0x640DF`
- Object-1 offset: `0x248B`
- authenticated `0xBD`-byte slice SHA-256: `64dbc1105b4a7dd9039b75c90fb4621f410063c879e152423e6c9582fb57d3dd`

The builder consumes a zero-terminated DWORD pointer list. Each nonzero pointer is treated as a 12-byte source record:

- `+0`: DWORD copied;
- `+4`: signed i16;
- `+6`: signed i16;
- `+8`: DWORD copied.

It emits one 12-byte runtime record per source pointer. This byte geometry exactly matches the already-qualified O69 MK2 graphics descriptor schema (`u16 width`, `u16 height`, `i16 x`, `i16 y`, packed resource reference).

The builder also contains placement transforms controlled by object flags:

- flag `0x10`: X becomes `-x + width`;
- flag `0x80`: Y becomes `-y + height`.

These are only qualified as **placement transforms**. Collision/world/hitbox semantics are not inferred.

## 4. Bounded authentic eight-frame witness

O95C closes one exact caller route without cross-producting identities and nested indices.

At physical `0x9509D`, canonical MK2 code explicitly writes identity slot `12` to object `+0x46`. The same code path later writes nested index `7` to `0x75A78`, calls Family A at `0x918F1`, and immediately calls the shared interpreter at `0x63E79`. There is no intervening write changing object `+0x46` before this interpreter call.

Exact witness code slice `[0x9509D, 0x950E4)` SHA-256:

`5b94d164fec96c7fee59a9f6a736d779ac50febf08f326505531dc9834fbba8f`

Family A slot 12 resolves to root Object-2 `0x12E74`. Nested index 7 resolves through the authentic LE fixup at root entry `0x12E90` to stream Object-2 `0x130B8`.

That stream contains exactly eight relocation-backed composition pointers followed by raw token `0`:

| Frame | Composition array | O69 descriptor | Resource | GRA offset | W x H | X | Y |
|---:|---:|---:|---|---:|---:|---:|---:|
| 0 | `0x130FC` | `0x2A6D0` | `GO.GRA` | 221568 | 125 x 105 | 56 | -6 |
| 1 | `0x13104` | `0x2A6DC` | `GO.GRA` | 229308 | 124 x 105 | 56 | -6 |
| 2 | `0x1310C` | `0x2A6E8` | `GO.GRA` | 236988 | 119 x 108 | 56 | -3 |
| 3 | `0x13114` | `0x2A6F4` | `GO.GRA` | 243896 | 107 x 116 | 51 | 5 |
| 4 | `0x1311C` | `0x2A700` | `GO.GRA` | 250888 | 126 x 108 | 63 | -1 |
| 5 | `0x13124` | `0x2A70C` | `GO.GRA` | 257828 | 139 x 95 | 69 | -15 |
| 6 | `0x1312C` | `0x2A718` | `GO.GRA` | 265140 | 135 x 92 | 66 | -18 |
| 7 | `0x13134` | `0x2A724` | `GO.GRA` | 272484 | 137 x 89 | 67 | -21 |

Each composition array contains exactly one descriptor pointer followed by a raw zero terminator.

The stream then contains raw DWORD `0` at Object-2 `0x130D8`, which takes the interpreter return path.

Bounded structural order:

`frame[0] -> frame[1] -> ... -> frame[7] -> token 0 return`

No loop is established for this witness. No timing/dwell units or human move name are assigned.

## 5. Rejected exploratory witness

During O95C development an exploratory note incorrectly treated Family A slot 12 / nested index 7 as resolving to Object-2 `0x248A`, producing an apparent eight-frame loop.

The first authentic O95C runner **failed closed** on this claim:

- expected exploratory target: `0x248A`;
- actual relocation target from root entry `0x12E90`: `0x130B8`.

The erroneous route was discarded, not reconciled by guesswork. `0x248A` is a real Object-2 stream reached from a different relocation source (`0x20A8`), but O95C does **not** promote a runtime identity/caller route for it. It remains future evidence only.

This rejection is intentionally preserved so later work cannot resurrect the wrong caller association.

## 6. Validation

Project implementation:

- `src/games/mk2/research/animationStreamGrammarAnchor.ts`
- `scripts/run-mk2-animation-stream-grammar-anchor.mjs`
- output: `mk2_animation_stream_grammar_anchor_o95c.json`

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent verifier:

- `scripts/verify-mk2-o95c-animation-stream-grammar.py`
- result: **54,199 checks / 0 failures**
- independently reparses the complete LE fixup surface;
- authenticates the interpreter and builder slices;
- re-derives all ten control-dispatch fixups;
- independently rescans Family A/B direct-next interpreter callers;
- verifies the explicit identity-12 / nested-index-7 caller code;
- resolves the slot/root/stream relocation chain;
- validates all eight composition-array and descriptor joins;
- reconciles each descriptor against the already independently qualified O69 corpus;
- verifies the raw token-0 termination.

## 7. Decision boundary

Machine verdict:

`MK2_O95C_SHARED_STREAM_INTERPRETER_AND_BOUNDED_EIGHT_FRAME_SEQUENCE_ESTABLISHED`

Established:

- shared selected-pointer stream interpreter;
- token-width/cursor mechanics;
- bounded control dispatch `0..9`;
- `>9` frame-composition path;
- frame-composition source-record geometry matching O69 descriptors;
- one authentic caller-connected eight-frame `GO.GRA` sequence with explicit termination.

Still open:

- universal MK2 animation grammar across all roots/callers;
- complete runtime-connected stream corpus;
- semantics of helper tokens `2..9` beyond their machine-level operand/control shapes;
- loops/branches beyond individually proven routes;
- multipart composition coverage;
- dynamic identity/nested-index routes;
- dwell/timing contract;
- human move/action names;
- complete per-identity animation coverage.

MK2 animation closure therefore remains **OPEN**.

## 8. Next pass

**O95D — runtime-connected stream corpus expansion.**

Expand from O95C only along caller routes whose identity and nested-index reachability can be established from executable data flow. Do **not** cross-product every observed nested index with every identity root. Enumerate the actually connected stream/control/composition graph, classify finite/loop/branch/multipart shapes, and preserve dynamic/unproven routes separately.

Timing and human naming remain out of scope until their own consumers are traced.
