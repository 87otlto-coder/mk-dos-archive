# MK DOS Archive — O95P MK2 Animation Exportability Closure Ledger

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Pass:** O95P — animation/extractor closure evidence audit  
**Status:** VERIFIED EVIDENCE RECONCILIATION / MK2 RESEARCH STILL OPEN

## Purpose and scope

O95P converts accepted O95A (whole-MK2 completion baseline), O95B–I (animation foundation and consumer grammars), and O95O (current selected-pointer accounting) into a **fail-closed animation/exportability contract**. It does not introduce new machine semantics, new runtime identity assignments, inferred palette bindings, animation names or frame rates. It does not modify original game binaries or build extractor/UI features.

The original MK2 fixture is SHA-256 pinned at `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`; its O95A 614-file / 19,921,006-byte inventory is checked afresh. O95P independently byte-checks all 253 recorded rel32 lookup calls against the real `mk2.exe`. The report carries SHA-256 hashes of all ten accepted input evidence reports.

## What is actually proven

1. **Root geometry (O95B):** 17 numeric identity slots for each of two lookup families, collapsing to 11 unique Family-A roots (670 contiguous relocation-backed entries) and 15 unique Family-B roots (255 entries). This is **925 root entries summed within each family**, not 925 animations, unique assets, or reachable sequences. The O95B one-hop descriptor witness counts are 41 A + 76 B = 117 structural witnesses; they do not prove 117 complete animations.
2. **Lookup-call consumer coverage (O95H–O95O):** 253 direct lookup calls (144 A / 109 B), 210 strict terminal-qualified, 29 additional strong nonterminal consumer-qualified, 14 without a strong qualified consumer. The latter remain exactly **4 conditional** and **10 structural-only**. Strong consumer evidence does not identify a complete stream's runtime identity, name, frames or timing.
3. **Exactly five explicitly bounded fixed-numeric-identity sequences (O95C/E/F/G):** the O95C slot-12 A/index-7 finite standard sequence (8 ordered entries); O95E slot-7 B/index-1 finite standard sequence (6); O95F slot-6 A/index-0 self-target-loop standard sequence (7); O95G slot-1 B/index-1 finite standard sequence (6); O95G slot-0 B/index-2 specialized direct-descriptor sequence (5). Those **five examples are not an inventory of all animations**. Their stream pointers, bounded ordered content and consumer types are supported by prior verified work; neither human gameplay names nor wall-clock playback timing are established.
4. **Consumer discrimination is essential:** O95C standard compositions, O95G direct descriptors, O95I reverse sequence and segment navigation, O95L's fixed six-pointer grammar, and O95N's custom cursor-record walker are not interchangeable. A Family-A/B root-origin test is **not a valid universal parser selector**. Structural navigation is not automatically semantic consumption.
5. **Graphics/palettes (O95A baseline):** 124 `.GRA` resources; 94 exact-full, 15 partial/ambiguous, 14 zero-candidate pooled, 1 out-of-pool = 30 non-exact-full requiring classification, not necessarily 30 broken graphics files. Nine of 17 identity palette slots have bounded correct-colour evidence; eight (6, 7, 10–15) do not. Neither a compatible colour appearance nor family sharing proves ownership.

## Exportability: allowed and blocked

Evidence supports **structural root/callsite manifests**, **bounded ordered metadata for the five numeric-identity witness sequences**, qualified **indexed graphics**, and **RGBA only with an explicit correct-colour context**. These are research contracts; O95P does not implement a universal MK2 animation exporter.

Not authorized: full character-animation export; speculative move/fighter names; universal A/B grammar; cross-products of identities × indices; inferred palette bindings; frame-duration conversion to FPS/milliseconds; arbitrary writeback or reassembly.

## Closure ledger — eight animation obligations

| ID | Obligation | O95P state | Blocks complete animation export? |
|---|---|---|---|
| AN01 | 17-slot root geometry and alias extents | QUALIFIED_STRUCTURAL | No, in established scope |
| AN02 | Selected-pointer downstream consumer provenance | PARTIAL (14 held) | Yes |
| AN03 | Runtime identity/index/stream reachability | BOUNDED_ONLY (five witnesses) | Yes |
| AN04 | Multiple authenticated consumer-specific grammars | PARTIAL | Yes |
| AN05 | Full per-sequence order, controls, multipart, alias/termination IR | BOUNDED_ONLY | Yes |
| AN06 | Playback timing and wall-clock mapping | UNKNOWN | Yes |
| AN07 | Correct-colour ownership in remaining palette contexts | PARTIAL (9/17) | Yes |
| AN08 | Classify GRA structures outside exact-full coverage | PARTIAL (94/124) | Yes |

**Seven animation obligations remain blockers; AN01 is structurally qualified.** These represent research obligations, not a percentage of completed animation assets or a ranking of runtime importance. The fourteen unresolved selected-pointer paths are not assumed to be extractor-blocking in every case; AN02 remains open until reachability/relevance can be bounded or the user accepts limitations.

## Other MK2 closeout domains preserved

- **Stages/backgrounds:** not reconstructed in MK2; placement, ordering, compositing, camera, palettes and dynamic processes remain open.
- **Music:** 33 files in each of five sets; independent original-code comparison is qualified for `.MID` only. `.AWE`, `.GVS`, `.LAP`, `.SBL` cannot be promoted from structural decoding alone.
- **Digital audio:** O94D's 312 `.U8` bounded source-domain mono PCM/WAV path is preserved; unread trailing bytes and final hardware mixer output remain outside the established contract.
- **Support resources:** still require relevance classification where extractor-visible.

## Validation / reproducibility

- Producer: `scripts/run-mk2-animation-exportability-closure-ledger.mjs <mk2-fixture-directory> [report-directory]`.
- Evidence JSON: `mk2_animation_exportability_closure_ledger_o95p_2026-10-08.json`.
- Independent verifier: `scripts/verify-mk2-o95p-animation-exportability-closure-ledger.py <mk2-fixture-directory> <repo-directory> <O95P-report.json>`.
- **O95P independent verifier: 877 checks / 0 failures**, including real executable rel32 lookup destinations, unique-root entry geometry, five witness source joins, palette/GRA partition, held-route disjointness, closure gating and SHA-256 evidence-report identity.
- This is an evidence-*reconciliation* pass. It does **not** rerun every O95C–O95O semantic parser in its producer, and its checks are not a claim of new complete stream decoding.

## Next bounded pass

**O95Q — authenticated per-root/slot/index stream exportability census.** Begin with relocation-backed O95B root entries and O95C–O95I consumer grammars; classify exact entries only when the pointer and consumer are both authenticated, preserve alias identities, finite/loop/control distinction and unknowns, and avoid runtime identity/index cross-products. This will produce a concrete count of safely describable stream shapes versus unknown shapes before further expansion. Do not let it displace separate stage, graphics, palette and hardware-music closeout blockers.

Project order remains **finish MK2 research → return to MK1 → finish MK3 → discuss UI/usability with user → only then implement the extractor**. **MK2 RESEARCH IS OPEN.**
