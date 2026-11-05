# P11 source handoff, 5 November 2026

Audited a clean Git checkout of develop at `240de32`. Used local DOS fixtures outside the checkout. The user had already verified sprite previews for all three games and Pit II Gallery resource navigation.

## MK1 backgrounds

- Canonical MK1.EXE SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`. Running the normal `scanAssets` entry point produced 2,656 assets: 2,363 sprites, 244 audio assets and 49 stage PNGs. O56 verified all 49 decoded pixel buffers, 48 stage documents, three root reports and the README in the 101-entry stage evidence ZIP.
- Each of the 24 executable module records has an ordinary raster and a normalized combined background. The 49th image is the shared CHOP/STATUE moon. Modules include hardware variants and non-arena screens. O54's 12 dynamic/static-extra cases and 12 qualified no-op cases remain separately documented. Use the package coverage documents for composition limits. These results establish neither arcade-stage identities nor gameplay camera state, timing or new palette bindings.
- Stage Gallery enumerates 17 distinct `*HDRS.GRA` filenames on this fixture. The canonical collection indexes stage images by generated paths such as `stages/pit_mod/normalized_combined_background.png`. Searching for the header filename therefore cannot identify a matching stage PNG. The new Gallery action searches the normalized output name across modules. The Asset Library stage type filter includes all 49 images. The complete package is available under **Coverage & evidence → MK1_stages_evidence.zip**.
- The modified O11 executable (`00079f3ad58e70de76ae0edbb4a0baac2cd0583ecf24ef946615faed57a60b92`) reproduced the read-only fallback with 58 raw GRA resources, 187 indexed Kano previews and zero stage assets. A canonical pipeline error can also trigger fallback. The notice now points to the recorded reason without presuming an identity mismatch. The user's specific MK1 scan mode was not recorded.

## Batch export and regressions

The original batch action was below the results and inspector. The new toolbar above the grid shows the filtered match count and the queued ZIP count. It uses the existing ordered selection and exporter, including its metadata and limits. The lower queue retains ordering, duplicate and export controls.

- MK2 original fixture: `verify-mk2-p11-cumulative.cjs` passed 40 checks and 5,053 unique assets, including the P8/P9/P10 package hashes and four-asset selection export.
- MK3 original fixture: 9,186 assets (6,654 sprites, 1,046 raw, 1,024 audio, 416 images and 46 music). The scanner exposes embedded pictures as images and preserves unresolved data ranges. Zero assets carried the stage type. Membership of the 416 pictures in particular stages remains open.
- Headless selection ZIPs preserved the tested two-entry manifest order on canonical MK1, modified MK1 and MK3. Fresh locked install, TypeScript and Vite production build passed locally.

### Chrome download from the production build

Opened the canonical MK1 directory in local headless Chrome, selected **Stage gallery → Browse normalized previews → Decode & browse**, added all 24 matches and clicked **Export selection ZIP (24)**. Chrome saved `MKDOS_selection.zip`. Independent ZIP inspection passed every CRC and found exactly 24 distinct module groups in manifest order, each with a 320 × 200 PNG, plus the manifest. Download SHA-256: `ad2309e1d69997066b8b87cb7d997f1ddeadda006ec3941fdc358dec3f57b64d`.

## Release gate

Keep P11 on develop. Record any remaining inspector, independent scrolling, individual PNG and cross-game browser download checks in [browser QA #4](https://github.com/87otlto-coder/mk-dos-archive/issues/4) before [promotion #2](https://github.com/87otlto-coder/mk-dos-archive/issues/2). Preserve the separate MK3 stage-identification question.
