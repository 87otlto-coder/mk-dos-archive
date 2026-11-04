# MK DOS Archive — Master Handoff Through O190

Date: 2026-10-14

## Authoritative predecessor

O187 remains the prior authoritative runtime checkpoint for Portal large-figure pose verification.

## O188 and O189 summary

- O188 produced a downloadable Portal fixture extract with hypothesis-based GIFs.
- O189 produced two Portal scene-context render packages: one cleaner but compositionally weaker, one more complete but with contextual artifacts.

## O190 summary

O190 incorporates user review of those scene-context renders and formalizes the current browser-UI browsing status.

### User feedback captured

- The timing is generally fine.
- The context-rich render is more complete but has some incorrect scene details.
- The cleaner render has broader composition problems.

### Interpretation

The present bottleneck is scene composition, not animation cadence. The next meaningful scene-render step is to improve compositing fidelity while preserving contextual completeness.

## Current UI guidance

Use the browser UI to inspect findings as follows:

1. Load an original MK2 directory.
2. Use `AssetBrowser` for raw asset browsing.
3. Use `MK2ObservedStageFloorPanel` to review floor-specific findings.
4. Use `MK2IndexedStageMosaicsO122` to browse Portal, Tomb, Tower and the other discovered background-related findings.

A dedicated guide is included in `README_UI_BROWSING_O190.md`.

## Current build-verification boundary

The source package was updated and audited structurally, but the full browser UI was not rebuilt or run end-to-end in this environment because npm dependencies are not installed here.

That means:

- the source package is suitable for continuation and browsing in the normal project environment;
- the UI audit is source-level, not a newly executed browser-runtime proof.

## Recommended next step

Proceed with a scene-compositor-focused pass that uses the contextual Portal render as the starting point and generalizes the same approach toward the other discovered MK2 stage backgrounds.
