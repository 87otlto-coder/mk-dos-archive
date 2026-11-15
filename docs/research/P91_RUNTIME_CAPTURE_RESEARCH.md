# P91 - native MK2 runtime capture investigation

**Result:** a substantially narrowed, executable capture protocol and readback
oracle. **No original runtime snapshot was captured.** Native DOSBox adapter
integration, compilation and actual capture remain **VALIDATION PENDING**.

## Baseline and scope

Verified remote P90 branch HEAD `74b10e4eb7e7ff0e862773bfa5c01e3555958a10`,
tree `a5cb3a8712140cb2161acbfebadcad82efb5735f`. P91 is isolated on
`research/p91-mk2-runtime-snapshot`. P90's private Windows execution and
independent Chat readback of 36 PNGs are accepted as stated in the assignment;
the older committed P90 pending-export wording is historical. P90 scripts and
projections were not rerun or regenerated.

Canonical SOURCE, TOOLS and MK2 fixtures were readable. The canonical checkout
still reports the P89 branch; it was not switched or edited. This session has
no permitted canonical F: write destination and did not retry the previously
blocked directory creation. New code was tested in temporary source staging,
then committed through GitHub. No game, emulator or GUI was launched. Existing
DOSBox-X executable installation was preserved. No commercial dump was saved.

## Concrete obstacle removed: one paused dump can select the wrong frame

**VERIFIED original instruction semantics:**

1. The frame driver toggles render-gate bit 0 at physical `0x67050`.
   Default draw at `0x670BD` calls `0x933C2`. After synchronization, the test at
   `0x670C7` jumps directly to `0x670DD` when the bit is set; otherwise it calls
   presentation at `0x670D8`. Thus simply arriving at the scheduler wait does
   not prove a frame was presented.
2. The render traversal adds object velocity fields to position fields at
   `0x93202..0x9320B` **before** the draw-gate test at `0x9320E`. A gate-off call
   can change coordinates without generating pixels. Capturing current objects
   and the last displayed buffer at a scheduler pause can pair different
   generations even if every read itself is atomic.
3. Mode-2 presentation at `0x65499` selects the current drawing buffer, calls
   the differential transfer `0x65A54`, writes its source to `0x7662E`, then
   changes `0x7662A` to the opposite buffer (`0x654C5..0x654D9` or
   `0x654EE..0x65502`). Therefore post-presentation `0x7662A` is not necessarily
   the displayed generation. The differential routine compares DWORDs against
   the other buffer and writes changed values to the VGA aperture; it does
   not establish that the opposite buffer has become the displayed image.

**Consequence:** retain the actual pixel-producing generation, not just current
globals. P91's collector preserves draw-entry objects and buffer seed, the
completed buffer, the palette-ready presentation state and post-present proof.
Gate-off rendering cannot replace the saved pixel generation. Full byte
equality, rather than a timestamp or a buffer pointer alone, connects phases.

This is a stronger, falsifiable capture criterion than a new list of addresses.

## Loaded mapping without assuming runtime addresses

The original LE table gives Object1 virtual size 257,688 and Object2 550,496;
preferred bases 0x10000/0x50000 are **not measured loaded bases**.
At a candidate frame-driver instruction, combine observed CS cached base and
EIP with the source-relative Object1 offset. Derive the Object2 **operand
bias** from its relocated inline data operand; only then add DS cached base
to obtain the data object's linear base.

Five original code windows and 12 typed relocated operands must agree.
SHA256 comparisons mask only the authenticated relocation slots. The executable
plan contains offsets, types and hashes, not commercial code bytes. Raw live
window bytes belong only in the private packet. Each retained phase must
independently reproduce its mapping; textual confidence labels do not pass.

`capture_plan.py` verified the canonical original EXE SHA and fresh instruction
anchors for the gate, swap, object mutation, allocation size and palette table.
An original-source model relocated its exact windows to synthetic nonpreferred
bases with **different nonzero CS/DS bases**; the resolver recovered both bases
and refused changed code/relocations. **VERIFIED model; actual loaded bases
UNKNOWN.** This test did not execute MK2 or the DOS loader.

## Capture boundary and lifetime protocol

| Phase | Source physical position | Retained evidence |
|---|---|---|
| Draw entry | 0x933C2 | Complete Object2, ordered lists, seed buffer, CPU/mapping context |
| Draw complete | 0x935E5 before RET | Completed native buffer and post-render state |
| Presentation entry | 0x65420 after caller's sync | Exact source-buffer parity, DAC and unchanged allocation table |
| Post presentation | 0x670DD with matching return witness | Last-presented source, aperture parity, unchanged DAC, next buffer |

These phases are different instants explicitly tied to one pixel generation.
The final packet is serialized while guest execution is held in the observer;
it preserves the earlier generation states. It does not falsely label all
values as one instantaneous state. Actual instruction serials, observed return
stack and return event bind the two final phases. Unsupported fixed-buffer
mode (`0x75CEE != 0`), paging, external object nodes or failed parity refuse
acceptance and retain the exact missing requirement.

## Objects and palette evidence needed for reconstruction

The object allocator zeroes 22 DWORDs and subtracts 0x58 at `0x936E9..0x936F6`:
capture **88 bytes per object**. Preserve actual +0 traversal order and raw
bytes, signed/fixed positions and velocities, flags, sort key, dimensions,
resource token, palette handle and descriptor pointer. Do not re-sort lists.
Complete Object2 includes the nine accumulators, vertical state and rate,
resource mappings, queues and static pools. External descriptors/nodes require
bounded additional blocks; the current oracle refuses unsupported external
nodes rather than silently omitting them.

The allocator has 60 eight-byte palette slots at Object2 0x75B00: pointer +0,
reference word +4 and DAC start byte +6. Capture raw records and pending update
queue context. Capture DAC `rgb[256]` directly from the emulator, with component
depth, PEL mask and read/write/component indices. Do **not** dump colors by
reading port 0x3C9: that changes its read state. CPU aperture reads can change
VGA latches, so preserve/restore latches or use raw VRAM with captured mapping.
Native buffer/aperture equality is not proof of host scanout or display scaling.

## DOSBox-X mechanism and P89 reuse decision

Pinned upstream `029bd65c5dcc7cdc7f2e14e35278620d9707d969` provides an exact
normal-core per-instruction hook after `LOADIP` and before decode. It needs no
guest stepping or breakpoints. `MEM_BlockRead` accepts a **linear** address and
uses the emulated memory system; names such as `PhysPt` in core-local code do
not justify bypassing translation. P91 initially supports no-paging bounded RAM.

Relevant upstream blobs were inspected directly: core_normal.cpp
`e582cc06f38809f2ee8ee8d6f1922f3eba5b6ab5`, vga.h
`00a5e9771987ddf755fce78a554daff79c8155df`, vga_dac.cpp
`509d42fbead67a56594e49cec55549bc6fcc6d7c`, mem.h
`8e764039130dae75d11e8797b2e009dc05594170`.

Reuse P89's opt-in private-output and exact-upstream guards. Do not reuse its
INT21 file-read hook as a frame trigger: cached stage rendering need not issue
file reads per frame. Do not reproduce its failed DEBUGBOX/STEPIN control loop.
The precise native adapter is specified in `P91_DOSBOX_ADAPTER_SPEC.md`.

## What exists and what was verified

- `scripts/research/p91/capture_plan.py`: original-source boundary/mapping plan.
- `snapshot.py`: executable relocation resolver, ordered-list decoder, frame
  generation collector and exclusive private packet writer.
- `verify_snapshot.py`: hash/path/phase/mapping/state readback oracle.
- `test_snapshot.py`: 13 focused original-free controls, including synthetic
  on-disk packet readback and corruption refusal; all passed locally.
- Five original-source windows / 12 relocated operands passed the mapping
  model with distinct CS/DS bases. No large inherited regression ran.
- Windows source-only CI [#43742132203](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43742132203)
  passed the 13 original-free controls at implementation commit
  `07f7a86880265379796e217487a1e40d8e9b3b66`, tree
  `a3d65d6e961da753d44b9f3abd1d9f16631c9388`. The four tested Python blobs
  were compared to GitHub and matched exactly. This is not native integration
  or original-game execution evidence.
- Native adapter: **specification only**, not compiled or executed. Private
  native writer execution and actual loaded addressing remain pending.

Research completeness: **PARTIAL; capture boundary/mapping obstacle narrowed**.
Collector/reference implementation: **VERIFIED in synthetic tests**.
DOSBox integration and original runtime verification: **VALIDATION PENDING**.

## Standard Chat handoff - no untested user launch sequence

1. Review the pinned adapter specification and implement its thin normal-core
   observer. Keep the existing emulator intact. First compile against the exact
   upstream revision and exercise the actual RAM/DAC/hook APIs in a no-game
   harness. Port the tested generation protocol, not just a scheduler memory
   dump. This is the next gate; P91 does not supply a capture-ready executable.
2. Only after that gate passes, provide one bounded Windows entry point with
   complete prerequisite/hash checks, explicit execution-policy handling and
   ProcessStartInfo stdout/stderr redirection compatible with PowerShell 5.1.
   Missing downloads/tools must fail before launch. No success after child
   failure; no experimental command sequence for the user to debug.
3. Capture one original Tomb mode-2 packet into a new private P91 folder.
   Reproduce mapping and generation pairing with `verify_snapshot.py`; check
   native instrument provenance separately. Keep all raw files private.
4. Build the first viewport from **draw-entry** state, applying the original
   in-traversal coordinate/channel updates and ordered commands. Use the saved
   seed buffer where source clear behavior requires it; include UI/extra queues
   or count those pixels as unmodeled. Use captured allocated DAC offsets.
5. Compare all 64,000 native index bytes against DRAW_COMPLETE, then compare
   that buffer against captured post-present aperture bytes. Report mismatches
   by contributing primitive and source resource. RGB agreement is a separate
   DAC/PEL-mask check; animation timing remains out of scope.

No native snapshot, reached camera coordinate, pixel-accurate reconstructed
viewport, elapsed animation timing or original DOS runtime success is claimed.
