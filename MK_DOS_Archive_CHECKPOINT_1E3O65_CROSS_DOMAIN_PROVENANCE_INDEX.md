# MK DOS Archive — Checkpoint — Pass 1E.3O.65 Cross-Domain Export Capability + Provenance Index

## Status

**VERIFIED / PRODUCT-METADATA INTEGRATION ONLY**

O65 integrates the already independently validated stage, animation and digital-audio browser product contracts into one machine-readable top-level index. It does not reinterpret any asset or broaden any semantic claim.

## Exact current product inputs

- Stage: O55 browser package, 101 logical entries, current-run SHA-256 `f40fd7101b05f7b6c8ef528aa0a548749d3e88b64a5f2d0fb7ba04018b98c119`.
- Animation: O60 browser package, 2,295 logical entries, current-run SHA-256 `9a54d39b5518439c2a76f66e2e3bd12dd01a642e2febf0869345b94accd8461d`.
- Audio: O64 accepted browser package, 249 logical entries, SHA-256 `a636108a4907ff0d1aa5b6ed75b7d0f7f4143674185c78ac8028c6f9a3874613`.
- Canonical source EXE across all three domains: SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.

The stage/animation current-run ZIP hashes are intentionally recorded as exact identities for this integration run rather than treated as universal constants because those packages embed run-specific report metadata.

## Indexed evidence tiers

O65 preserves:

- 49 verified stage RGBA PNG assets plus 48 structured stage documents;
- 2,263 explicit character-context animation RGBA variants;
- 21 independently verified effect RGBA assets;
- all 1,102 animation descriptors in lossless indexed form;
- exactly 79 cross-resource animation descriptors as palette-unresolved/indexed-only;
- all 244 authentic WAV assets as raw byte-exact audio;
- raw `SAMPLES.DAT` as one unresolved preserved resource.

## Boundaries preserved

O65 explicitly keeps false/unestablished:

- canonical gameplay stage screenshots;
- universal animation palette-selection semantics;
- animation wall-clock timing;
- gameplay audio event names;
- `SAMPLES.DAT` role;
- runtime MIDI/sequence relationship;
- any expansion of binary writer scope.

## Result

Format: `mk1_cross_domain_export_capability_provenance_index_v1`

Verdict: `MK1_CROSS_DOMAIN_EXPORT_CAPABILITY_AND_PROVENANCE_INDEX_ESTABLISHED`

Direct standalone execution: **SUCCESS**.

Summary: 3 domains / 3 validated nested packages / 2,645 total nested logical entries.
