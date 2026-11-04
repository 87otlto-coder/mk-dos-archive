# O228 — Pit II fatality blood sprite 177: original spawner, palette and coordinate placement

**Inputs:** original user canonical MK2.EXE/BLOOD.GRA, O219 source-vs-video palette measurements. **Status: independently source-verified and held-out video corroborated; not a DAC or live CPU trace.** O227 source archive retained unmodified.

## Proven original executable relationships

- Original fatality code at physical `0x806E6` writes Object-2 `0x206FC` (physical `0xC1350`) to the sprite descriptor selector. Its original Object-1 immediate has the exact typed LE relocation to that Object-2 descriptor. The sprite is authentic `BLOOD.GRA` source **177**, resource ID **9**, graphics offset **111552**, size **14×9**, descriptor-local X/Y **(7,3)**. The original code calls object constructor `0x64548`, copies the per-entry coordinate into EDX, calls coordinate helper `0x64A19`, then commits via `0x646B4`.
- The original per-descriptor fourth DWORD at physical `0xC135C` is a verified relocated pointer to Object-1 `0x26CC4`, physical **`0x88918`**. This is precisely the original **48-color** executable record independently found highly compatible with sprite 177 in O219. The earlier palette ownership uncertainty can now be narrowed: source-descriptor association is **verified**, while the actual DAC bank/state during impact is unobserved.
- Original `0x806C4` selects an 11-position DWORD table at Object-2 `0x13D70` (physical `0xB49C4`), with zero terminator. All 11 original packed coordinates are preserved in the O228 JSON. Their usage is code-connected to sprite 177, not an inferred pattern.
- Helper `0x64A19` unpacks signed 16-bit Y and X and performs `v - (v arithmetic-shift-right 2)` for each, storing the transformed values in object fields `[EDI+0x1E]` and `[EDI+0x1A]`. For nonnegative original coordinates this is `ceil(3v/4)`.
- A second four-entry alternating pointer+coordinate list at Object-2 `0x13DA0`, with typed links to source descriptors Object-2 `0x206E4` and `0x206F0`, is consumed in the preceding routine. Their effective runtime drawing needs separate qualification; no association with the five isolated sprite-177 blobs is asserted.

## Independent source-to-video numerical witness

Original O219 identified five source177 red fragments in original owner-recorded video at [(108,80),(180,80),(198,116),(204,140),(108,140)]. The corresponding transformed entries of the original eleven-position table are [(108,84),(180,84),(198,120),(204,144),(108,144)]. All five have exactly **(0,-4)** observed-screen displacement, no outliers. Exhaustively testing all possible translations implied by the first sample, only (0,-4) matches three or more of the independent five samples—and it matches **all five**. The cause of -4 (camera/clipping/descriptor offset) is **not** established; do not silently hardcode it as an original draw formula.

## Reproduction and safeguards

`scripts/verify-o228-pit-blood-source-placement-and-palette.py` requires original MK2.EXE and BLOOD.GRA SHA-256, parses actual typed LE fixups, independently checks code instructions/calls and exact placement data, verifies O219 source hash identities, performs exhaustive translation comparisons, and rejects **10** deliberate source mutations. Two runs reproduced byte-identical `research_outputs/O228_PIT_BLOOD177_SPAWNER_PALETTE_AND_PLACEMENT.json` SHA-256 **`c634b3b865d26e6643bcf6e597769999b06a8b6fcd2e5b62a36fdf71ebf71979`**.

```
python scripts/verify-o228-pit-blood-source-placement-and-palette.py --game-zip /path/to/owner-mk2.zip --project . --out /new/nonexistent/out
```

The original commercial binaries and existing source files were not patched or modified. Remaining boundaries: live renderer draw order, all blood/crack child effects, fatality triggering and timer-to-presentation mapping.
