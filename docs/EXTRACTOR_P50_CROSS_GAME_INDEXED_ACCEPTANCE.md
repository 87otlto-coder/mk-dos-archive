# P50 cross-game indexed/palette acceptance
2026-11-07; fourth interim after P46, develop only.

## Where we are
The repeatable gate initially failed because canonical MK1 exposed no native indexed candidates in the inspector. The existing workspace already decoded all 79 unresolved-palette records from validated O60 binary evidence, but dropped their planes. P50 retains those exact index/mask arrays through the workspace and asset registry. Their grayscale previews, identities, counts, palette uncertainty and decoders are unchanged.

These 79 records now support the existing direct indexed ZIP action. Provenance points to MK1_animations_evidence.zip indexed/descriptor_manifest.json and descriptor_pixels.bin. The old asset source offset/length do not establish encoded GRA extents; new metadata explicitly directs the user to evidence rather than claiming an extent. No palette is fabricated.

## Verified
**All twelve P50 acceptance steps PASS**:
- MK1 2,656 / MK3 9,186 compatibility; decoded visual hashes unchanged from P46.
- Current MK2 acceptance: 23 cumulative suites plus PORTAL/TOWER gates, 5,369 representations, 315 references and existing 43-effect export controls.
- All **79 MK1 unresolved indexed records / 740,670 native plane bytes** match existing qualified O60 descriptor/binary evidence exactly. No palette sidecars invented. The direct ZIP equals the current selected ZIP for each asset; these 79 archives intentionally gain preserved planes, not historical byte identity to PNG-only archives.
- Eight MK2 indexed cases pass independent original-source plane/preview checks.
- All 416 MK3 IFF archives pass independent BODY/CMAP comparison: 6,256,633 pixels / 319,488 palette bytes.
- P47 32 APNG cases / 236 decoded frames and tampering controls pass.
- Indexed-plane and palette refusal controls pass. New runner: eight preflight refusals / seven source-audit negative controls, clean reverified.
- Local 382-file syntax, TypeScript and production build PASS; existing bundle warning retained.

~~~sh
node scripts/verify-p50-indexed-acceptance.cjs --mk1 <original-dir> --mk2 <original-dir> --mk3 <original-dir> --report <private-json> --work <private-dir>
python scripts/test-p50-checkpoint-controls.py
~~~
All three fixtures and explicit report/work paths are required. Existing ancestors are resolved, outputs under source/fixtures refused, and RUNNING/PASS/FAIL saved atomically with per-step progress. Original artwork/ZIPs stay outside Git. Historical runners and the workbench remain preserved.

## Uncertainty and next
Shared API and original-fixture acceptance is VERIFIED; actual browser interaction/download remains VALIDATION PENDING. Embedded IFF CMAP is source-image evidence, not gameplay DAC ownership. MK1 unresolved palettes, native timing/activation and full stage composition remain unknown where unqualified.

P46 remains consolidated checkpoint. Next **P51 fifth-pass consolidation**: fresh current-source three-game, independent original-image/effect/indexed/palette/queue gates and complete source audit. Main remains P16. At each stop, state current pass, verified result, uncertainty and next action. Complete source/CI are verified below.

## Committed source and CI

Source candidate **f91f184bd73470c47338358e356b810fc9273b2d**, tree **3772820b18c2d6011c10bcce5d4a1cd4f5311f7f**: all **2,269 blobs / 386 src files** match (98 raw / 2,171 checkout-newline-normalized), zero missing/mismatched/unsafe paths. Inventory SHA-256 **4e160eef8375556216bd26d514f03f6703cde50093f21a3dbc864574c511f3b1**. Runtime changes are additive workspace/native-plane retention and registry provenance; existing decoding, colors and rendering remain unchanged. No source removals.

[CI run 42380926007](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42380926007) completed SUCCESS on the exact candidate, including new runner/sampler syntax, eight preflight refusals/seven source-audit controls without game data, existing export/palette controls, media guard, build/TypeScript and source-only Chrome startup. Original-fixture acceptance is recorded separately. Subsequent evidence-only commit changes this handoff, status and validation JSON; application/verification source match the audited CI candidate. Browser interaction remains pending; main stays P16.
