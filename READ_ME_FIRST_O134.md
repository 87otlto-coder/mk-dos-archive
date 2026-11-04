# MK DOS Archive — O134 release

Continue from the **O133 master handoff** and `CHECKPOINT_2026-10-12_O134_STAGE_INITIALIZER_BEHAVIOR_CALLBACKS.md`.

This checkpoint proves original stage-init function pointers, a bounded set of Tomb/Portal routine-registration sites, and their LE relocation provenance. It **does not yet identify animation frames or timings**. The full-width Tomb/Portal exporter and read-only browser diagnostics retain all original source graphics without trimming to the in-game camera.

Research report: `research_outputs/O134_STAGE_INITIALIZER_BEHAVIOR_CALLBACKS.json`.
Independent audit: `research_outputs/O134_INDEPENDENT_CALLBACK_AUDIT.json`.
Main scripts: `tools/mk2_native_stage_palettes/trace_o134_stage_behavior_callbacks.py`, `verify_o134_callbacks_independent.py`, `test_o134_callbacks.py`.

Commercial original game data is not part of the development source package. The full React build/runtime remains unverified.
