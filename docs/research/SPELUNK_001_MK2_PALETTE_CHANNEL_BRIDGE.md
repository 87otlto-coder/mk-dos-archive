# Spelunk 001 — MK2 palette provenance: shared channel-selector bridge

**Date:** 2026-11-16  
**Branch:** `research/spelunk-001-mk2-palette-provenance`  
**Scope:** Original DOS MK2, read-only/static analysis of user-supplied canonical `MK2.EXE`; no DOSBox, no game patching and no new UI or extractor modifications.  
**Source identity:** SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, length 861,133 bytes.  
**Classification:** VERIFIED STATIC / conditional relationships only; native active setup, returned palette handle and DAC bank remain **UNKNOWN**.

## Why this was investigated

Do not rediscover earlier successes. O119 recorded actual DOS gameplay perturbations proving selected *80-word* Tomb and Portal source records influence stage colour. O120 authenticated their Object2 setup/palette-pointer tables. O121 decoded selector fields and showed that the historical `tomb79` and `portal79` candidate records actually belong to `IMAGES.GRA`, not those stage GRA files. O260/O267 independently observed a *different* Pit wall palette cache/DAC queue path, which must not be generalized as Tomb/Portal ownership.

The unresolved extraction-related question was what produces the setup pointer in `ESI` before the renderer selects a source palette at `0x81DD5..0x81DDF`. Static source must not be misrepresented as an observed palette bank.

## Newly established: eight-channel intermediate table

The original Object1 routine beginning at physical `0x81BB3` traverses a table at Object2 offset `0x15B68` in 16-byte records. Its read of the fourth field at `0x81BC8` takes a **pointer to a mutable setup selector**, not the setup itself. It advances by 16 bytes per row and compares `EDI` against `0x84330` before processing the next row. Thus eight rows are reached; a ninth row is loaded transiently as the loop returns, **not processed as an active channel**.

All **32 fields** across eight rows have exact typed LE Object2 relocations; their raw DWORD targets match the relocations. The original EXE contains **27,004** LE fixup entries, **26,994** unique source sites (10 consistent duplicates). No assumed LE preferred runtime bases were used.

| Row | Object2 table | Source state | Shared vertical | Horizontal | Mutable setup selector |
|---:|---|---|---|---|---|
| 0 | `0x15B68` | `0x767CF` | `0x842E8` | `0x8432C` | `0x77453` |
| 1 | `0x15B78` | `0x7695F` | `0x842E8` | `0x84328` | `0x77457` |
| 2 | `0x15B88` | `0x76AEF` | `0x842E8` | `0x84324` | `0x7745B` |
| 3 | `0x15B98` | `0x76C7F` | `0x842E8` | `0x84320` | `0x7745F` |
| 4 | `0x15BA8` | `0x76E0F` | `0x842E8` | `0x8431C` | `0x77463` |
| 5 | `0x15BB8` | `0x76F9F` | `0x842E8` | `0x84318` | `0x77467` |
| 6 | `0x15BC8` | `0x7712F` | `0x842E8` | `0x84314` | `0x7746B` |
| 7 | `0x15BD8` | `0x772BF` | `0x842E8` | `0x84310` | `0x7746F` |

Object1 `0x81BD9` dereferences the selected row's mutable pointer; `0x81BDB` tests sentinel `1`, and `0x81BE0` checks a second sentinel `0x30240`. At `0x81C4E` the source calls `0x81E16`; this helper preserves EAX across its `PUSH EAX`/`POP EAX` path while operating on an object list. Then `0x81C53` executes `MOV ESI,[EAX]`. Therefore ESI is recovered **indirectly through the fourth field of the selected channel**, not derived by hardcoding a single stage setup address. The source at `0x81DD5` reads `[ESI+0x0E]` into the palette-table lookup; `0x81DDA` calls the established allocator and `0x81DDF` saves the returned handle in an object at `+0x30`.

**Important address-space distinction:** the channel pointers `0x77453..0x7746F` are Object2 *virtual* writable state (beyond its 50 pages of file-backed bytes). Their in-game contents cannot be read out of an EXE file image. Do not try to infer live ESI by reading file bytes at `Object2 physical file base + 0x77453`.

## Source-script joins: same channel, different palettes

Five independent chains are authentic original Object2 LE pointer relationships: command record → selector `0x77453` → setup → setup field `+0x0E` palette table → table's *slot 2* Object1 counted palette record.

| Prior O121 family | Command → channel `0x77453` | Linked setup | Palette table | Counted palette record | Original resource association |
|---|---|---|---|---|---|
| Portal 80 | `0x16394` (setup at `+8`) | `0x16514` | `0x16538` | physical `0x891E0` (80) | `PORTAL.GRA` |
| Tomb 80 variant A | `0x1720C` (setup at `+4`) | `0x17358` | `0x177D0` | `0x893C6` (80) | `TOMB.GRA` |
| Tomb 80 variant B | `0x17288` (setup at `+4`) | `0x17358` | `0x177D0` | `0x893C6` (80) | `TOMB.GRA` |
| `IMAGES` 79 group A | `0x2E7C4` (setup at `+8`) | `0x2E7E4` | `0x2E848` | `0x8CDBE` (79) | `IMAGES.GRA` |
| `IMAGES` 79 group B | `0x2E700` (setup at `+8`) | `0x2E720` | `0x2E784` | `0x8CD1E` (79) | `IMAGES.GRA` |

For these five chains, each pointer site has the expected original LE type-7 relocation, and each source DWORD matches its relocation target. The original count prefixes were rechecked (80/79). File associations in the final column are inherited from **O121's independent sprite-descriptor/resource-ID audit**, not newly claimed from these pointer records.

There are **48 typed incoming references to channel-zero `0x77453`**, of which 47 originate in Object2 static data and one in Object1 source. The corresponding counts for channels 1–7 are **2, 4, 3, 3, 3, 3, 3**. This is a pointer-reference census, not a runtime call frequency. It shows channel zero is broadly reused and is *not* an exclusive identifier for any one palette or stage. It also explains why the two IMAGES-associated 79-word records cannot simply be dismissed as unused based on the negative *stage* perturbation tests.

## Independent reproduction and falsification

A dedicated read-only Python audit parses LE pages/fixups, authenticates 19 original code-instruction anchors, checks the 32 row pointer sites, checks all five 4-edge script/setup/palette chains, and counts typed incoming references. It requires the exact original MK2.EXE fingerprint, from a user-supplied EXE or ZIP, and produces source-safe JSON with no original bytes. It refuses to overwrite its output.

**Private original fixture run, 2026-11-16:** source audit PASS with 8 rows, 5 chained command routes, 27,004 fixups and 26,994 unique sites; 16 targeted tests PASS. Negative controls separately altered the original opcode anchor, channel pointer, final channel row, pre-exit row, Tomb script pointer, IMAGES setup pointer, palette slot-2 typed target and palette count, with the whole-file SHA guard deliberately bypassed *only for those targeted negative assertions*. Existing-output refusal passed. This does not imply a Windows runtime test or a new original-game screen capture.

Machine metadata: `docs/validation/SPELUNK_001_MK2_PALETTE_CHANNEL_BRIDGE_20261116.json`.  
Reproducible source: `scripts/research/spelunk001/spelunk_001_channel_bridge.py` and original-private fixture negative tests.

## Extraction consequences and next validation

1. **Extractor design (INFERRED, not yet implemented):** identify palette source by authenticated setup/control table plus its currently selected channel pointer; do not assign a live VGA bank solely from EXE palette-record proximity or stage name. Retain original indexed pixels and the conditional palette-record provenance in exports.
2. **Existing P91 snapshot provides a future discriminator:** its full Object2 images at the draw/presentation boundaries permit direct comparison of `0x77453..0x7746F`, `0x75B00` palette slots and source-backed setup choices. Record actual values and phase differences, with runtime address mapping; do not assume a static slot is active.
3. **Do not change the v2 capture kit or ask the user to test now.** No original Tomb packet exists yet.
4. A separate next spelunk can examine stage script opcode/interpreter control flow and its explicit writes into these channel selectors, or investigate a different extraction-critical gap. Generalize to other stages only after independent repetition.

### Confidence register

- **VERIFIED STATIC:** 8 active rows/32 typed pointers; 19 code anchors; 5 pointer-chain routes; 48 channel-zero inbound typed references; original counted palette source records.
- **CARRIED VERIFIED:** O119 user-visible source-record perturbations; O120/O121 setup, selector and per-resource relationships; O260/O267 Pit palette cache path (different stage).
- **INFERRED:** the channel/command bridge is the proper point for future runtime palette resolver instrumentation and exporter metadata.
- **UNKNOWN:** which command stream actually ran in a given match; live channel selector contents; which ESI setup passed to allocator; returned handle, DAC start, palette upload timing, camera, final stage composition.
- **VALIDATION PENDING:** a live original MK2 snapshot and indexed framebuffer/DAC parity.

No original commercial binaries, graphics, palette words, screenshots or private raw packets are committed. Neither P90 nor accepted source has been modified.
