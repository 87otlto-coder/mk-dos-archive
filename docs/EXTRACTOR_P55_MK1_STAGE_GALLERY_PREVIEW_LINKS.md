# P55 — verified MK1 stage-gallery preview navigation

Date: 2026-11-07. Fifth-pass cycle: fourth interim after P51 (P52, P53, P54, P55); P56 remains the next consolidation assessment. Development branch `develop` only; `main` stays at the accepted P16 baseline.

## User evidence and scope

User-local P54 acceptance returned `PASS` with 2,656 MK1 assets, 24 original background modules, 15 unique HDRS.GRA resources, all 24 module-to-normalized-preview joins, invalid-preview refusal and exact P54 report SHA-256 `bb180450381a7f43ecca1f3bc6282bb1c6b0bc1d48cc77e8f9ad5e27092269db`. This is user-supplied console evidence, not a P55 browser click test or independently rerun three-game acceptance.

P53 had removed misleading MK1 `Browse resource` actions because file-inventory candidates did not necessarily correspond to decoded asset identifiers. P54 created the original-source qualified relationship report but did not expose it to stage-gallery navigation. P55 closes that particular usability gap without investigating gameplay, inventing arcade-stage names, changing palettes or rebuilding the research workbench.

## P55 implementation

- `src/components/stageGalleryModel.ts` adds `verifiedMK1HeaderPreviewLinks` to fail closed unless the P54 schema, negative stage/palette/gameplay claims, exact module slugs, unique module and preview IDs, full resource membership and report counts agree. Missing previews are not invented.
- `src/core/assets/assetSearchP55.ts` adds a dedicated `asset-id:<full-original-id>` exact search channel; the former case-insensitive name/group/confidence/source-path search remains unchanged.
- `src/components/AssetBrowser.tsx` reports successfully decoded collections to the parent and uses the exact-ID search helper, without changing assets, preview decoding, queue ordering, exports, or ordinary filtering.
- `src/App.tsx` carries only the decoded `reports.stageHeaderBindings` to Stage Gallery and clears it whenever a game source is replaced. O194 partial compilation reports do not authorize links.
- `src/components/MuseumWorkspace.tsx` presents separate module-labelled normalized-preview actions for each authenticated MK1 header relation after the user chooses **Decode & browse** in the Asset Library. Before the report exists, header cards stay explicitly unlinked. The existing normalized-preview banner and all MK2 actions remain. MK3 cards do not borrow the MK1 header message.
- `src/components/MuseumWorkspace.css` makes multiple module links readable. These are normalized background fixtures, explicitly **not** finished arcade-stage gameplay images.

## Controls and confidence

Source-only `scripts/test-p55-stage-gallery-navigation.cjs` checks positive multi-module/header cases, ordinary text search parity, exact-ID navigation excluding similarly named sibling modules, absent/unscanned report behavior, an explicitly unavailable preview and **eleven** falsified-report refusals. CI invokes the controls and checks the new original-fixture runner syntax.

`scripts/verify-mk1-p55-stage-navigation.cjs` is committed for execution against a private original MK1 directory. It reuses current `scanAssets`, confirms 2,656 unchanged assets, 15 header resources / 24 independently registered preview IDs, exact ID search yields one asset per link, source-inventory membership and P54 package hash parity, and rejects a false arcade-stage claim.

**VERIFIED:** GitHub source-only CI on the P55 UI, exact-ID filter and synthetic controls passed at [run 42399301672](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42399301672). Later CI that includes the new P55 original-fixture runner syntax is separate and must be checked before claiming it passed.

**VALIDATION PENDING:** execute `node scripts/verify-mk1-p55-stage-navigation.cjs <private-original-MK1-directory> <private-result-json>`; real browser click-through from Stage Gallery into a single preview and actual download; current full three-game fixture regression. No original data are carried by public source-only CI.

**UNKNOWN:** arcade-stage title mapping, original gameplay scene timing/camera/alpha and uncertain native palette attribution. This is a proven provenance-navigation feature, not stage reconstruction.

## Reproduce next

1. With the canonical MK1 game directory outside the repository, run the P55 original-fixture acceptance script. Confirm 24 exact links, 15 headers, P54 SHA-256 unchanged and no stage claims.
2. In the local browser select the original MK1 directory, open Asset Library, click **Decode & browse**, then Stage Gallery. For an authenticated HDRS.GRA card, click a named module preview; Asset Library should show **exactly one** corresponding normalized background asset. Verify multiple module links where present, and no link before decoding.
3. P56: perform fifth-pass consolidation and full MK1/MK2/MK3 regressions before any source checkpoint/promotion decision. Keep `main` unchanged and commercial game files and extracted artwork out of Git.
