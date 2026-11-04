# MK DOS Archive — deferred extractor UI feedback

**Recorded:** 2026-11-04, after P6 consolidation, during P7.
**User priority:** Do **not** interrupt research/extractor progress with immediate UI redesign. Re-evaluate at a future source consolidation, or when the relevant extractor functions are ready for proper preview.
**Purpose:** Ensure the UI feedback survives source changes and future chat handoffs. Not a claim that any work below is implemented.

## Asset Library scrolling and controls

- Asset browsing/searching should scroll independently from the rest of the page, rather than requiring repeated scrolls up/down to navigate results and inspect them.
- Keep the inspect panel visually available when scrolling browse results (sticky/fixed within the browsing layout), if feasible.
- Keep practical paging/filter controls ('Previous', 'Next', add filter) available within the browsing view. Consider sticky toolbar / bounded scrolling first; don't overload the whole HUD.
- Evaluate based on actual browser usability, including short and narrow screens. No source changes requested now.

## Navigation reset and deep linking

- A 'Browse resource' deep link from Stage Gallery currently changes Asset Library filtering/search and the user cannot easily return to its default all-assets view.
- Preferred low-complexity options: re-clicking top-level **Asset Library** restores the default view, or add an explicit **All assets** breadcrumb/reset.
- Independently check whether `PORTAL.GRA`-scoped deep links really show matching assets: user screenshot showed `PORTAL.GRA` and 'No matches', despite verified stage exports and packs. Do not assume all currently browseable staged assets are discoverable by the existing search text.
- Preserve users' selection intentionally when resetting browse state; don't silently destroy queued exports without a clear rule.

## Stage Gallery coverage evidence

- Each stage card should show an **evidence-grounded progress indicator**, not a fabricated percent from the number of files or observations.
- A useful future model: explicit matrix for source-identification, static layers, floor, palette, animation sequence, native timing, composite placement, export readiness. Display verified / partial / unknown categories; if a percent is used, publish denominator, weighting and rules. Distinguish research coverage from actual extractor readiness.
- Current Portal gallery may be stale relative to Pit/Pit II research, according to user observation. Reconcile source/evidence timestamps and stage-per-stage capabilities before adding percentages.
- 'Source present', frame counts and sequence counts should not imply that a playable-stage reconstruction is done.

## Stage preview in Museum

- User wants to **see the best current interpretation** of each stage from its recovered components, not only source lists and research evidence packages or an empty composition canvas.
- Offer clearly labeled preview modes: verified original individual layers; qualified setup-local composites; source-index previews; candidate-color previews; actual assembled stage only when placement/draw order/palette supported by evidence.
- Do not generate a fake complete scene to make a progress indicator look better. Stage Gallery → Browse Resource/Original Frames should lead to usable previewable selections.

## Reusing mechanisms between stages

- Periodically test *shared extraction mechanisms* (e.g. packed-floor command grammar) across stage files using independent source checks. Prefer transferring a qualified decoder/geometry rule, never copying stage-specific sprite offsets, camera settings, palettes, textures or behavior uncritically.
- O195 has already established that the packed-floor command/row-clipping logic is shared by **seven** MK2 stage configurations: Tomb, Battle, Tower, Forest, Armory, Portal, Arena. It does **not** establish their shared palettes or final camera composition.

## Implementation timing

Keep this as deferred feedback through P7–P10; review at P11 consolidation as a planning priority only, unless a demonstrable extractor blocker justifies earlier work. Preserve original research app and branch/copy a dedicated extractor only when functionality is mature enough.
