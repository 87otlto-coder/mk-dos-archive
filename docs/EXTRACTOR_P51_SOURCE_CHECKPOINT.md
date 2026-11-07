# P51 consolidated source checkpoint
2026-11-07; develop only. Consolidates P47-P50. Main remains accepted P16.

## Where we are
P51 checkpoints the direct indexed export action, original MK3 embedded-CMAP preservation, original MK1 unresolved-plane preservation, independent queue/APNG readback and repeatable cross-game indexed acceptance. No runtime changes or new asset representations in P51; original decoder/renderer qualification and the research workbench remain preserved.

## Verified
**Fresh complete acceptance PASS**, no skipped games:
- **27 core game gates**: 25 standard three-game suites plus PORTAL/TOWER gates. MK1 **2,656**, MK2 **5,369 / 4,357 cumulative checks**, MK3 **9,186**.
- Twelve independent native-image families: **251 representations / 939,903 indexed pixels / 10,712,883 checks**; **54 altered exports rejected**, clean reverified.
- Current native accounting/effects: **315 exact source references / 7,064,335 decoder checks / 171,036 export checks**, all 43 existing effects; **eight false reports / six altered exports rejected**.
- **79 MK1 unresolved indexed records / 740,670 original plane bytes** match O60 evidence. Palettes remain unresolved; encoded GRA extents are not inferred from placeholder source fields.
- Eight MK2 indexed-export cases independently match native source planes and preview roundtrips.
- **416 MK3 IFF images / 6,256,633 pixels / 319,488 CMAP bytes** match independent original FORM/BODY/CMAP decoding. Explicit embedded source-image palettes are not gameplay DAC ownership.
- **32 APNG cases / 236 decoded frames / 1,085,968 RGBA channel comparisons**, original and edited/duplicated queues and user timing bounds; four altered APNGs rejected, clean reverified.
- Indexed-plane and palette guard tests reject seven and five malformed cases respectively. New runner: **eight preflight refusals / seven source-audit negative controls PASS**.
- Local **382-file syntax**, TypeScript and production build PASS; existing bundle warning retained.

MK1/MK3 decoded visual hashes match P46 and earlier checkpoints. MK2 legacy package hash controls pass. MK1/MK3 indexed archives intentionally gained native planes/embedded palettes in P49/P50; whole-archive identity to prior PNG-only exports is not claimed. MK1 whole-evidence ZIP variance retains an INFERRED metadata explanation.

## Reproduce
~~~sh
node scripts/verify-p51-checkpoint.cjs --mk1 <original-dir> --mk2 <original-dir> --mk3 <original-dir> --report <private-json> --work <private-dir>
python scripts/test-p51-checkpoint-controls.py
~~~
All original fixtures are required. Private outputs resolve existing ancestors to stay outside source/fixtures; results are saved atomically as RUNNING/PASS/FAIL with last completed step. P50 remains the cross-game indexed gate; P46/P41 and earlier checkpoint runners remain frozen. Existing extracted fixtures were reused without a fresh archive download/re-extraction. Original game bytes/artwork/ZIPs are excluded from Git.

## Uncertainty and next
Shared API/original-fixture acceptance is VERIFIED. Actual browser click/download/preview remains VALIDATION PENDING; source-only Chrome startup is separate. Native palette/DAC ownership where unqualified, native alpha/timing/activation, world placement and complete scenes remain unknown. CAVE's first 120 bytes remain unqualified; out-of-scope resource bytes do not imply missing images.

Complete source audit **2,273 blobs / 386 src files PASS**, zero missing/mismatched/unsafe paths; candidate **0f065089b31f0a9ab2e49df188cb6e6232ea4096**, tree **644ac08a0174e7c7f6fec83f9c677624a21e977b**. [CI 42383236378](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42383236378) **SUCCESS** on that exact candidate. The follow-up records documentation/evidence association only; tested source and workflow are unchanged. Inventory SHA-256: a23e25f5a4854c8a762984e64d11e4784ad26c16174b68dc0632950e809b3ae8. Next **P52**: inspect native index/mask retention in the existing MK1 read-only fallback, qualify any improvement against original and controlled noncanonical fixtures, and preserve strict canonical gates. Browser checks remain open when no controller is exposed. P56 is the next consolidation assessment after four interim passes. Main promotion remains separately authorized.

At every stop: current pass, verified results, material uncertainty and next action.
