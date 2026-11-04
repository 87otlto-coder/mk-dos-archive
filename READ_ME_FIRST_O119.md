# MK DOS Archive — O119, 2026-10-11

This is the complete MK DOS Archive development source through **O119**.

O119 **resolved the O118 80-vs-79 counted palette record ambiguity for the two user-tested DOSBox fights**, using four labeled gameplay screenshots and byte-verified single-word palette experiments. Tomb 80-color and Portal 80-color source records visibly recolored the stages; the 79-color alternatives did not. Active runtime palette allocator handles/DAC indices remain unknown.

**New:** 4 source-screenshot evidence PNGs; a complete O119 proof report; a separate independent verifier; 12 O119 regression cases including intentional report tampering; TS runtime provenance metadata and 15 Node bridge assertions; improved floor preview panel explanation. Historical O118 source, tests, handoff and original assets remain intact except explicitly documented panel and tooling README edits.

The project's two-stage floor-only previews are not full stage renders and source crop offsets are not camera RAM coordinates. No original commercial game binary or `.GRA` is bundled in this source package. To reproduce verification, provide the original user-owned MK2 ZIP and the separately available O118 test kit.

Begin with `CHECKPOINT_2026-10-11_O119_RUNTIME_PALETTE_SOURCE.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-11_THROUGH_O119_RUNTIME_PALETTE_SOURCE.md`.

Research priorities: MK2 → MK1 → MK3 → integrated extractor/compiler. Authentic Enhanced / bot are future work.
