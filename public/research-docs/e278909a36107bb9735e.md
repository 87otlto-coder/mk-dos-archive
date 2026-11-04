# MK DOS Archive — O194: known-capability compilation and bounded hypothesis experiments

Date: 2026-10-14

## Scope and source authority

O193 is the historical predecessor. O194 adds a *presentation/orchestration* layer and two constrained research utilities. Existing MK1/MK2 research decoders, source-readers, proofs, historic reports, original pixel/asset packages and stage/gallery research remain untouched. No executable/GRA patching or relocation is performed.

## Implemented features

1. **Laboratory → Compile & hypotheses:** independent file census, source SHA-256 provenance, stage resource identification, six canonical MK2 effect lists (43 original frames), and the pre-existing deep verified asset-scanner pipeline. Each result records one of `compiled`, `partial`, `unsupported`, `failed`, `unverified` statuses. One failed step does not cancel successful earlier steps.
2. **Session-level compilation cache:** an explicitly initiated compilation can be browsed and exported after changing pages. The Asset Library can accept the compiled catalogue; its UI is kept mounted while navigating to other app pages, retaining filters, selection and scroll state. An explicit `All assets (keep filters)` inspector action resets focus without reloading.
3. **Portal → Forest bounded hypothesis experiment:** authenticates the original MK2 executable through the existing O130 control-stream reader, compares source counts and draw tokens for both stage configurations, and *declines* to transfer unsupported graphics-list offsets, palette associations or stage-object positions. Every assumption yields a structured status and readable evidence.
4. **Research Evidence Packages:** two ZIP modes, a concise visual review package and a full forensic package, with a full asset metadata/step manifest, exact source hash and byte addresses, assumptions, diagnostics, and reproduction instructions. Original EXE/GRA bytes are not bundled. For MK2, up to 24 already-decoded PNG previews are included. The Forest experiment's optional SVG shows **source control counts only**; it is *not* a synthesized stage render.
5. **Hypothesis-package import (display only):** O194 ZIP imports are checked for format/structure and CRC; imported findings are labeled untrusted until independently rerun against matching source hashes.
6. **MK1 legacy action label:** the historical `Run What's Needed` operation is now explicitly named a strict canonical research pipeline. Its source semantics remain identical; the failure-isolated `Compile All Knowns` workflow is separate.

## Fixture-backed tests

- `scripts/verify-o194-fixture.cjs /path/to/original/mk2`: source-backed 43 original effect frames, O130 Portal and Forest structures, four conservative assumptions, diagnostic SVG, full ZIP export/import, corrupted source rejection, partial-result retention.
- `scripts/verify-o194-mk1-fixture.cjs /path/to/original/mk1`: 17 original `*HDRS.GRA` stage-background resource candidates, 18 SHA-256 witnesses and ZIP metadata, no invented reconstructed stages.
- Changed TypeScript/JSX source modules passed local TypeScript syntax transpilation.
- A complete production React/Vite build **has not passed in this environment** because npm dependencies could not be installed. `npm ci --offline` failed (`ENOTCACHED`), and a registry install failed. **User Windows build and UI navigation still need verification.**

## Caveats and open work

- `Compile All Knowns` reuses the inherited deep scanner. On an original large installation it may take time or trigger memory limits; progress is displayed and the operation can be cancelled. A failed deep scan does not erase prior stage/resource/effect findings.
- Original MK1 background resource identities are known; correct full-scene reconstruction remains unresolved.
- Forest source-token compatibility does **not** establish Forest effect animations, final scene coordinates or palette. The only O194 visualization of Forest is source-stream **diagnostic counts**, not scene art.
- Although the asset library retains state inside the active session, compilation results are not yet persisted across page reloads/browser restarts. Future external package caching and import are separate work.
- User-friendly visual previews are bounded; the complete forensic catalogue/metadata is exported.
- No recorded source evidence was reclassified from hypothesis to verified by O194.
