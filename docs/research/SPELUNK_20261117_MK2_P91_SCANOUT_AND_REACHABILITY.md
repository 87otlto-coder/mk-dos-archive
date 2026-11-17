# Spelunking — P91 logical framebuffer versus VGA scanout provenance (2026-11-17)

**Classification:** source-observed / static VERIFIED; live original MK2 applicability **VALIDATION PENDING**.  
**Scope:** protect the first native P91 Tomb capture and identify the *next* extraction-fidelity gate. Research-only; no emulator patch, test run, original game, output packet or source checkpoint was altered.

## Baseline

- P90 [stage reconstruction report](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p90-mk2-stage-reconstruction/docs/research/P90_MK2_STAGE_RECONSTRUCTION.md) establishes mode-qualified static Tomb/Portal roots and projected contributions, not framebuffer truth.
- P91 [native integration report](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/docs/research/P91_NATIVE_CAPTURE_INTEGRATION.md) reports original-free Windows **portable kit** success at CI [43753635156](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43753635156), but no original Tomb mode-2 packet captured as of that checkpoint.
- Read from committed P91 [native_capture_adapter.hpp](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp), [native_generation_guard.hpp](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_generation_guard.hpp), and [run_private_capture.py](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/run_private_capture.py). No inference about uncommitted local changes.

## Find A — P91 indexed/aperture proof does not fully constrain DOSBox-X *displayed* pixels

**VERIFIED against exact upstream source at pinned DOSBox-X commit `029bd65c5dcc7cdc7f2e14e35278620d9707d969`:**

1. [`src/hardware/vga_dac.cpp`, `VGA_DAC_UpdateColor`](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_dac.cpp#L143-L204) maps a rendered palette index through `vga.dac.combine[]`, `VGA_AC_remap`, the attribute color-select/mode branch where applicable, and `vga.dac.pel_mask` before selecting `vga.dac.rgb[...]`. Hence raw DAC table plus PEL mask alone is not always sufficient to produce the effective palette.
2. [`VGA_DAC_SendColor`](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_dac.cpp#L104-L140) expands components according to `vga_8bit_dac`; in [`src/ints/int10.cpp`](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/ints/int10.cpp#L894-L910), the VESA DAC-width function can update that flag. The P91 adapter retains `vga.dac.bits`, **not** the `vga_8bit_dac` flag. They must not be assumed equivalent without a live/synthetic check.
3. [`src/hardware/vga_draw.cpp`](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L6489-L6530) derives the display address and linear mask from VGA/SVGA scanout configuration, panning and CRTC attributes. `VGA_DrawSingleLine` uses scheduled scanlines, so a synchronous CPU-visible 64K aperture snapshot is **not** automatically an entire monitor frame.
4. Upstream [Video Debug Overlay documentation](https://github.com/joncampbell123/dosbox-x/blob/master/README.video-debug-overlay.md) explicitly distinguishes raw palette (RPAL) from effective palette (EPAL/CSPAL), explains panning, line-compare and per-scanline changes; [upstream maintainer explanation](https://github.com/joncampbell123/dosbox-x/discussions/4715) separates CRTC display-start address from the CPU-visible VGA aperture mapping.

**VERIFIED against committed P91 adapter fields:** at each phase `sample` captures `vga.mode`, sequencer memory mode/map mask, graphics mode/miscellaneous, CRTC offset/start, attribute mode control, `vga.dac.bits`, `pel_mask`, and 256 raw DAC triplets. It **does not capture** `vga.dac.combine`, `VGA_AC_remap`, `vga.attr.color_select`, `vga_8bit_dac`, `vga.draw.address`, `vga.draw.linear_mask`, `vga.draw.panning`, `vga.draw.width/height` or `vga.config.real_start` (direct field inspection).

**Confidence boundary:** This does **not** demonstrate wrong P91 pixels or palette in native MK2; no observed Tomb register values exist. P91 correctly aims first for the game's *logical* 320×200 indexed buffer and matching A0000 CPU aperture, not host scanout. These extra fields belong to a distinct display-fidelity acceptance gate, **not** a justification to invalidate, rebuild or delay the portable P91 packet capture.

**Targeted later experiment:** After a successful original packet, implement a source-only optional VGA presentation-state record capturing the effective 256-entry RGB mapping and enough CRTC/draw state to explain scanout offset/panning. Verify on an original-free controlled 320×200 mode fixture with altered PEL mask, remap and start/panning; then compare with a separately captured DOSBox rendered frame at a specified scanline boundary. Do not simply equate screen capture with an A0000 dump. If original scanout state is canonical identity, establish it by observation, not assumption.

## Find B — first-run target reachability cannot be inferred from timeout alone

**VERIFIED implementation:** [P91 launcher](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/run_private_capture.py#L64-L79) starts `MK2.EXE` in a disposable copy with `core=normal` and no scripted gameplay inputs, and waits up to 600 seconds by default ([lines 110–145](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/run_private_capture.py#L110-L145)). The [observer](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp#L210-L312) binds only after source window checks and then seeks stage=1, mode=2 and the Tomb stream. `targetSeen_` and `bound_` state exist but are not written as progress breadcrumbs before final success/refusal; launcher timeout may thus have several explanations.

**INFERRED risk:** If the game does not naturally enter Tomb mode 2 or the user does not reach it during this run, an otherwise working native observer can time out. A bare timeout is **not** a palette, mapping or renderer failure. Whether the game's actual attract path hits this target is **UNKNOWN**. User interaction could be possible via the visible SDL window, but the launcher does not supply a reproducible route or prove such input.

**Recommended triage after the first private run (no code change beforehand):**
- If preflight refuses: fix only exact path/hash prerequisite, without touching originals.
- If bounded timeout with no `p91-capture-refusal.json`: mark **TARGET REACHABILITY / OBSERVER ACTIVATION UNKNOWN**; inspect private stdout/stderr, exact process state and whether the intended target was actually entered. No captured state must be invented.
- If native refusal exists: preserve its exact reason and private evidence; separate mapping/list/CPU context failure from buffer/palette/return/aperture mismatch.
- If a valid raw packet exists: independently verify P91 v2 pairing, original input identities and aperture equality **before** any RGB/scene reconstruction.

Future optional diagnostic instrumentation should log only original-safe counters such as 'source bound', 'target reached', boundary event counts and first refusal to a private path; introduce it in an isolated patch with new hash/build gates **only if first-run evidence justifies it**. Avoid a second unverified native build or speculative navigation automation now.

## Priority

1. **P0:** One bounded user-local P91 original Tomb mode-2 capture with the already verified portable kit. Do not rebuild the kit for this research note.
2. **P0:** Diagnose failure by exact classification; do not treat timeout as failed rendering.
3. **P1:** After accepted logical-frame capture, test effective-palette/scanout state and CRTC/panning only if needed for stage/viewport RGB fidelity.
4. **P2:** Independent second camera/frame holdout and Portal; generalize after repetition.

**Research/implementation/runtime confidence:** external DOSBox-X source static VERIFIED; P91 adapter field-coverage static VERIFIED; actual original-MK2 effective palette, scanout geometry, target traversal and gameplay frame all **UNKNOWN / VALIDATION PENDING**. No game assets, code bytes, raw DAC, ROMs, pixel captures, tests or release artifacts are in this note.
