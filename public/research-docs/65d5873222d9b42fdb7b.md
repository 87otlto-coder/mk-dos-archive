# MK DOS Archive — Pass 1E.3O.86
## MK2 seven verified identity/resource RGBA integration bundle

O86 is integration/distribution only. It nests seven exact independently accepted MK2 RGBA fixture packages without recomputing pixels or strengthening palette/resource semantics:

- slot 0 / HH0.GRA — O76 package SHA `1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2` — 72 PNGs / 77 entries;
- slot 1 / LK0.GRA — O77 `04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836` — 72 / 77;
- slot 2 / JC0.GRA — O74 `d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7` — 70 / 75;
- slot 3 / BA0.GRA — O79 `8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133` — 88 / 93;
- slot 4 / FN4.GRA — O81 `f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726` — 54 / 59;
- slot 5 / FN6.GRA — O83 `68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3` — 92 / 97;
- slot 16 / FN4.GRA — O85 `f15d5425f359ab6db21a31d82650ecd2c90105c9036194d1ef1e61e91e9079ff` — 54 / 59.

The two FN4 packages are intentionally distinct identity-slot contracts. Slot 4 and slot 16 share FN4 geometry, but O85 proves slot 16 has its own palette identity and that selector tables A/B alias the same palette record, making the same-character duplicate override a visual no-op for slot 16. O86 does not merge those semantics.

Accepted O86 outer package:
- `MK2_O86_VERIFIED_IDENTITY_RESOURCE_RGBA_BUNDLE.zip`
- 9 outer entries: 7 exact nested packages + stable manifest + README
- 537 nested logical entries
- 502 already-verified context-specific RGBA PNGs
- 9,989,261 bytes
- SHA-256 `6d17d56e676cdc2523efaa823ff716d5f28d3ce4f3350f82f669645b590a97e6`
- ZIP STORE-only

Validation:
- O86 implementation checks: 8/8
- independent Python outer/nested integration audit: 123/123
- source/UI integration audit: 46/46
- deterministic second generation: byte-for-byte identical
- targeted TypeScript/TSX: passed

No new palette ownership, sibling-resource ownership, whole-family ownership, human fighter names, Player 1/Player 2 labels, mode-4 meaning, or MK1-derived assumptions are promoted.

Verdict: `MK2_SEVEN_VERIFIED_IDENTITY_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.
