# MK DOS Archive — Full source through O115 (2026-10-11)

Primary runtime finding: four user-supplied DOSBox screenshots now corroborate the O113 stage source Y rulers (Tomb and Portal) and reconstruct **128 conditional source-byte-to-observed-RGB values** (50 Tomb + 78 Portal) in the index ramp captures. Both screenshot models use an approximately 2x scaled view. **The recovered Portal 78-color map has also reconstructed 2,210/2,210 unoccluded pixels from the entirely separate original Portal control screenshot** using the untouched original resource. These are **not** verified palette-bank assignments or global DAC dumps.

Read `CHECKPOINT_2026-10-11_O115_Y_RULERS_RAMPS.md`, the O115 addendum to the master handoff, and `research_outputs/O115_OBSERVED_STAGE_FLOOR_RGB_TABLE.csv`.

All prior source files remain preserved; source analysis tools, four unmodified screenshots, 5 JSON reports, and tests have been added. Original commercial game data is not bundled. Run the dedicated O115 tests under `tools/mk2_stage_runtime_witness`, and the independent verifier; its optional `--test-kit` mode checks every original patched source byte against the separately distributed O113 runtime kit.

**Status:** O111/O112 50-pass checkpoints closed, O113/O114/O115 runtime validation checkpoints. No padded 50-pass research claim. Next research: test whether O115 RGB observations can be reconciled with the executable's parameterized palette-base and runtime allocation relationships. No repeat gameplay tests requested.
