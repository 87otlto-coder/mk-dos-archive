# MK DOS Archive — O96R / O96S: Indexed Word-Record Hypothesis Tests and Consumer Qualification

**Date:** 2026-10-09 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** BOUNDED STATICALLY VERIFIED / MK2 RESEARCH OPEN

## Authority and validation basis

- Immediate parent: `MK-DOS-Archive-2026-10-09-O96Q-source.zip`, SHA-256 `c5d892bf9d991366bf9471e111b6c67a3778ca8275abeec72073ea25e1259e4f`.
- Canonical, unchanged `mk2.exe`: SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Earlier O96P and O96Q executable evidence is retained; these passes do not rename or contradict their runtime boundary.
- Hypotheses are now deliberately allowed as **testable proposals**; they are kept as `SUPPORTED_STRUCTURALLY`, `SUPPORTED_CONDITIONAL_ON_HELPER_RETURN`, `REJECTED`, or `UNPROVEN`. Failed proposals are not promoted.

## O96R — six-choice indexed stream source and alternate record

O96Q traced `0x76526` back to installer `0x97FA0` and an Object-2 table at offset `0x2AF80`. O96R independently establishes:

1. `0x97FA0` supplies EAX=6 to helper `0x645E5`. The helper multiplies a 32-bit value by 6, uses the **high DWORD**, adds one, and the caller subtracts one. Therefore the indexed table position is **0..5** for all possible unsigned 32-bit helper outputs. This does not prove uniform randomness or which choice occurs in a running game.
2. Table `0x2AF80` contains **six relocation-backed Object-2 pointers**, at 4-byte stride. Their targets are `0x2AF98`, `0x2AFB8`, `0x2AFD8`, `0x2AFF8`, `0x2B018`, and `0x2B038`.
3. Each target is exactly **16 signed 16-bit words**: a permutation of the integers **0..14**, followed by **-1**. The two records at `0x2AFD8` and `0x2AFF8` are byte-identical, giving **five distinct record bodies**.
4. A separate branch can override the table-selected pointer with `0x2B078`. That record has an eleven-zero prefix followed by additional values; its first `13` also occurs in word position 14, then `-1` in position 15. The override is **not** empty, and the conditions selecting it are not established for a particular runtime instance.
5. The O96P consumer at `0x86015` branches on negative values or literal **13**. Thus the hypothesis that its loop normally reads through the final `-1` is **rejected**: for all six static variants it encounters `13` first at word index 14.

Evidence: `mk2_six_way_signed_word_stream_records_o96r_2026-10-09.json`.

## O96S — bounded stream token, pointer-table, object-field join

1. For any of the **six static** O96R stream variants, the O96P `0x86015` loop sees **14 nonterminal tokens**, each drawn from the set **0..12,14**, followed by `13`. Each token is used to index the relocation-backed Object-2 pointer table at `0x1C264`, via `0x8608C`.
2. Slots **0..14** in this table are verified. The 15 entries resolve to **14 unique file-backed 16-byte records**; slots 13 and 14 share target `0x1C59C`. All 15 entry pointers have exact Object-2 Type-7 fixups. Their 16-byte records share the raw leading `WORD 35`, `WORD 41`, `DWORD 0` fields, with further values retained without unsupported gameplay names.
3. At `0x86098`, the selected record pointer is written to global `0x75A6C`. The routine at `0x64548` calls `0x64522`, which loads that pointer, stores it at object `+0x3C`, and reads raw fields from the target record into object `+0x28` and `+0x2C`. The call path also reaches `0x860FD` and tail-enters linked-list insertion via `0x646B4`.
4. The parallel source at Object-2 offset `0x1C2C6` provides **14 signed WORD values** `771,724,...,160`, descending by exactly **47**. The caller packs each source word into the high 16 bits of EDX with low 16 bits fixed at `0x00C5` (197). Routine `0x860FD` writes those two word halves to object `+0x1E` and `+0x1A`, respectively.
5. These establish **conditional per-token object construction/input relationships**, not fourteen runtime-observed objects. Continuing through the full 14 tokens requires the called consumer/insertion path to return and requires the stream/global to retain the authenticated selection; actual scene execution and values remain unobserved.

Evidence: `mk2_static_word_stream_descriptor_consumer_join_o96s_2026-10-09.json`.

## Hypotheses tested

| ID | Proposed interpretation | Evidence-based verdict |
|---|---|---|
| H1 | Six selectable fixed records each contain 0..14 plus final -1 | SUPPORTED structurally |
| H2 | The loop always reaches final -1 | REJECTED: `13` terminates first |
| H3 | Override record represents an empty stream | REJECTED: actual record content |
| H4 | The records identify a particular named stage | UNPROVEN |
| H5 | Each static variant supplies fourteen pre-13 object-construction inputs | SUPPORTED conditionally on helper return |
| H6 | `-1` is reached in the six static streams | REJECTED: earlier `13` exit |
| H7 | The progression by 47 is wall-clock frame timing | UNPROVEN |
| H8 | These data establish a complete named scene or stage | UNPROVEN |

## Independent verification and regression

- O96R fixture reparse: **54,293 checks / zero failures**, including separate traversal of **27,004** LE relocation records.
- O96S fixture reparse: **54,611 checks / zero failures**, including a second independent traversal of **27,004** LE relocation records.
- Total new: **108,904 checks / zero failures**.
- Four injected false reports correctly rejected: modified signed WORD, falsified `-1` traversal, modified selected descriptor, fabricated timing semantics.
- Regressions: O96Q **54,156 / 0**, O96O/P **54,213 / 0**, O96N **37 / 0**.

No runtime game files were changed. There is **no observed game execution**, no proven named stage, no demonstrated correct-color palette, and no timing/FPS model. The seven bounded fixed-identity animation witnesses, 210/253 terminal-qualified paths, 239/253 strong consumer paths, nine correct-color palette slots, and 94/124 exact-full GRA coverage remain unchanged.

## Next bounded target

**O96T:** examine the 14 unique 16-byte object records and their packed source references against verified MK2 graphics/resource contracts, testing concrete interpretation hypotheses independently. If those fields cannot be qualified by consumer code or authentic graphic decoding, keep them UNKNOWN and pivot to the remaining palette, stage-composition, resource and audio closure gates. Do not treat this token list as a complete visual stage without pixel, palette and placement validation.

Required sequence: finish MK2 → finish MK1 → finish MK3 → discuss UI/usability with the user → build the extractor.
