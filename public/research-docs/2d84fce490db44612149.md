# MK DOS Archive — Pass 1E.3O.88
## MK2 eight verified identity/resource RGBA integration bundle

O88 is an integration/distribution pass only. It nests eight exact independently accepted MK2 identity/resource RGBA fixture packages without recomputing pixels or strengthening resource/palette semantics.

## Accepted prerequisite contracts

| Identity slot | Resource contract | Pass | PNGs | Nested entries | Exact package SHA-256 |
|---:|---|---|---:|---:|---|
| 0 | `HH0.GRA` | O76 | 72 | 77 | `1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2` |
| 1 | `LK0.GRA` | O77 | 72 | 77 | `04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836` |
| 2 | `JC0.GRA` | O74 | 70 | 75 | `d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7` |
| 3 | `BA0.GRA` | O79 | 88 | 93 | `8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133` |
| 4 | `FN4.GRA` | O81 | 54 | 59 | `f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726` |
| 5 | `FN6.GRA` | O83 | 92 | 97 | `68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3` |
| 8 | `NJ7.GRA` | O87 | 232 | 237 | `b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd` |
| 16 | `FN4.GRA` | O85 | 54 | 59 | `f15d5425f359ab6db21a31d82650ecd2c90105c9036194d1ef1e61e91e9079ff` |

The two `FN4.GRA` packages remain separate identity-slot contracts. O85 proves slot 16 has its own palette identity even though it shares FN4 geometry with slot 4, and its default/duplicate selector records alias the same palette record.

O87's slot-8 package is also deliberately bounded. Its connected path starts from slot 8's unique root prefix and reaches `NJ7.GRA+0`, but the slot-8 root graph reaches additional NJ-family branches. Therefore O88 does **not** promote `NJ7.GRA` as the complete or canonical geometry of identity slot 8 and does not promote whole-NJ ownership.

## Accepted O88 outer package

- file: `MK2_O88_VERIFIED_IDENTITY_RESOURCE_RGBA_BUNDLE.zip`
- encoding: ZIP STORE-only
- outer entries: **10** — eight exact nested fixture ZIPs + stable manifest + README
- nested logical entries: **774**
- already-verified context-specific RGBA PNGs: **734**
- byte length: **12,525,359**
- SHA-256: `97cc701cf39641acaa2930d3e7568bb44ee6eeb0d84a65d972b7a470ccc49f1e`

## Validation

- O88 implementation contract checks: **8/8**
- independent Python outer/nested package audit: **139/139**
- source/UI integration audit: **38/38**
- deterministic second generation: **byte-for-byte identical**
- targeted TypeScript/TSX: passed
- runner syntax: passed

## Evidence boundary

O88 adds distribution/provenance only. It does **not** establish or promote:

- new palette ownership;
- sibling-resource or whole-family ownership;
- `NJ7.GRA` as complete/canonical slot-8 geometry;
- human fighter names for resource prefixes or identity slots;
- Player 1 / Player 2 labels for numeric side values;
- the semantic meaning of mode value 4;
- any MK1-derived assumption as MK2 evidence;
- a shared MK1/MK2 implementation abstraction.

O87 remains the semantic authority for the new slot-8/NJ7 contract. O88 is only an exact integration layer over already accepted prerequisite packages.

Verdict: `MK2_EIGHT_VERIFIED_IDENTITY_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.
