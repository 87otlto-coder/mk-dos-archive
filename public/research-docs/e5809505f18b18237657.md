# MK DOS Archive — O96L/O96M Process-Entry Provenance and List Entry Census

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** BOUNDED VERIFIED / MK2 RESEARCH REMAINS OPEN

## Source and fixture authority

Source predecessor: `MK-DOS-Archive-2026-10-08-O96K-source.zip` SHA-256 `ffc9c58ea98d691279d18f851c4d5467452303bf3df65f285f46ce1375249cde`.

Authentic executable: `mk2.exe` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. No game binary modified. Independent verification reparses **27,004** LE relocation entries.

## O96L — The eight-row producer has an authenticated repeat-capable process entry

O96I established the eight-row producer routine at physical `0x81BB3`. O96L now establishes a process-entry linkage rather than only a potential isolated routine:

- The code at physical `0x81B98` initializes global `0x75A7C` to the literal value **8**.
- At `0x81BA2`, it calls the established eight-row producer `0x81BB3`.
- At `0x81BA7`, it reloads the current `0x75A7C`; at `0x81BAC`, it calls already-qualified scheduler/yield routine `0x6710F`.
- The short jump at `0x81BB1` returns precisely to `0x81BA2`. This constitutes a **repeat-capable producer-yield loop**, subject to actual process scheduling.

This code has a precise Object-1 relative entry offset of **`0x1FF44`**, corresponding to physical `0x81B98` and loaded-linear address `0x2FF44` under the current bound-LE mapping.

Two actual machine paths install precisely this callback/entry offset:

| Source setup | `MOV EDX, 0x1FF44` | `CALL 0x67222` | Immediate other input |
|---|---|---|---|
| `0x82361` | `0x82366` | `0x8236B` | EBX = 5 |
| `0x86066` | `0x8606B` | `0x86070` | EBX = 5 |

The immediate DWORD operands at **`0x82367`** and **`0x8606C`** each have authentic Type-7 relocations to **Object 1**, value `0x1FF44`. In process constructor `0x67222`, the source EDX is stored in process field `[EAX+0x1C]` at `0x67248`, conditional on the allocator/free-list path at `0x67229`. This is a bounded executable route supplying the producer loop as a **process entry pointer**. The meaning of EBX=5 and of global scheduler argument 8 in wall-clock units is **UNKNOWN**.

The proof is **process construction / callback handoff**, not a dynamic trace proving either site executes in gameplay, any particular scene is active, or a scheduler actually runs the loop.

## O96M — Direct near-transfer inventory

A bounded raw-code-byte census over the file-backed Object-1 region `0x61C54..0xA0C54` identifies:

| Qualified destination | Exact raw `E8/E9 rel32` target matches |
|---|---:|
| O96I eight-row producer `0x81BB3` | 18 |
| O96K `0x84358` insertion wrapper `0x665EB` | 38 |
| O96K `0x84364` insertion wrapper `0x93709` | 1 |
| O96K `0x84360` insertion wrapper `0x93722` | 5 |
| O96E runtime initializer `0x81B18` | 7 |

The code also contains bounded, locally sequential call relationships: at `0x707EB` a call to runtime initialization precedes the producer call at `0x70810`; at `0x86041` and `0x8605F`, two producer calls precede the O96L process construction at `0x86070`, subject to calls returning and intervening branches. Three `MOV EAX,EDI; JMP` trampolines at `0x646A6`, `0x646AD`, and `0x646B4` reach the three O96K insertion wrappers.

**Important boundary:** O96M is an exact **raw-near-transfer byte census**. It does not assert a whole-program disassembly or that every raw opcode-pattern match is a reachable instruction boundary. The local explicit paths listed above have separately anchored machine slices. No entire-scene co-execution, live list contents, stage geometry, palette ownership, or sprite animation timeline is established.

## Verification

- O96L/O96M original-fixture producer: PASS.
- O96L/O96M independent verifier: **54,181 checks / 0 failures** (LE fixups independently reparsed, process constructor, code-pointer relocations, producer loop and call-target census reconstructed).
- Three negative-control mutations rejected: fabricated guaranteed execution, changed process pointer, fabricated near-call location.
- Previous O96K regression **54,157 / 0**, O96I/J **54,443 / 0**, O96H **27,414 / 0**.

Outputs:
- `mk2_producer_process_entry_provenance_o96l_2026-10-08.json`
- `mk2_object_list_entry_reference_census_o96m_2026-10-08.json`
- `scripts/run-mk2-o96l-o96m-process-provenance.mjs`
- `scripts/verify-mk2-o96l-o96m-process-provenance.py`

## Next bounded direction

**O96N** may examine the process scheduler's dispatch/resume use of the constructor's field `+0x1C` and whether O96L's entry is dynamically invoked, only if a bounded executable instruction path can be established. Do not equate a static process entry handoff with observed runtime execution. If static evidence stops here, pivot to MK2 palette binding, uncovered `.GRA` formats, stage composition, and non-MID audio verification, without another broad speculative census.

The wider MK2 coverage remains unchanged: seven bounded fixed-identity sequences; 210/253 terminal-qualified selected-pointer routes, 239/253 strong consumers, 14 held; nine correct-color palette slots; 94/124 exact-full `.GRA` resources. **MK2 remains OPEN.** User-required sequence remains **MK2 → MK1 → MK3 → discuss UI/usability → build**.
