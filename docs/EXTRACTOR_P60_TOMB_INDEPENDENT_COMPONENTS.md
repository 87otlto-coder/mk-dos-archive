# P60 — Kombat Tomb independent component evidence export (interim, fixture acceptance pending)

Date: 2026-11-07. Branch: `develop` only. P59 is the last focused original-file/browser-accepted MK2 pass; P56 is the last full original-MK1/MK2/MK3 cumulative checkpoint. P60 is the fourth interim pass after P56 (P57–P60); P61 remains the scheduled fifth-pass consolidation.

## Why P60 is an independent component package, not a composed scene

The original DOS executable/resource evidence supports **two separate provenance coordinate systems**:

1. **P59/O123 architecture and sky:** exact original TOMB.GRA setup-local indexed images, with two independent capture-specific shifts applied to selected held-out screenshot regions. The P59 proof concerns 2,650 opaque architecture pixels and 823 opaque sky pixels from one authenticated screenshot. Each export is a 319×199 sampled projection of an even-coordinate 637×397 capture. It does **not** establish full runtime camera, z-order, screen placement, or unselected pixels.
2. **P15/O115–O117 Tomb floor:** original 896-byte-stride packed floor, captured as a separate screenshot-conditioned 320×48 strip using source column 291. Its conditional RGB table is supported by 12,222 independently observed source/screenshot pixel matches. It is **not** established that this floor strip is registered to the O123 capture or that its screenshot RGB identifies the runtime native VGA DAC bank.

These components must not be alpha-composited into a claimed authentic game stage. Merely sharing `TOMB.GRA` does not establish common screen coordinates or layer order. The P60 bundle is designed as reusable **independent** evidence with explicit coordinate frames.

## Implementation

- `src/core/assets/mk2TombComponentsP60.ts` produces `MK2_P60_TOMB_INDEPENDENT_COMPONENTS.zip` only when the existing authenticated P59 ZIP and one exact qualified P15 Tomb floor asset are present. It independently checks the P59 ZIP CRC, format/source identifiers, two expected setup records, 319×199 image geometry, original opaque sample counts and mask/alpha boundaries. It independently checks the P15 indexed/paint/native-palette-known planes, source TOMB.GRA SHA-256 and floor extent, original witness/geometry and indexed/RGB digests. Invalid evidence fails closed rather than synthesizing missing layers.
- `src/core/assets/collection.ts` retains and exports the original P59 and P15 packages unchanged and conditionally adds the new P60 package. Any failure is reported as `reports.p60TombComponents.status='UNAVAILABLE'` without blocking the rest of the MK2 library. The asset census remains unchanged: **5,369** expected current MK2 representations; no new asset is registered.
- The new ZIP contains:
  - `components/architecture/sampled.png`, `indices.bin`, `sample-mask.bin`
  - `components/sky/sampled.png`, `indices.bin`, `sample-mask.bin`
  - `components/floor/conditional-rgb.png`, `indices.bin`, `paint-mask.bin`, `native-palette-known-mask.bin`
  - `manifest.json`: exact original asset identities, hashes, source record offsets/geometry, screenshot-specific registration for architecture/sky, original floor source x=291/stride=896, conditional screenshot colour provenance, independent coordinate frames, SHA-256 of exported payloads and strict UNKNOWN runtime properties.

P59 PNGs/indices/masks are copied **byte-for-byte**, not reprojected or recoloured. The floor PNG is reencoded from the unmodified P15 conditional-RGB array and the floor indices/masks are copied as-is. This is a convenience package of existing evidence—not newly discovered commercial game data or a full gameplay scene.

## Controls and acceptance

- Source-only: `scripts/test-p60-tomb-components.cjs` uses synthetic images/planes, verifies the three packaged groups, equality with each P59 input byte, floor RGBA/index/mask preservation, explicit cross-capture refusal flags and 15 deliberately false input cases (missing/duplicate source members, broken sample counts, source identity, corrupted planes, invented palette, camera and screenshot evidence).
- GitHub Actions runs this source-only test, the existing P59 controls, TypeScript, production build, source safety guard and headless Chrome startup. **VERIFIED:** [CI run 42412466093](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42412466093) completed **SUCCESS** on tested source/workflow commit `556712f8fc541e173ea949014300ef80abd9bfb2`, including all 15 synthetic false-evidence refusals, TypeScript checks, Vite production build and headless Chrome startup. Earlier interim failed CI runs were corrected test-expectation regex mismatches, not a claimed original-fixture pass.
- `scripts/verify-mk2-p60-tomb.cjs` is committed for original-MK2 acceptance. It scans the user's actual DOS source, checks canonical MK2.EXE and TOMB.GRA hashes, unchanged 5,369 assets, requires P59 and P60 verified source states, and independently matches all flattened P60 architecture/sky ZIP members against the original P59 ZIP. For the floor, it reconstructs 320×48 original indices from TOMB.GRA's floor suffix and compares P15 ZIP sidecars and decoded RGB pixel equality. It rejects any invented shared-camera/layer-order/native DAC claim. **Not yet executed with original MK2 files in this chat development session.**

**VERIFIED (pre-existing):** P59 original fixture/browser acceptance recorded at source `ac63b45`, P59 source-only CI success `42410395408`.

**VALIDATION PENDING:** the current P60 private original-MK2 runner, real browser download/ZIP export, fresh full three-game cumulative regression. The new focused P60 script's CI syntax check is NOT a substitute for executing it against commercial DOS fixtures.

**UNKNOWN:** full authentic Tomb stage reconstruction, native live VGA DAC palette ownership, screenshot-to-screenshot camera registration, layer ordering and original runtime animation timing.

## Reproduction, with original files outside Git

```powershell
git pull --ff-only origin develop
node scripts/verify-mk2-p60-tomb.cjs "E:\GOG\Games\Mortal Kombat 2\mk2" "C:\Temp\mkdos-p60-results.json"
npm.cmd run dev
```

In the Asset Library for the original MK2 game, **Decode & browse**, then under **Coverage & evidence** download `MK2_P60_TOMB_INDEPENDENT_COMPONENTS.zip`. Confirm it has the three independent component directories plus the manifest and that both original P59 and P15 packages are still available. Do not interpret a successful PNG export as proof of runtime layer registration or composited gameplay.

**Next P61:** Fifth-pass consolidation: current full MK1/MK2/MK3 regressions, source audit, recoverable checkpoint and assessment of `main` promotion only if justified. Keep original commercial resources and extracted copyrighted artwork outside GitHub.
