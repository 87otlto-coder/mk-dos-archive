# P91 - precise DOSBox-X adapter specification

**Status: source-backed design + executable Python collector/oracle; native
adapter NOT implemented/compiled/executed. Do not ask the user to launch a game
with a nonexistent or untested build.** Upstream pinned revision:
`029bd65c5dcc7cdc7f2e14e35278620d9707d969`.

## Hook and supported context

Use the normal interpreter core only, `core=normal`, paging disabled. At the
top of `CPU_Core_Normal_Run`'s instruction loop, immediately after `LOADIP;`
and before instruction execution, pass `SegPhys(cs)+reg_eip` to the observer.
Exact upstream anchor is `while (CPU_Cycles-->0) {\n\t\tLOADIP;` in
`src/cpu/core_normal.cpp`, blob `e582cc06f38809f2ee8ee8d6f1922f3eba5b6ab5`.
Do not put the hook at `restart_opcode`: prefixes would duplicate events.
Do not rely on cached `reg_eip` midway through a decoded instruction.
Disable the observer unless a private capture destination was explicitly armed.

The adapter must require `cpu.pmode && cpu.code.big && !paging.enabled` and
bound all ordinary RAM reads against `MEM_TotalPages()*4096`, using overflow-
checked addition. Unsupported context is a refusal, not a guessed translation.
Use `MEM_BlockRead` for bounded RAM. Its upstream signature takes **LinearPt**;
the `PhysPt` type used by old core-local names does not establish physical
addressing. Never use a host pointer equal to an emulated linear address.

## Discover loaded bases without scanning all memory

At a candidate instruction with the frame-entry XOR form, derive:

- Object1 linear base = current linear IP minus `0x67050-0x61C54`.
- Object2 operand bias = inline relocated DWORD at IP+2 minus `0x562D4`.
- Object2 linear base = DS cached base + Object2 operand bias.

Require the five plan windows' masked SHA256 values and all 12 relocated
operands to agree. For a target Object2 relocation, expected inline value is
operand bias + target offset. Object1 relocation bias is derived separately
from code base and CS base. `snapshot.resolve_mapping` is the reference
implementation and executable oracle for these domains. It deliberately
does not assume CS.base=DS.base=0 or use the LE preferred bases.

Retain raw window bytes privately at every retained phase; the readback
validator recalculates mapping rather than accepting a textual assertion.
Reject foreign binaries or mismatches. No source-offset breakpoints, DEBUGBOX,
remote BREAK polling or STEPIN loop is needed.

## Frame-generation protocol

Retain four phase packets. Each packet is copied synchronously while no guest
instruction executes; never collect fields through asynchronous requests.

1. **DRAW_ENTRY:** source physical `0x933C2`. Require mode=2, stage=1,
   `0x75CF6 == Object2 operand bias + 0x17300`, render gate bit0=1 and populated
   lists. Save complete Object2 virtual image (550,496 bytes), selected buffer
   pointer and 64,000-byte buffer seed, raw code windows, mapping and CPU context.
2. **DRAW_COMPLETE:** source `0x935E5`, before the frame-renderer RET. Save the
   same state and completed 64,000-byte source buffer. Tie it to DRAW_ENTRY's
   buffer and generation; reject mapping/source changes. Gate-off render calls
   must not replace the last pixel-producing generation.
3. **PRESENT_ENTRY:** source `0x65420`, after the caller's `0x7B30B` sync/DAC
   updates. Require ordinary mode-2 path (`Object2 0x75CEE==0`), selected source
   in the two native buffers, and **byte equality** to the last captured
   DRAW_COMPLETE buffer. Save Object2, current palette slots and raw DAC state.
   Reject a palette allocation change since DRAW_ENTRY. Keep the earlier draw
   objects even if a gate-off call has since changed their coordinates.
4. **POST_PRESENT:** source `0x670DD`, reached only after the observer saw the
   matching PRESENT_ENTRY return. Check Object2 `0x7662E` names that source;
   compare all 64,000 CPU-visible aperture bytes against DRAW_COMPLETE. Require
   unchanged DAC bytes/bits/PEL mask since PRESENT_ENTRY. Save the now-selected
   `0x7662A` too: it may be the *next* buffer, not the displayed generation.

`snapshot.Collector` implements these checks. The observer must invalidate the
pair on context switch to another executable, target stage/mode loss, a new
gate-on draw, unsupported presentation path, memory failure or bounded timeout.
The adapter must not infer PRESENT from simply arriving at `0x670DD`, because
the source has a branch that skips presentation and also loops at that address.

For strong control-flow provenance, retain a bounded boundary-event ring with
monotonic instruction serials, actual return sites/stack values and call depth;
emit the ring and the four retained phases in one private operation. Do not
timestamp separate debugger reads and call them one paused snapshot. Guest
IRQ handlers may run between phases; state and buffer equality checks remain
required. Host wall time is not an animation clock.

## Object/data coverage

Complete Object2 contains the nine accumulators, vertical state/rate, control
stream, list heads, palette allocation slots, source-resource mappings and
statically allocated object pools. Walk actual +0 links in order, not sorted
copies. Each object allocation is **0x58 bytes** (22 DWORD zeroing at `0x936E9`),
not an assumed 0x50/0x60/0x64 record. Preserve raw bytes plus decoded fields.
Multipart descriptor arrays use 12-byte entries under flag gates. Follow any
external descriptor, palette record or node with separate bounded block reads
and explicit provenance. The current oracle refuses out-of-Object2 nodes;
extend the range contract only after such a runtime case is observed.

Palette slots at Object2 `0x75B00` are 60 records of eight bytes: source record
pointer +0, referenced word +4 and DAC start byte +6. Preserve all eight bytes;
do not infer ownership from adjacency. Record pending palette queue head/tail
`0x563D8/0x563DC`, packed palette mapping, and referenced record bytes as needed.

## DAC and aperture: avoid changing the evidence

Read `vga.dac.rgb[i].red/green/blue` directly, all 256 entries, plus
`vga.dac.bits`, `vga_8bit_dac`, `pel_mask`, read/write indices, PEL component
index and state. **Do not read port 0x3C9** to dump colors: that advances DAC
read state. Raw component values must remain 6/8-bit with their format tags;
RGB expansion belongs to the independent verifier.

CPU aperture reads through VGA handlers can alter latches. Save/restore
`vga.latch` if using that route, or copy raw `vga.mem.linear` and reproduce the
observed aperture mapping independently. Also save sequencer chain/memory-mode,
graphics read/write mapping, CRTC start/offset/size, attribute mode and display
geometry. Do not label aperture equality proof of host scanout. The first
acceptance target is the game's native 320x200 logical framebuffer plus DAC.

## One-shot output and acceptance

Write only under a new `F:\Dev\MKEXT\FIXTURES\VALIDATION\P91-*` directory.
No raw packets, code/data memory, DAC or framebuffer goes to GitHub or CI.
Use exclusive creation and a completion marker only after all files close and
their hashes are recorded. Preserve failure metadata separately. Record exact
original input hashes, upstream revision, patch SHA and built EXE SHA. Normal
game launch must use an authorised disposable fixture copy with read-only
originals retained; avoid speculative autoexec/debugger commands.

**Build gate before user execution:** port the small collector/state machine
to the native adapter, compile it against the pinned DOSBox source, execute a
no-game synthetic-memory harness exercising real hook/memory/DAC APIs, then
run one bounded original Tomb capture. No automatic download/build/launch
command is offered in P91 because that integration has not passed this gate.
