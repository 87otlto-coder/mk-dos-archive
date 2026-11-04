# O254 — Conditional cache lifetime and frame-presentation matrix

Date: 2026-10-17. Inherits O253. Status: original source verified; **symbolic models only, not a live DOS emulator trace**.

## Result

With the same six original source palettes, one 32-step sequence can have radically different DAC enqueue behavior depending on the number of external palette owners.

- **0 persistent unrelated owners:** each group releases the prior group's final palette reference; new group first tile misses, other tiles hit. 32 misses, 468 hits, 31 zero-count releases between groups, 500 tile acquisitions.
- **≥1 persistent unrelated owner:** old group release leaves the palette cached; every new wall tile hits. 0 misses, 500 hits, 500 acquisitions.

On misses, the original allocator sets pending flag `0x563E0=1` (`0x7B48F`), resets alternating bit `0x562D4=0` (`0x7B499`), and queues DAC data (`0x7B4A3 -> 0x7B2D0`). When pending remains set at the controller gate `0x6708C`, `0x670A2/0x670A7/0x670AC` compose, flush DAC and transfer a frame; the DAC consumer clears pending at `0x7B3ED`. Otherwise the frame controller can use its normal alternating presentation gate at `0x670C7`.

Crucially **32 cache misses do not imply 32 distinct visible palette flashes or 32 presented frames**: queue timing, task interleaving, existing other palette operations, the 50 fps presentation observations, and the captured 30 fps sampling remain separate quantities.

The exact live number of external palette holders remains UNKNOWN. Replay in the joint O252–O254 verifier.
