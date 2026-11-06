# P27 — standalone TOMB components and verified mosaic coverage

Date: 2026-11-06. First interim pass after P26; baseline `ee81cea1b395ae7a86033555ed2769409aab16de` on develop. Main remains P16.

## Outcome and counting boundary

The Asset Library now exposes **16 complete original TOMB.GRA setup components individually**, with native dimensions, indices, opacity and source-to-setup provenance. Existing preview, PNG and selected-ZIP workflows apply. Coverage & evidence offers `MK2_P27_TOMB_16_ORIGINAL_SETUP_COMPONENTS.zip`.

Current MK2 census: **5,236 unique asset representations**, up from 5,220. This adds sixteen standalone representations of **already researched/decoded source components**, not sixteen newly discovered images or newly decoded source streams. All sixteen were already used inside six existing setup-local mosaics, but no full standalone record with matching dimensions/index/mask existed in the P26 library.

The original O110A/O121/O122 research is retained. P27 improves ordinary extractor access to its complete source components, including portions omitted by clipping/overdraw in composited previews. All **28 earlier TOMB representations** are preserved, including sixteen effect frames, six setup mosaics, floor variants and two animation-group sheets.

## Coverage join

Before implementation, P27 scanned the complete P26 collection and joined the original sixteen descriptors against existing TOMB records by native dimensions and original index/opacity hashes, then against original setup-control tuples. Result:

- Existing TOMB representations: **28**; exact standalone native image matches: **0**.
- Original source components: **16**; already referenced by setup mosaics: **16**.
- Existing setup-local canvases: **6**, with **87 original control placements**.
- New components reconstruct all six existing indexed/opacity canvases exactly: **523,584 total canvas cells**.

The independent Python verifier reads the six setup records and all 87 controls directly from canonical EXE bytes. Its control-to-descriptor joins and reconstructed canvas hashes are separate from the observed P26 registry snapshot. The latter is explicitly labeled an observation, not an independent original-source golden.

For example, original component 2 is **109 × 57**, placed at setup-local **(393,-54)** in the **896 × 48** canvas. Only its last three source rows fall within that canvas. The new individual export preserves the entire original 57-row image. These coordinates are source-setup coordinates, not established live screen/world positions.

## Original-source extent and provenance

- MK2 EXE SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- TOMB.GRA: **106,784 bytes**, SHA-256 `be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613`.
- Original resource pool slot **28**, Object-2 image base **0xA0C54**, eight-byte descriptor table **0x17688**, sixteen distinct original intervals.
- Component streams exactly tile **[0,54328)**: **54,328 encoded bytes / 64,971 indexed pixels**.
- Existing flying-effect source intervals occupy **[54328,63776)**, and the existing native floor occupies **[63776,106784)**. P27 does not reinterpret those effects/floor or infer a full scene from this source-byte partition.

Each component records original descriptor location and all existing setup-layer uses, occurrence counts and rectangle-clipping counts. It explicitly records `componentPreviouslyUsedInMosaics=true`, `newlyDiscoveredSourceImage=false`, and unknown native palette/timing/scene/world placement. Descriptor order is not animation order. Diagnostic grayscale preserves source index values; native palette-known masks remain zero.

The adapter requires original hashes/sizes, source resource ID, exact stream partition and a join to existing setup rows. Prior research/renderers, palettes, UI and other adapters are unchanged. The existing qualified row decoder is reused.

## Fresh verification

| Gate | Result |
|---|---|
| Component/reference/export + existing-renderer reconstruction | **466 checks PASS**, sixteen complete components, six exact old canvases, eight negative source fixtures |
| Independent original EXE controls/streams, PNG/sidecar verification | **1,437,357 checks PASS**; original sixteen streams, all 87 controls, six canvas reconstructions and every exported PNG/plane/provenance link |
| False export controls | **Four rejected**: mutated indices, wrong PNG pixels with valid CRCs, invented palette ownership and lost existing-setup relationship; clean export reverified |
| Complete current cumulative gate | **5,236 unique representations / 1,079 checks PASS**; all 28 observed prior TOMB records retain dimensions, source extents and indexed/opacity hashes; independent canvas hashes and original floor bytes match |
| Current MK2 runner | **14 suites PASS**, retaining all prior family checks and seven older focused suites (**818,695 checks**) |
| Local source checks | **371 TypeScript files / zero syntax errors**, TypeScript, production build, verifier syntax and diff-whitespace checks PASS; existing large Vite chunk warning retained |

Component evidence ZIP SHA-256: `a408f7e4000e0bec4d2db717925ac9e4dfd31d05591a641eb02d30e7521faa90`.

Reference fixtures contain geometry, original control relationships and hashes only. Original game files, extracted image data, PNGs, private ZIPs and falsification variants remain outside GitHub.

[Machine-readable P27 evidence](validation/P27_TOMB_COMPONENT_REGRESSION_2026-11-06.json).

## Reproduce

```powershell
node scripts/verify-mk2-p27-tomb.cjs <MK2-dir> adapter.json private-tomb.zip
python scripts/verify-mk2-p27-tomb-independent.py <MK2-dir> --export private-tomb.zip --report independent.json
python scripts/test-mk2-p27-tomb-negative.py <MK2-dir> private-tomb.zip <private-output-dir>
node scripts/verify-p21-checkpoint.cjs --mk2 <MK2-dir> --through p27 --report regression.json
```

Keep outputs outside original games and the Git checkout. The current interim runner defaults to P27. The P26 checkpoint runner and earlier fixed-census gates remain frozen to their matching source checkpoints.

## Confidence and continuation

**VERIFIED:** source component geometry/indices/opacity, original six-setup/87-control relationships, complete-component access, exact reconstruction of existing source-local indexed canvases, independent export parity and preservation of previous TOMB records and earlier MK2 families.

**NOT CLAIMED:** newly discovered source artwork. These are new standalone library representations of known components.

**UNKNOWN:** live palette selection, native timing, runtime setup activation, global world/screen placement and full stage composition. Source-control placements and source table order do not establish those runtime relationships.

**VALIDATION PENDING:** original-data browser interactions. Source-offline Chrome CI remains separate. MK1/MK3 fixture suites were not freshly rerun in P27; P26 contains their latest full verification. Existing extracted MK2 fixtures and pinned complete EXE/TOMB hashes were used; no fresh archive-level download/hash/re-extraction is claimed.

Next P28: apply a separately verified PORTAL descriptor/component coverage join against existing setup mosaics/effects, then expose only useful missing full originals with explicit existing-use provenance. Preserve P26 and the workbench, continue on develop, and keep main unchanged. No full-source packaging in this interim pass.
