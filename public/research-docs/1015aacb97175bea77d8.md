# MK DOS Archive — Checkpoint 1E.3O.83

## MK2 FN6 slot-5 connected-provenance RGBA fixtures

O83 strengthens the shared-FN provenance model for identity slot 5 without generalizing the FN family.

Authentic MK2 executable fixups establish the connected path:

`slot 5 root 0x21B8 -> source 0x21D0 -> Object-2 0x2E86 -> source 0x2E86 -> 0x2ECE -> source 0x2ECE -> descriptor 0x2788C -> physical 0xC84E0 -> FN6.GRA+0`

O69 independently qualifies `FN6.GRA` as `EXACT_FULL_RESOURCE_TILING`: 46 unique streams cover all 125,348 authentic encoded bytes with opaque index domain 1..63. O72 resolves palette selector slot 5 to two counted 63-colour Object-1 records: table A at Object-1 `0x25D4A` / physical `0x8799E`, SHA-256 `f267c92cb13bc10aaffa115250579ac8997dfd107e11a3e8c41dce36fba0bad9`; table B at Object-1 `0x25DCA` / physical `0x87A1E`, SHA-256 `966975e1af91339efd1fb74184cc897956ec77bd3081ebd74c37793b992297ff`. O75 supplies the already-qualified meanings `DEFAULT_CHARACTER_PALETTE` and `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`.

Applying the previously verified MK2 renderer mapping `opaque source index N -> palette-record colour N-1` yields 92 deterministic RGBA PNGs (46 streams x 2 contexts). The accepted package contains 97 entries and is 1,584,566 bytes, SHA-256 `68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3`.

Validation:
- implementation checks: 14/14
- independent Python reconstruction: 354/354
- source/UI integration: 35/35
- second package regeneration: byte-for-byte identical
- targeted TypeScript/TSX: passed

Evidence boundary:
- this establishes `slot 5 -> FN6.GRA` only;
- no ownership is promoted for FN0-FN5, FN7, or the whole FN family;
- no human fighter name is inferred from the `FN` prefix;
- O73's earlier nonzero FN6 witness remains a historical family-level clue but is superseded for slot-5 ownership by this connected offset-0 chain;
- slot 16 remains unresolved at the connected-chain standard;
- O81's separate slot-4 -> FN4.GRA fixture remains unchanged.

Verdict: `MK2_FN6_SLOT5_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.
