# MK DOS Archive — Pit II handoff through O268

**Authoritative source:** `MK_DOS_Archive_Source_O268_Pit_II_2026-10-18.zip` (this checkpoint). Inherit `MK_DOS_Archive_Pit_II_HANDOFF_THROUGH_O261_2026-10-18.md` and all earlier O1–O261 handoffs unchanged.

O267: five user screenshots from one DOSBox-X fatality session independently confirm palette pending flag 1 at `0x2963E0`, one 8-byte DAC command in queue, source pointer `0x22795A` (two-byte header past cache source `0x227958`), destination 64, count 81, subsequent queue drain and pending clear, and breakpoint hit at `0180:00205458` (physical `0x670AC`) in the palette-triggered video-transfer branch. **No claim that the CALL had already executed.** The live cache eviction and 15-reference reacquisition is inherited from O260.

O268: original executable source confirms `0x670AC -> 0x65420`; the transfer wrapper has mode and buffer-state branches, and normal-mode delta copy `0x65A54` writes into `0xA0000` when comparison finds changed dwords. This is **source-verified but not yet live demonstrated** for the observed frame.

Coordinate spaces: original code file-image base `0x61C54`, runtime code-object base `0x200000`; writable data operands add `0x240000` (e.g. cache original `0x75B00` -> live `0x2B5B00`). Palette source `0x27958` -> live `0x227958` instead, reflecting a different mapping. **Never add the writable-data delta to palette source pointers.**

`CHECKPOINT_2026-10-18_O267_O268_PIT_LIVE_DAC_TO_TRANSFER.md` contains source addresses, limitations, screenshot hashes, exact reproduction commands and next boundary. O267/O268 JSON outputs are deterministic, mutation controls total 48. Original MK2.EXE/FALL.GRA unmodified; previous source archive entries remain unchanged.

**Pit II unfinished:** exact VRAM writes/display cadence, O248 unequal texture holds, complete screen/camera timing and secondary impact-effect compositing. The evidence supports a palette-associated *branch call reached*, not an exact 50 fps texture timing model.
