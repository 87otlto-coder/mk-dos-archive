# MK DOS Archive — O97C / O97D / O97E Battle Plan Graphics and Portrait Composition

**Authority:** 2026-10-09 SAST · Authentic DOS MK2 binary fixture · MK2 RESEARCH OPEN · All new passes independently verified

## Source and classification

- Parent: `MK-DOS-Archive-2026-10-09-O97B-source.zip`, unchanged historical source, independent scripts, GRA decoding and 27,004 verified LE relocations retained.
- Authentic `mk2.exe` SHA256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Authentic `mountain.gra` SHA256 `0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6`.
- The source graphics now visibly reconstruct a **MORTAL KOMBAT BATTLE PLAN** tower structure with portrait slots and a distinct landscape image group. This supports a substantive reclassification of parts of this file as battle-plan/interface graphics rather than assuming the entire file is an in-fight stage solely based on the resource filename.
- All RGBA images here are *palette candidates* using the 207-word Object-1 record and the previously qualified packed RGB6 translation. They are **not observed frames, verified final game colors, or evidence that the corresponding processes run simultaneously**.

## O97C — Independent full 39-image source-coordinate atlas

- 39 authentic file-backed sprite descriptors / 39 decoded resource streams, source setup at Object2 `0x1C31E` and control list `0x1C5DC`.
- Derive atlas bounding box X **-8..320 exclusive**, Y **-48..848 exclusive** from each serialized rectangle: **328×896**, 293,888 pixel positions. Deliberately not assumed to be the visible viewport.
- **112,988 opaque source pixel instances = 112,988 opaque atlas pixels** (no opaque-over-opaque collisions); 194 source rectangle positions are double-covered but no such position has two opaque source pixels.
- Pixel indices and opacity plus separate rectangle/opaque owner buffers written losslessly. Rendering overlays alpha-only in source list order is a diagnostic; **actual game z-order is unproven**.
- The palette-mapped RGBA atlas visibly contains the title `MORTAL KOMBAT BATTLE PLAN` and vertically segmented tower artwork. The text/shape reading is based on the decoded preview, not inferred from a GRA filename.

## O97D — Recorded setup dimensions and diagnostic crop

- The *file-backed Object2 setup headers*, interpreted as WORD width, WORD height, WORD count and confirmed through prior consumer instructions `[ESI]`, `[ESI+2]`, `[ESI+4]`, are exactly **(320, 768, 39)** at `0x1C31E` and **(320, 200, 10)** at `0x1C330`.
- The **320×768** crop, projected from the 328×896 atlas in the same raw coordinate system, holds **87,183 opaque** and **158,577 transparent** positions. Another **25,805** opaque atlas positions fall outside the declared bounds, illustrating the importance of runtime crop/camera qualification.
- This crop is a **diagnostic data-sized canvas**, not a proven 320×768 framebuffer or observed camera transform.

## O97E — Six 14-portrait tower-placement hypotheses re-encoded

- The six O96R/O96U fixed stream variants select **14 of 15** source 35×41 portraits. Each variant's 14 signed tokens are separately verified from the executable; `13` is the command terminator and never passed to the descriptor consumer, while **source-image ordinal 13 is legitimately selected via token 14**. The 15th adjacent image (ordinal 14) is not selected by these tables.
- Each variant supplies X field **197** and Y fields **771, 724, ... 160** (step -47); all 14 35×41 portraits fit inside the tall source-coordinate atlas. Their top-left bounds remain valid even though the highest Y falls beyond the declared 768 height; this is **not** a verified camera correction.
- Hypothetical overlay of the full-opaque portraits into the 39-image source-coordinate atlas fills **exactly 20,090 previously transparent positions**, zero overdraw on pre-existing opaque artwork, zero portrait-portrait overlapping pixels. The 14-portrait group aligns geometrically with the decoded tower's transparent slots.
- All six variant overlays were produced as 328×896 indexed buffers. Variants 2 and 3 have byte-identical composites, yielding **five distinct composites** and one invariant opacity mask. Representative variant-0 328×896 palette candidate PNG exported.
- The overlay and slot alignment strongly support the architectural hypothesis that the original game separates the tower background, selected portrait permutation, and color records. **The executable provenance does not yet prove the 39-image producer and 14-portrait producer coactivate in a specific gameplay instance or the exact layering/color pipeline.**

## Independently verified outcomes

| Run | Checks | Failures |
|---|---:|---:|
| O97C/O97D independent Node verifier (re-decoded 39 streams, source words, full pixel/alpha buffers, two PNGs) | **1,165,876** | **0** |
| O97E independent Node verifier (six word streams, descriptors, 14 portraits, full overlays, candidate PNG) | **818,531** | **0** |
| O96X/Y regression | 93,666 | 0 |
| O96T regression | 4,007 | 0 |
| O96U regression | 957 | 0 |
| O97B regression | 189,285 | 0 |
| **Six deliberate false report assertions** | **6/6 rejected** | — |

## Hypothesis verdicts

- **SUPPORTED:** All 39 decoded sprites reproduce the source-coordinate tower; 39 setup declares 320×768 versus companion ten-tile setup declaring 320×200; fourteen independently indexed 35×41 portraits fit in empty tower slots at common X and regular Y spacing; five distinct portrait order variants; zero opaque overdraw in the overlay candidate.
- **REJECTED:** A proposed opaque-overlap count other than zero, a setup height of 200 for the 39-entry record, fabricated source portrait order, guaranteed runtime coactivation without runtime evidence.
- **UNPROVEN:** Both producers execute in the same scene; actual runtime camera and clipping calculations; final screen placement; exact game RGB; z-order; time durations; whether the battle-plan and landscape setups are used together or in separate game states.

## Next O97F

Investigate the runtime global `0x77453`, its data record predecessor links, the camera/culling globals `0x75FAA` / `0x75FAE` / `0x75A64`, and the real relationship (if any) between the tall battle-plan object producer and the portrait-selection/placement path. **Promote coactivation only if a real source-backed executable chain, trace, or tested emulation supports it.** If bounded evidence does not close those paths, pivot to new MK2 resource/audio/palette blockers instead of stretching the semantics of beautiful previews.

**Required project order:** complete MK2 research → return to MK1 → complete MK3 → discuss UI/usability → only then implement extractor.
