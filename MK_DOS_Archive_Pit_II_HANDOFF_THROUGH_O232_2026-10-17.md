# MK DOS Archive — Pit II continued handoff through O232

**Authoritative source:** `MK_DOS_Archive_Source_O232_Pit_II_2026-10-17.zip`; previous source O230 preserved, with O231 and O232 research added. **Latest evidence:** `MK2_Pit_II_O232_Research_Evidence_2026-10-17.zip`. Original DOS game files unchanged.

Read the inherited `MK_DOS_Archive_Pit_II_HANDOFF_THROUGH_O230_2026-10-17.md` for O227–O230, and the earlier O226 handoff inside the archive for the complete preceding investigation. O231 establishes that the tall bridge pillar in 28.6–29.233s of the fatality is original `PIT.GRA` setup 2 and is distinct from original `FALL.GRA` graphic 58.

## O232 new result

A canonical-source rerender and 17-frame video scan recovered **12 stringent three-patch/2+ source-qualified pillar matches** from frames 861–877. Recorded source-to-native screen horizontal offset moves `−32` at 28.700s to `−71` at 29.133s. The 3,500-pixel distant-stage background witness is pixel-identical at 28.8, 29.0 and 29.2s, confirming near-layer displacement while the distant layer is stationary. The original pillar graphic is **exactly 96 pixels periodic in Y**, *not 48*: do not turn template-match vertical aliases into unique camera offsets. Source-derived bitmap pixels and source-video matches were independently reproduced twice with the same O232 report hash. Exact draw/camera control-flow arithmetic remains unresolved.

The original upper PIT stage remains separate from `FALL.GRA` lower textures. Distinct actor animations in the upper bridge were authenticated O220–O223. O224 original lower 32-entry selector uses graphic 58, but O214 held-out video matches do not witness it. Do not delete it or claim it is the pillar. The game’s ~50fps presentation, ~60Hz timer and 30fps recording must remain distinct. **Do not resume patching stage fatalities** without O209's fatality dispatcher preconditions.

## Immediate continuation options without user input

1. Source-level investigation of PIT setup-2 vertical camera function and transition boundary to `FALL.GRA`: find actual write/update sites for stage mode offsets; cross-check signed fixed-point arithmetic. Bound to original function callers and reject unrelated pointers.
2. Denser native video-to-original tile comparison across frames 878–895 to test whether graphic 58 ever wins in a localized sub-region or compositing layer; keep original palette and controls. A live debugger capture remains the only conclusive proof of selector presentation suppression.
3. Extend the preview with an **explicitly empirical** O232 pillar passage, retaining user-visible note that vertical absolute origin is not proved; do not fake a complete runtime camera.

Avoid broad search loops or lengthy uncheckpointed experiments. Preserve exact previous ZIP members. Continue with bounded, reproducible read-only source and recorded-video tests.
