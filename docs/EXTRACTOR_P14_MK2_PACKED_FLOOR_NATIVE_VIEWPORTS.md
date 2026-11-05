# MK DOS Extractor — P14 interim: seven native packed-floor viewport previews

**Date:** 2026-11-05  
**Baseline:** P13 on `develop`; stable P11 source checkpoint remains on `main`.  
**Research basis:** original O110C seven-stage packed viewport source/independent verifier, not appearance-based stage identity matching.

## Why this pass

The P4/P5 extractor already exposes seven native **896-column** original MK2 packed stage-floor strips, but does not expose the executable-backed **320-column output projection** recovered independently in O110C. P14 makes one bounded, repeatable projection per source directly available in Asset Library and selected-asset ZIP export. The improvement is usable original stage content with preserved index bytes, not an invented stage scene.

Original-source rows and total pixels:

| Source resource | Original 896-byte rows | Normalized diagnostic output |
|---|---:|---|
| `TOMB.GRA` | 48 | 320 × 48 |
| `BATTLE.GRA` | 40 | 320 × 40 |
| `TOWER.GRA` | 64 | 320 × 64 |
| `FOREST.GRA` | 32 | 320 × 32 |
| `ARMORY.GRA` | 56 | 320 × 56 |
| `PORTAL.GRA` | 40 | 320 × 40 |
| `ARENA.GRA` | 40 | 320 × 40 |

The **320 rows** in the earlier O110C handoff are the *sum* of source row counts across all seven resources; these are not seven complete 320×200 backgrounds.

## Source-executable qualification

The original DOS `MK2.EXE` is fixed to SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. All seven resources are individually gated by original whole-resource SHA-256, exact suffix length, source pointer record at `MK2.EXE:0xCFBAC`, and the independently verified original index-plane SHA-256. Missing, corrupted, ambiguous files cannot qualify as a preview.

O110C authentic native source witnesses include `MK2.EXE:0x9E118` camera/control projection, `0x659C6` DWORD-emitting renderer, and the Object-2 replicated-byte palette-base LUT. This implementation uses **source-normalized** `x=288` with a **hypothetical bank start of 1**:

- `x=288` yields zero signed 16.16 incremental displacement. The native reader therefore selects source columns **288–607** of each original 896-byte row without any invented gameplay camera.
- Native palette LUT adjustment is zero for hypothetical bank start 1. Thus each native little-endian `DWORD ADD` reproduces the original selected pixel word exactly, with **no mistaken per-byte colour addition**.
- Display PNG uses **RGB=(index,index,index)** as a diagnostic value visualization only. All true runtime palette colours are **UNKNOWN**; the exported `paletteKnownMask` is all zeros.
- Source index bytes and full paint mask are separately exported. The 896-column native planes remain available in existing P4/P5 assets.

Importantly, O110C's alternate x/bank controlled inputs (176, 400, 193) are research stress cases, **not** assumed runtime states. This extractor pass exports only the neutral source-backed projection, rather than multiplying the asset count with hypothetical variants.

## Changes

- New `src/core/assets/mk2NativeFloorViewportsP14.ts` implements seven strict source-qualified diagnostic previews, status reports and a deterministic source evidence ZIP. Per-resource availability is independent after the canonical EXE check.
- Updated `src/core/assets/collection.ts` registers the seven new stage source assets and evidence ZIP without modifying the earlier P7–P13 decoders or source material.
- New `scripts/fixtures/mk2-p14-stage-neutral-viewport-parity.json` stores independently generated O110C hashes/geometry/offsets only. **No extracted image pixels or commercial assets are committed.**
- New `scripts/verify-mk2-p14-source-viewport.cjs` validates every original projected pixel and every grayscale channel, independent O110C hashes, source pointer/extent and selected ZIP index/mask/known-mask preservation; source tampering/duplication controls are explicit.
- New `scripts/verify-mk2-p14-cumulative.cjs` retains the complete P13 source census, original P8–P10 archive hash parity and 7 more registered floor previews.

## Validation

- Independent O110C original-fixture producer generated **28 controlled cases** from seven authentic packed suffixes; its independent Node verifier passed. The source producer ZIP SHA-256 was `4e4e433b6d8b08ce9593e97073efbf7a8f54682cd574c79f5ead244c96075ca0`. That external research package stays local.
- New P14 adapter: **409,790 focused checks PASS**, seven original-fixture source index plane hashes verified; diagnostic RGBA pixels, masks and selected ZIP source-order verified; nine tampered/missing/duplicate fixture variants correctly rejected.
- Deterministic P14 source ZIP SHA-256: `e7b588f7f84807b3dab054e0b8ce99336570f29256056617b6c38bafad2b36ca`.
- **Cumulative regression PASS:** **5,106 distinct MK2 assets / 66 checks**, all P7–P13 cohorts preserved, and original P8/P9/P10 evidence ZIP hashes byte-identical. Seven additional source-backed floor projections beyond P13 5,099.
- **Independent image readback PASS:** external Pillow PNG decoder recomputed **102,400** diagnostic RGBA pixels from the ZIP index planes across all seven outputs; separate paint masks were all 1 and palette-known masks all 0. ZIP CRCs pass. This never changes the unknown runtime colour/camera status.
- GitHub production/TypeScript/Chrome tests are a **separate CI gate** after source commit. No claim of new original-game browser validation is made before that.

## Strict confidence boundary

**VERIFIED:** original resource identity, native 896-byte stride, executable-backed normalized 320-column source projection, source hash parity, original 8-bit index planes, deterministic diagnostic PNG and selected ZIP preservation.

**UNKNOWN:** live camera/x, palette-bank allocation at runtime, original RGB colour assignment, complete 320×200 stage composition, stage activation, offsets/layer order, timing or dynamic object relationships. A filename grouping is not proof of game-screen placement.

**Next P15 candidate:** apply evidence-grounded stage palette witnesses or source-controlled relative placement to the existing extracted floor/foreground layers. Generalize only after independent cross-stage verification; otherwise select another already qualified high-value graphic family. No gameplay-system work is justified merely to fill a scene preview.
