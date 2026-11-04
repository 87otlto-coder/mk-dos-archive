# O253 — Pit fatality handoff resets palette cache and stage objects

Date: 2026-10-17. Inherits O252. Status: VERIFIED original executable call paths with explicitly unproven live interleavings.

## Result

Before entering lower fatality scene, `0x80436 -> 0x64685 -> 0x64695 -> 0x64659 -> 0x7B41F` resets the palette cache. `0x7B41F` zeroes 120 DWORDs (60 records × 8 bytes) and initializes the DAC queue. `0x6466F -> 0x81B18` clears stage list heads. Within the same reset chain `0x64680 -> 0x66D04 -> 0x66D51 -> 0x7B41F` resets the palette cache again; `0x66D76 -> 0x81B18` clears the stage lists again, and `0x66D7B..0x66DC9` reconstructs the object free-list.

A scheduler yield (`0x80451 -> 0x6710F` with count 5) separates this reset from the lower-scene entry (`0x8045B -> 0x8054A`); the lower scene subsequently creates a fighter and starts the wall selector.

**Implication:** The Pit palette's previous presence in the upper stage is not evidence that it remains registered during the lower scene. The reset can invalidate that cache entry even without reference-by-reference release callbacks. Other tasks during the yield and other lower objects could still register the same palette; no runtime occupancy is asserted.

Replay in the joint O252–O254 verifier.
