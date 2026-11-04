# MK DOS Archive — Checkpoint — Pass 1E.3O.76 MK2 HH0 Second Fighter-Resource RGBA Fixtures

## Status

**VERIFIED SECOND INDEPENDENT MK2 FIGHTER-RESOURCE CORRECT-COLOUR FIXTURE / IDENTITY SLOT 0 → HH0.GRA OFFSET 0 / 36-STREAM EXACT FULL RESOURCE TILING / TWO EXACT SLOT-0 63-COLOUR PALETTES / O75 DEFAULT+DUPLICATE SEMANTICS PRESERVED / 72 RGBA PNGs / HH0-ONLY SCOPE / HH1–HH5 NOT PROMOTED / HUMAN FIGHTER NAME NOT PROMOTED / INDEPENDENT 281/281 AUDIT PASSED / SOURCE+UI 33/33 AUDIT PASSED / DETERMINISTIC PACKAGE REPLAY PASSED / ONE-PASS PAUSE REACHED**

O76 establishes a second independent MK2 fighter-resource correct-colour fixture after JC0. The claim is deliberately bounded to `HH0.GRA`; it does not promote palette ownership for the rest of the `HH` resource family.

## Authentic anchors

- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- `HH0.GRA` SHA-256: `bee34a00af661a1e6d8771dab41cc4b0e084c2a8791c80cafc0147902519247f`
- executable resource-pool ordinal: `97`
- shared identity / palette selector slot: `0`
- O73 slot-0 witness descriptor: physical `0xC3CB0`
- witness GRA offset: `0x000000`
- O69 `HH0.GRA` qualification: `EXACT_FULL_RESOURCE_TILING`
- authentic `HH0.GRA` byte length: `147,844`
- qualified streams: `36`
- opaque index domain: bounded inside `1..63`

## Identity → resource join

O73 independently established the 17-slot resource-family selector keyed by object field `+0x46`.

For selector slot `0`:

`identity slot 0`

→ relocatable per-character resource structure

→ authenticated descriptor physical `0xC3CB0`

→ `HH0.GRA + 0x000000`

O69 independently found that same descriptor as the first member of an exact 36-stream tiling of the complete authentic `HH0.GRA` file.

O76 therefore uses **HH0 only** as the second bounded correct-colour fixture. It does not infer that `HH1.GRA` through `HH5.GRA`, `HHFRIEND.GRA`, or any other `HH*` resource necessarily uses the same palette merely because the prefix matches.

## Slot-0 palette records

O72's independently verified 17-slot palette tables resolve selector slot 0 to two exact Object-1 counted 63-colour records:

### Table A

- semantic alias from O75: `DEFAULT_CHARACTER_PALETTE`
- Object-1 offset: `0x252A0`
- physical file offset: `0x86EF4`
- record byte length: `128`
- colour count: `63`
- exact raw record SHA-256: `d15b71319a074b382cf89cb605d140392085d2b4c1391f1848cf11889f2a2c1a`

### Table B

- semantic alias from O75: `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`
- Object-1 offset: `0x25320`
- physical file offset: `0x86F74`
- record byte length: `128`
- colour count: `63`
- exact raw record SHA-256: `cc292774415c99138b7eeff2afc3e3742b5b87ce1e10c40f7f95e28eb50622cb`

The O75 gameplay-semantics boundary remains unchanged: table A is the default character palette; table B is the same-character duplicate override. Numeric Player 1 / Player 2 naming and the meaning of mode value `4` remain unresolved.

## Pixel → palette mapping

O76 rechecks the MK2 renderer relation established in O74:

`opaque source index N (1..63) → palette-record colour N-1 (0..62)`

The renderer reads the palette handle DAC-start byte at `+0x06`, subtracts one, resolves the replicated-byte offset lookup, and adds that offset to packed source index bytes. O71 independently establishes that palette record colour 0 is transferred beginning at the handle's DAC start.

The exact executable-proven 6-bit DAC triples are converted to PNG RGB8 by the same deterministic display-only rule used in O74:

`round(component * 255 / 63)`

## Exported fixture

O76 renders:

- 36 exact `HH0.GRA` indexed streams;
- under `DEFAULT_CHARACTER_PALETTE`;
- under `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`;
- for **72 deterministic RGBA PNGs** total.

The package also contains both exact 128-byte palette records, two manifests, and a README.

Package:

- filename: `MK2_O76_HH0_PALETTE_CONTEXT_RGBA_PACKAGE.zip`
- entries: `77`
- PNGs: `72`
- palette binaries: `2`
- manifests: `2`
- README: `1`
- byte length: `1,843,277`
- SHA-256: `1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2`

A second independent regeneration produced the exact same package bytes and SHA-256.

## Independent validation

The TypeScript O76 implementation passes **14/14** internal checks.

A completely separate Python auditor passes **281/281** checks. It does not call the O76 TypeScript implementation. It independently:

- authenticates `MK2.EXE` and `HH0.GRA`;
- rechecks the renderer palette-offset relation;
- authenticates both exact slot-0 palette records;
- scans file-backed Object-2 data for resource ID `97` descriptors;
- rediscovers 36 HH0 descriptor candidates / 36 unique streams;
- verifies no geometry/length ambiguity;
- proves stream 0 begins at GRA offset 0;
- proves every decoded stream ends exactly at the next stream;
- proves the final stream ends exactly at HH0 EOF;
- verifies the index domain remains within 1..63;
- independently reconstructs all 72 expected RGBA buffers;
- parses every PNG including chunk CRC, zlib stream and filter state;
- compares every decoded PNG RGBA payload byte-for-byte;
- verifies both manifests and exact palette binaries;
- verifies the package SHA against the O76 report;
- verifies that the report does not promote the whole HH family or a human fighter name.

Source/UI integration passes **33/33** checks. Targeted TypeScript compilation passes with the established archival React/lucide/Node shims.

## Boundaries

O76 establishes exactly:

`identity slot 0 → HH0.GRA offset 0 → exact full 36-stream HH0 resource → palette selector slot 0 → default + same-character-duplicate palettes → 72 correct-colour RGBA fixtures`

O76 does **not** establish:

- palette ownership for `HH1.GRA` through `HH5.GRA`;
- palette ownership for `HHFRIEND.GRA` or the broader `HH` family;
- the human fighter name represented by `HH`;
- Player 1 / Player 2 naming for side indices 0/1;
- the meaning of O75's mode value `4`;
- a shared MK1/MK2 palette abstraction.

The visible character appearance is not used as identity evidence.

## Verdict

`MK2_HH0_SECOND_FIGHTER_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`

Independent audit:

`MK2_O76_INDEPENDENT_RGBA_AUDIT_PASSED`

Source/UI audit:

`MK2_O76_SOURCE_UI_INTEGRATION_AUDIT_PASSED`

Per the user's timeout discipline, pause after this single major verification pass. **O77 has not started.**
