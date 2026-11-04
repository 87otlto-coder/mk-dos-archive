# MK DOS Archive — Checkpoint 1E.3O.87 — MK2 NJ7 Slot-8 Connected RGBA Fixtures

## Verdict

`MK2_NJ7_SLOT8_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`

O87 establishes one bounded MK2 slot-8 / `NJ7.GRA` correct-colour contract from authentic MK2-only evidence. It does **not** claim `NJ7.GRA` is the complete or canonical geometry for identity slot 8, because the slot-8 root graph has additional connected NJ-family branches.

## Connected provenance

- identity slot: **8**
- O73 family/root clue: `NJ`, Object-2 root `0x9C54`
- O87 connected path: `0x9C60 -> 0xAC4A`, `0xAC7A -> 0xACA6`, `0xACE2 -> 0xAD16`, `0xAD4E -> 0x285F8`
- descriptor Object-2: `0x285F8`
- descriptor physical: `0xC924C`
- exact resource target: `NJ7.GRA+0`
- resource-pool ID: **55**

The first edge begins inside the slot-8 root's unique prefix, before slot 9's root at `0x9C68`. Every edge is an authentic Object-2 type-7 LE fixup and the final target is the O69-authenticated `NJ7.GRA` offset-0 descriptor.

## Exact-full indexed resource

O69 independently qualifies `NJ7.GRA` as `EXACT_FULL_RESOURCE_TILING`:

- **116** streams
- **241,320** encoded bytes
- first stream offset `0`
- opaque index domain **1..63**
- authentic resource SHA-256 `4de11628c34955832742166b330aacb01d4422cca09027fb626acd4e3698ab8e`

## Palette ownership

O72 selector slot 8 resolves to two exact counted 63-colour records:

- table A / `DEFAULT_CHARACTER_PALETTE`: Object-1 `0x2634A`, physical `0x87F9E`, raw record SHA-256 `2d7d4ba61593ead73ef6d672bc0e6bf8e742ba0d80f463995da3ce41380cdd6e`
- table B / `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`: Object-1 `0x263CA`, physical `0x8801E`, raw record SHA-256 `5d5cab5ed9e55bc356c79a6d354b4ad0ec5dc41229055b557c5aefbdcfac6894`

O75 supplies those semantic meanings. O74's renderer-qualified mapping remains: opaque source index `N` in 1..63 -> palette-record colour `N-1`.

## RGBA export

O87 renders all **116 streams under both contexts = 232 deterministic RGBA PNGs**. The STORE-only browser package contains **237 entries**:

- 232 RGBA PNGs
- 2 exact palette-record binaries
- 2 manifests
- 1 README

Accepted package:

- filename: `MK2_O87_NJ7_SLOT8_PALETTE_CONTEXT_RGBA_PACKAGE.zip`
- bytes: **2,535,316**
- SHA-256: `b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd`
- deterministic replay: byte-for-byte identical

## Independent validation

- implementation checks: **14/14**
- independent Python reconstruction: **846/846**
- source/UI integration audit: **37/37**
- independent audit reparses LE fixups, rediscovers all 116 streams and reconstructs all 232 RGBA payloads without calling the O87 TypeScript implementation.

## Boundaries

O87 explicitly does **not** establish:

- that `NJ7.GRA` is the complete/canonical slot-8 geometry;
- palette ownership for any NJ sibling resource;
- whole-NJ-family ownership;
- a human fighter name for slot 8 or the `NJ` prefix;
- Player 1 / Player 2 naming;
- any MK1-derived semantic assumption.

O73's older slot-8 `NJ6.GRA` family witness is superseded **for this bounded ownership fixture** by the connected `NJ7.GRA+0` path, but remains part of the historical research record.
