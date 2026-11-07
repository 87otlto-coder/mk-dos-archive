# P48 direct indexed-asset export
2026-11-07; second interim after P46, develop only.

## Where we are
The asset inspector now offers **Export indexed asset ZIP** when the focused asset has an indexed plane. It exports one asset directly, without adding to or changing the presentation queue. The archive includes the existing preview/data, native numeric indices, available mask/known-palette planes and manifest provenance/qualification metadata. No absent mask or palette ownership is invented.

The new indexedAssetZip helper checks matching safe positive dimensions and complete typed plane lengths before calling the established selectedZip serializer. The filename uses the existing safe-name convention and an _INDEXED.zip suffix. Existing single-preview, queue ZIP, sprite sheet and APNG actions are unchanged.

No decoders or source interpretation changed; MK2 remains **5,369** representations. This is an export-usability improvement, not new artwork or a native-color claim.

## Verified
- Eight original-data cases: CAVE, additional ARMORY/FOREST, TOMB/PORTAL components, a TOWER effect, a PIT bridge frame and the BATTLE native floor preview.
- All direct archives **byte-identical to the existing selectedZip([asset])** output. Original metadata/planes unchanged; absent mask/known-palette planes remain absent.
- Independent original-file reconstruction: **4,824,820 decoder checks / 156,801 native-plane/preview checks PASS**, including exact source extents, original index/mask hashes, PNG geometry and preview RGBA roundtrip.
- **Seven invalid plane/geometry cases rejected** in source-only controls. Valid minimal and fully masked cases preserve legacy bytes.
- Current MK2 acceptance runner PASS: **23 cumulative suites plus PORTAL/TOWER gates**, 5,369 representations, 315 source references, independent all-43-effect export checks and failure controls.
- P47 compatibility PASS: **32 APNG cases / 236 decoded presentation frames / 1,085,968 channel comparisons**, four tampered APNGs rejected.
- Local **382-file syntax**, TypeScript and build PASS; existing bundle warning retained.

~~~sh
node scripts/test-p48-indexed-export.cjs
node scripts/verify-mk2-p48-indexed-export.cjs <original-dir> <private-output>
python scripts/verify-mk2-p48-indexed-independent.py <original-dir> <private-output> --report <private-json>
node scripts/verify-p45-mk2-acceptance.cjs --mk2 <original-dir> --report <private-json> --work <private-dir>
~~~

Original game data and private exports remain outside Git. Only code, hash/count evidence and documentation are committed. Complete source and CI are verified below.

## Uncertainty and next
No controllable local browser was exposed, so the new button's real click/download behavior remains **VALIDATION PENDING**. The helper was exercised against original fixtures; this is separate from browser interaction. Native palette/DAC/alpha/timing/world relationships are unchanged. P46 remains the latest fresh full three-game checkpoint; MK1/MK3 were not rerun here.

Next **P49**: review preservation of source-qualified palette payloads alongside indexed exports, fixing only a demonstrated gap without assigning unverified ownership. Exercise browser downloads when local control is available. P51 remains next consolidation assessment. Main remains P16.

Every stopping update states current pass, verified results, uncertainty and next action.

## Committed source and CI

Source candidate **8c2634d92408bf8efba969a3d3e4ca70f04f9c8e**, tree **9323673c6a20616e494f6704dda00a0993cada0b**: all **2,259 blobs / 386 src files** match (97 raw / 2,162 checkout-newline-normalized), zero missing/mismatched/unsafe paths. Inventory SHA-256 **9bf3f999ab079f16d0416c560b150b949abd75c1febc244dd20c4fd60967755a**. Reviewed runtime changes are only the direct inspector button and validated helper; old export functions/serializers are unchanged. No source removals.

[CI run 42371498982](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42371498982) completed SUCCESS on that exact candidate, including seven indexed-export guard rejections on dummy data, independent Python verifier load, source syntax, existing refusal controls, media guard, build/TypeScript and Chrome onboarding startup without original game data. This is separate from the original-fixture tests and pending actual button/download interaction. Subsequent evidence-only commit changes this handoff, status and validation JSON; runtime and verification source match the audited CI candidate. Main remains P16.
