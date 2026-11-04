# MK DOS Archive — Checkpoint 1E.3O.81

## MK2 FN4 slot-4 connected-provenance RGBA fixture

Pass O81 tightens the shared-family provenance boundary left by O73 before promoting a fifth bounded correct-colour MK2 resource fixture.

O73 correctly established the 17-slot identity/palette axis and the broad `FN` family classification for slots 4/5/16, but its historical slot-4 `FN6.GRA+0xA968` witness was a loose bounded family witness rather than a connected pointer chain from the slot-4 root. O81 therefore does **not** use that FN6 witness as ownership evidence.

Authentic MK2 LE fixups instead establish the connected slot-4 path:

`identity slot 4 root Object-2 0x2194`
→ root field source `0x21AC` → Object-2 `0x21E0`
→ field source `0x21EA` → Object-2 `0x220A`
→ source `0x220A` → descriptor Object-2 `0x27640`
→ physical `0xC8294`
→ `FN4.GRA + 0x000000`.

O69 independently establishes `FN4.GRA` as `EXACT_FULL_RESOURCE_TILING`: 27 unambiguous streams, first offset 0, 69,660 encoded bytes covered exactly through EOF, opaque index domain 1..63.

O72 palette selector slot 4 resolves to two exact counted 63-colour records:
- table A / `DEFAULT_CHARACTER_PALETTE`: Object-1 `0x25B4A`, physical `0x8779E`, raw-record SHA-256 `0f61a83d2cb74174f25dc19b922943c93792bab6ca33aae891cef5a3f0c85320`;
- table B / `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`: Object-1 `0x25BCA`, physical `0x8781E`, raw-record SHA-256 `2bab018a1306b03a20fe93735f59dd8459195a0e440574c3aa4b246aad88091c`.

Using the already-qualified MK2 renderer relation `opaque index N -> palette-record colour N-1`, O81 exports 27 × 2 = **54 deterministic RGBA PNGs**.

Accepted package candidate:
- `MK2_O81_FN4_PALETTE_CONTEXT_RGBA_PACKAGE.zip`
- 59 entries
- 989,065 bytes
- SHA-256 `f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726`

Validation:
- implementation checks: 14/14;
- independent Python reconstruction: **221/221**, including independent LE-fixup parsing and all 54 PNG RGBA buffers byte-for-byte;
- source/UI integration: **35/35**;
- targeted TypeScript: passed.

## Boundary

O81 is `FN4.GRA` / identity slot 4 only. It does not promote `FN0–FN3`, `FN5+`, the whole FN family, slots 5/16, or a human fighter name. O73's older slot-4 FN6 witness is **SUPERSEDED FOR THIS SLOT-4 RESOURCE-OWNERSHIP CLAIM**, but remains historical evidence of the broader shared FN family.

Verdict: `MK2_FN4_SLOT4_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.
