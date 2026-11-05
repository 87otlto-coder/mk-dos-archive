# MK DOS Extractor — P15 MK2 screenshot-witnessed original packed-floor previews

**Date:** 2026-11-05  
**Parent:** P14 interim `develop` at `00247994c0e5209ff46194a7ac4c8b570f3eaa7c`  
**Release classification:** Fourth focused interim pass after P11 source checkpoint. P16 should be consolidation/regression/source checkpoint when verified; do not release a full archive solely for P15.

## Extraction outcome

The Asset Library now includes **two original indexed 320-column source-floor previews with explicitly screenshot-witnessed RGB**, alongside the seven P14 neutral grayscale source projections. This is *using existing independently verified O115/O116/O117 research*, not inferring a new native game palette or reconstructing a complete stage:

| Original resource | Source extent | Screenshot-conditional source column | Preview | Distinct original bytes | Independent original screenshot validation |
|---|---|---:|---|---:|---|
| `TOMB.GRA` | Byte 63,776 + 896 × 48 | 291 | 320 × 48 | 43 | **12,222/12,222** held-out unoccluded pixels in O117 original Tomb control |
| `PORTAL.GRA` | Byte 56,916 + 896 × 40 | 292 | 320 × 40 | 26 | **4,420/4,420** screenshot match samples in O115B/O116 original Portal control |

Tomb x=291 derives from **O117**, not O116's older x=290 suggestion from a different screenshot. Portal x=292 derives from O115B/O116. These positions are **conditional screenshot-source alignments**, not live emulator camera register addresses. Colours are from original DOSBox **O115 screenshot-measured** per-index colour maps (Tomb source bytes 2–51, Portal 3–80), confirmed separately against original unmodified gameplay images. The independently checked source-to-RGB mappings are not proof of the live VGA DAC allocation at every frame or under other game settings.

### Explicit confidence categories

- **VERIFIED:** Original resource hashes, exact 896-byte row and source boundaries, source-index extraction and export, screenshot-observed per-index RGB table, specified screenshot-conditional source alignment, bounded original screenshot pixel matches, deterministic PNG image and ZIP index/mask exports.
- **INFERRED:** Nothing about unmeasured world scene placement or palette owner is promoted to verified from the source filename or view.
- **UNKNOWN:** Live colour-bank/handle, general palette ownership, real-time camera position, camera motion, layer order/occlusion, source palette under other runtime states, full 320×200 scene and native animation timing.
- **VALIDATION PENDING:** User-initiated real-game browser navigation to new Asset Library records; GitHub CI separately from original-fixture tests until a completed run is recorded.

The new assets have original `indices` and all-one `mask` in their metadata and selected ZIP exports. The **native palette-known mask remains all zero** because runtime DAC bank identity remains unknown, even though an O115 screenshot colour is known for every exported source index. Metadata separately records the screenshot-observed RGB provenance; these *must not be conflated*.

## Implementation boundaries

- New: `src/core/assets/mk2ObservedFloorColorsP15.ts`, a bounded Asset Library adapter that calls the **unchanged** `observedStageFloorPreviewO116.ts` implementation using the explicitly qualified Tomb and Portal source-left values, verifies the original `MK2.EXE` plus the individual `TOMB.GRA`/`PORTAL.GRA` canonical source checksums, and extracts original raw indices separately from the original packed suffix.
- Modified: `src/core/assets/collection.ts`, to add the two newly qualified stage-floor assets, one focused forensic ZIP and a source-status report. Existing P2–P14 source, research workbench and asset groups are untouched.
- New: `scripts/verify-mk2-p15-floor-witness-independent.py`, independent standard-library reference generator from **original MK2 files + original O115 private witness JSON reports** with pinned SHA256 and complete original index domains. The reports are private; the script can reproduce parity when those original evidence files are available.
- New: `scripts/fixtures/mk2-p15-floor-original-witness-parity.json`, **only original input SHA256, format geometry, index and RGB SHA256, mask SHA256 and report provenance**; no original game pixel/media bytes.
- New: `scripts/verify-mk2-p15-observed-floors.cjs` and `scripts/verify-mk2-p15-cumulative.cjs`, independent-source/hash/ZIP/PNG/negative fixtures and cumulative regression.

## Original-fixture verification

- Independent Python producer parses the original DOS `.GRA` resources and separately authenticated O115 screenshot-ramp report bytes; it does **not** import the TypeScript O116 renderer. Both report hashes and source resource SHA256 values match the original O115/O117 published evidence. There are **28,160** source-index pixels (15,360 Tomb, 12,800 Portal).
- Focused TypeScript adapter vs Python goldens: **28,244 checks PASS**. Independently generated index and screenshot-RGB SHA256 values match for both assets; canonical resource extents and 10 missing/tampered/duplicate/synthetic negative controls pass. Selected-asset ZIP retains correct index bytes and native-palette-unknown mask. The recorded focused source evidence ZIP SHA256 is `1ded7e25adc7043e908cf2268fc208321fed6afa8779526dda1e17739455454b`.
- Independent standard-library ZIP CRC and Pillow PNG readback: **both 320×48 and 320×40 PNGs match all 28,160 expected screenshot-RGB pixels byte-for-byte**, source indices match independent original golden hashes, native palette uncertainty bits all zero. This is source-exact screenshot-conditional rendering; not a fresh gameplay capture.
- The P15 cumulative fixture scanner requires **5,108 unique assets** (P11 5,053 + P12 31 + P13 15 + P14 7 + P15 2), all previous source groups retained and original P8/P9/P10 evidence ZIP SHA256 values intact. Record final PASS separately from the focused checks, rather than claiming it solely because the adapter passed.

## Reproduction

```bash
python scripts/verify-mk2-p15-floor-witness-independent.py \
  /path/to/original/MK2 /path/to/private/O115-reports \
  --out /tmp/p15-original-witness-parity.json
node scripts/verify-mk2-p15-observed-floors.cjs /path/to/original/MK2 /tmp/p15-focused.json
node scripts/verify-mk2-p15-cumulative.cjs /path/to/original/MK2 /tmp/p15-cumulative.json
```

The original DOS resource fixture, private O115 evidence reports, screenshot captures and original artwork must **not** be uploaded to GitHub. No consumer-ready full stage reconstruction is claimed.

## Next pass — consolidation decision

P12–P15 added **55** original graphics/qualified representations to P11's 5,053 MK2 assets: 31 introductory images, 15 original Mountain sprites, seven source-neutral floor projections and two conditional screenshot-RGB floor projections. P16 is the appropriate **fifth-pass consolidation candidate**: complete original-fixture cumulative and independent checks, strict production build, source checkpoint, updated documentation and an honest browser/coverage boundary. Avoid a heavy source ZIP/release until P16 acceptance is met. Continue MK2-first thereafter, particularly candidate palette ownership, reusable layer-source provenance and additional animation/audio completeness.
