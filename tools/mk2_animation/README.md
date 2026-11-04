# Original MK2 stage-effect frame extraction (O136)

Requires the original, SHA-256 authenticated MK2.EXE and original TOMB.GRA/PORTAL.GRA provided via the user's `mk2.zip`. The exporter creates an output directory with original ordered individual frames, transparent PNGs, raw indexed pixels and source masks, plus a SHA-256 provenance manifest. The independent verifier reopens the original inputs and audits the results against a separate implementation of the original sprite decoder. The suite rejects forged records, altered game files and invented timing claims. No input file is edited.

Use the reproduction commands in `CHECKPOINT_2026-10-12_O136_ORIGINAL_BACKGROUND_ANIMATION_FRAMES.md`.
