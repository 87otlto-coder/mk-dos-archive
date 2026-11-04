# MK DOS Archive O124 — source-to-screenshot attribution

O123 remains preserved. O124 adds a deterministic, read-only original MK2 layer-attribution diagnostic for the previously verified Tomb and Portal screenshots. For the two particular screenshots, 166,180 Tomb pixels and 102,251 Portal pixels have an exact source candidate matching their RGB; this is *not* an estimate of complete stage compositor coverage. Each image distinguishes uniquely matched source layers, multiple matches and unattributed pixels. The project still needs the user to supply the canonical DOS MK2 game files when running the analysis. See `CHECKPOINT_2026-10-11_O124_SCREENSHOT_SOURCE_ATTRIBUTION.md` and `tools/mk2_native_stage_palettes/README.md` for reproduction. No new DOSBox test is necessary.

O124 consists of one substantive independently audited checkpoint, not an artificial set of 50 passes. Full React app build was not conducted; the O122 JS bridge remains tested and unchanged.
