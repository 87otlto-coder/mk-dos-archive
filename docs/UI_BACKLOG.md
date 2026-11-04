# Deferred extractor UI feedback

**Captured 2026-11-04. Deferred by user until a suitable source consolidation.** Current extraction work remains higher priority. No UI fixes are claimed here.

## Asset Library navigation

- Make the asset browsing/results pane independently scrollable so inspecting results does not move the whole page.
- Keep the inspector visible as the result list scrolls; consider sticky/fixed within layout.
- Keep useful Previous / Next / Add filter controls accessible, e.g. sticky controls or a bounded scroll region.
- Test behavior on compact viewport sizes rather than adding more HUD clutter.

## Stage Gallery deep links

- Stage Gallery → Browse Resource currently changes the Asset Library view and makes its default all-assets state hard to regain.
- Prefer a clear **All assets** breadcrumb/reset or re-clicking **Asset Library** to restore its default state.
- Do not silently clear selected or queued export assets on navigation reset.
- User observed **PORTAL.GRA** deep link showing a narrow package view / potentially **No matches** even when verified exported stage components exist. Audit search scoping and aliases when UI work is taken on.

## Stage Gallery progress and preview

- Show **evidence-grounded** completeness / readiness, not a percentage invented from file count. If a percent is introduced, define and expose its criteria, denominator and weights.
- Distinguish source presence, indexed pixels, palette attribution, layers, frame sequence, timing, full composition, and export readiness.
- Stage cards may be stale: user's Portal card appeared more complete than Pit/Pit II despite much greater recent Pit research.
- Permit previewing the **best current supported stage interpretation** from recovered components. Clearly separate individual verified layers, setup-local composites, index-value previews, candidate-color previews and only genuinely verified full scenes.
- Gallery navigation should lead to actual previewable assets rather than only reports and research package names.

## Cross-stage reuse

Periodically test shared source-decoding grammar across multiple stage files. The O195 packed-floor mechanism is qualified across seven MK2 stage configurations (Tomb, Battle, Tower, Forest, Armory, Portal and Arena), but this does **not** prove common palette assignment, camera or scene placement.

## Timing

Revisit at **P11** as a planning and usability audit, but do not let opportunistic UI redesign displace extractor capability, source preservation or source/regression validation.

## P11 implementation status (2026-11-04)

The focused Asset Library deep-link and independent-scroll improvements were **implemented on `develop`** (commit `4e3c370`) and have passed production build, TypeScript checking, and source-offline Chrome boot. **Do not mark them fully browser-verified yet.** Stage Gallery resource matching, reset behavior and sticky scroll require a trusted local browser run with an original MK2 installation (Issue #4).

Stage completeness percentages, fresh card research coverage, and credible assembled-stage previews remain **deferred / unimplemented**; percentages must have an explicit, reproducible evidence denominator. Do not conflate original source-local layers with completed stage compositions.
