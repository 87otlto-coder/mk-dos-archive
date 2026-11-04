# MK DOS Extractor — P9: Original Pit II upper source-local layers

**Checkpoint:** P9 interim on P8 (which builds on the frozen P6 source). **No full source release until P11.**

## Extractor-facing result

Six authentic `PIT.GRA` stage background setup-local canvases have been integrated into the MK2 Asset Library, based on the **unchanged original O205 Python renderer** and O206/O208 source/video evidence:

| Setup | Original pixels | Original source control placements |
|---|---:|---:|
| 1 | 1400 x 64 | 10 |
| 2 | 1400 x 768 | 90 |
| 3 | 832 x 24 | 7 |
| 4 | 376 x 120 | 10 |
| 5 | 504 x 120 | 4 |
| 6 | 320 x 120 | 5 |

Resource: `PIT.GRA` (**not Kombat Tomb**). Resource ID 32. Original EXE-linked palette record: physical `0x895AC`, 81 colors. Indexed pixels, source paint-coverage mask and source-local placement table are included alongside each PNG. Note that *paint-coverage* mask is not necessarily the same as RGBA alpha for indexed color 0, which is transparent in O205's preview.

The full MK2 scanner now reports **5,039** unique assets, up from 5,033 in P8. Existing 312 sound effects, 43 stage-effect frames, eight Tomb/Portal setup layers, 15 native floor assets, ten Forest preview variants and seven lower-wall Pit graphics remain present.

## Strict evidence boundary

These six canvases preserve original setup-local geometry. They are **not** a completed stage render, not the final shared-screen positions, not the verified sprite draw order or runtime parallax/camera, and do not include the small far-bridge actors, HUD or main fighters. O208 supports aspects of relative Pit parallax and palette appearance, but the present extraction does not make live DAC or complete runtime scene claims. Mode-two original source root refers to all six layers, while the reduced original root refers to 1, 2 and 6; active runtime mode is unknown.

No runtime gameplay controls, damage or combat logic were investigated.

## Validation

- Canonical `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` and `PIT.GRA` SHA-256 `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96` are required; absent/modified/duplicate inputs fail closed.
- P9 headless scan and selective ZIP export: **105 checks passed**, cumulative MK2 count 5,039.
- P9 independent parity test against unchanged O205's `render_stage`: **205 checks passed**, all six PNGs exact RGBA match; original placement fields, source control counts, clipping and total painted pixels match. O205 is invoked without its separate historical video-file dependency because this is source extraction, not a new video experiment.
- The six-layer ZIP and annotated source-local contact sheet are both created from original authenticated resources, not synthetic artwork.
- Targeted TypeScript compilation completed with declaration shim for missing Node type in the wider existing source.
- Full browser/Vite integration and UI are **not** claimed verified in this environment.

## Continuity and next work

Retain P7 interface backlog for P11 UI consideration. Keep the research source untouched. Do not produce a full source archive before P11. P10 should assess an extractor-relevant source mechanism across existing stage assets; Pit bridge actors' 14 original native frames and two O221 source-loop lists are a candidate, but avoid inventing presentation speed or a scene assembly.
