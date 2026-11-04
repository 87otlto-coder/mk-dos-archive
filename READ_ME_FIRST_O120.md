# MK DOS Archive — O120 checkpoint

## What's new

The O119-confirmed Tomb/Portal 80-color stage palette records are now connected to typed LE **Object-2 palette pointer tables and ten compatible 18-byte setup records**. A source-backed control path at physical `0x81DD5–0x81DDF` uses a setup record's `+0x0E` pointer to request a palette and store a returned handle. This is conditional code-structure provenance, **not proof of live handle ownership**.

Start with `CHECKPOINT_2026-10-11_O120_STAGE_PALETTE_SETUP_GRAPH.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-11_THROUGH_O120_SETUP_GRAPH.md`.

### New code

`tools/mk2_native_stage_palettes/trace_o120_setup_graph.py`

`tools/mk2_native_stage_palettes/verify_o120_independent.py`

`tools/mk2_native_stage_palettes/test_o120_graph.py`

`research_outputs/O120_STAGE_PALETTE_SETUP_GRAPH.json`

All operate on an explicitly supplied exact original `MK2.EXE` (SHA-256 pinned). No DOSBox gameplay was executed in the current environment. The prior O119 user-runtime experiments remain archived and qualified.

### Validation

27,004 LE relocation records parsed (26,994 unique sources), 10 full setup records, 34 contiguous table references, 5 other referenced palette words, 92 independent graph assertions, 23 targeted Python tests, 12 O119 prior regressions and 15 Node bridge checks passed. Full React app build remains unverified.
