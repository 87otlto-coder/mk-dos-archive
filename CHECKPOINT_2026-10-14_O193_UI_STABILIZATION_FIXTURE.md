# MK DOS Archive — O193 MK1/MK2 UI Stabilization Checkpoint

Date: 2026-10-14

## Basis

User supplied the original MK1 fixture as `mk1(3).zip` after testing UI.1/O192 in Windows. The reported crash occurred when opening the **MK1 validated research workflow**. The diagnostic stack identified a React render exception reading `.toLocaleString()` on an undefined provenance field in `ResearchQuickActions.tsx`. The user also reported inconsistent MK1 and MK2 Stage Gallery behavior.

## Targeted corrections

1. **Research-workflow rendering:** `ResearchQuickActions.tsx` now uses `describeResearchProvenance`, a presentation-only utility that checks the presence and type of the file name, byte length and SHA-256 field before rendering. If optional fields are absent, the interface says **size not reported** and **hash not reported**. The underlying research reports, fingerprint checks and write guards are unchanged.
2. **MK1 Stage Gallery discovery:** O192 searched for English arcade-stage names in `.GRA` filenames, which misses the genuine `GRAPHICS/*HDRS.GRA` resources. A pure `discoverStageGallery` helper lists those existing resources as background/header candidates. It **does not** invent a mapping to arcade stage names; O27 expressly left that mapping unresolved.
3. **MK2 Stage Gallery scope/error clarity:** Source-backed Tomb/Portal/Tower cards remain. The source frame panel reports that the specialized original-frame viewer requires an unmodified source, including when the original resource hash differs. Other resource browsing is unaffected.
4. **Regression test:** `scripts/verify-o193.cjs` runs fixture-backed checks for the provenance display, MK1 candidate enumeration, search and MK2 original-frame extraction. It requires original fixture directories through `MK1_FIXTURE` and `MK2_FIXTURE` environment variables; no game files are packaged.

## Fixture findings

- MK1 fixture: `MK1.EXE` is 1,157,222 bytes and has SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14` (canonical).
- MK1 stage candidate enumeration: 17 distinct `*HDRS.GRA` resources present; **17 candidate resources, not 17 independently verified arcade stages**.
- MK2 fixture: original `MK2.EXE` and `PORTAL.GRA`, `TOMB.GRA` and `TOWER.GRA` pass their strict frame decoder checks: Portal 3 sequences / 20 frames; Tomb 2 / 16; Tower 1 / 7.
- Modified GRA negative tests: the original-frame decoder still refuses changed graphics files.

## Verification

- O193 focused fixture verifier: **23 checks passed**.
- Browser gallery source discovery tested against actual MK1 and MK2 fixture files, including case-independent names and filters.
- Presentation-only provenance format tested against missing, malformed and complete metadata.
- The original O192 research library verification was rerun after indexing the new documentation.
- The complete dependency-backed React/Vite build **was not verified in this execution environment**. `npm ci --offline` failed due uncached dependencies; the attempted registry install exited with an npm CLI error. The user has a working browser runtime and should run the O193 build checks there.

## Known limitations / next work

- The MK1 gallery uses source-identity placeholders for the HDRS background candidates; it does not show finished arcade-stage art or infer which background module belongs to which named stage.
- Full deterministic MK1 and MK2 scene assembly is still incomplete.
- No FPS or world-coordinate claims were promoted.
- The original pipeline repeatedly parses the same MK1 LE/WATCOM structures; performance caching should be implemented only after defining cache keys that incorporate source identity, fixture hash and expected decoder prerequisites.
- Browser/UI end-to-end regression, responsive checks and full `npm run build` remain to be done on a dependency-complete machine.
