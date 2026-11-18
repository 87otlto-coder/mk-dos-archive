# P91 spelunking — CPU-visible VGA aperture is a mode-dependent observer (2026-11-18)

**Status:** source-code relationships **VERIFIED STATIC** at pinned revisions; MK2 live runtime state and impact **UNKNOWN / VALIDATION PENDING**. Research-only; no original game run, C++ patch, test execution, source-branch merge or change to the validated portable capture kit.

## Baseline and exact source provenance

- P91 baseline: `research/p91-native-observer-smoke`, [P91 native capture integration](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/docs/research/P91_NATIVE_CAPTURE_INTEGRATION.md). The original-free Windows portable kit passed; an original MK2 Tomb mode-2 packet was **not** captured at that checkpoint.
- Our prior [2026-11-17 scanout / target-reachability note](SPELUNK_20261117_MK2_P91_SCANOUT_AND_REACHABILITY.md) distinguishes logical framebuffer from monitor scanout. **This note is a different, narrower finding:** even the **CPU-visible A0000 read** can be a transformation of underlying VGA memory, and the observer's read can affect emulator timing bookkeeping.
- Pinned emulator source: [DOSBox-X exact commit `029bd65c5dcc7cdc7f2e14e35278620d9707d969`](https://github.com/joncampbell123/dosbox-x/tree/029bd65c5dcc7cdc7f2e14e35278620d9707d969). No reliance on HEAD/master implementation.
- Independent hardware reading: [FreeVGA graphics-controller reference (Johns Hopkins mirror)](https://www.cs.jhu.edu/~huang/cs318/fall17/project/specs/freevga/vga/graphreg.htm), [FreeVGA memory operation reference (Stanford mirror)](https://www.scs.stanford.edu/22wi-cs212/pintos/specs/freevga/vga/vgamem.htm).

## New finding A — a raw `MEM_BlockRead(0xA0000,64000)` is a *CPU read transaction*, not an unconditional raw VRAM dump

**VERIFIED STATIC:**

1. The actual P91 adapter's [`native_capture_adapter.hpp`, `sample` post-present](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp#L482-L491) saves `vga.latch`, invokes `native_ram_read(0xa0000u,PIXELS,...)`, then restores the latch. `PIXELS=64000` is defined in [`native_generation_guard.hpp`](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_generation_guard.hpp).
2. `native_ram_read` calls DOSBox-X `MEM_BlockRead`. [Pinned `src/hardware/memory.cpp` L914-L919](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/memory.cpp#L914-L919) implements this as successive `mem_readb_inline` calls. In other words, it traverses the emulator's memory/page-handler semantics rather than copying a raw `vga.mem.linear` backing array.
3. [Pinned `src/hardware/vga_memory.cpp` L281-L327](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_memory.cpp#L281-L327) implements `VGA_Generic_Read_Handler`: odd/even and plane calculations, VGA latch load, read-mode-0 plane selection, and read-mode-1 color compare + don't-care logic. A mode-1 read is not a native color-index byte. Do **not** generalize this exact path to every selected emulator handler: optimized chained/banked handlers exist.
4. [Pinned `vga_memory.cpp` L395-L451](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_memory.cpp#L395-L451) implements chained access with remapping, while [L2534-L2547](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_memory.cpp#L2534-L2547) maintains **separate** `bank_read_full` and `bank_write_full`. Thus the value available at CPU aperture `A0000` can depend on the active memory mapping; the source render buffer, physical VRAM and display scanout are three separate evidence objects.
5. [Pinned `src/hardware/vga_gfx.cpp`](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_gfx.cpp) writes read-mode selection from graphics-mode register bit 3 and maintains the read-map/color compare/don't-care settings.

**Implication (HYPOTHESIS requiring game evidence):** If P91's guard ever refuses `VGA aperture differs from completed draw`, classify what the VGA **CPU read configuration** means first. A mismatch *could* be caused by a mode-1 compare read, banking, odd/even, a noncanonical plane selection or another presentation consumer; it is **not**, on its own, proof of a wrong decoder or scene composition. Conversely, this observation **does not** establish that MK2's actual 320x200 Tomb path uses any exotic read mode. Typical straightforward chain-4 indexed use remains possible.

P91 [`sample` L455-L461](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp#L455-L461) captures `vga.seq.memory_mode`, `vga.gfx.mode` and `vga.gfx.miscellaneous`, which may diagnose read-mode and chain settings. It does **not** preserve `vga.svga.bank_read_full/bank_write_full`, `vga.config.read_map_select`, `color_compare`, `color_dont_care`, or handler-selection identity. This is a bounded extension candidate **only if a private P91 failure shows it is required**.

## New finding B — reading the aperture may alter emulator cycle accounting

**VERIFIED STATIC:**

- [Pinned `vga_memory.cpp` L72-L92](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_memory.cpp#L72-L92) defines `VGAMEM_USEC_read_delay`: when enabled, it subtracts a computed delay from `CPU_Cycles` and adds it to `CPU_IODelayRemoved`.
- Some VGA page handlers call it from their `readb` methods, e.g. [L435-L442](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_memory.cpp#L435-L442). Because P91 uses 64,000 byte-wise `MEM_BlockRead` operations, it **can** alter emulated CPU timing bookkeeping if the active A0000 handler charges this delay.
- The current P91 observer restores **`vga.latch` only** after this terminal read, not the two CPU delay counters. Its [no-game adapter self-test](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp#L495-L530) instead validates an ordinary 16-byte RAM read at `0x400`, a DAC non-mutation check and SHA-256; it does not exercise 64,000 CPU reads from A0000.

**Impact assessment (INFERRED):** In the present one-shot P91 design, the aperture read occurs in `PostPresent` immediately before accepted output and capture stops. No subsequent game-frame timing is claimed. This is **not an established reason to rebuild or delay the first original packet**. For *future repeated runtime captures* or any attempt to claim the observer is cycle-noninvasive, it is a real control to address and independently test.

## Practical experiment / falsifiers — defer until justified

1. **Do not modify P91 on speculation.** Run the already prepared one-shot portable kit locally with the original private MK2 fixture when available. Maintain original read-only inputs, exclusive private outputs, and fail-closed packet checks.
2. **If the exact failure is aperture inequality**, first examine the captured/recorded `vga.gfx.mode` and `vga.seq.memory_mode` and the emulator machine configuration; **do not** assume bank settings or VRAM planes from visuals. Ask for a narrowly scoped original-free VGA test before extending the native observer.
3. **Proposed original-free VGA controls** with known data patterns: chained 320×200 read-mode-0, graphics-controller read-mode-1, nonzero read/write banks, odd/even and read-map changes. At each controlled state independently compare (a) backing VRAM, (b) 64K CPU aperture read, and (c) logical source buffer. Test that restoring the latch does not necessarily restore `CPU_Cycles`/`CPU_IODelayRemoved`. Do not expose or upload copyright bytes.
4. Only if controls show an actual problem for the observed MK2 state, extend **a new isolated observer variant** with side-effect-free raw VRAM copy plus captured read-bank/controller identity. Re-pin source/patch/executable SHA, pass no-game Windows tests, then validate a second native Tomb runtime state. Avoid silently changing what the existing P91 `aperture` field means.
5. Keep separate acceptance labels: **source buffer indexed parity**, **CPU aperture read parity**, **VRAM backing parity**, **effective DAC/RGB**, and **real scanout**. Never promote one to the others by assumption.

## Stop state

**VERIFIED:** upstream emulator memory-read behavior and timing counter semantics, P91 code path/self-test coverage. **INFERRED:** possible mismatch/refusal or timing contamination under specific VGA states. **UNKNOWN:** actual MK2 Tomb VGA modes/banks/read delay, loaded runtime buffers and original frame. **VALIDATION PENDING:** any synthetic A0000 emulator test or original-game capture. No tests run and no original artwork, audio or binaries committed.
