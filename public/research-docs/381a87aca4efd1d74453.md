# MK DOS Archive — Checkpoint O190

Date: 2026-10-14

## Scope

This checkpoint records the first post-O187 review of the Portal scene-context renders and an explicit audit of the browser UI surfaces used to browse MK2 findings.

## What changed

- The user reviewed the two main Portal scene exports.
- Timing was judged visually acceptable for this purpose.
- The remaining issues were identified as composition and contextual-scene assembly issues rather than cadence/FPS issues.
- The source package was updated with an O190 UI browsing guide and metadata milestone update.

## Portal scene render conclusion

The more contextual Portal export is the more useful baseline, even though it still contains visible duplication / backdrop conflicts and approximation artifacts.

The less contextual export demonstrates the independent animation layers more clearly, but has more obvious composition and placement issues.

This means the next scene-composition milestone should prioritize:

1. preserving the completeness of the contextual version;
2. eliminating duplicated animated objects already present in the backdrop;
3. reducing patchwork seams and screenshot-derived cleanup artifacts;
4. keeping the currently acceptable timing hypothesis unless contradicted by stronger evidence.

## UI browsing audit

The current MK2 browser-facing entry points remain:

- `AssetBrowser`
- `MK2FoundationPanel`
- `MK2ObservedStageFloorPanel`
- `MK2IndexedStageMosaicsO122`

These panels already support practical browsing of background findings and stage-related evidence, including comparisons across discovered stages.

## Verification boundary

A full Vite/browser execution was not performed in this environment because installed npm dependencies are not present here. The UI audit is source-level and structural, not a fresh end-to-end browser execution report.

That limitation should remain explicit in subsequent handoffs.
