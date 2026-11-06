# P24 — BATTLE images with lossless duplicate-witness provenance

Date: 2026-11-06. Third interim pass after P21. Baseline: P23 `5c6ab85a96cd79bbf456e54473d4798bc3dfd4ad` on develop. Main remains P16.

## Practical outcome

The Asset Library now exposes **20 distinct BATTLE.GRA source images from 40 original descriptor witnesses**. Each asset retains both original descriptor ordinals, Object-2 offsets and physical EXE addresses. Repeated pointers do not inflate the new image count or duplicate exported image payloads.

Current MK2 collection: **5,205 unique representations**, up from 5,185. Existing sprite preview, PNG and selected-ZIP controls apply. Coverage & evidence includes `MK2_P24_BATTLE_20_ORIGINAL_INDEXED_IMAGES.zip`: 20 PNGs, 60 original/known-mask sidecars, one ordered provenance manifest. Original-data browser clicking remains validation pending.

## Original-file qualification

- Canonical MK2 EXE SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- BATTLE.GRA: **95,276 bytes**, SHA-256 `ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63`.
- Resource pool slot **34**, Object-2 image base **0xA0C54**, table **0x19380**, **40 eight-byte descriptors**. Existing O110A research is applied and independently repeated against original bytes.
- For each ordinal `i=0..19`, original records `i` and `i+20` are **byte-identical across all eight bytes**, proving the same native width, height and packed source pointer. The TypeScript adapter and independent Python verifier check this separately.
- The first twenty descriptors identify twenty distinct original intervals. Their decoded streams form a gapless **[0,59436)** prefix: **59,436 encoded bytes / 85,188 indexed pixels**.
- The original **[59436,95276)** suffix is the previously exposed **35,840-byte native floor**. The new cumulative gate retains all three prior BATTLE floor representations and compares uncropped raw floor bytes directly against the original file. Prefix plus floor is an exact source-byte partition; it is not a verified full stage composition.

Deduplication is bounded to these authenticated identical descriptor pairs and source intervals. It does not merge different original intervals merely because their pixels look alike, remove alternative interpretations, or generalize every table into an animation.

## Interpretation and implementation

The new adapter reuses the unchanged row decoder qualified on CAVE and ARMORY. It independently pins BATTLE's source identity, table, resource slot, original extent and pair equality. Invalid/synthetic/missing/ambiguous/mutated/truncated inputs yield no partial assets or package.

Each image preserves native indices and source transparency. Diagnostic grayscale is `RGB=(index,index,index)` with native opacity; all palette-known masks are zero. Source table order is explicitly not animation order. Native palette, timing, world position, human stage identity and complete scene assembly remain unknown.

No earlier adapter, research implementation, UI layout or source export was changed. The new collection registration, regression runner selection and source-only verifier syntax checks are additive.

## Fresh verification

| Gate | Result |
|---|---|
| BATTLE adapter/reference/export suite | **432 checks PASS**, 20 images / 40 witnesses, eight source-negative cases |
| Independent original-file PNG/sidecar/provenance readback | **511,492 checks PASS**, all 20 PNGs/three sidecars and both original witnesses per image |
| Falsified exports | **Four rejected**: changed source indices, changed PNG pixels with valid CRCs, invented palette ownership, missing duplicate-witness address; clean export reverified |
| Full cumulative collection | **5,205 unique assets / 826 checks PASS**, preserving earlier groups/archive identities and raw BATTLE/ARMORY floors |
| Consolidated runner through P24 | **12 MK2 suites PASS**, including CAVE **862**, ARMORY **335**, and seven older focused suites **818,695** checks |
| Local source checks | **369 TypeScript files / zero syntax errors**, TypeScript, production build, verifier syntax and diff-whitespace checks PASS; existing Vite large-chunk warning retained |

BATTLE evidence ZIP SHA-256: `3faed3ece5808182446d64092184300da667719cc95948c3f8a2db1f2c06f5eb`.

Preserved CAVE ZIP SHA-256: `e7c407cd1727b003387eb95c91a7e5a131c3eed0c5967fb1d7761ee3f81e9745`. Preserved ARMORY ZIP SHA-256: `7e5870cdeebf6c17c36a50024592115a1e3172b4a299f379e234ace86ed410ac`.

The Python row decoder/reference reads original EXE/GRA independently of TypeScript. PNG checks reuse the independent Python CRC/zlib/row-filter reader introduced in P22. Reference JSON contains geometry, addresses and hashes only. Game resources, generated PNGs, export ZIPs and falsification variants remain outside GitHub.

[Machine-readable P24 record](validation/P24_BATTLE_REGRESSION_2026-11-06.json).

**Committed source verified:** `a8ec7d2bf7e4c25a46ca8985a08dcc030d4e9c13`, tree `92892120b7854b770c4bfba81c7508e5e6901c3b`: **2,114 tracked file blobs / 373 src files**. All fourteen changed/added file blobs match the local candidate. No paths were removed; no reviewed original-game/media/archive extensions are tracked. Prior adapters, shared decoder and research source remain unchanged.

**GitHub CI PASS:** [run 42288449917](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42288449917) completed successfully on `a8ec7d2`: strict locked dependency install, source/new verifier syntax, media guard, Vite production, TypeScript, source-offline headless Chrome startup and build upload. This source-only CI does not contain commercial fixtures or establish real-data browser interactions.

## Reproduce

```powershell
node scripts/verify-mk2-p24-battle.cjs <MK2-dir> adapter.json private-battle.zip
python scripts/verify-mk2-p24-battle-independent.py <MK2-dir> --export private-battle.zip --report independent.json
python scripts/test-mk2-p24-battle-negative.py <MK2-dir> private-battle.zip <private-output-dir>
node scripts/verify-p21-checkpoint.cjs --mk2 <MK2-dir> --through p24 --report regression.json
```

Keep generated outputs outside original game directories and the Git checkout. The current checkpoint runner defaults to P24. Earlier `--through` choices require matching historical source; earlier fixed-census scripts are preserved.

## Remaining qualifications and next pass

**VERIFIED:** original descriptor-pair equality, lossless witness preservation, twenty distinct image intervals, native pixel/mask geometry, independent PNG/sidecar parity, additive census and earlier floor/export preservation.

**UNKNOWN:** native RGB ownership, original image animation order/timing, world placement, scene identity and complete gameplay composition. A source filename is not a newly established arena attribution.

**VALIDATION PENDING:** real-data browser actions. Source-only Chrome CI remains a separate gate. MK1/MK3 fixture suites were explicitly not rerun in P24; their P21 evidence is historical. This pass uses the existing extracted MK2 fixture with directory identity checks and pinned complete EXE/BATTLE hashes; no fresh archive-level download/hash/re-extraction is claimed.

Next P25: audit ARENA's original descriptor coverage and integrate only independently verified missing images, preserving its existing floor representations. P25 is the fourth interim pass; P26 is the next consolidation candidate. Keep develop recoverable, preserve P21 and leave main unchanged; no full-source release at this interim pass.
