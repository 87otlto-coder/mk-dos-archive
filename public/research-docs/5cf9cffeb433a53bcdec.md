# MK DOS Archive — Pass 1E.3O.79 Checkpoint

## Scope
O79 establishes one additional bounded MK2 correct-colour fighter-resource fixture: identity slot 3 / `BA0.GRA` only. It does not promote BA1+, whole-family ownership, or a human fighter name.

## Verified prerequisites
- authentic MK2 fixture SHA-256: `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2`
- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- `BA0.GRA` SHA-256: `bce354dc74b2e12d05a0e6643364ffaabbc3b8bc789a834fe4c8113fd36023fd`
- O73 identity slot 3 reaches the exact `BA0.GRA+0` descriptor at physical `0xC5FC0`.
- O69 qualifies `BA0.GRA` as `EXACT_FULL_RESOURCE_TILING`: 44 streams, 111,300 bytes, opaque indices 1..63.
- O72 slot-3 table-A palette: Object-1 `0x2594A`, physical `0x8759E`, 63 colours, raw record SHA-256 `88c20a63940c97ccd0a8bfd5a534959fd2901ddd65b44e41687cad4d360a8347`.
- O72 slot-3 table-B palette: Object-1 `0x259CA`, physical `0x8761E`, 63 colours, raw record SHA-256 `8e69dfc77db334ce295a2de71fe1db119139a7221733bb9b09592cef0ae0f3eb`.
- O75 semantics remain `DEFAULT_CHARACTER_PALETTE` / `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`.
- O74 renderer mapping remains `opaque source index N -> palette-record colour N-1`.

## O79 result
- 44 BA0 streams × 2 semantic palette contexts = 88 RGBA PNGs.
- package entries: 93.
- package bytes: 1,299,552.
- package SHA-256: `8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133`.
- implementation checks: 14/14.
- independent Python reconstruction: 337/337.
- source/UI integration audit: 33/33.
- deterministic second regeneration: byte-identical.
- targeted TypeScript: passed.

## Boundary
O79 is `BA0.GRA`-only. It does not establish palette ownership for `BA1+`, the entire BA family, a human fighter name, Player 1/Player 2 numbering, mode-4 meaning, or any MK1-derived semantics.

## Verdict
`MK2_BA0_FOURTH_FIGHTER_RESOURCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`
