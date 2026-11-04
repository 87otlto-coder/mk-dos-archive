# O129 control stream dataflow

Use the original, exact-hash `MK2.EXE` as input. The producer and independent verifier operate without changes to the game and without runtime claims. See `CHECKPOINT_2026-10-12_O129_CONTROL_STREAM_SOURCES.md` in the root of the complete project for findings and commands.

Only the three statically assigned, authenticated pointer lists are enumerated. A separately verified initialization pathway can assign a dynamic control-stream pointer. Therefore the absence of `-1` in those fixed lists does **not** exclude a packed stage renderer call during gameplay.
