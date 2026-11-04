# MK2 O116 — Authenticated floor-only preview export and browser bridge

**Date:** 2026-10-11. **State:** independent Python projection + digest audits VERIFIED, 50 new bounded development checks PASS; TypeScript browser renderer returns byte-identical RGBA; React UI wired in source but end-to-end Vite build NOT VALIDATED in this environment. New user DOSBox proof NOT REQUIRED for Portal preview; unmodified Tomb control requested only for Tomb cross-capture validation.

## New capability

1. `tools/mk2_observed_floor/mk2_observed_floor.py` creates a source-identity-checked 320-pixel-wide **floor-only** observed-color preview from a canonical `TOMB.GRA`/`PORTAL.GRA` input plus a pinned O115 witnessed source-index→RGB table. It emits an RGBA PNG and provenance JSON. Optional O111/O112 valid edit receipts allow preview of precisely authenticated stage-source modifications.
2. `src/games/mk2/research/observedStageFloorPreviewO116.ts` is a browser implementation consuming original user-loaded GRA bytes only. In the project, `src/components/MK2ObservedStageFloorPanel.tsx` is visible in the MK2 advanced inventory section via `src/App.tsx`, allowing source-X parameter selection and PNG export.
3. Two small sample PNG previews can be found under `evidence/mk2_o116`. Their source data was *derived privately* from user-provided original MK2 game files; no original GRA binaries or other game resources are included in the development archive.

## Cross-language and gameplay checks

| Qualification | Portal | Tomb |
|---|---:|---:|
| Original GRA verified by SHA256 | Yes | Yes |
| O115 witnessed source-byte color domain | 3–80 | 2–51 |
| Original packed source indices in preview | 26 | 43 |
| PNG pixels independently audited at 3× | 115,200 | 138,240 |
| Screenshot unmodified control cross-reconstruction | **4,420/4,420** (original O114 20.png) | **Not established** (no unmodified Tomb screenshot) |
| Default screenshot-consistent source crop | 292 | 290 (from separate O114 X-ruler capture; not validated vs an original Tomb floor screenshot) |

The independent Portal check samples alternating screenshot row parities: using only odd rows gives a spurious equally perfect match for image Y origins 320 and 321, whereas both parities uniquely qualify origin 321. This corrects a previously unnoticed sampling alias **without changing the O115 original finding**. At source-left 291 or 293 only 1,364/4,420 samples match; at origin 320/322 only 2,567/2,583 match.

**Crucial counterexample:** treating the Portal source-left screenshot fit 292 as O112’s `camera_x=292` is incompatible with the screenshot (previous experimental projector gives low agreement). The preview uses a **fixed source crop**, not a dynamic row-offset model, does not apply the unproven bank-start DWORD transform, and does not identify a live camera register or palette ownership. Only the floor layer is generated.

## Verification summary

- **50 Python development scenarios** pass; 34+14+31=79 previous stage tools/witness tests pass, total **129 regression methods**.
- **26 JavaScript/TypeScript bridge checks** pass; generated RGBA SHA-256 exactly equals independent Python output for each stage.
- Independent audit rederived **253,440** scaled PNG output pixels and **4,420** unoccluded Portal gameplay screenshot pixels.
- **9 independent forgeries** (overstated palette claim, mismatched resources, source and witness hashes, left crop/height, altered image and index/RGBA digests) correctly rejected.
- Original ZIP resources remained read-only; output collision and receipt verification are strict; all earlier app files preserved except the explicitly changed `src/App.tsx` UI mounting point.
- `tsc` isolated TS decoder check and TypeScript JSX syntactic transpilation passed. Full Vite/React build is not verified because `react` and `lucide-react` dependencies are not installed in the current offline environment. Revalidate in a full app environment before shipping UI.

## Next boundary

- If a clean, unmodified *Kombat Tomb* gameplay screenshot is available, cross-check the Tomb floor against the reconstructed source preview and confirm/falsify the 290 screenshot crop. Existing O113 kit test **20** (original-resource cheat control), choose **Kombat Tomb** in F9 developer menu. Screenshot should be 320×200 DOSBox native (Ctrl+F5) if possible, or the prior ~2× displayed window.
- For palette-bank identity/camera RAM rather than screenshot-relative rendering, DOSBox debugging, an emulator state trace or controlled executable instrumentation remains necessary.
- Other five authenticated packed stages have no witnessed color tables. No inferred colors are substituted.

**Roadmap remains MK2 → MK1 → MK3 → UI/extractor milestone.** Autonomous bots and Authentic Enhanced runtime postponed.
