# MK DOS Archive O133 — Stage motion-source investigation

Continue from `CHECKPOINT_2026-10-12_O133_STAGE_MOTION_SOURCE_CHANNELS.md` and the O133 master handoff. This release adds a source-verified connection between MK2 stage configuration tables and nine accumulating renderer channels. The original full-width Tomb/Portal stage assets and their separate sprite/alpha/index exports are **not** cropped or flattened.

**Do not call these source words measured parallax factors or animation frames.** They are signed 16.16 input words; their active transform, frame cadence, callbacks and moving sprite associations are unresolved. The project continues prioritizing MK2 extraction and future animation-capable, separate-layer source exports.

Research report: `research_outputs/O133_STAGE_MOTION_INPUTS.json`.

CLI: `tools/mk2_native_stage_palettes/trace_o133_stage_motion_sources.py` (read-only game inputs). See the checkpoint for verification commands. The entire React UI build has not been verified.
