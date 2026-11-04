# MK DOS Archive — Checkpoint — Pass 1E.3O.68 MK2 JC0 Indexed Graphics Export

## Status

**VERIFIED / LOSSLESS INDEXED EXPORT ESTABLISHED / INDEPENDENT 205/205 AUDIT PASSED / TWO-PASS PAUSE REACHED**

O68 qualifies the first MK2 graphics decode/export mechanism from MK2 bytes themselves. It deliberately stops before palette ownership or game-colour rendering.

## MK2-derived command grammar

Canonical MK2 Object-1 renderer bytes independently establish three sprite-stream command forms:

1. `cmd & 1` — transparent skip, count `cmd >> 1`, no payload bytes;
2. bit 0 clear / bit 1 set — indexed-colour RLE, colour `(cmd >> 2) & 0xFF`, repeat count `cmd >> 10`;
3. bits 0..1 clear — literal indexed run, count `cmd >> 2`, followed by literal bytes and 4-byte payload alignment; the code bounds the literal count to `<= 0x40`.

The decisive executable signatures are at physical `0x69F0C` and `0x6A46C`.

This grammar is structurally the same three-form grammar previously qualified in MK1, but O68 reached it independently from MK2 code. **No shared cross-game abstraction is promoted yet.**

## JC0 descriptor/resource closure

Authentic resource:

- `JC0.GRA`
- byte length: **120,240** (`0x1D5B0`)
- SHA-256: `ef7b96d1725f45386f9503b252602db3ae22ab7ef638a3f1add91adb42079f1b`
- executable filename-pool ordinal/resource byte: **109 / `0x6D`**

O68 scans only the O67-bounded unresolved post-LE overlay for plausible 12-byte records carrying resource byte 109 and then requires each candidate to decode successfully under the MK2-derived grammar.

Exactly **35** coherent records qualify, from physical `0xC53D8` through `0xC5574`.

First record:

- width 47
- height 100
- placement `(22,-12)`
- packed resource reference `0x6D000000`
- resource offset `0`
- encoded length **`0xE38`**

The next descriptor begins at `JC0.GRA+0xE38`. This boundary condition repeats for every record: each decoded stream ends exactly at the next descriptor's GRA offset, and the 35th stream ends exactly at `JC0.GRA` EOF.

Therefore the 35 streams tile **all 120,240 encoded JC0 bytes with no gap and no overlap**.

## Lossless indexed export

O68 exports, per sprite:

- one raw one-byte-per-pixel index plane;
- one raw one-byte-per-pixel opacity mask;
- exact dimensions, placement, descriptor physical offset, resource offset, encoded length, and SHA-256 values in the manifest.

Aggregate decoded surface:

- sprites: **35**
- decoded pixels: **194,096**
- opaque pixels: **70,283**
- transparent pixels: **123,813**
- literal commands: **5,502**
- indexed-RLE commands: **1,773**
- transparent-skip commands: **8,234**
- opaque index union: **1..63**, all 63 values observed

That last result is a direct cross-game warning: MK1's observed 1..23 animation index domain does **not** generalize to MK2.

## Browser package

`MK2_O68_JC0_INDEXED_SPRITE_PACKAGE.zip`

- entries: **74**
- byte length: **465,392**
- SHA-256: `e1449affba806a6a76dfb1bc63b99efe1af5c6182c562b3a68aad6eba5a08390`
- 35 index binaries + 35 mask binaries + manifest + O67 report + O68 report + README
- deterministic for identical prerequisites

The application now exposes a dedicated **MK2 Independent Foundation** panel when MK2 is detected, with O67/O68 execution, JSON downloads, and **Download JC0 Indexed Package**. The existing MK1 75-stage workflow remains separately gated to MK1.

## Independent validation

A Python implementation independent of the TypeScript decoder/builder passes **205/205 checks**. It independently:

- authenticates the fixture/executable/JC0 resource;
- reparses the LE topology and resource filename pool;
- verifies the renderer signatures;
- rediscovers all 35 records from the unresolved overlay;
- independently decodes every stream;
- rechecks all 35 exact tiling boundaries;
- verifies the ZIP inventory/CRC integrity;
- compares every exported index plane and opacity mask byte-for-byte;
- reconciles every manifest descriptor and SHA-256;
- rechecks the 1..63 index domain.

A second execution with identical prerequisites regenerated the exact same package SHA-256.

Source/UI integration audit passes **21/21** checks, and the new core modules plus MK2 panel pass targeted TypeScript checking. The standalone runner passes `node --check`.

## Mandatory unresolved boundaries

O68 does **not** establish:

- the runtime consumer of the post-LE descriptor corpus;
- the semantic classification of the post-LE overlay itself;
- palette ownership for JC0;
- correct-colour RGBA/PNG rendering;
- a gameplay/character name for `JC0` beyond the authentic resource identifier;
- a universal MK2 descriptor census from the broad blind candidate scan;
- a shared MK1/MK2 graphics abstraction;
- MK2 animation, stage or audio semantics.

## Verdict

`MK2_JC0_INDEXED_GRAPHICS_DESCRIPTOR_STREAM_EXPORT_ESTABLISHED`

This completes the O67 + O68 two-major-verification MK2 foundation block. The project must pause here and refresh the authoritative full handoff before O69.
