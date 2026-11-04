# MK DOS Archive — O131 checkpoint (October 12, 2026)

O131 authenticates the geometry and source-offset chain for MK2's seven packed stage-floor renderer commands. This is a **static source** finding, not a new gameplay capture. Complete project source and all historical research checkpoints are preserved. See `CHECKPOINT_2026-10-12_O131_PACKED_ROW_GEOMETRY.md` and `tools/mk2_native_stage_palettes/README_O131.md`.

The new read-only stage layer diagnostic reports the requested row count and conditional visible rows for Tomb/Portal. It explicitly does not report a live camera value, vertical adjustment, palette handle, or scene draw order. The original runtime mutable first-pointer value is not present in `MK2.EXE`'s file-backed data.

Full React app remains unbuilt in this environment due to missing dependencies; isolated TypeScript and Node parity pass. Supply your own original MK2 game files for reproducing the binary findings.
