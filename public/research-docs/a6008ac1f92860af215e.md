# MK DOS Archive — Authoritative Master Project Handover

**Reconciled:** 2026-09-29 (SAST)  
**Coverage:** project inception through Pass 1E.3O.19 authentic-install resource decode and character-to-animation-table selector validation  
**Purpose:** self-contained continuation document for a new research/coding agent  
**Authority:** this document reconciles the available project history, current source snapshot, machine-generated evidence, prior handoffs, and user-observed validation history. It is not a substitute for inspecting the underlying artifacts when a new pass depends on exact bytes.

---

# 0. Read this first

This is a **full-project handover**, not a delta note.

A new agent should be able to receive this document plus the available project files and continue with little or no user intervention. Earlier handovers remain useful historical evidence, but they should not be required merely to understand the current project state.

The most important high-level fact is that MK DOS Archive has evolved from a browser-based forensic extractor into a **lossless asset-reconstruction research platform with bounded compiler/recompiler validation capabilities**. The strongest repeated proof pattern is now:

**authentic binary → semantic parse/IR → byte-identical no-edit rebuild → bounded semantic edit → independently predicted exact byte diff → semantic reparse → exact reversal → runtime test where runtime semantics are the question**.

Pass **1E.3O.14** is now fully closed for its bounded compiler/UI claim. The final user-directory transaction matched the independently predicted eight-byte diff exactly, reparsed all seven qualified frame records plus placement, reported aliases correctly, and reversed to the canonical MK1 hash. No new DOSBox run was required because O14 exercised already-runtime-grounded topology and descriptor-placement semantics.

Pass **1E.3O.15** is now fully closed for its bounded read-only preflight claim. The normal-app user-directory export reproduced the independently predicted developer result exactly: `heart_0` is a genuine 8 -> 12-byte growth fixture with no in-place room; its direct little-endian dword inbound surface is one semantic reference / one raw occurrence / zero unexplained occurrences; 70 qualifying Object-2 zero runs are all Watcom module-owned, none belong to `MKBLOOD.ASM`, and none are promoted safe. Relocation therefore remains deliberately blocked.


Pass **1E.3O.16** returned the project to the export path. A direct canonical census of `KANO_ANITAB` bounded 101 symbol-span dword cells, classified all cells structurally, resolved 79 unique grammar-compatible stream starts, 168 unique frame targets and 163 descriptors, and retained O14's off-table heart `BEAT_LOOP` as explicit proof that the table is not Kano's complete animation universe. O16 core structural result is established; the normal-app user-directory export remains a separate integration gate.

Pass **1E.3O.17** then repeated the method across every blindly discovered Watcom Segment-2 DATA symbol ending in `_ANITAB`: EMP, GORO, KANG, KANO, LIZ, NINJA, VANDAN and RAIDEN. The eight symbol spans are not uniform (41..106 cells), but the qualified DO_NEXT_A9_FRAME stream grammar and direct-descriptor / zero-terminated-descriptor-vector frame model repeat across all eight wherever stream-compatible entries occur. Direct canonical validation accounts for 739 symbol-span cells, 564 stream cells, 514 unique stream starts, 1,144 unique frame targets and 1,102 unique descriptors. Five independent tables contain multi-part vectors. Auxiliary non-stream values remain explicitly unknown rather than being guessed.

The user then supplied the complete original MK1 installation archive. **Pass 1E.3O.18** resolved all 1,102 O17 descriptors against 12 authentic GRA resources and decoded **1,102/1,102** successfully with the established uGRA decoder. The known Kano checksum `09961980` reproduced, the opaque pixel-index union across the graph is exactly 1..23, and all 25 structural multi-part frames show pairwise-overlapping opaque bounds under descriptor-local X/Y. This establishes broad resource/decode backing, but not palette ownership.

**Pass 1E.3O.19** then located canonical code symbol `GET_CHAR_ANI` and established the runtime bridge from the already-qualified +0x48 character identity field through a nine-entry ANITAB selector table to the O17 animation tables. Character IDs 0..8 map to VANDAN, KANO, RAIDEN, KANG, NINJA, NINJA, LIZ, GORO and EMP ANITABs respectively; Scorpion/Sub-Zero explicitly share `NINJA_ANITAB`. Individual ANITAB-index gameplay names remain open.

The product direction has also been clarified: the **end product is primarily an asset extraction/reconstruction/export tool**, not an EXE modding suite. Binary write-back, exact-diff recompilation, and runtime mutations remain valuable **internal validation techniques** when they are the strongest way to prove a semantic interpretation, but they are not themselves required end-user features. The immediate continuation should broaden MK1 understanding and exportability rather than forcing arbitrary relocation or import capability.

---

# 1. Permanent handover-generation rules

These instructions are permanent project context and **must be reproduced in every future authoritative handover**.

## 1.1 Every handover is a complete project handover

A handover must contain the **entire relevant history of the project from its beginning through the current checkpoint**.

Do not write authoritative handovers as incremental updates that assume the next agent has read earlier handovers.

Each new handover must:

- preserve the established project history;
- incorporate all newly verified results;
- incorporate relevant failures, corrections, and rejected hypotheses;
- update older conclusions where newer evidence supersedes them;
- preserve important prior discoveries even when the immediate work has moved beyond them;
- distinguish historical status from current authoritative status;
- make clear which earlier findings remain valid, which were refined, and which were superseded.

The latest handover should therefore be sufficient to reconstruct the project state without requiring the previous handover documents.

Previous handovers remain historical evidence, but the newest reconciled handover becomes the primary continuation document.

## 1.2 A handover must make the next agent aware of the available evidence and source material

Every handover must include an **Available Sources / Evidence Manifest** describing the source material that exists within the project and how it should be used.

This includes, where available:

- current source ZIP/archive;
- previous source snapshots that remain historically relevant;
- canonical game fixtures and known hashes;
- inventories;
- machine-generated research JSON;
- validation exports;
- edit reports;
- runtime test bundles;
- screenshots or user-observed runtime evidence;
- historical handovers;
- source documentation such as `README.md`, `CURRENT.md`, `RESEARCH.md`, `PROJECT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and `GAME_MATRIX.md`;
- relevant project conversation history;
- any other supplied research or reference material.

The handover must identify the **current authoritative source snapshot** and warn the next agent when source filenames, archive suffixes, README headings, milestone labels, or documentation are stale or misleading.

**Archive numeric suffixes are not semantic versions.** Authority comes from chronology, provenance, and independent reconciliation.

The next agent should be explicitly instructed to inspect available project sources rather than assuming the handover contains every byte of evidence.

## 1.3 Handovers are checkpoint documents, not pass-completion paperwork

Do **not** create a new full handover automatically after every research or implementation pass.

Create or refresh the handover when there has been a material change in project state, including situations such as:

- an important validation closes a mechanism;
- a runtime test materially strengthens or rejects a hypothesis;
- a validation fails and changes the recommended direction;
- a previous conclusion is overturned;
- a significant new capability becomes verified;
- a major blocker is discovered or removed;
- the project changes research direction;
- the current source package changes materially;
- the conversation/project is about to pause, move to another agent, or risks losing context;
- enough accumulated work has occurred that the existing handover no longer accurately represents the project.

A small implementation pass that does not materially alter the continuation state does not require a new full handover.

When a handover is created, however, it must again contain the **complete project state**, not merely changes since the previous handover.

## 1.4 Preserve the project's evidence hierarchy

When sources disagree, reconcile them rather than silently choosing the most convenient prose.

Use approximately this authority order:

1. authentic original fixture bytes;
2. independently inspected/generated machine evidence from the authentic fixture;
3. returned user-directory validation artifacts and exact binary diffs/hashes;
4. independently observed runtime behavior;
5. independent closeout/reconciliation;
6. implementation handoff documents;
7. current source documentation;
8. agent completion summaries or narrative claims.

A status label in `README.md`, `CURRENT.md`, an old handoff, UI banner, or agent message does not override stronger later evidence.

Explicitly record stale or superseded documentation when necessary.

## 1.5 Preserve failures and corrections

Do not rewrite project history so that every investigation appears to have succeeded on its first attempt.

For each material failure or correction, preserve:

- what was believed or attempted;
- what evidence contradicted it;
- what changed;
- what lesson or constraint resulted;
- whether the failure invalidated only that experiment or a broader mechanism.

Important examples in this project include incorrect coordinate models, misleading visual tests, stale source metadata, wrong-directory runtime testing, invalid free-space assumptions, and hypotheses rejected by authentic fixture evidence.

## 1.6 Distinguish validation states precisely

Do not collapse different forms of validation into the single word `verified`.

Use explicit states where relevant:

- `VERIFIED` — mechanically established from authentic fixture evidence;
- `RUNTIME VERIFIED` — behavior observed in the running original game;
- `STATICALLY VERIFIED` — binary/semantic/compiler evidence is exact but runtime behavior was not required or not tested;
- `IMPLEMENTED / VALIDATION PENDING`;
- `INFERRED`;
- `HYPOTHESIS`;
- `UNKNOWN`;
- `SUPERSEDED`;
- `REJECTED`.

Where source implementation, direct core validation, normal-app integration, user-directory export, and runtime validation have different statuses, report them separately.

Never promote a pass merely because its implementation exists.

## 1.7 Preserve the distinction between fixture facts and general rules

Every handover must continue enforcing:

- one observed Kano fact is not automatically an MK1 rule;
- one MK1 rule is not automatically an MK-DOS rule;
- numeric equality is not automatically an address relationship;
- palette compatibility is not palette ownership;
- a code-facing endpoint is not automatically a consumer;
- visual movement is not gameplay/collision movement;
- zero-filled storage is not automatically free/allocatable storage;
- successful serialization is not automatically proof of runtime semantics;
- an external reverse-engineering source may guide an experiment but does not replace independent derivation from the authentic binaries.

Promote mechanisms only after the required independent evidence exists.

## 1.8 Preserve the compiler philosophy

The long-term project goal is not merely extraction or patching.

The intended architecture is:

**Binary → lossless semantic IR → editable representation → deterministic compiler → Binary**

For understood structures:

- parse semantic fields;
- preserve original provenance;
- preserve unknown bytes/fields;
- perform a no-edit semantic round trip;
- require byte identity where expected;
- independently predict legal changed bytes for edits;
- diff the complete rebuilt binary;
- reject unexpected changes;
- semantically reparse the result;
- reverse the edit where practical and require recovery of the canonical source hash.

Use:

**unknown → preserve losslessly**

not:

**unknown → discard**.

Do not substitute raw offset patching for a semantic compiler when a qualified semantic structure exists.

## 1.9 Protect canonical source provenance

Writers and validation passes must operate against the authentic canonical source fixture unless a pass explicitly requires otherwise.

The handover must record known canonical hashes and identify edited/test binaries as noncanonical.

Do not treat a previously modified executable as a valid authoring source merely because it still runs.

When runtime bundles are produced, clearly preserve:

- source identity;
- edited identity;
- exact edit report;
- intended test directory/workflow.

This is necessary to avoid false validation failures caused by testing the wrong executable or directory.

## 1.10 Explain the current epistemic boundary

Every handover must explicitly state:

- what is established;
- what is only bounded to a specific fixture;
- what is implemented but not validated;
- what remains unresolved;
- what operations remain deliberately blocked;
- which tempting conclusions must **not** be made;
- what the next logical research/compiler step is;
- what should not be reopened unless contradictory evidence appears.

## 1.11 End with an actionable continuation section

Every handover must end with a clear continuation plan containing:

- the current authoritative checkpoint;
- the immediate next task;
- required prerequisite evidence;
- files/artifacts the next agent should inspect;
- exact validation gate for the next task;
- expected outputs;
- hard stop conditions;
- operations that remain out of scope;
- what evidence would justify changing direction.

The continuation instructions should be detailed enough that a capable new agent can begin work with little or no user intervention.

## 1.12 These rules are permanent project context

These instructions must be reproduced in every future authoritative handover.

If the project later adopts additional handover rules, append and reconcile them into this section so the newest handover always contains the complete current handover policy.

---

# 2. Project identity and long-term goal

**Project:** MK DOS Archive  
**Scope:** DOS PC versions of Mortal Kombat 1, Mortal Kombat II, and Mortal Kombat 3  
**Primary current fixture:** Mortal Kombat 1 DOS  
**Application form:** browser-based local-directory research/reconstruction tool  
**Current architectural direction:** forensic parser + lossless semantic IR + asset reconstruction/export pipeline, with deterministic bounded recompilation retained as a validation instrument

The original objective was to identify installations, inventory files, recover graphics/resources, and understand the executables. The project has advanced materially beyond raw extraction: the current product goal is to **reconstruct and export game assets correctly and usefully**, preserving the semantic relationships needed to turn raw resources into palettes, sprites, animations, composed frames, stages/scenes, audio relationships, and machine-readable metadata. A general EXE editor/recompiler is **not** currently an end-product requirement. Bounded recompilation remains strategically important as a proof tool because it can validate that the inferred semantic model matches the original game.

Primary product-facing conceptual pipeline:

`DOS game binary/resource set`  
`→ lossless parsed representation`  
`→ semantic dependency graph`  
`→ reconstructed sprites / animations / scenes / metadata`  
`→ useful export formats`

Retained research-validation pipeline where useful:

`qualified semantic IR → deterministic bounded serialization → Binary`

The second path exists to falsify or confirm interpretations; it does not imply every writer must become an end-user feature.

Desired future dependency graphs include relationships such as:

- Character → animations → frame records → descriptors → GRA resources → palette records → renderer path;
- Stage → layers/resources → animations → palettes → ordering/composition → scene representation;
- audio/music/speech resources and relationships where recovered.

The tool should preserve unknown bytes and unresolved structures rather than deleting or normalizing them away.

External reverse-engineering projects, including ReWolf/wcdatool-derived knowledge, may provide comparison context or hypotheses. **The authentic DOS binaries remain authoritative.**

---

# 3. Architectural and research discipline

Standing research cycle:

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION**

Hard rules carried throughout the project:

- fixture fact ≠ generic format rule;
- MK1 rule ≠ MK2/MK3 rule;
- repeated MK1 evidence may justify an MK1-supported mechanism, but not a family-wide abstraction;
- structural coincidence ≠ pointer;
- exact numeric equality ≠ address identity;
- address-like occurrence ≠ data flow;
- x86 operand shape ≠ semantic pointer;
- code-facing endpoint ≠ verified consumer;
- palette compatibility ≠ palette ownership;
- no reference ≠ palette-negative evidence;
- numeric `CALL`/`JMP` target region ≠ verified runtime destination semantics;
- visual descriptor placement ≠ collision/world/hitbox placement.

Conceptual software layers remain:

1. generic binary/format/forensic mechanics;
2. MK-DOS family layer only when cross-game evidence justifies it;
3. game-specific logic under `src/games/`;
4. research/verification layer;
5. UI as presentation/authoring surface, not binary-parser logic.

Unknown resources remain first-class data with provenance.

---

# 4. Available sources and evidence manifest

## 4.1 Current authoritative source snapshot

The current development source lineage is **Pass 1E.3O.19**. The source tree is rooted at `MK-DOS-1E3O19` and includes all prior O16/O17 export-structure work plus:

- `src/games/mk1/research/animationResourceDecodeCensus.ts` (O18);
- `src/games/mk1/research/characterAnimationTableSelector.ts` (O19);
- `scripts/run-animation-resource-decode-census.mjs`;
- `scripts/run-character-animation-table-selector.mjs`;
- O18 and O19 handoffs;
- normal research workflow extended to **28/28**;
- `src/appMetadata.ts` identifying Pass `1E.3O.19`.

O18/O19 are read-only. They do not broaden the binary writer surface. Their purpose is to turn the executable-side animation graph into an authentic resource-backed, character-organized export graph.

## 4.2 Canonical MK1 executable and complete installation fixture

The canonical MK1 executable is now available directly inside the user-supplied original installation archive, not merely by reverse reconstruction:

- archive: `mk1.zip`;
- archive SHA-256: `27123ee97d8d8a63e0cfd2debd040409763ef1e017f93379fbf7d9bde70ee6cb`;
- archive entries: 329;
- regular files: 326;
- root: `mk1/`.

Canonical executable inside the archive:

- `mk1/MK1.EXE`;
- size: **1,157,222 bytes** (`0x0011A866`);
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.

The archive also supplies the original GRA, WAV, driver and other installation resources needed for export-focused research. It is now the preferred authentic MK1 resource fixture for read-only work. Writers must still fresh-read and verify canonical identity before modifying anything.

## 4.3 Top-level mounted artifacts

| File | Size | SHA-256 |
|---|---:|---|
| `Continue chat analysis.txt` | 473 B | `fe19d2dbf9a94eff18e7cdb054c2eb0c1b636a14c85b6e0d521d3f6c11295b91` |
| `inventory_mk1_2026-09-02T12-40-50-696Z.json` | 115.6 KB | `a3757652b77aafac90189e13bb46e04a5c8e807e0252ba1a0a0a1e6217afc488` |
| `inventory_mk2_2026-09-02T12-40-37-343Z.json` | 237.7 KB | `ac6c77ae911dac0e98067756de924baa1bbb6d6746dd07d51461c2e14bdfac2f` |
| `inventory_mk3_2026-09-02T12-40-20-198Z.json` | 33.1 KB | `cc20ce878fc44e8e0ac168461b7c5755f0aef5497eee2ee9033a058426089abf` |
| `mk1_heart_rip_growth_relocation_preflight_2026-09-29T16-06-16-269Z.json` | 94.7 KB | `81e6912d6906b579c6c88a85ed62ab81b4de19bd4699011953cd68fb2e6f06c5` |
| `_internal_canonical_MK1.EXE` | 1,157,222 B | `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14` |
| `MK-DOS-1E3O14-source.zip` | 2.2 MB | `e87b0dcc911464bbf65f1cce7c5452d501f7e70975a9e569aad550e3d307b9ed` |
| `mk-dos-archive (1).zip` | 205.8 KB | `abc71b92f22a8bc68843764c4fc4243b728542b3499b1d791d148cf00f4e0326` |
| `mk-dos-archive (10).zip` | 643.7 KB | `9c5fb5afa6272bd7731c65532bcc71d55dcbe66325834b3effa50752bc503971` |
| `mk-dos-archive (2).zip` | 265.7 KB | `86b883e82487ae6c22f83be4db85829055cf36a7e573fa13908905e08cc5842d` |
| `mk-dos-archive (3).zip` | 323.9 KB | `48302d32891fb1c7d198ab73083c2ce617b9b181f29e81291267ececd8c1d2d7` |
| `mk-dos-archive (4).zip` | 391.3 KB | `752769d949a40f5ee6ed1ff1bc4f2156b7dd685262ee3747ff8ba989fd91779a` |
| `mk-dos-archive (5).zip` | 420.0 KB | `dca5040c1e3f329a82705b4f693b6ec846d56a4b9f90e54f1942c49efa351f0c` |
| `mk-dos-archive (6).zip` | 478.7 KB | `1fd46d65237cc92c1091af20137f16a1b5d873b18f12181de4367ca5504e4903` |
| `mk-dos-archive (7).zip` | 496.8 KB | `407e93f185db0f80ee37ca32fa9a7f9713641b405a6bc6471713e9e019b1e28b` |
| `mk-dos-archive (8).zip` | 577.3 KB | `55b2e0226cc44f97c52c4256f4c36e47b96e862995d9af14432d735403a0c9a7` |
| `mk-dos-archive (9).zip` | 622.0 KB | `01b8ef5434e310777f5c1357fb9f402ce2660c2fa76609fac0613b069dd2d425` |
| `mk-dos-archive.zip` | 181.1 KB | `4b5054dad8caa9bca1f3d529012613582bc189f16823e46ffba7c45be22ad3f3` |
| `mk1_handle_table_2026-09-02T13-16-20-750Z.json` | 30.6 KB | `559eec742259af01f2c9519482ef784c313cfaaa4397c0ecc489356c9dab20c7` |
| `mk1_palette_compact_mk1_2026-09-03T12-52-48-434Z.json` | 27.6 MB | `9e3ca4ffe1ac609e8f68f034852ea738e24a461f44653766e9267ac65d529351` |
| `mk1_probe_JCATT_GRA_2026-09-02T12-55-53-245Z.json` | 7.5 KB | `571773fa34a2ff6e3935817d3f3e8a344d30182f05fff974431752a213c89f15` |
| `mk1_sprite_descriptors_GRAPHICS_JCATT_GRA_2026-09-02T13-46-25-784Z.json` | 1.9 KB | `8224205b34c5c9701fda934831a71e86748c52da6d0d170cd4b901ef692bed7e` |
| `mk1_sprite_descriptors_GRAPHICS_KANO_GRA_2026-09-02T13-54-27-411Z.json` | 1.9 KB | `810978671c106fd24ab3656e6f7a096bee6dd5a752d4c66ef9887bdd0d76d399` |
| `mk1_sprite_descriptors_GRAPHICS_KANO_GRA_2026-09-03T08-36-16-153Z.json` | 168.6 KB | `bee9d91af2f29f2d1a677b99788551583d376eddc9007939d7f4c8a80ef9107e` |
| `mk1_sprite_descriptors_GRAPHICS_KANO_GRA_2026-09-03T09-22-16-194Z.json` | 222.0 KB | `38af3f408b4198f89b47553c2124d05c2b70704aacd7aad0c0634e1a8a5e34a9` |
| `MK_DOS_Archive_HANDOFF_1E3O14_FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING.md` | 10.3 KB | `65239fb88f0e2efa69fce562f168e5f7d8888f446e779b40f147aede28797663` |
| `MK_DOS_Archive_HANDOFF_1E3O5_INTERACTIVE_CANVAS_PLACEMENT_EDITOR.md` | 8.7 KB | `abda4fadf73fedf96f441fc5c091619c52e8a6b4e129fb0f916d3ee7bc390335` |
| `MK_DOS_Archive_HANDOFF_2026-09-12_PAUSE(1).md` | 40.3 KB | `2b94e0c57cd6a40eb0699eaecb3bc08359fead397e007a45fe7cf6552ca3833b` |

The old `mk-dos-archive.zip`, `(1)` through `(10)` archives are historical development snapshots. **Do not infer chronology from the numeric suffix alone.** They are useful for recovering earlier implementation/documentation state and are not automatically authoritative over the current O15 source.

The extracted `/mnt/data/earlydocs/` tree contains historical `CURRENT.md`, `RESEARCH.md`, and metadata snapshots recovered from those older archives.

## 4.4 Historical handoffs available inside the current source lineage

- `MK_DOS_Archive_HANDOFF_1E3H_LOSSLESS_PALETTE_ROUND_TRIP.md`
- `MK_DOS_Archive_HANDOFF_1E3I_CONTROLLED_PALETTE_EDIT.md`
- `MK_DOS_Archive_HANDOFF_1E3J_KANO_COLOR_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3K_KANO_ALTERNATE_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3L_FIGHTER_PALETTE_OWNERSHIP.md`
- `MK_DOS_Archive_HANDOFF_1E3M_MAIN_ROSTER_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3N1_OPPONENT_ACCESS_HARNESS.md`
- `MK_DOS_Archive_HANDOFF_1E3N2_LADDER_GRAMMAR.md`
- `MK_DOS_Archive_HANDOFF_1E3N3_SHANG_PALETTE_QUALIFICATION.md`
- `MK_DOS_Archive_HANDOFF_1E3N4_SHANG_MORPH_SELECTION.md`
- `MK_DOS_Archive_HANDOFF_1E3N_UNRESOLVED_SLOT7.md`
- `MK_DOS_Archive_HANDOFF_1E3O10_RESHAPE_MULTI_FULL_CAPACITY_TERMINATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O11_CONTROLLED_FOURTH_PART_TOPOLOGY_WRITE.md`
- `MK_DOS_Archive_HANDOFF_1E3O11_CONTROLLED_FOURTH_PART_TOPOLOGY_WRITE_RUNTIME_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_1E3O12_FIXED_CAPACITY_HEART_RIP_TOPOLOGY_AUTHORING.md`
- `MK_DOS_Archive_HANDOFF_1E3O12_FIXED_CAPACITY_HEART_RIP_TOPOLOGY_AUTHORING_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_1E3O13_ATOMIC_HEART_RIP_COMPOSITION_AUTHORING.md`
- `MK_DOS_Archive_HANDOFF_1E3O14_FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING.md`
- `MK_DOS_Archive_HANDOFF_1E3O15_HEART_RIP_TRUE_GROWTH_RELOCATION_PREFLIGHT_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_1E3O16_KANO_ANIMATION_EXPORTABILITY_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O17_MK1_ANITAB_STRUCTURAL_COMPARISON.md`
- `MK_DOS_Archive_HANDOFF_1E3O18_ANIMATION_RESOURCE_DECODE_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O19_CHARACTER_ANIMATION_TABLE_SELECTOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O1_ANIMATION_STREAM_FRAME_COMPOSITION.md`
- `MK_DOS_Archive_HANDOFF_1E3O2_MULTI_PART_FRAME_LOSSLESS_IR.md`
- `MK_DOS_Archive_HANDOFF_1E3O3_CONTROLLED_MULTI_PART_XY_EDIT.md`
- `MK_DOS_Archive_HANDOFF_1E3O4_RAYDEN_LIGHTNING_PLACEMENT.md`
- `MK_DOS_Archive_HANDOFF_1E3O5_INTERACTIVE_CANVAS_PLACEMENT_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O7_INTERACTIVE_MULTI_PART_COMPOSITION_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O8_FULL_HEART_RIP_FIXED_LAYOUT_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O8_FULL_HEART_RIP_FIXED_LAYOUT_EDITOR_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_1E3O9_HEART_RIP_STRUCTURAL_GROWTH_RELOCATION_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O9_HEART_RIP_STRUCTURAL_GROWTH_RELOCATION_CENSUS_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_2026-09-24_1E3D1_VERIFIED_PALETTE_GROUND_TRUTH.md`
- `MK_DOS_Archive_HANDOFF_2026-09-24_1E3F_IMPLEMENTED_SELECTION_SEMANTICS.md`
- `MK_DOS_Archive_HANDOFF_2026-09-24_1E3G_IMPLEMENTED_TRANSFER_PIPELINE.md`
- `docs/MK_DOS_Archive_HANDOFF_2026-09-24_1E3D1_VERIFIED_PALETTE_GROUND_TRUTH.md`
- `docs/MK_DOS_Archive_HANDOFF_2026-09-24_1E3F_IMPLEMENTED_SELECTION_SEMANTICS.md`
- `docs/MK_DOS_Archive_HANDOFF_2026-09-24_1E3G_IMPLEMENTED_TRANSFER_PIPELINE.md`

Several passes have both implementation-era and later `..._VERIFIED.md` closeout documents. Prefer the closeout when the evidence was independently reconciled, while retaining the earlier file as implementation history.

## 4.5 Additional project/library handoffs previously surfaced

The wider Project file surface has previously exposed additional handoff/checkpoint files not necessarily present in the mounted O14 ZIP, including:

- `MK_DOS_Archive_HANDOFF_2026-09-05_PAUSE(1).md`
- `MK_DOS_Archive_HANDOFF_2026-09-16_NEXT_VALIDATION_STEPS.md`
- `MK_DOS_Archive_HANDOFF_2026-09-20_B10D_DIRECTION_AND_RECOMPILER_GOAL.md`
- later D/F/G/O handoffs and closeout copies also exist in the Project file surface.

If a future question depends on exact wording or an artifact absent from the current source ZIP, search the Project files rather than guessing.

## 4.6 Key current MK1 research modules

The extracted source contains the following MK1 TypeScript modules; these names are useful entry points for a new coding agent:

- `detection.ts`
- `graphics/ugraDecoder.ts`
- `research/animationStreamGroundTruth.ts`
- `research/authoritativeKano.ts`
- `research/executableLayoutProbe.ts`
- `research/executableLayoutTypes.ts`
- `research/executableRegionTopology.ts`
- `research/fighterPaletteOwnership.ts`
- `research/fileEntryProbe.ts`
- `research/handleTableProbe.ts`
- `research/handleTableTypes.ts`
- `research/heartRipAnimationCanvasEditor.ts`
- `research/heartRipAtomicCompositionEditor.ts`
- `research/heartRipFixedCapacityTopologyEditor.ts`
- `research/heartRipFourthPartTopologyWriter.ts`
- `research/heartRipFullFixedLayoutCompositionEditor.ts`
- `research/heartRipRelocationCensus.ts`
- `research/kanoPaletteSelectionReferenceGraph.ts`
- `research/kanoPaletteSelectionReferenceGraphTypes.ts`
- `research/kanoPaletteSelectionSemantics.ts`
- `research/kanoPaletteSelectionSemanticsTypes.ts`
- `research/multiPartCompositionCanvasEditor.ts`
- `research/multiPartControlledEdit.ts`
- `research/multiPartFrameLosslessIr.ts`
- `research/opponentAccessHarness.ts`
- `research/paletteCandidateEvidenceFusion.ts`
- `research/paletteCandidateEvidenceFusionFilter.ts`
- `research/paletteCandidateEvidenceFusionTypes.ts`
- `research/paletteControlledEdit.ts`
- `research/paletteConvergentDecoder.ts`
- `research/paletteConvergentEntryReconnaissance.ts`
- `research/paletteConvergentEntryReconnaissanceTypes.ts`
- `research/paletteCycleLayout.ts`
- `research/paletteCycleLayoutTypes.ts`
- `research/paletteEditCodec.ts`
- `research/paletteEntryColors.ts`
- `research/paletteEntryEdit.ts`
- `research/paletteOccurrenceContext.ts`
- `research/paletteOccurrenceContextTypes.ts`
- `research/paletteOperandCallBoundary.ts`
- `research/paletteOperandSummaries.ts`
- `research/paletteOperandUseReconnaissance.ts`
- `research/paletteOperandUseReconnaissanceTypes.ts`
- `research/palettePhaseHarmonic.ts`
- `research/palettePhaseHarmonicTypes.ts`
- `research/paletteProbe.ts`
- `research/paletteReferenceChainReconnaissance.ts`
- `research/paletteReferenceChainReconnaissanceTypes.ts`
- `research/paletteReferenceReconnaissance.ts`
- `research/paletteReferenceReconnaissanceTypes.ts`
- `research/paletteRegionCorrelation.ts`
- `research/paletteRegionCorrelationTypes.ts`
- `research/paletteRepeatedStructure.ts`
- `research/paletteRepeatedStructureTypes.ts`
- `research/paletteRoundTrip.ts`
- `research/paletteRoundTripCodec.ts`
- `research/paletteSeedFixupQualification.ts`
- `research/paletteSeedFixupQualificationTypes.ts`
- `research/paletteSegmentQualification.ts`
- `research/paletteSegmentQualificationTypes.ts`
- `research/paletteSetupTransferSemantics.ts`
- `research/paletteSetupTransferSemanticsTypes.ts`
- `research/paletteTargetEntryReconnaissance.ts`
- `research/paletteTargetEntryReconnaissanceTypes.ts`
- `research/paletteTypes.ts`
- `research/raydenLightningCanvasEditor.ts`
- `research/raydenLightningPlacementFixture.ts`
- `research/reshapeMultiFullCapacitySemantics.ts`
- `research/shangMorphSelection.ts`
- `research/singlePlayerLadderGrammar.ts`
- `research/spriteDescriptorProbe.ts`
- `research/spriteDescriptorTypes.ts`
- `research/watcomAddressModelInventory.ts`
- `research/watcomDataImagePaletteGroundTruth.ts`
- `research/watcomDataImagePaletteGroundTruthTypes.ts`
- `research/watcomDebugContainerDiscovery.ts`
- `research/watcomPermanentClassInventory.ts`

## 4.7 Evidence management warning

`README.md`, `CURRENT.md`, and `RESEARCH.md` accumulated chronologically and contain stale headings/status text alongside later appended closeouts. They are valuable research logs, but not a single clean authority layer.

When status conflicts occur, use the evidence hierarchy in Section 1.4.

---

# 5. Full project history and milestone progression

## 5.1 Milestone 0 — directory-first forensic foundation

The project began by selecting a user-owned DOS game directory in the browser, recursively inventorying files, preserving unknown resources, identifying executable/resource signatures, and detecting MK1/MK2/MK3 installations from evidence clusters rather than hardcoded directory names alone.

Early passes established:

- recursive file inventory;
- executable signature inspection;
- provisional game detection;
- JSON inventory export;
- later high-confidence MK1/MK2/MK3 detection;
- broader executable type handling;
- Miles driver recognition.

The surviving inventories for all three games are still available as top-level JSON artifacts.

## 5.2 Milestone 1A/1B — MK1 executable ↔ GRA handle-table relationship

Research then focused on MK1. A `FileEntry`-style structure in `MK1.EXE` was correlated with resource names and GRA files. This led to recovery of the full graphics handle table.

Verified MK1 fixture facts:

- handle table start: `0x000B0C5C`;
- end: `0x000B11CC` exclusive;
- **58** entries;
- **24-byte** stride;
- string/data base: `0x0008CA54`;
- File ID 4 → `GRAPHICS/JCATT.GRA`;
- File ID 35 → `GRAPHICS/KANO.GRA`.

This was an early example of the project's standing rule: File ID 35 is a Kano fixture fact, not a universal schema rule.

## 5.3 Milestone 1C/1C.1 — sprite descriptors and target resolution

Two descriptor layouts were established:

`WITH_XY` — 12 bytes:

`[u16 width][u16 height][i16 x][i16 y][u32 packed]`

`NO_XY` — 8 bytes:

`[u16 width][u16 height][u32 packed]`

The packed resource reference was established as:

- high 8 bits = File ID;
- low 24 bits = byte offset into the target `.GRA`.

A target-resolution bug in the scanner was identified and corrected in 1C.1. The corrected scanner became defensive rather than treating every plausible-looking packed value as an authoritative descriptor.

The authoritative Kano descriptor run ultimately established **187 successful WITH_XY descriptors**, beginning at `0xA7464`, with the last run beginning at `0xA7D20`, using source indices 1..23.

## 5.4 Milestone 1D/1D.1 — uGRA decode

The project recovered indexed sprite reconstruction sufficiently to decode and preview MK1 GRA sprite payloads. Decoded preview payloads were retained so later palette and animation research could work from authentic sprite evidence.

Important boundary that still remains today: **decoding is established; general uGRA pixel encoding/import of new art is not yet established.**

## 5.5 Milestone 1E.1/1E.1a — palette catalogue and data-quality correction

A broad executable palette-shape scan was built as reconnaissance. Baseline counts included:

- raw candidates: **110,605**;
- valid: **40,146**;
- structural: **29,516**;
- research shortlist: **1,541**;
- unique: **22,315**;
- duplicates: **7,201**.

This catalogue was useful but deliberately heuristic. Candidate `0x9C914`, for example, looked visually Kano-like but was bright-blue/wrong in relation and had no external reference evidence in the later B.1 pass. The correct conclusion was **reference-negative only**, not “not a palette”.

The palette catalogue was later superseded as palette ground truth by Watcom symbol/module evidence, but remains useful historical reconnaissance.

## 5.6 Milestone 1E.2A family — embedded LE topology

The embedded Linear Executable was mapped:

- LE header: `0x292E4`;
- CPU: 80386;
- 2 objects.

Object 1:

- R-X;
- base `0x10000`;
- virtual size `0x3B2D5`.

Object 2:

- RW-;
- base `0x50000`;
- virtual size `0x5D140`.

The highest file-backed LE end was established at `0xABBFF`. The tail from there to EOF is **453,735 bytes**, roughly **39.21%** of the executable. Its semantic purpose was initially unknown.

The graphics handle table lies in that tail.

A major later correction is critical: **Watcom static-data file-image coordinates are not interchangeable with direct LE Object-2 page-map coordinates.** That distinction became decisive in 1E.3D.1.

## 5.7 Milestone 1E.2B.1–B.8 — palette-reference archaeology

The project spent a substantial research era determining what could and could not be inferred from candidate palette references in the executable.

### B.1 exact 32-bit occurrence reconnaissance

For the 1,541 research targets:

- 136 had external hits;
- 1,405 had no external hit;
- 530 logical matches;
- 522 unique physical positions.

The negative result was important: absence of references was never allowed to become “palette-negative” evidence.

### B.2 operand-shape reconnaissance

A narrow x86 whitelist found, in Object 1:

- 13 positive operand-shaped occurrences;
- 6 negative relative-control cases;
- 98 unmatched cases.

Operand shape was treated as syntax/evidence, not semantic proof.

### B.3 repeated structure

Repeated contexts/motifs were recovered, including a strong motif around `0x324C0`, without prematurely assigning ownership semantics.

### B.4 cycle-layout reconnaissance

Candidate cycle/internal structures were compared. The first run was not closable because provenance and contract details were insufficient; later corrective passes repaired the methodology.

### B.5 phase/harmonic work

The analysis produced **2,602 phase cells** and **60 harmonic relationships**. A key methodological correction was that `phaseAlignedAgreementPercentage` is invariant across divisors for a fixed cycle population; it therefore could not be used as a discriminator in the way initially hoped.

### B.6 evidence fusion

Multiple evidence classes were fused across all 1,541 candidates without promoting unsupported semantics.

### B.7 reference-chain reconnaissance

Two-hop relationships and negative precedence anchors were explored. The pass improved reference topology understanding without proving palette ownership.

### B.8 bounded operand-use reconnaissance

Straight-line bounded use and CALL-boundary topology were studied. By the 2026-09-12 authoritative pause handoff, B.1–B.8 were independently closed. The important result was not a palette owner; it was a much sharper understanding of what the code evidence did **not** justify.

## 5.8 B.9/B.10 — target-entry qualification and segment-base problem

The next era focused on a strongest code-facing endpoint rather than another broad scan.

Key B.9 observation:

- target candidate around `0x2C410`;
- incoming `EAX = 0x2012`;
- target `0x400C8`;
- path includes `MOV EBX,0xFFFF` then a jump to numeric `0x53D33`;
- EAX remained preserved/unread at the bounded boundary.

B.10 compared another path:

- candidate around `0x2C3FE`;
- `EAX = 0x2000`;
- direct CALL to the same numeric `0x53D33` region.

The EAX delta was `0x12`, exactly matching the physical-distance delta between candidate payloads. This was strong affine evidence, but the project correctly refused to call it a palette pointer.

A simple loaded-linear interpretation placed a target in Object 2 around physical `0x6A133`, but runtime destination semantics were not proven.

Subsequent B10b/c/d work examined candidate-start blocks, LE fixups, generic LE chaining, and segment-base relationships. By the later strategy pivot, the unresolved relationship had been distilled to:

`effective linear address = DS.base + EAX`

with EAX values such as `0x2000/0x2012`, and a `+0x10000` relationship reproducing candidate payload coordinates. The actual runtime DS base remained unresolved within that investigation.

By the September 20–22 strategic direction, B10 was considered sufficiently closed for the project's purpose. The instruction became: **stop micro-disassembly when it ceases to advance compiler capability.**

## 5.9 1E.3A–1E.3D.1 — Watcom debug discovery and palette ground truth

This was the biggest strategic breakthrough in the palette research.

External references suggested the executable retained Watcom debug/symbol information. The project deliberately avoided searching directly for expected symbol names. Instead it implemented **blind generic Watcom discovery and enumeration first**, then compared discovered names afterward.

Recovered Watcom debug container facts included:

- master header around `0x11A858`;
- signature `0x8386`;
- debug size **296,467** bytes;
- container span roughly `0xD2253..EOF`;
- 2 source languages;
- 2 segment entries;
- 192 modules;
- **3,915 global symbols**.

Blind enumeration surfaced symbols such as:

- `_handleTable`;
- `IRQSKYE`;
- `TRANSFER_PALETTES`;
- `WrtNonZero`;
- `TupleTable`;
- `KANO_P`;
- `KANO3_P`;
- `KANO_ANITAB`;
- many more.

Watcom Segment 1 was structurally related to LE Object 1, and Segment 2 to Object 2, but the runtime/file-coordinate semantics still required qualification.

### Rejected first 1E.3D implementation

The first attempt was rejected even though parts of it appeared to execute authentically. It conflated Watcom static-data file-image coordinates with direct LE Object-2 page mapping and used assumptions that were too fuzzy. An outdated UI palette shape also produced a crash in that era.

This failure is important: **authentic execution does not rescue a wrong coordinate model.**

### Corrected 1E.3D.1

The correct static-data file-image base was derived independently:

`physical handle table start 0xB0C5C - _handleTable Watcom map offset 0x24208 = 0x8CA54`

This exactly matched the independently reconstructed string/data base.

For qualified Watcom Segment-2 static data:

`physical file offset = 0x8CA54 + Watcom segment-2 map offset`

This formula, not direct LE Object-2 page mapping, became the authoritative file-image translation for this class of data.

`NEWPALS.ASM` was then identified as a complete palette module:

- Watcom span approximately `0xF3A4..0x10914`;
- **5,488 bytes**;
- 173 DATA symbols;
- **123 unique offsets**;
- **123/123** offsets parsed as palette records;
- gapless/overlap-free exact tiling of the module.

Qualified records included:

- `KANO_P` at Watcom offset `0x101A6`, physical `0x9CBFA`, length 23;
- `KANO3_P` immediately after at physical `0x9CC2A`, length 23.

The observed authoritative Kano sprite indices 1..23 fit `KANO_P` **only under a one-based palette model**. This established a bounded one-based relationship for the qualified Kano evidence without yet universalizing it.

This pass superseded heuristic palette ranking as palette ground truth.

## 5.10 1E.3E/1E.3F/1E.3G — palette selection and transfer pipeline

The project mechanically recovered corresponding palette tables:

- `NORMAL_PALETTES`;
- `ALTERNATE_PALETTES`.

A bounded same-character/equality selector path was recovered around player/character state. The careful interpretation is an **edge-triggered equality palette latch / alternate-palette selection mechanism**, not a generic “mirror-match system” claim.

The downstream routes converge through:

`MULTI_SWPAL → GETPAL → PALSET`

The transfer pipeline work recovered:

- `PALSET` transfer ring;
- `GETPAL` / `PALRAM` allocator behavior;
- `TRANSFER_PALETTES` hardware path;
- VGA DAC ports `0x3C8` / `0x3C9`;
- 15-bit source color to 6-bit DAC arithmetic;
- `IRQSKYE` involvement including palette/index 0 behavior;
- `TupleTable` / renderer palette-shift bridge including `WrtNonZero` relationships.

This pipeline independently corroborated the one-based sprite index behavior in the relevant rendering path.

## 5.11 1E.3H — lossless palette semantic IR and round trip

This was the first decisive compiler milestone.

All **123 NEWPALS records** were parsed into semantic IR and re-encoded:

- module bytes: **5,488**;
- semantic records: 123;
- no-edit module mismatch: zero;
- no-edit whole-EXE mismatch: zero;
- rebuilt whole-EXE SHA-256 exactly canonical.

The pass added strong provenance checks and deliberately failed closed when source hashes, record coordinates, or evidence fields were altered.

This established that the project could reconstruct a meaningful executable-resident semantic module byte-identically.

## 5.12 1E.3I/1E.3J/1E.3K — controlled palette editing and Kano color editors

### 1E.3I controlled edit

`KANO_P` was edited with a deliberately obvious all-magenta preset while preserving the other 122 palette records, including `KANO3_P`.

The writer:

- fresh-read canonical `MK1.EXE`;
- verified size/hash;
- changed only predicted bytes in the target record;
- reparsed the edited record;
- reversed the edit to the canonical SHA exactly.

Runtime testing established that changing the qualified normal Kano palette changes Kano in-game while unrelated fighter/stage/HUD rendering remains normal.

### 1E.3J individual normal-palette entry editor

The normal `KANO_P` editor was expanded to allow individual 23-color edits while retaining exact diff/reversal safeguards.

### Operational testing failure: wrong directory

During a later near-black/gray runtime test, the user initially continued to see magenta. Investigation suggested an export/source problem, but the actual cause was that the user was launching/testing **the wrong directory**. Once the correct patched bundle/directory was run, the edit worked.

This incident permanently established the need for:

- explicit source hash;
- edited hash;
- isolated runtime bundle;
- clear test-directory provenance/instructions;
- no assumption that a visual mismatch means the compiler is wrong.

### 1E.3K alternate `KANO3_P` editor

A separate alternate palette target was implemented rather than aliasing the normal editor. Runtime closeout later established the bounded `KANO3_P` path for the same-character alternate-palette case.

## 5.13 1E.3L/1E.3M — fighter palette ownership and main roster editor

The 9-slot normal/alternate palette table structure was mapped, with playable selectable slots 0..6 corresponding to:

- Cage;
- Kano;
- Rayden;
- Liu Kang;
- Scorpion;
- Sub-Zero;
- Sonya.

Runtime tests qualified multiple fighter palette ownership relationships and expanded the editor beyond Kano.

One especially useful boundary test was Rayden: editing his alternate body palette recolored his body while his lightning remained blue/white. This demonstrated that **fighter body palette ownership and effect palette ownership are separable**. Do not generalize all fighter effects from fighter-body palette ownership.

Slots 7 and 8 remained unresolved at this stage and led into the boss-access work.

## 5.14 1E.3N/N1/N2/N3/N4 — bosses, ladder grammar, and Shang morph selection

### N1 opponent-access harness

The project modified the existing single-player ladder data rather than combat code to access normally constrained opponents.

Runtime qualification established:

- token 6 → Goro;
- token 7 → Shang Tsung.

A special green-ninja path was observed but intentionally deferred.

This pass also established Goro palette evidence (`GONGORO_P`) and the path toward slot-8 Shang palette qualification.

### Important stage-inference correction

The forced boss route appeared at Goro's Lair, but the user correctly pointed out that endurance/Goro/Shang progression already uses that stage. The project therefore **rejected the inference that the modified ladder token itself proved stage-selection linkage**.

### N2 ladder grammar

The ladder grammar was further qualified:

- `0xFF` / signed `-1` terminator;
- token 15 = Test Your Might;
- tokens `>= 0x10` participate in endurance-pair grammar;
- player-relative mapping table.

A Cage/token `0x12` endurance prediction for Sub-Zero/Sonya was later supported by runtime spot-checking.

### N3 Shang base palette

Slot 8 palette aliasing around `YANG_P` / `EMP_P` was qualified to establish Shang's base palette relationship.

### N4 Shang morph selection

Shang's morph path established two different palette phases:

- transition/morph-specific EMP assets/palettes selected through a command-6 callback path;
- after morph completes, generic fighter palette selection is used for the target fighter;
- unmorph restores ID 8 + Shang base palette.

A magenta Shang test corroborated this separation: base Shang became magenta, morphed fighters remained ordinary, and magenta returned on unmorph.

## 5.15 Strategic pivot — from extractor toward compiler

By roughly September 20 onward, the project direction became explicit:

- not a viewer;
- not a cheat/editor utility;
- not merely a reverse-engineering notebook;
- build a deterministic **recompiler**.

Every understood format should ideally gain:

1. decode/parse;
2. semantic IR;
3. no-edit byte-identical encode;
4. bounded edit path;
5. independent exact-diff validation;
6. runtime validation only when needed to answer a runtime-semantic question.

Automatic palette matching is considered a core product capability, not optional polish.

Stage reconstruction should ultimately become a scene/IR/compiler problem, not a spreadsheet of offsets.

## 5.15a 2026-09-29 product-direction clarification — export-first

The user clarified that the end product does **not** need to become a general-purpose EXE editor/importer. The primary value is correct extraction and reconstruction of assets from MK1, then eventually MK2/MK3. Earlier write-back work remains highly valuable because it produced localized proof of palette ownership, placement, topology, aliasing, and composition semantics, but those writers should be treated as **research instrumentation** unless an end-user write feature becomes independently valuable.

The practical consequence is:

- continue using no-edit round trips, exact-diff writers, and runtime edits when they are the strongest way to validate semantics;
- do not make arbitrary EXE relocation, art import, or binary expansion a required product milestone;
- prioritize broader MK1 understanding and useful exports: correctly palettized sprites, transparent PNGs, ordered animation frames, multi-part composites, animation metadata, scene/stage reconstruction, and resource relationships;
- preserve local proof boundaries: a verified Kano heart-rip grammar is not automatically the grammar for every Kano animation or every MK1 fighter;
- scale to MK2 and MK3 only after independent evidence, reusing tooling/methods rather than assumptions.

## 5.16 1E.3O.1 — animation stream and frame composition ground truth

The project moved from palettes into animation/composition semantics, first using Shang morphing as a bounded interpreter fixture.

It mechanically qualified a bounded animation command grammar and composition path across eight morph streams and 24/24 controlled EMP.GRA sprites.

The pass intentionally did **not** promote the bounded morph grammar to a universal MK1 animation format.

## 5.17 1E.3O.2 — multi-part frame grammar and bounded lossless animation IR

Kano's heart-rip fatality became the first genuine multi-part fixture.

Recovered route:

`KANO_DEATH_BLOW → MSU_HEART → MA_KHEART`

Relevant setup included a four-object linked setup using `BIGBLD1` and `BLOOD_P`.

A multi-part frame example:

`heart_2 = [KHEART3A, KHEART3B, KHEART3C, 0]`

Nine KHEART descriptors were qualified, pointing to File ID 2 / `MISC.GRA`.

The project created bounded `mk1_animation_ir_v1` and a serializer covering **22 semantic regions**. The no-edit whole-EXE rebuild was byte-identical with canonical SHA restoration.

This was the first animation-level semantic compiler foothold.

## 5.18 1E.3O.3 — controlled multi-part X/Y edit

`KHEART3B.x` was changed by +31.

Static evidence was excellent:

- exactly two expected bytes changed;
- no unexpected binary changes;
- semantic reparse correct;
- reverse exact.

Runtime remained non-destructive, but the visual displacement was inconclusive because the part was small, short-lived, and overlapped. The lesson was methodological: **a technically correct fixture can still be a poor visual validation fixture.**

## 5.19 1E.3O.4 — Rayden lightning placement fixture

Rayden's persistent lightning was chosen as a better visual fixture.

Thirteen normal lightning descriptors were qualified:

- setup: `HANDBO22`;
- initial: `HANDBO4`, `5`, `8`, `9`;
- continuation: `HANDBO10..13`;
- persistent loop: `HANDBO14..17`.

They use File ID 36 / `RAIDEN.GRA` with `MORPH_P` in the qualified setup path.

A +24 Y displacement produced an obvious in-game movement. The user reported it **worked perfectly** while the lightning otherwise behaved normally.

This established descriptor-local X/Y as authoritative over the qualified displayed visual placement mechanism.

It did **not** establish collision/world/contact semantics.

## 5.20 1E.3O.5 — first author-facing interactive canvas editor

O5 promoted the qualified Rayden placement mechanism into a real interactive canvas editor.

Features included:

- decoded sprite on common canvas;
- original ghost/current sprite;
- drag placement;
- numeric entry/nudging/reset;
- grouped batch deltas;
- PNG export;
- compile/export;
- exact whole-EXE diff/hashing;
- isolated runtime test bundle.

No-edit round trip across all 13 descriptors remained exact.

A representative four-loop-descriptor edit of `+8 X / -6 Y` changed exactly eight expected bytes and reversed exactly.

The editor remained X/Y-only and deliberately blocked unsupported semantic operations.

## 5.21 O6 — separate visual placement from gameplay/contact semantics

O6 is not represented as a standalone handoff file in the current mounted source, but its context is carried into O7 and later history.

It investigated whether projectile/world/contact/impact positioning could be assigned to visual descriptors.

Important result:

- static checks and impact sprite qualification were possible;
- runtime markers could not be uniquely assigned to descriptor owners;
- no impact/hit-effect writer was justified.

This became a hard project boundary: **keep gameplay/hitbox/contact authoring outside the visual authoring path until independent evidence exists.**

## 5.22 1E.3O.7 — interactive multi-part composition placement editor

O7 added interactive placement for the three-part `heart_2` composition (`KHEART3A/B/C`) while keeping topology fixed.

The implementation used the O2 semantic IR writer and independent expected-diff/reversal checks.

The original handoff was cautious, but a later independent fixture closeout established O7 as **VERIFIED** under the project's accepted static-fixture criteria. A later literal report string may still say `STATIC_VALIDATION_PASSED_RUNTIME_PENDING`; the independent closeout supersedes that as the project classification.

## 5.23 1E.3O.8 — full heart-rip fixed-layout placement and alias semantics

O8 expanded fixed-layout placement across the heart-rip sequence:

- 8 sequence occurrences;
- 7 unique frame records;
- 9 qualified descriptors.

A crucial model distinction was made explicit:

**sequence occurrence ≠ frame-record storage ≠ descriptor storage**.

Example alias:

- `heart_4` / `KHEART5A` is reused at `PRIMARY:4` and `BEAT_LOOP:2`.

O8's controlled semantic edit, full-executable exact diff, semantic reparse, alias reporting, and exact reversal passed canonical-fixture validation. O8 is closed **VERIFIED** without requiring DOSBox solely for closure.

## 5.24 1E.3O.9 — structural growth / relocation census

The first interpretation was that adding a fourth part to `heart_2` might require 20 bytes because four pointers plus a zero terminator would exceed the existing 16-byte record and the next frame record followed immediately.

A storage census was performed. Zero runs were found, but every candidate remained classified as:

`UNQUALIFIED_ZERO_RUN_ONLY`

No zero-filled region was promoted to safe allocatable storage.

This remains valuable reconnaissance for any future true-growth/relocation pass.

## 5.25 1E.3O.10 — full-capacity linked-object termination eureka

Control flow in `RESHAPE_MULTI` changed the conclusion completely.

The four-object setup chain can terminate by **chain exhaustion** at full capacity. Therefore, a four-part frame does **not** require a fifth zero pointer.

Four pointers fit exactly in the existing 16-byte `heart_2` allocation.

This was a major compiler-enabling correction:

- O9's free-space caution remains valid;
- `heart_2` can reach four parts **without relocation**.

Final O10 verdict:

`FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE`

## 5.26 1E.3O.11 — controlled fourth-part topology write

O11 replaced the existing `heart_2` terminator with a qualified fourth descriptor pointer (`KHEART5B`) inside the existing allocation.

The exact binary change was bounded and reversible. Runtime closeout showed:

- Kano heart-rip fatality completed normally;
- expected visible heart-animation difference;
- no crash/corruption.

Final status: **RUNTIME VERIFIED**.

This is the first strong runtime proof that bounded frame topology, not only descriptor placement, can be authorable safely inside the qualified structure.

## 5.27 1E.3O.12 — fixed-capacity `heart_2` topology authoring

O12 generalized the qualified 16-byte record to 1..4 unique parts:

- 1 part: `[ptr,0,0,0]`;
- 2 parts: `[ptr,ptr,0,0]`;
- 3 parts: `[ptr,ptr,ptr,0]`;
- 4 parts: `[ptr,ptr,ptr,ptr]`, terminated by O10-qualified chain exhaustion.

A user interactive transaction from `[3A,3B,3C]` to `[3C,KHEART1]` passed:

- exact expected whole-EXE diff;
- semantic reparse;
- exact reversal.

O12 is closed **VERIFIED**.

## 5.28 1E.3O.13 — atomic `heart_2` topology + placement authoring

O13 combined topology and descriptor-local placement into one atomic semantic transaction.

The returned canonical user-directory model and authored edit passed:

- canonical provenance;
- no-edit round trip;
- exact topology + placement compile;
- **7/7 expected executable byte changes**;
- **0 unexpected changes**;
- exact semantic reparse;
- alias reporting;
- exact reversal to canonical SHA.

The authentic user request set `KHEART1 Y=-112`. This was retained rather than “corrected” to a more modest test, providing a stronger signed-int16 validation.

Final O13 verdict:

`HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_VERIFIED`

## 5.29 1E.3O.14 — full heart-rip fixed-layout composition authoring

O14 broadens O13 from only `heart_2` to **all seven unique qualified frame records** while preserving every existing allocation.

Qualified records:

| Frame | Watcom | Physical | Allocation | O14 topology policy |
|---|---:|---:|---:|---|
| `heart_0` | `0xB244` | `0x97C98` | 8 | exactly 1 qualified descriptor |
| `heart_1` | `0xB24C` | `0x97CA0` | 8 | exactly 1 qualified descriptor |
| `heart_2` | `0xB254` | `0x97CA8` | 16 | 1..4 unique qualified descriptors |
| `heart_3` | `0xB264` | `0x97CB8` | 8 | exactly 1 qualified descriptor |
| `heart_4` | `0xB26C` | `0x97CC0` | 8 | exactly 1 qualified descriptor |
| `heart_5` | `0xB274` | `0x97CC8` | 8 | exactly 1 qualified descriptor |
| `heart_6` | `0xB27C` | `0x97CD0` | 8 | exactly 1 qualified descriptor |

`heart_4` remains one shared record used by both `PRIMARY:4` and `BEAT_LOOP:2`.

Six 8-byte records remain `[descriptor pointer, 0]` and are not enlarged. `heart_2` retains its existing 16-byte capacity.

O14 also retains descriptor-local signed-int16 X/Y authoring for descriptors used somewhere in the authored animation and recalculates alias/usage relationships after topology changes.

### O14 compiler safety path

`executeHeartRipFullFixedLayoutCompositionEdit(...)` follows the project's strongest compiler pattern:

1. require successful O14 model;
2. require all seven frame records;
3. validate per-record topology constraints;
4. validate qualified descriptor membership and signed-int16 placements;
5. reject duplicates/no-ops/unsupported placement targets;
6. fresh-read canonical `MK1.EXE` and verify SHA-256;
7. clone semantic IR;
8. apply topology + placement semantically;
9. serialize all established O2 semantic regions;
10. deterministically replace the seven fixed allocations;
11. independently derive expected frame and X/Y byte changes;
12. full-EXE diff and exact-set equality;
13. semantic reparse of all requested records/coordinates;
14. reverse every actual changed byte;
15. require exact canonical SHA recovery.

### Direct canonical core validation

The O14 core was independently executed against the canonical fixture and authentic prior O8/O13 evidence.

Model result:

- status `SUCCESS`;
- verdict `FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_ESTABLISHED`;
- 9/9 validation checks;
- seven unique frame records;
- correct six-8-byte/one-16-byte allocation model;
- no-edit mismatch 0;
- rebuilt SHA exactly canonical;
- relocation disabled.

Representative direct transaction:

- `heart_0`: `KHEART1 → KHEART2`;
- `heart_1`: remains `KHEART2`;
- `heart_2`: `[KHEART3A,KHEART3B,KHEART3C] → [KHEART3C,KHEART1]`;
- other frame records unchanged;
- `KHEART2`: `(3,-10) → (8,-9)`.

Results:

- changed frame records: `heart_0`, `heart_2`;
- expected changed bytes: **8**;
- actual changed bytes: **8**;
- unexpected changes: **0**;
- full-EXE diff exact: true;
- seven frame reparses exact: true;
- placement reparse exact: true;
- alias correctly reports `KHEART2` shared by `heart_0` and `heart_1`;
- reversal exact: true.

Direct edited SHA-256:

`571b369e8ec8ec90de58b7bfb1c7630e5bc8ef11766d6c9afb3af14cf8c4efef`

Five representative invalid requests were correctly rejected: missing a frame, two-part request for an 8-byte record, duplicate `heart_2` descriptor, out-of-range placement, and complete semantic no-op.

### O14 final normal-app closeout — VERIFIED

The final user-authored normal-app transaction used untouched canonical `MK1.EXE` and requested:

- `heart_0`: `KHEART1 -> KHEART2`;
- `heart_2`: `[KHEART3A,KHEART3B,KHEART3C] -> [KHEART3C,KHEART1]`;
- `KHEART2`: `(3,-10) -> (8,-9)`;
- all other qualified frame records unchanged.

Returned evidence:

- expected changed bytes: **8**;
- actual changed bytes: **8**;
- unexpected changes: **0**;
- edited SHA-256: `571b369e8ec8ec90de58b7bfb1c7630e5bc8ef11766d6c9afb3af14cf8c4efef`;
- all seven frame reparses exact;
- placement reparse exact;
- aliasing correctly reports `KHEART2` shared by `PRIMARY:0` and `PRIMARY:1`;
- frame allocations unchanged;
- sequence pointers untouched;
- GRA/palette/gameplay data untouched;
- relocation unused;
- exact reversal restored canonical SHA-256.

The isolated ZIP was independently checked: integrity passed, embedded JSON matched the standalone export, the bundled executable hash matched the report, and reversing the eight actual bytes reconstructed canonical MK1 exactly.

Final O14 classification:

`FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_VERIFIED`

Layered status:

`CORE VERIFIED / NORMAL-APP AUTHORING VERIFIED / NEW RUNTIME TEST NOT REQUIRED`

## 5.30 1E.3O.15 — true-growth relocation preflight

O15 deliberately does not write. It chooses `heart_0` as the first genuine structural-growth fixture because a two-part record requires 12 bytes while the original allocation is 8 bytes and `heart_1` begins immediately afterward. Existing `MSU_HEART` capacity is four linked objects, so the proposed two-part count lies within the already-qualified object-count bound.

The bounded direct inbound surface is mechanically clean in developer validation:

- `heart_0` Watcom record offset: `0xB244`;
- qualified inbound sequence cell: `PRIMARY:0` at Watcom `0xB21C` / physical `0x97C70`;
- semantic inbound count: 1;
- raw whole-EXE little-endian dword occurrences: 1;
- unexplained raw occurrences: 0.

This establishes only the direct dword occurrence/rewrite surface; it does not exclude computed/derived runtime references.

Storage reconnaissance uses the correct 12-byte threshold and overlays Watcom Segment-2 address-info ownership. Developer validation found:

- file-backed Object-2 zero-run candidates >=12 bytes: **70**;
- module-owned: **70**;
- unassigned: **0**;
- fully contained by one module range: **70**;
- candidates in target owner `MKBLOOD.ASM`: **0**;
- safe candidates promoted: **0**.

`heart_0` itself lies in Watcom module `MKBLOOD.ASM`, module index 14, range `0xB070..0xB298`. Module-owned zeros remain unqualified because ownership does not establish padding/liveness safety; missing symbols or missing raw references also do not establish free space.

Expected O15 verdict:

`HEART0_DIRECT_DWORD_INBOUND_SURFACE_ESTABLISHED_STORAGE_ALLOCATION_NOT_ESTABLISHED`

Final status:

- implementation: complete;
- targeted core typecheck: passed;
- 24-stage integration syntax/transpile check: passed;
- smoke-script syntax: passed;
- byte-equivalent canonical developer execution: passed;
- normal-app user-directory export: **VERIFIED**;
- relocation writer: **NOT ESTABLISHED / BLOCKED**.

Returned user-directory report: `mk1_heart_rip_growth_relocation_preflight_2026-09-29T16-06-16-269Z.json` (SHA-256 `81e6912d6906b579c6c88a85ed62ab81b4de19bd4699011953cd68fb2e6f06c5`). It has canonical source provenance, all 12 validation checks pass, and verdict `HEART0_DIRECT_DWORD_INBOUND_SURFACE_ESTABLISHED_STORAGE_ALLOCATION_NOT_ESTABLISHED`.

Final O15 classification: **VERIFIED / READ-ONLY PREFLIGHT COMPLETE / RELOCATION WRITER NOT ESTABLISHED**.

## 5.31 1E.3O.16 — Kano animation exportability census

O16 returned to read-only export research and used `KANO_ANITAB` as the strongest previously grounded table fixture. The table is symbol-bounded from `0x13F6C` to `MSU_KANO` at `0x14100`, yielding 101 dword cells. The canonical animation dispatcher is independently rechecked before parsing.

Direct canonical result: all 101 cells are structurally classified; 84 are grammar-compatible stream cells reducing to 79 unique stream starts; 168 unique frame targets resolve to 156 zero-terminated descriptor vectors plus 12 direct descriptors; 163 unique descriptors are implicated across KANO/STANCE/MISC/FONTS/VICTORY resources. Multi-part repetition includes three two-part vectors and the known three-part heart frame.

Critical boundary: O14 proves an off-table heart `BEAT_LOOP`, so `KANO_ANITAB` is explicitly not promoted to the complete Kano animation universe. O16 establishes an export-planning foothold, not universal per-index runtime semantics.

Current classification: **DIRECT CANONICAL STRUCTURAL VALIDATION PASSED / NORMAL-APP USER-DIRECTORY EXPORT PENDING**.

## 5.32 1E.3O.17 — cross-table MK1 ANITAB structural comparison

O17 uses blind Watcom suffix selection and discovers eight Segment-2 DATA symbols ending in `_ANITAB`: `EMP_ANITAB`, `GORO_ANITAB`, `KANG_ANITAB`, `KANO_ANITAB`, `LIZ_ANITAB`, `NINJA_ANITAB`, `VANDAN_ANITAB`, and `RAIDEN_ANITAB`. Their next-symbol-bounded spans contain 41, 78, 103, 101, 105, 106, 101 and 104 dword cells respectively; therefore table length is not universal even within MK1.

Across all eight spans, direct canonical validation reports 739 cells, 564 grammar-compatible stream cells, 514 unique stream starts, 1,144 unique frame targets and 1,102 unique descriptors. Every frame event reached through a grammar-compatible stream resolves structurally to a WITH_XY descriptor or a zero-terminated descriptor-pointer vector. Five tables contain multi-part vectors, materially broadening composition evidence beyond Kano.

O17's first fail-closed run also exposed non-stream auxiliary values. EMP contains six small packed signed-int16 pairs; KANG contains three file-backed data-pointer-like values including one exact `MSU_KANG` reference. These are preserved as `PACKED_I16_PAIR_UNKNOWN` and `DATA_POINTER_LIKE_AUXILIARY_UNKNOWN` rather than coerced into animation semantics. After adding explicit unknown structural classes, all 739 cells are accounted for with zero generic unresolved cells; this does not mean all semantics are known.

Direct verdict: `MK1_ANITAB_STRUCTURAL_EXPORT_MECHANISM_REPEATED_ACROSS_DISCOVERED_TABLES`. The bounded repeated mechanism is now strong enough for export planning within MK1, but complete animation universes, auxiliary-value semantics, per-entry runtime consumers, and MK2/MK3 parity remain unestablished.

Current classification: **CORE STRUCTURAL MECHANISM STATICALLY VERIFIED ON CANONICAL BYTES / NORMAL-APP USER-DIRECTORY EXPORT PENDING**.


---


## 5.33 1E.3O.18 — authentic-resource animation decode census

O18 crossed the first major post-O17 resource boundary by using the user's complete untouched MK1 installation rather than inventories alone. All 12 GRA files referenced by the O17 graph are present and size-consistent. Every one of the **1,102 unique O17 descriptors** resolves into an authentic resource and decodes successfully; decode failures are zero. The established 58x104 Kano offset-0 checksum `09961980` reproduces exactly.

Across the graph, decoded opaque indices are strictly positive with union **1..23** and no opaque index above 23. This broadly corroborates the one-based opaque pixel-index domain, but does not prove palette ownership. O17's 25 multi-part frame records across GORO/KANG/KANO/LIZ/VANDAN all have pairwise-overlapping opaque bounds after descriptor-local signed X/Y placement, strongly corroborating visual composition coherence.

Machine verdict: `MK1_ANITAB_DESCRIPTOR_RESOURCE_DECODE_GRAPH_ESTABLISHED`.

The decisive remaining visual-export problem is palette context, not basic uGRA decoding.

## 5.34 1E.3O.19 — runtime character identity to ANITAB selector

O19 established the export-organizing runtime bridge hidden behind the module/table names. Canonical Watcom code symbol `GET_CHAR_ANI` at Segment-1 `0x9CA6` / physical `0x5A6FA` reads object character identity at `+0x48`, selects an ANITAB base through the nine-dword table at Segment-2 `0x9914`, uses `A9` (`0x24B54`) as the dword index into that selected table, and stores the selected payload back into A9.

The exact selector is:

- 0 CAGE -> `VANDAN_ANITAB`;
- 1 KANO -> `KANO_ANITAB`;
- 2 RAYDEN -> `RAIDEN_ANITAB`;
- 3 LIU KANG -> `KANG_ANITAB`;
- 4 SCORPION -> `NINJA_ANITAB`;
- 5 SUB-ZERO -> `NINJA_ANITAB`;
- 6 SONYA -> `LIZ_ANITAB`;
- 7 GORO -> `GORO_ANITAB`;
- 8 EMP -> `EMP_ANITAB`.

All eight O17 tables are reachable. IDs 4 and 5 explicitly share the same NINJA table. This mapping is executable evidence, not filename inference.

Machine verdict: `MK1_CHARACTER_ID_TO_ANITAB_SELECTOR_ESTABLISHED`.

O19 does not establish semantic names for every A9/table index and does not claim ANITABs are complete animation universes.

# 6. Canonical MK1 technical facts to preserve

## 6.1 Executable and major coordinate anchors

- `MK1.EXE` size: 1,157,222 bytes (`0x11A866`)
- canonical SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- embedded LE header: `0x292E4`
- code file-image base used in later authoring work: `0x00050A54`
- qualified Watcom/static-data file-image base: `0x0008CA54`
- graphics handle table: `0xB0C5C..0xB11CC`, 58 × 24 bytes

Do not mix these coordinate spaces casually. Every report should name whether an address is physical file offset, Watcom map offset, LE object-relative coordinate, loaded-linear candidate, GRA offset, descriptor pointer, or another domain.

## 6.2 Resource/file IDs used in established fixtures

- File ID 2 → `MISC.GRA` in the qualified KHEART fixture;
- File ID 4 → `GRAPHICS/JCATT.GRA`;
- File ID 35 → `GRAPHICS/KANO.GRA`;
- File ID 36 → `GRAPHICS/RAIDEN.GRA`.

These are fixture-established identities, not assumed cross-game constants.

## 6.3 Descriptor fields

`WITH_XY` 12-byte descriptor:

- `+0x00`: width `u16`;
- `+0x02`: height `u16`;
- `+0x04`: x `i16`;
- `+0x06`: y `i16`;
- `+0x08`: packed `u32` resource reference.

Current visual authoring writes only the qualified X/Y fields unless a pass independently qualifies more.

---

# 7. Compiler safety contract — standardize this across future authoring

The strongest established writer pattern should be treated as the default template for every new compiler-capable structure:

1. start from a verified semantic model;
2. validate the authoring request against explicit supported constraints;
3. fresh-read the untouched canonical source;
4. require exact canonical identity/hash where a canonical fixture is part of the contract;
5. clone the semantic IR rather than directly patching ad hoc bytes;
6. mutate only supported semantic fields;
7. regenerate bounded structures deterministically;
8. independently derive the exact set of allowed changed bytes;
9. diff the **entire** executable/resource;
10. reject any unexpected byte change;
11. semantically reparse the compiled output;
12. require exact equality with the requested semantics;
13. reverse the observed changes where practical;
14. require exact canonical SHA restoration;
15. package edited output separately; never overwrite the canonical source automatically.

For runtime bundles, include source hash, edited hash, edit report, and clear launch/test-directory instructions.

This contract is more important than any individual UI feature.

---

# 8. Current capability/status matrix

| Capability | Current status | Notes |
|---|---|---|
| MK1/MK2/MK3 installation detection | VERIFIED | inventory/detection foundation exists for all three |
| MK1 GRA handle table / file IDs | VERIFIED | 58-entry table and key fixture identities established |
| MK1 sprite descriptor layouts | VERIFIED | WITH_XY / NO_XY + packed FileID/offset |
| MK1 uGRA decode / preview | VERIFIED | decode established; encode/import not established |
| embedded LE topology | VERIFIED | coordinate-space caveats apply |
| Watcom debug container enumeration | VERIFIED | blind discovery, modules/symbols recovered |
| Watcom static-data file-image mapping | VERIFIED for qualified class | direct LE Object2 mapping is not interchangeable |
| NEWPALS palette module | VERIFIED | 123 records / 5,488 bytes exact tiling |
| KANO_P / KANO3_P identity | VERIFIED | adjacent 23-color records |
| observed Kano one-based palette indexing | VERIFIED bounded relationship | do not universalize without evidence |
| NORMAL/ALTERNATE palette tables | VERIFIED | 9-slot structure recovered |
| same-character alternate selection semantics | VERIFIED bounded mechanism | avoid overclaiming generic “mirror” semantics |
| PALSET/GETPAL/TRANSFER pipeline | VERIFIED/closed | VGA DAC path recovered |
| lossless NEWPALS round trip | VERIFIED | whole-EXE no-edit byte identity |
| normal Kano palette editing | RUNTIME VERIFIED | individual editing supported |
| alternate Kano palette editing | RUNTIME VERIFIED bounded path | same-character alternate fixture |
| main selectable roster palette ownership | materially qualified | multiple runtime cases; effect palettes can differ |
| Goro/Shang access | VERIFIED | via ladder harness, not combat-code hack |
| ladder grammar | VERIFIED bounded grammar | terminator, TYM, endurance/player-relative mapping |
| Shang base palette | VERIFIED bounded relationship | slot-8 alias qualification |
| Shang morph palette selection | VERIFIED | transition vs completed morph vs unmorph separation |
| bounded animation stream interpreter | VERIFIED fixture scope | Shang morph fixture; not universal MK1 grammar |
| bounded animation semantic IR | VERIFIED | heart-rip 22-region no-edit exact rebuild |
| descriptor-local visual X/Y authoring | RUNTIME VERIFIED mechanism | Rayden lightning strong fixture |
| Rayden canvas editor | STATICALLY VERIFIED authoring + inherited runtime mechanism | X/Y only |
| heart-rip multi-part placement | VERIFIED | alias-aware fixed-layout |
| `heart_2` fourth-part topology | RUNTIME VERIFIED | no relocation required |
| `heart_2` 1..4 topology authoring | VERIFIED | exact diff/reparse/reversal |
| atomic `heart_2` topology + placement | VERIFIED | O13 returned user-directory artifact |
| all-seven fixed-layout heart composition authoring | VERIFIED | O14 core + normal-app transaction exact |
| O14 normal-app authored transaction | VERIFIED | 8/8 expected bytes, 0 unexpected, exact reparse/reversal |
| O15 heart_0 direct-dword relocation preflight | VERIFIED | user-directory 24/24 export reproduced direct dword surface and 70/70 module-owned zero-run census; 0 safe |
| O16 Kano ANITAB exportability census | DIRECT CANONICAL STRUCTURAL VALIDATION PASSED | 101 cells; 79 unique streams; 168 frame targets; off-table substream boundary retained |
| O17 MK1 ANITAB repeated structural export mechanism | STATICALLY VERIFIED on canonical bytes | 8 tables; 739 cells; 514 unique stream starts; 1,144 frame targets; 1,102 descriptors; auxiliary unknowns preserved |
| broad MK1 animation image export | RESOURCE BYTES NEEDED | structural graph now broad; actual GRA payloads/palette application are next |
| general arbitrary frame growth/relocation | NOT ESTABLISHED | O9 zero runs are not qualified free space |
| uGRA pixel encoding/import | NOT ESTABLISHED | major future compiler lever |
| gameplay/collision/hitbox authoring | NOT ESTABLISHED | deliberately separated from visual placement |
| stage scene/compiler | NOT ESTABLISHED | strategic future priority |
| audio/music compiler | NOT ESTABLISHED | future |
| MK2/MK3 deep format parity | NOT ESTABLISHED | only detection/inventory foundation currently mature |
| shared MK-DOS compiler abstraction | NOT YET JUSTIFIED | wait for independent cross-game repetition |

---

# 9. Important failures, rejected interpretations, and lessons

These must stay visible so future agents do not repeat them.

## 9.1 Palette catalogue ≠ ownership

Large-scale palette-shape discovery and reference statistics did not prove ownership. That entire B.1–B.8 era is evidence for disciplined restraint, not a failed detour to erase.

## 9.2 Direct LE Object-2 mapping was wrong for qualified Watcom static data

The first D-era implementation conflated coordinate models. The corrected static-data base `0x8CA54` was independently derived and became the right model for the qualified Watcom Segment-2 file image.

## 9.3 External symbol names are clues, not proof by themselves

The successful path was blind Watcom discovery/enumeration first, then semantic comparison. Do not hardcode expected external names as a discovery method.

## 9.4 Visual fixture quality matters

The O3 heart-part displacement was statically exact but visually inconclusive. Rayden lightning was chosen because its persistent visual made the same mechanism obvious.

## 9.5 Wrong runtime directory can mimic compiler failure

A Kano palette test appeared stuck on magenta because the wrong installation/test directory was being launched. Compiler/export debugging should always first confirm the exact executed binary hash/path.

## 9.6 Boss-route stage appearance did not prove stage-selection semantics

The existing ladder naturally converged on Goro's Lair for that part of progression. The project rejected the stage-selection inference rather than retrofitting it to the evidence.

## 9.7 Zero bytes are not free storage

O9 explicitly classified zero runs as unqualified. Never use them for relocation merely because they look empty.

## 9.8 Four parts did not require relocation

The initial “four pointers + zero terminator = 20 bytes” assumption was overturned by control-flow analysis: full-capacity linked-object chain exhaustion terminates without a fifth zero pointer. O10 closed this.

## 9.9 Visual placement ≠ gameplay placement

O6 could not uniquely assign impact/contact writers from the available evidence. Keep collision/hitboxes/gameplay semantics out of the authoring path until they are independently qualified.

## 9.10 Documentation labels can be stale

The earlier O14 package carried a stale O13 `APP_MILESTONE` even though O14 code was present. That defect was corrected before O15. Earlier `CURRENT.md`/`RESEARCH.md` files also intentionally retain chronological pending-state text. Presentation prose must not outrank stronger machine evidence.

---

# 10. Current source/package reconciliation status

1. **Current source lineage** — O19 is the active source line and carries the O18/O19 read-only modules plus the full prior compiler/research history.
2. **Authentic complete installation now available** — `mk1.zip` is directly available and contains canonical `MK1.EXE` plus original resource files. This supersedes the earlier operational assumption that GRA payload access was pending.
3. **O18 direct authentic-install evidence** — 1,102/1,102 O17 descriptors decode successfully from real GRA files. Core result is statically verified; a separate user normal-app export is not necessary to establish the byte/resource claim.
4. **O19 selector evidence** — canonical GET_CHAR_ANI bytes and the nine-entry selector establish character -> ANITAB organization. Core result is statically verified.
5. **Normal-app integration** — O18/O19 are wired into the 28/28 research flow. A full dependency-backed UI typecheck is not claimed in this container because the source snapshot lacks installed node dependencies; crude declaration shims are insufficient for the full component tree. Core targeted TypeScript and script syntax checks passed.
6. **Writer scope unchanged** — O18/O19 do not enable new writes. Relocation remains parked after O15.

---

# 11. Current epistemic boundary

The project now establishes a broad MK1 executable-to-resource animation graph:

`runtime character identity -> ANITAB -> stream -> frame target -> descriptor/vector -> GRA payload -> indexed pixels`.

That graph is strongly resource-backed, but it is not yet a complete semantic animation/export system.

Still unestablished or intentionally blocked:

- correct palette binding for every animation/effect/object context;
- semantic gameplay names for every ANITAB/A9 index;
- proof that ANITABs are complete animation universes;
- all off-table substream relationships;
- complete timing/event semantics for every stream;
- generic stage/background scene reconstruction;
- complete audio/music relationship mapping;
- generic uGRA pixel encoding/import;
- arbitrary EXE allocation/relocation;
- gameplay/collision/hit semantics from visual descriptors;
- full MK2/MK3 resource-format parity;
- shared MK-DOS abstractions not independently repeated across games.

Known palette-context counterexamples must remain prominent: `RAIDEN.GRA` contains both body sprites and the qualified lightning effect, yet the lightning path uses `MORPH_P`; the Kano heart uses `MISC.GRA` with `BLOOD_P`. **One GRA file != one palette owner.**

---

# 12. Recommended immediate continuation

## 12.1 Current authoritative checkpoint

Treat the project as:

**O14 VERIFIED; O15 VERIFIED and relocation parked; O16/O17 establish broad MK1 animation-table structure; O18 establishes authentic GRA backing and decode for all 1,102 reached descriptors; O19 establishes runtime character-ID -> ANITAB selection. The next product-critical correctness boundary is palette context and semantic export labeling, not basic sprite decoding or EXE write-back.**

## 12.2 Immediate task — palette-context binding for export

Design the next pass as read-only. It should determine how much of the O19-organized animation graph can be assigned a palette from mechanically supported setup/object/selection evidence.

Required discipline:

1. begin with already-qualified palette ownership/selection paths rather than resource filenames;
2. distinguish body palette contexts from effect/special palettes;
3. preserve unresolved contexts explicitly;
4. classify export confidence per animation/frame/descriptor rather than forcing one palette per GRA;
5. use known fixtures as anchors: normal/alternate roster body palettes, Rayden lightning/MORPH_P, Kano heart/BLOOD_P, Shang morph transition vs completed fighter palette;
6. generate correct-color PNGs only for contexts whose palette binding is supported;
7. keep transparent indexed/raw exports available even when color ownership is unresolved.

## 12.3 Parallel/next semantic task — ANITAB index meaning

`GET_CHAR_ANI` establishes that A9 indexes the selected ANITAB, but not the semantic name of every index. A broad raw scan of A9 writes is only reconnaissance. Future labeling should attribute writes/callers to bounded code/symbol contexts and promote names only when independently supported.

This task is useful for organizing exported animations but should not delay palette-safe sprite/frame export where labels are unknown.

## 12.4 Longer export-first roadmap

1. palette-safe character/effect frame exports;
2. composed multi-part frame export with metadata;
3. animation stream export with timing/control metadata where qualified;
4. stage/background reconstruction;
5. audio/music relationship mapping;
6. independent MK2 investigation using the same research discipline, not MK1 assumptions;
7. independent MK3 investigation after mechanisms are understood well enough to compare.

Do not make arbitrary relocation, gameplay hitboxes, or import-back-to-game capability part of the critical path unless a concrete extraction question requires them.

## 12.5 Exact pass design standard for future work

Every proposed new pass should state:

- the exact semantic/export question;
- authentic fixture(s);
- coordinate/resource domains involved;
- success and falsification conditions;
- explicit non-claims;
- whether runtime evidence is actually necessary;
- expected artifacts and handover trigger.

---

# 13. Do-not-regress checklist for the next agent

- Do not overwrite canonical source binaries.
- Do not use edited test binaries as new authoring sources.
- Do not trust archive suffix numbers as versions.
- Do not trust a UI milestone banner as source truth.
- Do not call zero-filled bytes free storage.
- Do not equate Watcom static-data map offsets with LE Object-2 page-map coordinates.
- Do not generalize Kano-specific evidence to all MK1 without repetition.
- Do not generalize MK1 evidence to MK2/MK3 without independent validation.
- Do not infer palette ownership merely from visual compatibility, GRA filename, descriptor proximity, or index range.
- Do not infer collision/gameplay placement from sprite X/Y placement.
- Do not split shared frame/descriptor aliases silently.
- Do not call an ANITAB the complete animation universe; known off-table substreams exist.
- Do not assign semantic names to A9/ANITAB indices from raw immediate values alone.
- Do not treat successful indexed-pixel decode as correct-color export proof.
- Do not discard unknown bytes/resources/auxiliary table values.
- Do not broaden writer capability merely because the product can parse a structure.

---

# 14. Practical agent takeover checklist

1. Read this master handover completely.
2. Inspect the current O19 source snapshot and O18/O19 handoffs before adding export logic.
3. Use the user-supplied `mk1.zip` as the authentic MK1 resource fixture; confirm its archive hash and embedded canonical EXE hash when re-materialized.
4. Read O17 before changing animation graph logic; its unknown auxiliary classes and table-boundary cautions remain active.
5. Read D1/F/G/H/I/K/L/M/N handoffs before changing palette-context logic.
6. Preserve O18's 1,102/1,102 decode result as resource/decode evidence, not palette evidence.
7. Preserve O19's selector mapping as character organization, not per-index semantic labeling.
8. Do not reopen O15 relocation unless an extraction need genuinely depends on it.
9. Refresh the full handover after any material validation/failure that changes continuation state.

---

# 15. Handover trigger policy from this point onward

A future full handover is warranted when, for example:

- palette-context binding materially expands safe correct-color export coverage;
- ANITAB index semantics are materially qualified;
- stage/background reconstruction reaches a useful checkpoint;
- audio/music relationship recovery materially changes export scope;
- MK2 or MK3 independently validates/rejects an MK1 mechanism;
- a major runtime result changes an established semantic boundary;
- the project pauses or changes agents after substantial new work.

A future handover must regenerate the complete project history/current state, not only list deltas.

---

# 16. One-paragraph restart summary

MK DOS Archive is an export-first forensic reconstruction project for DOS MK1/MK2/MK3, with MK1 far ahead. Earlier work established resource handles, descriptor layouts, uGRA decoding, LE/Watcom coordinate models, complete NEWPALS palette ground truth, palette selection/transfer behavior, roster/boss/ladder/morph relationships, runtime-grounded visual placement and bounded multi-part composition. O14 closed full fixed-layout Kano heart-rip authoring; O15 showed true-growth relocation is blocked by unqualified storage and was parked. O16/O17 mapped a broad MK1 animation-table graph across eight ANITAB families: 1,144 unique frame targets and 1,102 unique descriptors. The user then supplied a complete original MK1 installation. O18 resolved and decoded all 1,102 descriptors from 12 authentic GRA resources with zero failures, reproduced the established Kano checksum, observed opaque indices 1..23, and corroborated all 25 multi-part candidates spatially. O19 mechanically established `GET_CHAR_ANI` and the nine-slot runtime character-ID selector mapping CAGE/KANO/RAYDEN/LIU KANG/SCORPION/SUB-ZERO/SONYA/GORO/EMP to VANDAN/KANO/RAIDEN/KANG/NINJA/NINJA/LIZ/GORO/EMP ANITABs. The next critical problem is palette-context binding: correct indexed pixels are broadly available, but one-resource-one-palette is false. Preserve unresolved palette contexts, then build safe colored/composed animation exports before stage/audio work and eventual independent MK2/MK3 investigation.

---

# Appendix A — Current source handoff inventory

- `MK_DOS_Archive_HANDOFF_1E3H_LOSSLESS_PALETTE_ROUND_TRIP.md`
- `MK_DOS_Archive_HANDOFF_1E3I_CONTROLLED_PALETTE_EDIT.md`
- `MK_DOS_Archive_HANDOFF_1E3J_KANO_COLOR_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3K_KANO_ALTERNATE_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3L_FIGHTER_PALETTE_OWNERSHIP.md`
- `MK_DOS_Archive_HANDOFF_1E3M_MAIN_ROSTER_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3N1_OPPONENT_ACCESS_HARNESS.md`
- `MK_DOS_Archive_HANDOFF_1E3N2_LADDER_GRAMMAR.md`
- `MK_DOS_Archive_HANDOFF_1E3N3_SHANG_PALETTE_QUALIFICATION.md`
- `MK_DOS_Archive_HANDOFF_1E3N4_SHANG_MORPH_SELECTION.md`
- `MK_DOS_Archive_HANDOFF_1E3N_UNRESOLVED_SLOT7.md`
- `MK_DOS_Archive_HANDOFF_1E3O10_RESHAPE_MULTI_FULL_CAPACITY_TERMINATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O11_CONTROLLED_FOURTH_PART_TOPOLOGY_WRITE.md`
- `MK_DOS_Archive_HANDOFF_1E3O11_CONTROLLED_FOURTH_PART_TOPOLOGY_WRITE_RUNTIME_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_1E3O12_FIXED_CAPACITY_HEART_RIP_TOPOLOGY_AUTHORING.md`
- `MK_DOS_Archive_HANDOFF_1E3O12_FIXED_CAPACITY_HEART_RIP_TOPOLOGY_AUTHORING_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_1E3O13_ATOMIC_HEART_RIP_COMPOSITION_AUTHORING.md`
- `MK_DOS_Archive_HANDOFF_1E3O14_FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING.md`
- `MK_DOS_Archive_HANDOFF_1E3O15_HEART_RIP_TRUE_GROWTH_RELOCATION_PREFLIGHT_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_1E3O1_ANIMATION_STREAM_FRAME_COMPOSITION.md`
- `MK_DOS_Archive_HANDOFF_1E3O2_MULTI_PART_FRAME_LOSSLESS_IR.md`
- `MK_DOS_Archive_HANDOFF_1E3O3_CONTROLLED_MULTI_PART_XY_EDIT.md`
- `MK_DOS_Archive_HANDOFF_1E3O4_RAYDEN_LIGHTNING_PLACEMENT.md`
- `MK_DOS_Archive_HANDOFF_1E3O5_INTERACTIVE_CANVAS_PLACEMENT_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O7_INTERACTIVE_MULTI_PART_COMPOSITION_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O8_FULL_HEART_RIP_FIXED_LAYOUT_EDITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O8_FULL_HEART_RIP_FIXED_LAYOUT_EDITOR_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_1E3O9_HEART_RIP_STRUCTURAL_GROWTH_RELOCATION_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O9_HEART_RIP_STRUCTURAL_GROWTH_RELOCATION_CENSUS_VERIFIED.md`
- `MK_DOS_Archive_HANDOFF_2026-09-24_1E3D1_VERIFIED_PALETTE_GROUND_TRUTH.md`
- `MK_DOS_Archive_HANDOFF_2026-09-24_1E3F_IMPLEMENTED_SELECTION_SEMANTICS.md`
- `MK_DOS_Archive_HANDOFF_2026-09-24_1E3G_IMPLEMENTED_TRANSFER_PIPELINE.md`
- `docs/MK_DOS_Archive_HANDOFF_2026-09-24_1E3D1_VERIFIED_PALETTE_GROUND_TRUTH.md`
- `docs/MK_DOS_Archive_HANDOFF_2026-09-24_1E3F_IMPLEMENTED_SELECTION_SEMANTICS.md`
- `docs/MK_DOS_Archive_HANDOFF_2026-09-24_1E3G_IMPLEMENTED_TRANSFER_PIPELINE.md`

---

# Appendix B — Canonical status terminology

Use these labels consistently in future reports and handovers:

- **VERIFIED** — directly established from authentic fixture evidence under the required contract.
- **STATICALLY VERIFIED** — exact structural/compiler evidence; no runtime claim implied.
- **RUNTIME VERIFIED** — in-game observation confirms the bounded runtime behavior.
- **IMPLEMENTED / VALIDATION PENDING** — code exists; required validation not yet accepted.
- **INFERRED** — strong evidence supports the interpretation but it is not directly proven.
- **HYPOTHESIS** — proposed explanation to test.
- **UNKNOWN** — unresolved.
- **SUPERSEDED** — once-reasonable conclusion/status replaced by stronger later evidence.
- **REJECTED** — contradicted by stronger evidence or invalid methodology.

When useful, combine layers explicitly, e.g.:

`CORE STATICALLY VERIFIED / NORMAL-APP INTEGRATION VERIFIED / RUNTIME SEMANTICS NOT REQUIRED`

rather than compressing everything into one word.

---

# Appendix C — Why this handover exists

The user requires handovers that can transfer the entire project to a new agent with little to no intervention. Therefore this file intentionally repeats established project history instead of assuming access to prior conversations. Future authoritative handovers must follow the same model: **complete history, current evidence, all available sources, new results integrated into the whole, failures preserved, exact continuation instructions, and these permanent rules reproduced verbatim or faithfully reconciled with any later additions.**
