# MK DOS Archive — O145–O152: original MK2 render traversal, presentation, and timing boundaries

**Date:** 2026-10-12. **Original authority:** canonical DOS `MK2.EXE` (861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`). This is **static EXE source tracing**, not an emulator execution trace. The O139–O144 source archive is inherited byte-for-byte except for the new research files and this handoff.

## Results

### O145 — Positive control token enters the actual sprite render-object chain

At physical `0x93500` the stage control dispatcher loads the current dynamically chosen pointer at Object-2 `0x75CF6`. The token decoder at `0x93547` advances the cursor. For a positive signed token (`0x93559`), the following DWORD is loaded as a pointer to a horizontal-offset source (`0x9358C–0x93594`), and **the positive token itself becomes EBP** (`0x935A1`). `CALL 0x93390` (`0x935A3`) dereferences `EBP+0x00` and enters the source render traversal at `0x931E4`. The traversal advances using render-object `+0x00` (`0x93390–0x9339B`); conditionally it reaches sprite draw dispatcher `0x652FC` via original calls `0x93356`, `0x93373`, `0x933BA`. This proves a concrete source connection from dynamically selected stage-control streams to linked render objects and the raster renderer.

**Unresolved:** which dynamic stream runs for a real fight, all-object compositing order and final pixel coverage. Ordered insertion inside one list (O143) is not sufficient to establish raster draw order between lists or stages.

### O146 — Render traversal conditionally moves objects and applies draw-coordinate gates

If mutable global `0x75A88` equals zero (`0x931F6`), code adds 32-bit object `+0x10` to `+0x18` (`0x93202–0x93205`) and `+0x14` to `+0x1C` (`0x93208–0x9320B`). This is **conditional position advancement while the object is traversed**, not proof of a particular per-second velocity.

`0x562D4` bit 0 gates sprite draw; object `+0x34` bit 0 and shape `+0x24` bit 14 select a different position/origin adjustment path. Object `+0x34` bits 1 and 5 control multi-descriptor processing branches. The descriptor-array cursor increments in 12-byte steps (`0x9337C`). The ultimate screen position still depends on mutable globals and actual runtime flags.

### O147 — Actual primitive raster entry and resource lookup

The shared original draw endpoint `0x652FC` checks a current buffer global (`0x7662A`) against two original internal buffer base values `0x56524` and `0x65F24`. Its packed resource reference in ESI uses the high byte to select an entry at `0x2F434` and low 24 bits as a resource-relative offset; missing base entries call `0x62658` to resolve resource data. It then applies palette/draw-mode options, retrieves a row pointer, and jumps via the original raster dispatch table `0x9A8`. This proves source code binding to the low-level graphics emitter, but not the runtime-selected palette or captured output.

### O148 — Task continuation scheduler, independently of wall-clock claims

The frame controller at `0x670DD` inspects an input word/dword in a dynamically allocated runtime structure addressed by global `0x3177C` at field `+0x24`, clearing it at `0x67101` when received. The task walker follows the head at `0x35B04`, decrements a **signed 16-bit** `+0x06` counter (`0x67158`), and skips tasks if it remains positive. Otherwise it restores task state, EDI render object `+0x18`, and jumps via the saved continuation `+0x1C` (`0x67182–0x67185`). Yield at `0x6710F` stores the countdown, return continuation and task context.

**Important:** the original routine handling `0x3177C+0x24` is identified on the consumer side only; source linkage of a specific IRQ producer to this counter and elapsed seconds has not been proved.

### O149 — Conditional stage-frame renderer → synchronization → presentation → scheduler

Frame controller `0x67050–0x6710D` toggles renderer gate bit 0 at `0x562D4`, invokes original renderer preparation `0x935E6`, and selects drawing paths based on the current mode (`0x3014C`), update enable (`0x75CF2`) and a second condition (`0x563E0`). Original calls at `0x6707B`, `0x670A2`, and `0x670BD` reach the frame routine `0x933C2`. Source branches then call `0x7B30B` (video synchronization) and `0x65420` (buffer presentation), conditionally. They converge on the runtime task-input gate at `0x670DD`.

This is a true control-flow linkage, but it does **not** mean every task countdown decrement corresponds to one displayed hardware frame.

### O150 — VGA retrace wait and selectable 320×200 buffer presentation

At `0x7B325–0x7B32C`, an original conditional path reads VGA status port `0x03DA`, tests bit 3 and polls until it becomes set (vertical-retrace indication). A mode flag at `0x75CE8` changes the earlier control flow; do not assume every path executes this exact wait. Port `0x3C8` / `0x3C9` DAC updates occur conditionally in the same area.

`0x65420` selects mode-dependent copy behavior. Some paths copy one of two internal buffers (`0x56524`/`0x65F24`) into video-memory aperture `0xA0000` via `0x65521`; other paths use `0x65A54` with both buffers and the aperture. The selected internal buffer can change. The actual video output has not been captured in this pass.

### O151 — PIT channel-zero divisor is original code-backed, not measured FPS

Original timer setup at `0x66F59–0x66F6C` disables interrupts (`CLI`), outputs mode/control `0x36` on port `0x43`, loads channel 0 divisor **`0x4D9D` = 19,869**, outputs low and high divisor bytes on port `0x40`, and re-enables interrupts (`STI`). The same source also contains the distinct VGA retrace wait and the task-consumer `0x3177C+0x24`.

It is **not verified** that this PIT reprogramming directly drives each task counter tick, that the emulator ran with a specific clock frequency, that one tick equals one presented frame, or that this implies game/animation FPS. Static hardware setup can suggest what to measure; it is not a substitute for measurement.

### O152 — Exact original final display-transfer geometry

`0x65521–0x65836` is a source-verifiable unrolled copy: 80 consecutive DWORD loads and stores covering offsets `0..316` in steps of 4; source and destination each advance `0x140` (320 bytes), while `CL` decrements from `0xC8` (200) and loops until zero. That is **320 × 200 bytes = 64,000 bytes per presentation pass**. These dimensions describe the displayed framebuffer, **not** the native full-width geometry of a scrolling stage/background. Keep all O135 native full-width layers and 43 original effect frames separate.

## Evidence and limits

| New milestone | Independent assertions/checks | Regression status |
| --- | ---: | --- |
| O145–O150 | 174 | 14 test methods, with hostile subcases |
| O151 | 44 | included in 13 O151–O152 test methods |
| O152 | 250 | included in 13 O151–O152 test methods |
| **New totals** | **468** | **27 new test methods, all passed** |

**Inherited independent reruns:** O139–O144 (328+68+52+62 = 510 original assertions), 39 focused tests; O138 15 regression tests; O135 34 regression tests. All passed in this continuation. Tests verify the code and the report's source claims; none are screenshots, measured FPS, or complete React build validation.

Original `MK2.EXE` and game `.GRA` files were never modified. No original commercial executable or `.GRA` is included in the source-only research tools. The existing extracted images remain unchanged.

## Reproduce and inspect

```bash
EXE=/path/to/original/MK2.EXE
TOOLS=tools/mk2_animation_continuation
python "$TOOLS/trace_o145_o148_render_dispatch.py" --exe "$EXE" --outdir /new/O145_O148
python "$TOOLS/trace_o149_o150_vga_present.py" --exe "$EXE" --outdir /new/O149_O150
python "$TOOLS/trace_o151_pit_setup.py" --exe "$EXE" --out /new/O151_REPORT.json
python "$TOOLS/trace_o152_screen_transfer.py" --exe "$EXE" --out /new/O152_REPORT.json
# independent reports O145-O150 should be in one directory (O145_REPORT.json..O150_REPORT.json)
python "$TOOLS/verify_o145_o150_independent.py" --exe "$EXE" --report-dir research_outputs
python "$TOOLS/verify_o151_pit_setup_independent.py" --exe "$EXE" --report research_outputs/O151_REPORT.json
python "$TOOLS/verify_o152_screen_transfer_independent.py" --exe "$EXE" --report research_outputs/O152_REPORT.json
python "$TOOLS/test_o145_o150.py" --exe "$EXE"
python "$TOOLS/test_o151_o152.py" --exe "$EXE"
```

## Remaining investigation and runtime verification gate

1. At runtime, resolve the original LE file-physical instruction offsets into debugger addresses using the **observed** loader mapping. File physical offsets are not directly emulated loaded addresses.
2. Log mode `0x3014C`, update enable `0x75CF2`, renderer gate `0x562D4`, stage control-root `0x75CF6`, object chain and pointer values, and input counter `*(0x3177C)+0x24` at the frame controller `0x67050`/`0x670DD`, task countdown `0x67158`, frame consumer `0x86CC5`, renderer dispatch `0x652FC`, and VGA sync/presentation `0x7B30B`/`0x65420`.
3. For Tomb, Portal and Tower, compare controlled DOSBox video captures with objects' original `+0x18`, `+0x1C`, `+0x3C` fields, stage-list origins and source frame pointer transitions.
4. Measure elapsed real/emulated time per counter/event and actual frame presentation. Do not promote FPS, parallax, exact placement or occlusion without such evidence.
5. Full app build remains unverified because `node_modules` and an emulator are absent in this container. Avoid shipping a speculative browser animation player until runtime behavior is calibrated.

**Current authority: O152. Continue on MK2 first; MK1 and MK3 afterward. Do not restore an artificial pass-count limit.**
