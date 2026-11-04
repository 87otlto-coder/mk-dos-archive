# MK2 original effect continuation (O139–O144)

This directory adds source-only, original `MK2.EXE`-anchored investigation beyond O138. It requires the untouched original commercial executable for reproducibility but **does not bundle or alter** it. All addresses are **physical executable offsets**, not emulated loaded addresses.

- `trace_o139_o141.py` — task-to-render-object binding (O139), frame-advance/counter routing (O140), descriptor-relative coordinate changes (O141)
- `verify_o139_o141_independent.py` — independent source opcode and report audit
- `trace_o142_initial_spatial_inputs.py` / `verify_o142_independent.py` — three source-level initial packed coordinate transforms (O142)
- `trace_o143_renderer_registration.py` / `verify_o143_independent.py` — ordered render-object insertion (O143)
- `trace_o144_stage_position_normalization.py` / `verify_o144_independent.py` — stage object list coordinate adjustment (O144)
- `test_o139_o142.py` — 39 adversarial regression tests covering all six checkpoint reports

See `CHECKPOINT_2026-10-12_O139_O144_SOURCE_EFFECT_OBJECT_TIMING_POSITION_ORDER.md` at repository root for exact evidence, source addresses, original-code distinctions, and known unknowns. No runtime FPS, final effect positions or raster draw order is asserted.

## Subsequent research O145–O152

- `trace_o145_o148_render_dispatch.py` / `verify_o145_o150_independent.py` — control-stream to object traversal and raster consumer, conditional render movement and task scheduler continuation (O145–O148).
- `trace_o149_o150_vga_present.py` / `verify_o145_o150_independent.py` — frame-driver sequencing, video retrace wait and presentation (O149–O150).
- `trace_o151_pit_setup.py` / `verify_o151_pit_setup_independent.py` — PIT channel-zero programming and separation from unmeasured task cadence (O151).
- `trace_o152_screen_transfer.py` / `verify_o152_screen_transfer_independent.py` — exact native 320×200 display-copy bytecode (O152).
- `test_o145_o150.py`, `test_o151_o152.py` — regression/adversarial suites.

See `CHECKPOINT_2026-10-12_O145_O152_RENDER_PRESENT_HARDWARE_TIMING.md`. The original EXE is required as input to reproduce these reports and is never rewritten. **O152 is source-only, not gameplay-runtime certified.**

## O166–O170: original keyboard branches, timer/sample cadence and effect-list termination (October 13, 2026)

- `trace_o166_o168_input_cadence.py` + `verify_o166_o168_independent.py`: original IRQ8 Alt-combination scan-code/status paths (O166), IRQ0 chaining cadence and conditional nominal PIT frequency model (O167), recorded IRQ sample versus once-per-traversal task countdown decrement (O168).
- `trace_o169_original_effect_list_control.py` + `verify_o169_independent.py`: all six original animation-stream loop/zero termination rules and 43 descriptor identities (O169).
- `trace_o170_keyboard_mode_switch.py` + `verify_o170_independent.py`: source-authenticated mode flag `+0x3D`, duplicate original setter/clearer helpers, complete key-state-table clearing and distinct IRQ9/main-loop conditional branches (O170).
- `test_o166_o168.py`, `test_o169.py`, `test_o170.py`: 45 adversarial cases. The independently checked O166–O170 reports live in `research_outputs/O166_REPORT.json` through `O170_REPORT.json`.

Refer to `CHECKPOINT_2026-10-13_O166_O170_INPUT_CADENCE_LIST_MODE.md`. All these new passes are static two-file original-source research, **not observed animation FPS or an emulator gameplay run**. Original commercial files are never bundled in source releases.

## O171–O176: two original sprite interpreters, phase gating, relative breakpoint plan, Tower browser preview

- `trace_o171_o173_interpreters_order.py`, `verify_o171_o173_independent.py`, `test_o171_o173.py`: original 10-token alternate dispatcher and LE jump-table fixups, normal descriptor/flag reader, within-list sort/traversal distinction.
- `trace_o174_original_keyboard_phase_model.py`, `verify_o174_independent.py`, `test_o174.py`: exact modifier-qualified 16-bit phase-wrap arithmetic and reset branch. Counts are not milliseconds.
- `trace_o175_runtime_capture_preflight.py`, `verify_o175_independent.py`, `test_o175.py`: canonical EXE/driver-only watchpoint plan with unknown loaded addresses deliberately null. NOT an emulator trace.
- `scripts/run-mk2-o176-tower-original-effect-bridge.mjs`, `scripts/test-mk2-o176-tower-source-hardening.mjs`: user-supplied original Tower frame/palette-source parity and negatives. The existing O136 browser decoder supports optional original Tower source frames and retains unmodified Tomb/Portal functionality. Tower palette is source-linked, not runtime confirmed.
- Checkpoint `CHECKPOINT_2026-10-13_O171_O176_INTERPRETER_RENDER_PHASE_TOWER_BROWSER.md` preserves all verified claims, qualifiers, and reproduction commands.
