# MK DOS Archive — Pass 1E.3O.57 Research Results Workspace

**Status:** VERIFIED for source/data-model integration; live browser visual inspection remains recommended.  
**Verdict:** `MK1_RESEARCH_RESULTS_WORKSPACE_AND_STAGE_GALLERY_ESTABLISHED`

## Objective

Close the accumulated UI-results gap without creating a bespoke React result panel for every new research pass. Preserve existing specialist editors while making the complete research stream and stage visual outputs discoverable in the normal app UI.

## Implemented surface

O57 adds `src/components/ResearchResultsWorkspace.tsx` plus `src/games/mk1/research/researchResultsWorkspace.ts`.

The workspace consumes the existing `ResearchArtifact[]` stream produced by **Run What's Needed**. Completed artifacts are presented through a generic model rather than a hard-coded pass registry. The UI provides:

- Overview cards for total visible artifacts, validation-bearing artifacts, grouped domains and 24/24 stage previews.
- Stable domain grouping: palette/roster foundation, authoring/validation, animation/character export, stage/background reconstruction, and product/UI integration.
- Searchable/filterable research-pass explorer.
- Pass/status/verdict/format presentation.
- Per-artifact JSON download.
- Lazy raw JSON report inspection.
- A 24-stage visual gallery backed directly by the verified O54 payload graph.
- Ordinary vs normalized stage preview toggle.
- Exact stage coverage document and time-aware scene IR inspection.
- Existing specialist authoring/editor panels remain mounted separately below the workspace.

## Stage-preview source

The UI does not screenshot or re-render stage semantics through Canvas. O57 retains exact O54 RGBA payloads in workspace state and uses the already-established deterministic browser PNG encoder only to display those verified RGBA bytes.

All 24 stage entries include:

- 320x200 fresh ordinary RGBA;
- 320x200 normalized combined RGBA;
- coverage document;
- time-aware scene IR.

No normalized preview is promoted to a canonical gameplay screenshot.

## Direct validation

Authentic MK1 fixture smoke against canonical `MK1.EXE` SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14` passes:

- 65 historical artifacts through O56 represented;
- every artifact receives a presentation row;
- group counts cover the complete historical artifact set;
- 24/24 stage gallery entries present;
- 24/24 ordinary previews are exactly 320x200 RGBA;
- 24/24 normalized previews are exactly 320x200 RGBA;
- 24/24 scene and coverage documents present;
- no writer path added.

## Integration

`ResearchQuickActions.tsx` now retains one `researchWorkspace` state object rather than adding state variables for dozens of historical passes. O57 executes after O56 as stage 66/67 and mounts `ResearchResultsWorkspace` after the run completes.

This is deliberately future-safe: future `ResearchArtifact` entries automatically participate in the pass explorer through `buildResearchPassPresentationRows(...)`.

## Boundary

A full Vite production build was not available in the archival execution environment because `npm ci --offline` cannot restore uncached package `yallist-3.1.1.tgz`. The O57/O58 TypeScript modules compile through the targeted path, and `ResearchResultsWorkspace.tsx` plus `ResearchQuickActions.tsx` pass targeted TSX typechecking with archival React/lucide dependency shims. Direct human browser inspection remains useful for layout/ergonomics, but it is not being substituted for mechanical research evidence.
