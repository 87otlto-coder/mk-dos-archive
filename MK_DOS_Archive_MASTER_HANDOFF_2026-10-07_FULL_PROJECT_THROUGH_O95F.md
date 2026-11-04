# MK DOS Archive — authoritative handoff through O95F and research-completion roadmap

**Checkpoint date:** 2026-10-07 (SAST)  
**Current technical checkpoint:** O95F  
**Roadmap base source:** `MK-DOS-Archive-2026-10-07-O94D-source.zip` (SHA-256 `35eb058c781e0988be08a74f02b34c9820fef27798a1f14c861ab78fd24787eb`)  
**Roadmap status:** user-directed research-completion order locked  
**Product status:** extractor implementation intentionally deferred until MK2, MK1 and MK3 research closure

This document is the current authority for continuation order. It supersedes older recommendations to move immediately into browser integration, O94E, or opportunistic cross-game product work. Older handoffs and checkpoint notes remain forensic evidence, but their continuation-order prose is historical where it conflicts with this section.

The governing order is now:

**1. Finish MK2 research completely → 2. return to MK1 and finish it → 3. finish MK3 → 4. discuss UI/usability with the user → 5. only then design and build the extractor.**

The purpose of this ordering is to prevent product implementation from freezing incomplete or guessed semantics into the extractor. The project is still a forensic reconstruction effort. The extractor begins only once the structures needed for the requested asset classes are understood well enough to expose them honestly.

---


## 0.6 O95F — fixed-identity provenance expansion and structural-loop witness

O95F expands the fixed-numeric-identity animation surface from two witnesses to three and adds a qualified code write-site census for object identity field `+0x46`. Scanning the authenticated file-backed Object-1/Object-2 code ranges for the qualified `mov [reg+0x46],reg` instruction form yields exactly **24 code writes**: **12 immediate constants** and **12 copy/dynamic writes**. Copy/dynamic values remain symbolic unless their sources are independently resolved.

The new fixed route begins at physical `0x83DBD`: immediate 6 is written to current object `+0x46` at `0x83DC2`; a bounded helper at `0x64E44` executes; nested selector 0 is written at `0x83DCA`; and physical `0x83DD4` calls combined Family-A lookup/interpreter entry `0x63E74`. The bounded helper slice and explicitly audited returning helper slices contain no direct object-`+0x46` write; exceptional error flow tails away rather than returning to this lookup route. This is a bounded route non-interference result, not a whole-program theorem.

Family A slot 6 root Object-2 `0x11744`, index 0 resolves by authentic LE fixup to stream Object-2 `0x11884` / physical `0xB24D8`. The stream contains seven one-part composition pointers, all joined to O69-authenticated `ST0.GRA` descriptors, followed by raw token 1 at Object-2 `0x118A0`; its relocation-backed operand at `0x118A4` targets the same stream start `0x11884`. Under O95C's already-qualified token-1 behavior, the structural sequence is therefore `frame[0] -> ... -> frame[6] -> token 1 -> stream start`. This is the first fixed O95-series witness with a directly authenticated structural loop. No wall-clock timing, dwell duration, fighter name, move name, gameplay semantics, palette ownership or user-observed runtime claim is promoted.

Independent O95F verifier: **54,213 checks / 0 failures**. Regression verifiers remain clean: O95B **54,200**, O95C **54,199**, O95D **54,335**, O95E **54,186**, all with zero failures. Machine verdict: `MK2_O95F_SLOT6_FAMILY_A_INDEX0_SEVEN_FRAME_ST0_STRUCTURAL_LOOP_AND_IDENTITY_WRITE_CENSUS_ESTABLISHED`.

Examples deliberately not promoted include slot-1 selections whose selected pointer is separated from interpreter consumption by scheduler/state flow, slot-0 Family-B index-2 selection without a bounded immediate consumer join, and slot-12 selections at `0x95145`/`0x951B4` that are followed by explicit rewrites to slot 6. This preserves the rule that selection is not itself proof of animation consumption.

MK2 animation closure remains **OPEN**. Still unresolved are provenance for copy/dynamic identity writes, constant-identity routes whose selected pointer crosses scheduler/state helpers, broader stream/control coverage, timing, human names and complete identity coverage.

**Immediate next pass: O95G — constant-identity selected-pointer continuation tracing.** Trace the remaining immediate identity writers where a Family A/B selection occurs but interpreter consumption is delayed. Promote only routes where the exact selected pointer can be followed through storage/resume machinery into an authenticated consumer without identity/index ambiguity.


## 0.5 O95E — identity provenance and delayed lookup/interpreter joins

O95E tightens the sole O95D dynamic-index direct route and establishes the first delayed lookup/interpreter wrapper contract. At physical `0x63E45`, EAX is copied to global `0x75A78`, EDI is replaced by `[ESI+0x28]`, Family A is called at `0x63E54`, then the shared interpreter at `0x63E59`. This route is therefore `FamilyA[relatedObject.identity][EAX] -> interpreter`; the related object's numeric identity remains unresolved.

Two adjacent wrappers at physical `0x64ACC` (Family A) and `0x64AE5` (Family B) encode a bounded delayed route. For input `V` in global `0x75A78`, they preserve `V >>> 14`, clear the global's high 16 bits, perform `Family[currentObject.identity][V & 0xFFFF]`, add the saved `V >>> 14` as a **byte displacement**, then tail-jump to the interpreter. The displacement is not named as frame number, command count or time. A direct caller at `0x7C2BA` proves one identity-unresolved Family-B route with input `0x30001`: nested index 1, +12-byte entry displacement.

O95E also establishes a second fixed-numeric-identity bounded animation witness. Physical `0x7987C` loads dispatcher case 13 and reaches dispatcher `0x7B588`; relocation-backed Object-2 table entry 13 (`0x1352C`) targets handler Object-2 `0x1359A` / physical `0xB41EE`. On the immediate bounded path, physical `0xB422E` loads 7, `0xB4233` writes slot 7 to `[EDI+0x46]`, `0xB4236` writes selector value 1, and the relocated call at `0xB4240` enters the Family-B delayed wrapper. No call intervenes between the identity write and delayed selection.

Family B slot 7 root `0xD188`, index 1 resolves to stream Object-2 `0xD5D8`. That stream contains six one-part composition pointers, all O69-authenticated `RD0.GRA` descriptors, followed by token 0 at `0xD5F0`. Structural order: `frame[0] -> ... -> frame[5] -> token 0 return`. No move/action name, timing, gameplay semantics, or runtime-observation claim is assigned. This is the second fixed numeric MK2 animation witness after O95C's slot-12 / Family-A index-7 finite sequence.

Independent O95E verifier: **54,186 checks / 0 failures**. Regression verifiers remain clean: O95B **54,200**, O95C **54,199**, O95D **54,335**, all with zero failures. Machine verdict: `MK2_O95E_RELATED_OBJECT_IDENTITY_PROVENANCE_AND_FIXED_SLOT7_DELAYED_FAMILY_B_SIX_FRAME_SEQUENCE_ESTABLISHED`.

Still open: numeric identity provenance for the remaining parameterized direct routes, broader fixed-identity paths behind other identity writers/dispatch cases, complete stream/control corpus, loops/branches/multipart classification, animation timing, human names, and complete per-identity coverage. MK2 animation closure remains **OPEN**.

**Historical next-pass note:** superseded by O95F. See O95F above for the current O95G continuation.

## 0.4 O95D — direct runtime lookup/interpreter route census

O95D authenticates every executable callsite where one of the O95B identity-indexed lookup families is followed immediately by the O95C interpreter. There are **28** such routes: Family A **11**, Family B **17**. Twenty-seven have a strict adjacent immediate nested-index write; Family A call `0x63E54` has unresolved/non-adjacent index provenance. Immediate index sets are A `{0,6,7,16,38,60}` and B `{0,1,2,3,4,5,7}`.

Only one direct route currently has fixed numeric identity provenance at the route itself: the O95C witness at `0x950DA`, identity slot 12 / Family A index 7 / exact stream `0x130B8`. The remaining **27** are preserved symbolically as `Family[object.identity][index] -> interpreter`. O95D explicitly does **not** instantiate those callsites across all 17 roots.

For fixed-index routes, O95D compares the index only to O95B's qualified contiguous relocation-backed root extent. This identifies routes whose index lies beyond some qualified root spans (A index 38/60 for slots 12/13; B index 5 for slot 1; B index 7 for slots 1/10/13/14/15), but this is **not** promoted to a runtime-impossibility claim.

Independent verifier: **54,335 checks / 0 failures**. O95B and O95C regression verifiers remain clean at **54,200** and **54,199** checks respectively. Machine verdict: `MK2_O95D_28_DIRECT_LOOKUP_INTERPRETER_ROUTES_ESTABLISHED_IDENTITY_REMAINS_PARAMETERIZED_EXCEPT_O95C_WITNESS`.

Still open: numeric identity provenance for 27 direct routes, non-direct/delayed lookup-to-interpreter joins, complete connected stream corpus, loop/branch/multipart classification, timing and human names.

**Historical next-pass note:** superseded by O95E. See O95E above for the current O95F continuation.

## 0.3 O95C — selected-pointer stream interpreter and bounded frame-sequence anchor

O95C authenticates the shared consumer used immediately after a bounded subset of the O95B lookup routes. The interpreter is at physical `0x63E79` / Object-1 `0x2225`; its authenticated `0x105`-byte code slice SHA-256 is `6f0826bdac12e9f51ac2fc3af55bc915dea9fccfeedfd784ead73a41bea300cf`. It consumes DWORD tokens through cursor global `0x75A78`: token 0 returns; tokens 1..9 dispatch through the relocation-backed Object-2 table at `0x7A4`; values >9 are passed to the frame-composition builder at physical `0x640DF` / Object-1 `0x248B`.

The composition builder consumes a zero-terminated DWORD pointer list and reads each source record as DWORD + signed i16 + signed i16 + DWORD, exactly matching the already-qualified 12-byte O69 graphics-descriptor geometry. Placement transforms controlled by flags `0x10` and `0x80` are established only as visual placement transforms; collision/gameplay semantics are not promoted.

Direct lookup -> interpreter joins: Family A **11** callsites, Family B **17**. The interpreter is not exclusive; other selected-pointer consumers exist and remain open.

One caller-connected witness is fully bounded: canonical code at physical `0x9509D` writes identity slot 12; later on the same path it writes nested index 7, calls Family A, then immediately calls the interpreter. Family A slot 12 root `0x12E74`, index 7 resolves by authentic fixup to stream Object-2 `0x130B8`. That stream contains eight composition pointers; each points to one O69-authenticated `GO.GRA` descriptor plus a zero composition terminator. After frame 7, raw token 0 at `0x130D8` returns from the interpreter. Structural order only: `frame[0] -> ... -> frame[7] -> token 0 return`. No dwell/wall-clock timing or human move name is assigned.

During implementation, an exploratory note incorrectly associated this exact caller with Object-2 stream `0x248A` and an apparent loop. The first authentic O95C run rejected that claim: root entry `0x12E90` actually targets `0x130B8`. The `0x248A` stream is real but is reached from a different relocation source; no caller/identity route for it is promoted in O95C. This failed hypothesis is preserved as **REJECTED**, not silently reconciled.

Independent O95C verifier: **54,199 checks / 0 failures**. Machine verdict: `MK2_O95C_SHARED_STREAM_INTERPRETER_AND_BOUNDED_EIGHT_FRAME_SEQUENCE_ESTABLISHED`.

Still open: universal animation grammar/corpus, helper-token semantics beyond operand/control shape, runtime-connected loops/branches/multipart compositions, dynamic identity/index routes, timing, human names and complete per-identity coverage.

**Historical next-pass note:** superseded by O95D. See O95D above for the current O95E continuation.

## 0.2 O95B — MK2 identity-indexed animation-root structural graph

O95B begins the MK2 animation blocker with executable/fixup evidence rather than visual inference. Canonical MK2.EXE contains two adjacent lookup routines: family A at physical `0x918F1` selects through the 17-slot Object-2 table `0x1D544`; family B at `0x91909` selects through `0x1D588`. Both read object identity from `+0x46`, use global `0x75A78` as a nested index, dereference the selected root, and replace that global with the resulting pointer.

Fresh structural census:

- family A: **11 unique roots**, **670** contiguous relocation-backed entries across unique roots, **144 direct callers**, with 125 strict adjacent-immediate index calls spanning 38 distinct observed values;
- family B: **15 unique roots**, **255** contiguous relocation-backed entries, **109 direct callers**, with 103 strict adjacent-immediate calls using values `0..8` and `13`;
- root sharing differs across families; table lengths vary substantially by identity root, so no fixed universal animation-table length is promoted;
- bounded one-hop relation to the already qualified O69 descriptor corpus reaches **41** known descriptors from family A roots and **76** from family B roots; many entries remain intermediate/unknown;
- independent O95B verifier: **54,200 checks / 0 failures**.

No animation command grammar, frame order, timing, loop semantics, human move names or complete animation IR is claimed yet.

**Immediate next pass: O95C — selected-pointer consumer / record-grammar anchor.** Trace consumers of global `0x75A78` after the two lookup routines and establish record access geometry/control boundaries from code before decoding command values.

## 0.1 O95A — MK2 completion audit / closure blocker census

O95A is the current continuation checkpoint. It does not promote new gameplay semantics; it fresh-runs the established O67/O68/O69/O71/O72/O73 chain against the authentic 614-file MK2 fixture and makes the remaining MK2 closure blockers explicit.

Fresh closure state:

- graphics: **94/124 GRA resources exact-full**, **15 partial/ambiguous**, **14 pooled zero-candidate**, **1 out-of-pool**; 3,790 exact qualified streams; the 30 non-exact-full resources require final extractor-relevance classification rather than automatic rejection;
- palettes: **9/17 selector slots** have bounded correct-colour contracts; unresolved slots are **6, 7, 10, 11, 12, 13, 14, 15**;
- animations: O73 establishes the 17-slot per-identity resource/animation-root skeleton, but no MK2 animation grammar/frame IR has yet been reconstructed;
- stages/backgrounds: no qualified MK2 stage placement/renderer/dynamic-process reconstruction exists yet;
- digital audio: O94D remains qualified for all 312 U8 source-domain WAVs within the authenticated boundary;
- music: all **165** hardware-sequence files (`33 x MID/AWE/GVS/LAP/SBL`) structurally parse under the current Sound Images grammar. Aggregate tracks are MID 212, AWE 218, GVS 217, LAP 216, SBL 233. Only MID currently has independent original-GMI emulation proof, so the other four sets remain open;
- independent O95A fixture/status audit: **1,191 checks / 0 failures**.

The machine-readable audit is `mk2_completion_audit_o95a_2026-10-07.json`; the checkpoint is `CHECKPOINT_2026-10-07_O95A.md`.

**Immediate next pass: O95B — MK2 17-slot animation-root structural graph.** Use the authenticated O73 identity roots and LE relocation graph to recover repeated pointer/table structure and descriptor reachability before interpreting any animation command bytes. Do not assign move names, human character names, timing, or gameplay semantics from filenames/visuals.

## 1. Permanent research discipline

The following rules remain non-negotiable:

- authentic game bytes and machine behavior outrank prose, naming conventions and visual plausibility;
- fixture fact is not a format rule until independently generalized;
- palette compatibility is not palette ownership;
- indexed decode is not proof of correct colour;
- a decoded sprite is not proof of animation order, timing or identity;
- a decoded background image is not proof of stage placement, renderer order or dynamic behavior;
- scheduler ticks are not wall-clock milliseconds unless separately established;
- visual X/Y placement is not collision, world or hitbox state;
- filenames are not gameplay-event semantics;
- unknown bytes/resources remain first-class evidence and must not be normalized away;
- no game may be declared “closed” merely because a browser can display attractive output;
- no unsupported semantic gap may be filled by guessing for product convenience.

The project goal is not to reverse-engineer every gameplay subsystem. “Complete” means **complete for the asset-reconstruction and export scope the user wants**, with every remaining non-gating unknown explicitly identified. If an unresolved structure could materially change sprites, palettes, animation assembly/timing, stages/backgrounds, audio/music, provenance, or export correctness, it is a closure blocker unless the user explicitly accepts it as out of scope.

---

## 2. Current technical state through O94D

The October 7 base already contains the unified asset browser, MK1's mature animation/stage/audio research, MK2 indexed graphics and bounded palette contracts, verified MK2 proprietary music conversion, and MK3 container/image/sprite/audio decoding. Subsequent checkpoints add:

- **O91:** source/root normalization and browser-state hardening; deliberate duplicate export-chain frames; generic canvas dragging/reordering; safer MIDI bank lifecycle. The source changes were targeted-tested, but the bundled `dist/` is still the pre-O91 build because a fresh Vite dependency restore/build was not available in the execution environment.
- **O92:** fail-closed reconnaissance of the 312 MK2 `fx/*.U8` files and the Sound Images runtime sample contract.
- **O93:** corrected O67's overly rigid MK2 fixture envelope. Both known authentic installations are accepted: 614 files including `ULTRAMID.INI`, and 613 files with only that 6,720-byte optional file absent. Other missing/altered files still fail validation.
- **O94A:** authenticated the direct MK2 sample path `MK2 read -> RM.DRV request 1 -> SCC/GMI far API -> AH 0x11 -> GMI+0x0F03`, with no post-read write into the U8 buffer on that traced path.
- **O94B:** established that U8 `+0x04` is copied unchanged into the live channel end-threshold state. The authentic corpus has 308 files using one disk end convention and 4 exceptions using another.
- **O94C:** established the operational half-open mixer-readable interval and ruled out mixer over-read in the authenticated one-, two- and four-voice kernels. The unread regions are 33 bytes for 308 files and 1 byte for the four exceptions; their purpose remains UNKNOWN.
- **O94D:** established signed mono 8-bit source PCM, authenticated `+0x10` as the source-rate term for the direct path, and authorized a bounded source-domain WAV adapter over `[U32(+0x00), U32(+0x04))`. Corpus rates are 190 x 11025 Hz and 122 x 22050 Hz. The WAV is not claimed to be a bit-exact capture of the game's final resampled/mixed hardware output.

O94D closes the immediate digital-sample format question well enough for later product integration. O95A then makes the remaining MK2 game-level blockers explicit. **MK2 remains open.**

---

# 3. Completion order and hard game-closure gates

## 3.1 Phase A — finish MK2 before leaving MK2

MK2 must not be declared complete until a dedicated **MK2 closure audit** demonstrates that every extractor-relevant domain below is either verified to the required level or explicitly accepted by the user as a documented limitation.

### A1. Fixture, executable and resource topology

Required before closure:

- preserve the O67/O93 authentic-installation envelopes and canonical executable/driver identities;
- maintain a complete file/resource census and identify which files are asset-bearing, support/runtime-only, configuration-only, duplicated or still unknown;
- preserve partial/ambiguous resources instead of silently dropping them;
- rerun the final MK2 coverage census against the authentic fixture used for closure.

This gate is substantially established, but must be included in the final MK2 audit so later passes cannot accidentally narrow the accepted installation surface.

### A2. Graphics/resource decoding

Current strength:

- indexed GRA stream grammar is established;
- broad exact-full GRA corpus coverage exists;
- deterministic indexed browser/export packages exist for qualified streams.

Still required before MK2 closure:

- produce a final census of every graphics resource/stream: exact-full, partial, ambiguous, non-image, or unknown;
- determine whether any partial/ambiguous streams are required by characters, effects, stages or UI assets;
- close or explicitly classify every extractor-relevant undecoded graphics population;
- retain indexed pixels/opacity independently from palette ownership.

### A3. Palette ownership and correct-colour coverage

Current strength:

- two 17-slot selector structures are known;
- nine bounded identity/resource contracts are independently qualified at the connected standard: slots 0, 1, 2, 3, 4, 5, 8, 9 and 16;
- the existing integrations produce hundreds of correct-colour RGBA variants without promoting family/sibling ownership.

MK2 is **not palette-complete** yet.

Required before closure:

- audit all 17 selector slots from their own actual roots rather than adjacency/family inference;
- determine which unresolved slots are asset-bearing identities, aliases, special cases or non-fighter contexts;
- establish palette ownership for all character/effect/stage resources needed by the extractor;
- retain same-character duplicate/alternate semantics only where proven;
- do not assign human character names solely from slot position, filename resemblance or sprite appearance;
- publish a final palette-coverage matrix showing correct-colour, indexed-only and unresolved assets.

A visually plausible colourization is not a closure substitute.

### A4. Character/effect animation reconstruction

This is a major remaining MK2 gap.

Required before closure:

- identify the MK2 equivalents of identity selector -> animation table/stream -> frame/part records -> graphics descriptor/resource;
- qualify control grammar, termination, aliases/reuse, loops and dynamic/non-immediate branches;
- establish frame ordering and multipart composition where applicable;
- separate structural dwell/timing values from wall-clock timing unless runtime frequency is proven;
- determine how palette context joins animation/resource context without assuming one palette per resource family;
- distinguish canonical game animation sequences from user-created presentation chains;
- produce a machine-readable animation IR and coverage census;
- export representative animations only after the above joins are qualified;
- list every animation-bearing branch that remains unresolved.

MK2 cannot be closed while the browser merely exposes loose sprites/manual chains in place of recovered game animation structure.

### A5. Levels/backgrounds, including animation and renderer behavior

This is the other major MK2 gap.

Required before closure:

- identify the complete stage/background set from executable/resource evidence rather than filenames alone;
- join stage identity to resource modules/images, placement records and palette contexts;
- recover layer/plane order, clipping, camera/scroll projection and orientation/flip behavior where used;
- reconstruct dynamic background processes/animation, including state cycles, motion, random phase/history dependencies and conditional objects where they affect visible output;
- distinguish deterministic fresh/normalized scene exports from arbitrary runtime snapshots when runtime history is not recoverable;
- produce a stage coverage matrix showing static, dynamic, normalized-only and unresolved elements;
- verify assembled exports against the authentic fixture and retain source provenance for every component.

Recognizable `ARENA.GRA`, `ARMORY.GRA`, `FOREST.GRA`, etc. are not, by themselves, reconstructed stages.

### A6. Digital sound effects / U8

Current status through O94D:

- 312/312 U8 files are structurally accounted for;
- signed mono 8-bit source PCM is established on the authenticated software mixer paths;
- source rates are established as 11025/22050 Hz for the direct path;
- the bounded mixer-readable range is established;
- deterministic source-domain WAV conversion is authorized and independently audited;
- byte-exact originals remain the authority;
- unread trailing bytes remain preserved and semantically UNKNOWN.

Before final MK2 closure:

- integrate this status into the MK2 domain coverage matrix;
- decide whether gameplay-event naming is required for the intended extractor. If names cannot be proved, preserve filenames/resource identity rather than guessing;
- do not broaden O94D into claims about bit-exact final mixer/hardware output.

No further audio-format research is required merely to make the already-qualified source-domain WAVs usable later, unless another MK2 subsystem reveals a contradictory sample path.

### A7. Music / proprietary sequence system / MIDI

Current strength:

- `sound/*.MID` are correctly classified as proprietary Sound Images Generation 2 sequences, not standard SMF files;
- the parser/converter is derived from original GMI behavior;
- original-code emulation verifies 33 songs / 212 tracks for event bytes, ticks, end and loop boundaries;
- SMF conversion is bounded and keeps unsupported driver-global/sample-channel semantics separate;
- `ULTRAMID.INI` is recognized as optional installation/configuration material rather than a graphics validity requirement.

Before final MK2 closure:

- rerun and preserve the complete song/track coverage census;
- document which Sound Images events convert exactly, which are preserved as metadata/control evidence, and which cannot be represented faithfully in SMF;
- preserve loop/control provenance and do not claim hardware/audible equivalence from event equivalence alone;
- determine whether any additional music/sample-bank files affect extractor-visible music assets;
- keep soundbank playback a later UI/product concern, not a substitute for format proof.

### A8. Remaining asset-bearing unknowns

Before declaring MK2 closed, perform a deliberate unknown-resource audit:

- inspect every still-unclassified or partially classified file/chunk/range that could plausibly contain graphics, palettes, animation/control data, stages, sound or music;
- cross-reference executable consumers where practical;
- classify each as extractor-relevant and resolved, extractor-relevant and still blocked, or non-gating/unknown;
- never convert absence of a known parser into evidence that a resource is irrelevant.

### A9. MK2 closeout gate

MK2 may be labelled **RESEARCH-CLOSED FOR EXTRACTOR SCOPE** only when all of the following exist together:

1. a complete domain coverage matrix for graphics, palettes, character/effect animations, stages/backgrounds/dynamics, digital audio, music and remaining unknowns;
2. authentic-fixture reruns of every critical parser/verification path used by the final extractor contract;
3. independent validation for high-risk structural claims where feasible;
4. explicit lists of bounded assumptions and unresolved non-gating unknowns;
5. no hidden reliance on visual plausibility, filename semantics or sibling inheritance;
6. a refreshed authoritative handoff stating exactly what is and is not closed;
7. user approval for any intentionally unresolved extractor-visible limitation.

Until that gate passes, **do not move to MK1 merely because MK2 audio, graphics or palettes look mature in isolation.**

---

## 3.2 Phase B — return to MK1 and finish MK1

Once MK2 passes its closure gate, return to MK1. Do not spend this phase expanding general authoring/compiler features unless they directly validate an extractor-relevant semantic question.

MK1 is the most mature game, but it still has meaningful closure work.

### B1. Character/effect animations

Current strength includes 739 ANITAB cells, 514 unique streams, 1,144 frame targets, 1,102 decoded descriptors, 1,824 frame events and established multipart/effect fixtures.

Required before MK1 closure:

- finish the transition from structural ANITAB coverage to a canonical export-oriented animation graph;
- audit off-table animation/effect streams so ANITAB is not falsely treated as the complete universe;
- preserve aliases/reuse and multipart composition explicitly;
- resolve or clearly classify dynamic/non-immediate control branches;
- keep dwell/scheduler timing structural unless wall-clock frequency is separately established;
- produce final animation coverage and unresolved-branch matrices;
- distinguish canonical game sequences from manual presentation chains.

### B2. MK1 palettes

Current strength includes the nine-slot normal/alternate system, runtime-grounded Kano editing, roster ownership mechanisms, shared NINJA geometry with separate palette contexts, and several direct effect bindings.

Required before closure:

- resolve the remaining extractor-relevant palette gaps, especially the known cross-resource unresolved descriptor population where possible;
- audit effects separately from fighter/body palettes;
- revisit slot-7/Goro/Shang/other special relationships only where the current evidence leaves extractor-visible ambiguity;
- publish a final per-context palette coverage matrix rather than implying a universal resource->palette rule.

### B3. Levels/backgrounds, including dynamic animation

MK1 already has the strongest stage reconstruction in the project: 24 top-level modules, placement/camera/order logic, horizontal flip, clipping/history work, normalized states and multiple dynamic-process contracts.

Required before closure:

- perform a final 24-stage audit ensuring every top-level module is represented and every dynamic/special path is accounted for;
- identify which scene outputs are deterministic fresh/normalized states versus runtime-history/random-state dependent;
- ensure palette/resource/placement provenance survives assembled export;
- close any remaining stage-visible state that materially affects the requested extractor, or mark it explicitly as runtime-dependent rather than inventing a canonical snapshot;
- produce one final stage/background coverage matrix.

### B4. MK1 audio/music

Current strength includes 244 WAV files, 533 sound records and 243 exact record-to-WAV bindings with bounded loop-forever codes.

Required before closure:

- finish or explicitly bound the remaining `SAMPLES.DAT` / music relationship if it is required to expose all requested MK1 music/audio assets;
- determine whether any additional sequence/sample-bank path is extractor-relevant;
- preserve filenames/record identities without inventing gameplay event names;
- integrate audio/music coverage into the final MK1 closeout matrix.

### B5. MK1 closeout gate

MK1 may be labelled **RESEARCH-CLOSED FOR EXTRACTOR SCOPE** only when graphics/palettes/animations/stages/dynamics/audio/music and extractor-relevant unknowns have a complete coverage matrix, remaining limitations are explicit, and the final integrated exports can be regenerated from the authentic fixture without semantic guessing.

---

## 3.3 Phase C — finish MK3

Only after MK1 is closed should work move to MK3.

### C1. Fighter/effect palette ownership

Current strength:

- all 6,654 sprite frames decode and match the original decompressor;
- 416 IFF/PBM/ILBM images decode correctly, including their embedded image palettes;
- the post-decompress palette-index-shift path around `0xD2CCC` is a strong executable anchor.

Required before closure:

- trace the index-shift/loader/selector path to exact palette records and contexts;
- establish ownership for fighter/effect sprites rather than colourizing by compatibility;
- distinguish body, alternate and effect palette contexts where the game does;
- retain grayscale/indexed previews for anything still unresolved.

### C2. Character/effect animation grammar

Current strength:

- ATHD/ATAB/ATYP relationships are visible;
- type-2 values align with the 36-byte FHDS descriptor stride;
- type-1 values behave like ATAB control offsets;
- all underlying sprite frames are already decoded.

Required before closure:

- qualify ATAB/ATYP control grammar, termination, loops and dynamic branches;
- resolve multi-model FHDS joins and relocation/address semantics;
- reconstruct frame ordering and multipart composition;
- separate structural timing/control from wall-clock claims;
- produce a bounded animation IR plus complete coverage/unresolved matrices.

### C3. Levels/backgrounds, including animation

Current strength:

- 416 source FORM pictures decode correctly.

Required before closure:

- identify actual MK3 stage identities and joins to those source images/resources;
- reconstruct placement, layers/order, palette context, clipping/camera/orientation as applicable;
- recover dynamic stage/background processes and animation;
- distinguish source images from assembled levels;
- publish final stage/background coverage and bounded scene exports.

### C4. MK3 audio/music

Current strength:

- 995 WAVs from SPEC/CLAS plus 29 from MK3.ASG = 1,024 WAV assets;
- 46 OGG CD tracks are preserved unchanged with cue context.

Required before closure:

- final coverage/provenance audit of WAV/music assets;
- verify whether any remaining audio/music container/chunk is extractor-relevant;
- preserve source identities and avoid inferred gameplay naming where not proven.

### C5. Remaining MK3 container/chunk unknowns and closeout

Audit all raw/unknown MFIL/DATA.MK3 ranges for possible extractor-relevant asset/control content. MK3 closes only with the same standard used for MK2/MK1: complete domain matrix, authentic-fixture reruns, bounded unknowns and no guessed semantics.

---

# 4. Phase D — extractor definition begins only after all three research closeouts

Do **not** treat the current unified browser as the final extractor design. It is a research/proving surface.

When MK2, MK1 and MK3 are all research-closed for extractor scope, the first extractor activity is a **UI and usability discussion with the user**, not implementation.

The UI discussion should explicitly decide:

- how the user opens/detects MK1, MK2 and MK3 installations/ZIPs;
- the primary information architecture: game -> domain -> character/stage/audio/music -> asset/animation/state;
- whether characters, effects, stages and audio use separate workspaces or a unified browser;
- how palette variants are presented without confusing verified alternatives with guessed colourizations;
- animation preview/timeline controls, loops, speed display and how structural timing uncertainty is communicated;
- stage/background preview, normalized/runtime-dependent state selection and dynamic-animation controls;
- search, filtering, grouping and resource/provenance inspection;
- Ctrl/Command/Shift selection, ordered export queues and deliberate duplicate-frame use;
- composition-canvas behavior, layer dragging/reordering, snapping, coordinates, zoom/pan and whether manual compositions are visually distinguished from canonical game compositions;
- export formats: original bytes, indexed+palette sidecars, PNG, APNG/GIF/video if desired, sprite sheets, WAV, MIDI/sequence preservation, stage scene data and metadata ZIPs;
- provenance/confidence display so VERIFIED / bounded / unresolved status is visible rather than buried;
- warnings when an asset is indexed-only, palette-unresolved, normalized rather than arbitrary-time, or manually chained;
- project persistence, undo/redo, save/reload and reproducible export recipes;
- performance expectations, worker-based decoding, progress, cancellation and memory limits;
- accessibility and general usability before visual styling.

No final UI architecture should be assumed from the present research browser. The user should approve the workflow/wireframe direction first.

After UI/usability is agreed:

1. freeze the cross-game extractor data model and provenance/confidence schema;
2. define export contracts and product-level regression fixtures;
3. decide worker/cache/project-persistence architecture;
4. implement the extractor incrementally against the already-closed game research contracts;
5. keep the forensic parsers and evidence gates separate from presentation code so later UI changes cannot weaken semantic validation.

---

# 5. Immediate next action from O94D

The old O94D recommendation to proceed directly to **O94E browser integration** is superseded by this roadmap.

The immediate next research block is:

**MK2 completion audit -> identify and close the remaining MK2 animation, stage/background/dynamic, palette and asset-bearing-unknown gaps before MK2 is allowed to close.**

Recommended first sub-pass:

1. generate an MK2 extractor-scope coverage matrix from all current evidence;
2. enumerate every remaining unresolved selector slot, animation-bearing structure, stage/background resource/process path and partial/unknown graphics resource;
3. rank them by whether they block character animations, assembled stages/backgrounds, correct-colour output or music/audio coverage;
4. choose the smallest next forensic pass from that evidence rather than from filename intuition.

Once MK2 passes the closeout gate, move to MK1 closure, then MK3 closure, then the user-led UI/usability phase.

---

# 6. Current build/runtime caveat

The included `dist/` is still the **pre-O91 October 7 compiled build**. O91-O94D source/research changes are present in source but were not regenerated into `dist/` in the constrained execution environment. Do not hand-edit generated JavaScript or claim the newer source is represented by the existing bundle. Perform a clean dependency restore, `npm run lint`, `npm run build`, and appropriate browser regression checks before using the current source as a rebuilt application.

---

# Historical comprehensive handoff through O92

The following handoff is retained intact for forensic history and detailed earlier evidence. Where its continuation order conflicts with the roadmap above, the roadmap above controls.

# MK DOS Archive — authoritative continuation handoff through O92

**Checkpoint date:** 2026-10-07 (SAST)  
**Continuation base:** `MK-DOS-Archive-2026-10-07-source.zip` (SHA-256 `d1f3cb3b7293abbc1f35db83afab493efeded7196f3c47e8f3e497c60901514a`)  
**Current status:** O91 source/runtime hardening implemented and targeted-tested; O92 MK2 U8 driver/header reconnaissance formalized fail-closed; full Vite rebuild and authentic-fixture reruns remain pending in this execution environment.

This handoff supersedes older "current checkpoint" prose where it conflicts. The full October 7 master handoff is reproduced below unchanged as historical/forensic context. In particular, its historical O89 appendix is not the current state: the October 7 base already contains O90, MK2 MIDI work, MK3 decompression and the unified browser, and this continuation adds O91/O92.

## Current takeover continuation

Read `CHECKPOINT_2026-10-07_O92.md` for the detailed O91/O92 evidence contract. The concise state is:

- **O91:** fixed the fallback-folder/root-wrapped-ZIP path namespace mismatch; added a reproducible root-normalization smoke test; made manual export chains support deliberate duplicate frames; added generic composition-layer pointer dragging/reordering; strengthened scan cancellation/state reset and numeric bounds; and made MIDI soundbank replacement non-destructive with natural-end/error handling.
- **O91 validation:** JSON manifests valid, new scripts pass `node --check`, synthetic root ZIP/wrapper ZIP/`webkitdirectory` normalization test passes, modified browser source passes targeted TypeScript with local declaration shims. The full npm/Vite build is **not claimed** because `node_modules` is excluded and dependency transport timed out here. The included `dist/` remains the pre-O91 October 7 build.
- **O92:** formalizes 312 MK2 `fx/*.U8` files with a 32-byte header and the retained canonical Sound Images GMI runtime sample contract. Inventory evidence independently retains the **308 normal / 4 exceptional** `+4` disk-field split. Driver routines prove signed runtime sample-byte mixing and the runtime descriptor's data-start/end/loop behavior.
- **O92 boundary:** the disk-to-runtime transformation of `+4` remains unresolved. Therefore exact PCM disk range and WAV export remain blocked. The new runner requires canonical O67/GMI identities and will census all 312 files when the authentic fixture is available; it still returns `wavAdapterAuthorized:false` by contract.
- **Fixture/build availability:** the takeover environment has the source and retained evidence but not the copyrighted MK1/MK2/MK3 game fixture ZIPs. It can run the existing packaged runtime. It cannot honestly rerun the three authentic game collections or the 312-file O92 pass here.

## Immediate continuation

1. Restore dependencies in a normal development environment, run `npm run lint`, `npm run build`, and `npm run smoke:source-root-normalization`.
2. Run MK1/MK2/MK3 through both folder and ZIP entry paths; specifically exercise duplicate frame chains, APNG/sheet/ZIP downloads, generic canvas drag/reorder/export, and MIDI bank load/play/end/replacement.
3. Run `npm run smoke:mk2-u8-recon -- <MK2-install-dir>` and preserve any contradiction rather than adapting the expected 308/4 partition silently.
4. Continue the MK2.EXE loader bridge around physical `0x815CE..0x81621` until every disk-header-to-runtime-descriptor transformation relevant to sample bounds is accounted for.
5. Only then implement signed-PCM WAV export, preserving originals and checking exact sample counts/ranges.
6. If MK2 fixture work is unavailable, the next independent research branch is the MK3 post-decompress palette-index shift/loader join; do not colorize fighter frames by compatibility alone.

## Hard stop / no-regression rules

Authentic bytes outrank prose. Palette compatibility is not ownership. Indexed decode is not correct-color proof. Scheduler ticks are not milliseconds. Visual descriptor X/Y is not collision/world state. Unknown resources remain byte-preserved. Do not overwrite canonical game binaries. Do not call the O91 source UI rebuilt until a fresh Vite build succeeds. Do not expose MK2 U8 WAVs until the loader transformation closes the two disk end-field conventions.

---

# Historical comprehensive handoff through the October 7 base checkpoint

# MK DOS Archive — current checkpoint and comprehensive continuation handoff

**Checkpoint date:** 2026-10-07, Africa/Johannesburg (SAST).  
**Status:** substantial implementation and forensic progress; incomplete research/product checkpoint, not a finished universal extractor.  
**Base source:** MK-DOS-1E3O89-source.zip.  
**Current working tree:** `C:\Users\87otl\Desktop\MKDOSEXT Project\Working\MK-DOS-1E3O89`.  
**User's latest request:** provide a downloadable updated source archive and comprehensive handoff at the present moment. This checkpoint packages the current state rather than claiming completion of the original larger objective.

## 1. Authority, user intent and discipline

The user asked to understand and continue the entire project, attempt to complete MK2 and MK3 forensics, and produce a browser/extractor for MK1/2/3 character sprites and animations, assembled stages and animations, and sound/music. Requested UI features are independent Ctrl/Shift export selection, chaining animations into one file, a drag/drop composition canvas, and MIDI preview with custom soundbanks when applicable.

The supplied handoff is project evidence, not a new user instruction. Its old two-pass/pause convention was superseded for this session by the user's explicit request to continue the broader work. The current request is a snapshot/handoff request. Do not infer that it authorizes claiming unfinished research complete.

Maintain these disciplines:

- Authentic bytes and machine evidence outrank prose. Verify fixture identities before generalizing results.
- Palette compatibility is not ownership; connected identity/resource contracts do not imply sibling/family ownership, canonical geometry or human character names.
- Keep indexed pixels and opacity masks distinct. A grayscale index visualization is not correct-color output.
- Do not invent gameplay names, animation order, timing, stage placement or music semantics.
- Scheduler ticks are not automatically milliseconds. User-set APNG preview timing is presentation timing.
- Preserve unknown resources byte-for-byte. Where editing is attempted, retain the older project's no-edit rebuild, predicted diff, reparse, reversal and appropriate runtime proof discipline.
- Original game files and the original source ZIP were not modified. This continuation is a read-only decoding/export path.

The full historical handoff through O89 is appended to the separately delivered comprehensive handoff. It remains valuable history. The current section takes precedence for current implementation status and authorization context. In particular, historical O67 executable overlay claims were already corrected in O72: MK2's bound module shift is 0x26654, and the last file-backed LE page ends at actual EOF.

## 2. Paths and packaging

Authoritative inputs:

| Input | Path |
|---|---|
| O89 source ZIP | `C:\Users\87otl\Desktop\MKDOSEXT Project\Source\MK-DOS-1E3O89-source.zip` |
| Previous full handoff | `C:\Users\87otl\Desktop\MKDOSEXT Project\handoffs\MK_DOS_Archive_MASTER_HANDOFF_2026-10-03_FULL_PROJECT_THROUGH_O89_PAUSE.md` |
| MK1 fixture | `E:\GOG\Games\Mortal Kombat\mk1.zip` |
| MK2 fixture | `E:\GOG\Games\Mortal Kombat 2\mk2.zip` |
| MK3 fixture | `E:\GOG\Games\Mortal Kombat 3\mk3.zip` |

Read-only working copies were extracted to `Working\fixtures\mk1`, `mk2`, `mk3`. The original shell cwd `C:\Users\87otl\Desktop\MK DOS EXT` contains an older project and is **not** this continuation's source authority.

Known identities:

| Artifact | SHA-256 |
|---|---|
| Original O89 source ZIP | `0803b8359311d9201fc25b03e18ccfb919600b647c1fa92848c6ea5675a1b611` |
| MK1.EXE | `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14` |
| MK2.EXE | `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` |
| MK3.EXE | `8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0` |
| MK2 GMI.BIN | `7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633` |

The downloadable source archive includes source, scripts, prior project documents, text/JSON evidence, local synthesizer bundles and licenses, and a compiled `dist` build. It excludes node_modules, the local Python tool installation, game fixtures, and generated game-asset ZIP/PNG/MIDI export payloads. Those generated asset exports remain in the working directory and can be regenerated from the user's game files. `ARCHIVE_CONTENTS_SHA256.json` inventories packaged files. A separate checksum file records the downloadable archives.

## 3. Running this checkpoint

1. Extract the updated source ZIP into a new directory.
2. With Node.js available, double-click `Launch_Checkpoint.bat`, or run `node scripts/serve-checkpoint.cjs 3001`.
3. Open `http://127.0.0.1:3001/` in Chrome or Edge. Keep the server window open.
4. Choose **Open Game ZIP** and select a supplied game archive, or use a folder picker.
5. After detection, click **Decode & browse**. MK1/MK2 run existing evidence chains and can take longer than MK3.
6. Filter by type/resource/search. Click, Ctrl/Command-click, and Shift-click manage export selection. The ordered queue is independent of canvas layers.
7. Export originals/PNG individually, ZIP with metadata, an APNG chain, a sprite sheet, or canvas PNG plus scene metadata.
8. For MK2 MIDI, select a sequence and load a local SF2/SF3/DLS soundbank in **MIDI preview**. No soundbank is bundled. Preview fidelity depends on the chosen bank.

The compiled launcher requires Node but no npm install. For development in a freshly extracted source directory: `npm install`, `npm run lint`, `npm run build`, `npm run dev -- --host 127.0.0.1`.

Important local environment detail: the current working tree's `node_modules` is a directory junction to the older project's installed dependencies. Do not run npm install into that junction when continuing in place. The downloadable ZIP excludes the junction. The local MIDI dependency install is isolated under `.vendor-runtime`, pinned to `spessasynth_lib` 4.3.14 and `spessasynth_core` 4.3.22; its dependency manifests are retained, binaries in its node_modules are excluded. Browser-ready bundles are already in `public/vendor` with license files.

## 4. Coverage at the snapshot

| Domain | Implemented/verified | Unfinished or bounded |
|---|---|---|
| MK1 sprites | 2,263 character-context RGBA variants, 21 verified effect assets, 79 unresolved grayscale previews | Context variants are not universal palette assignments; not all gameplay animation semantics are established |
| MK1 stages | 49 PNGs exposed from the existing qualified stage package, including bounded ordinary/dynamic compositions | Not 49 unique gameplay stages; full runtime stage state is not claimed |
| MK1 sound | Existing 244 WAV package integrated into the collection adapter | SAMPLES.DAT meaning and general music/runtime sequence relationship remain unresolved |
| MK2 indexed sprites | 94 exact-full GRA resources, 3,790 indexed sprites | Partial/ambiguous/unqualified resources remain outside this accepted corpus |
| MK2 color sprites | Nine bounded identity/resource contracts, 782 RGBA PNG variants | No whole-family/sibling promotion; many palettes/characters unresolved |
| MK2 music | 33 proprietary sequences converted to standard MIDI; original bytes also retained | One traversal; loop metadata preserved; hardware tempo scheduling/fidelity not emulated |
| MK2 digital sound | Header and driver investigation only | No qualified U8 WAV adapter in this checkpoint |
| MK2 stages/animation | Existing research and raw/indexed assets; user-selected presentation chains | Automatic assembled stage reconstruction and complete gameplay animation extraction unfinished |
| MK3 sprites | 6,654 decoded indexed frames, all independently matched to original decompressor | Fighter palette bindings unresolved; previews grayscale |
| MK3 images | 416 IFF images with explicit palettes | Individual source images, not automatically assembled gameplay stages |
| MK3 sound | 995 FTR embedded WAVs plus 29 ASG WAVs = 1,024 | Semantic event naming remains structural |
| MK3 music | 46 original OGG CD tracks | No inferred gameplay track names |
| MK3 stages/animation | MFIL/ATAB/FHDS structures preserved and partially investigated | Full stage assembly, animation-control grammar and palette context not implemented |

Expected current collection counts after the MK1 uppercase-WAV extension fix: MK1 2,656 assets (2,363 sprite previews/variants + 49 stage PNGs + 244 audio); MK2 4,638 (4,572 sprite previews/variants + 33 originals + 33 MIDI); MK3 9,186 (includes raw chunks and unknown gaps alongside decoded assets). Use `evidence/checkpoint-verification.json` for the actual final census. Older `mk1-collection-summary.json` reflects the pre-fix omission of uppercase `.WAV` and is superseded by that final report.

## 5. MK2 O90 integration

`src/games/mk2/research/verifiedIdentityBundleO90.ts` packages the eight exact O88 contracts plus exact O89 slot-9 NJ4. It checks prerequisite success, exact nested package hashes, counts, and O89's accepted package identity.

Contracts: slots 0/HH0, 1/LK0, 2/JC0, 3/BA0, 4/FN4, 5/FN6, 8/NJ7, 9/NJ4 and 16/FN4. This is nine contracts, not nine fully reconstructed fighters.

Result: nine packages, 782 PNGs, 827 nested logical entries, 11 outer entries; archive size 13,439,841 bytes; SHA-256 `d2975983d9404463ade071e9a4955b5f9326a34b25def726b329d849e6d4ce58`. See `evidence/mk2/o90.json`; the generated ZIP remains at `evidence/mk2/o90.zip` in the working tree, excluded from the source download. No new palette ownership or semantic naming was promoted. A separate independent Python O90 audit was not completed in this session; do not describe it as done.

## 6. MK2 proprietary music breakthrough

Implementation: `src/core/assets/mk2Music.ts`.

The supplied `sound/*.MID` files are **not** SMF files: they do not begin with MThd. GMI.BIN identifies itself as Sound Images Generation 2, Tony Williams/Sound Images. The parser was independently derived from original code, not guessed from the extension.

Format and code anchors:

- First byte is song count (qualified here: one). Little-endian u16 at 1 points to song-pointer table. First pointer identifies song header.
- Song header: PPQN byte, BPM byte, track-count byte, then u16 track offsets.
- GMI.BIN 0x3BF establishes loading; 0x43E initializes tracks; 0x2FA interprets events; 0x5FA reads variable-length deltas.
- Each track begins with delta. Note bytes below 0x80 carry a velocity byte. 0x80–0x8F select channel.
- 0x90 explicit note-off; 0x91 end plus CC123; 0x92 program; 0x93 shared tempo change; 0x94 no-op; 0x95 pitch bend MSB with LSB zero; 0x96 CC7; 0x97 auxiliary track state; 0x98 loop; 0x99 previous-note off; 0x9B CC10; 0x9C loop-point marker; 0x9D arbitrary controller; 0xFF delay-only.
- 0x9A driver-global branch is explicitly unsupported. Digital sample channels above 11 are not silently converted to MIDI notes.
- Conversion preserves one traversal and records loop offsets. It does not endlessly unroll loops. SMF output is format 0 with a tempo map.

Independent verification: `scripts/verify-mk2-music.py` executes original x86-16 routines 0x43E and 0x2FA in Unicorn. It captures MIDI bytes at 0x795/0x79E and compares each event's bytes and tick, ending tick and loop boundary with the TypeScript result. **33 songs, 212 tracks passed, zero failures.** Evidence: `evidence/mk2-music-emulation.json` and `evidence/mk2-music.json`.

Qualification limits: the emulator bypasses hardware scheduling and directly advances logical ticks. Tempo-header interpretation is traced through 0x664 (PPQN × BPM and PIT divisor arithmetic), but audible equivalence to original hardware is not proven. Soundbank loader and synth UI compile; end-to-end audible soundbank playback was not yet manually verified at this checkpoint. Do not equate the synth library's capabilities with tested app behavior.

## 7. MK2 digital audio investigation, unfinished

312 `fx/*.U8` files have a 32-byte header. Observed fields: u32 at 0 is 32; u32 at 4 resembles length/end; u16 at 16 is 11025 or 22050; bytes 18–19 are 06 01. Other observed header dwords are zero.

308 files have `fileLength - 32 - headerU32At4 = 1`. Four differ: `gong.u8`, `liu-kang.u8`, `thunder.u8`, `thundsht.u8` have header field = fileLength - 1. Do not normalize this disagreement silently.

GMI mixer 0xCF3 reads samples and uses signed IMUL at 0xD11; 0xDB7 adds 0x80 for output. This supports signed internal PCM, but the complete file-loader transformation and exact export range have not been qualified. GMI pitch code 0xAFD reads header words at +0x10/+0x12. MK2.EXE physical 0x815CE opens the fx path, 0x815E6 selects a real-mode destination, 0x815F4 reads the file, and 0x8160A sets a request flag; 0x81621 constructs the `.U8` path from a filename-pointer table. The bridge consumes additional runtime state and remains to be traced.

Read-only disassembly outputs `evidence/mk2-gmi-disasm.txt` and `mk2-rm-disasm.txt` contain both code and data interpreted as instructions. Only anchored executed/connected routines are evidence; linear disassembly of arbitrary data is not.

## 8. MK3 container and image forensics

Implementation: `src/games/mk3/container.ts`, `src/core/assets/iff.ts`, `src/core/assets/wave.ts`, `src/core/assets/mk3Collection.ts`.

MFIL: 12-byte file header, u16 chunk count excluding CDIR at +4, u32 CDIR offset at +8. Chunks have 32-byte headers: tag at +0, name (eight bytes) at +6, payload size +16, decoded size +20, flags +24, additive byte checksum +28. Payload immediately follows. All supplied chunks have zero flags and equal stored/decoded size. The final CDIR has 32-byte records agreeing with chunk tag, name, offset and length. **17/17 FTRs** validate checksums, directories and exact EOF.

DATA.MK3: **416 FORM pictures** (340 PBM, 76 ILBM), all decoded. FORM/chunk bounds, BMHD, CMAP, BODY, ByteRun compression, masks and palette bounds are checked. Crucial fixture-specific layout: DOS PBM rows are exactly width bytes, including odd widths; the explicitly identified `GWS/Windows 1.1n` ILBM annotation uses byte-aligned planes (`ceil(width/8)`), while other ILBM uses standard word alignment. A single internal zero pad and ByteRun no-ops are preserved/checked. Unsupported HAM/EHB fails. The initial generic interpretation decoded 207/416; correcting authentic PBM layout/padding reached 368/416; the explicit GWS layout reached 416/416. Unrecognized DATA.MK3 ranges remain raw exports.

SPEC/CLAS payloads contain consecutive WAV records: 995 total with exact tiling. MK3.ASG contains another 29 consecutive WAVs. RIFF size, chunks, PCM block alignment and rate checks are implemented. Original OGG tracks are exported unchanged; the source CUE is retained.

## 9. MK3 compiled sprite decoder and independent proof

Implementation: `src/games/mk3/sprites.ts`.

FHDS descriptor stride is 36 bytes. Fields: u16 width/height +0/+2; signed x/y +4/+6; expanded size +12; FDAT offset +20; compression +24 (qualified value 1); compressed length +28; mode u16 +32; group u16 +34. FDAT name is `FrDt{group-1:02}{model:02}`, where model comes from the FrmHdrs suffix. Treating every sprite as belonging to FrDt0000 is wrong.

The executable dispatch at physical 0xC0C4C maps modes to bit depths:
`[5,4,4,3,3,7,7,3,2,2,2,3,4,4,6,3,7,2,6,4,6]`.

Compressed bits run MSB-first within little-endian 32-bit words. The original decompressor is at physical 0xD1BD4–0xD2B16. It produces skip/count/literal commands. Skip prefix selects 5/3/6/7/8 payload bits; count prefix selects zero, four bits or eight bits. Count zero terminates a row. First literal uses mode bit depth; subsequent colors use repeat, +/-1, or literal coding (depth two is direct literals). The parser checks expanded length, row extents, exact row consumption and bounded dword padding. Opacity comes from skip/count commands, not palette index zero.

**6,654/6,654 frames decode, zero failures.** Per container: BLADE 363, INDIAN 396, JAX 355, KAHN 100, KANG 327, KANO 369, LAO 355, LIA 409, MISC 911, MOTARO 113, ROBO 604, SHANG 386, SHEEVA 327, STANCES 492, SWAT 355, TURK 379, TUSK 413.

Independent proof: `scripts/verify-mk3-emulation.py` runs the authentic routine in Unicorn x86-32 for every frame, compares SHA-256 of the complete expanded output with TypeScript output, and checks an output guard for overruns. **6,654 passed, zero mismatches.** See `evidence/mk3-emulation-verification.json` and `mk3-emulation-cases.json`. This proves decompression and extent, not fighter palettes or gameplay semantics.

Executable mapping: bound LE physical 0x290A4; bound module base 0x26654; relative data-pages field 0x69E00; actual code page base 0x90454; object-2 file base 0x12B454. Caller 0xC0CA0 selects bit depth, calls decompression, then 0xD2CCC applies palette-index shift to opaque literals and 0xD2B17 creates row offsets. That index-shift path is a useful next palette research anchor.

## 10. MK3 animation leads, not qualified implementation

FTRs contain ATHD, ATAB and ATYP triples. In BLADE Anitab0, ATYP values are 0 (468 cells), 1 (105), 2 (633). Early type-1 values are byte offsets into ATAB; type-2 values are multiples of 36 consistent with FHDS records. The first eight type-2 values in the first stream are 0,36,72,108,144,180,216,252 followed by type-0 value 1 and type-1 value 352 pointing back to the stream start. Other streams use control values 0,2,5 etc.

This is a strong structural lead, not permission to export all streams as canonical gameplay animations. Different ATHD variants have different frame counts (BLADE 309 versus 363) and model/header joins must be connected through loader code. The current browser only allows user-selected sprite chains; it does not yet claim compiled automatic animation extraction for MK3.

## 11. Browser/export implementation map

| File | Responsibility |
|---|---|
| `src/core/assets/model.ts` | Shared asset/collection models with confidence, source extent and metadata |
| `src/core/assets/collection.ts` | MK1/MK2 adapter orchestration; MK3 dispatch |
| `src/core/assets/mk1Pipeline.ts` | 57-step export dependency closure of existing MK1 research workflow |
| `src/core/assets/mk2Pipeline.ts` | Existing O67–O89 evidence chain; still computes some unnecessary intermediate bundles |
| `src/core/assets/mk3Collection.ts` | MK3 sprites, IFF, WAV, OGG, raw chunks and unknown ranges |
| `src/core/assets/export.ts` | PNG, ordered ZIP+metadata/index sidecars, sprite sheet, APNG, alpha composition |
| `src/components/AssetBrowser.tsx/.css` | Search, filters, paginated cards, inspector, selection queue, canvas |
| `src/components/MidiPreview.tsx` | Local soundbank upload and worklet MIDI preview |
| `src/core/filesystem/ZipDirectorySource.ts` | Read-only ZIP store/deflate source, CRC and bounds checking |
| `src/components/DirectoryPicker.tsx` | Folder and direct game-ZIP selection |
| `src/App.tsx` | Primary asset browser, old research panels inside Advanced disclosure |
| `scripts/local-runtime.cjs` | Portable TS research runner using TypeScript transpilation and read-only filesystem source |

Export selection is ordered, independent of canvas, with Ctrl/Command toggle and Shift range; reordering/removal buttons are present. APNG and sheets use top-left alignment and explicit user timing. ZIP includes a manifest and indexed/mask sidecars where available. Composition performs alpha blending, clipping and horizontal flip. Canvas supports dropping assets and numeric placement edits; direct dragging/reordering of already-placed canvas layers has not been implemented. No project save/reload or undo stack yet.

ZIP import verified every file's CRC and size in the supplied archives: MK1 326 files, MK2 614, MK3 87. It rejects encrypted, unsupported, split/ZIP64 archives, duplicate/unsafe paths and excessive expanded sizes. It uses DecompressionStream and targets modern browsers. It does not write archive paths to disk.

## 12. Tests and honest integration status

Completed:

- TypeScript `npm run lint` passed after ZIP/MIDI/browser additions.
- Production Vite build passed; only the existing large-chunk warning remains (about 3 MB main JS before gzip).
- Authentic MK1 export pipeline and MK2 O67–O89 chain ran successfully using the local runtime.
- MK3 collection census: 9,186 assets, 6,654 sprites, 416 images, 1,024 waves, 46 music tracks, no reported decoding failures.
- Original-code MK3 emulation: all 6,654 frames matched.
- Original-code MK2 music emulation: all 212 tracks across 33 songs matched event bytes/ticks/end/loop boundaries.
- `scripts/test-asset-exports.cjs`: alpha composition, horizontal flip, clipping, invalid sizes, selected ZIP ordering, indexed sidecars, corrupt MFIL, invalid IFF/MIDI checks passed.
- Independent Pillow APNG validation confirmed two-frame order, 125ms duration and exact RGBA pixels; sprite-sheet dimensions and pixels also matched.
- In-app browser loaded the MK3 folder, detected the game, decoded all 9,186 assets, and displayed cards. Ctrl-click selected two items; Shift range selected four. Adding to canvas did not change export selection. No browser console errors were observed at that point.
- ZIP loader authenticated all supplied archive member CRCs/sizes in Node.

Incomplete verification and known risks:

- Browser APNG download observation timed out in the automation tool; the downloaded file was not captured/verified through that UI path. Generator output itself passed independent decoding. Do not report full browser download end-to-end success.
- MIDI worklet/soundbank playback has not yet been manually heard or fully tested end-to-end. Only code compilation and original-event conversion are verified.
- Direct ZIP opening was added after the folder UI test; its decoder was verified in Node, but ZIP picker UI still needs an end-to-end browser pass.
- Full historical Vitest suite was not rerun in this continuation. Do not substitute the focused checks for it.
- MK1 `.WAV` case sensitivity bug found in collection census was fixed; final checkpoint census is the authority for the fix.
- MK1/MK2 adapters rely on evidence packages and do not populate exact original byte extents for every PNG entry; some source paths/lengths are package-oriented or zero, with evidence references. Improve per-asset original provenance rather than claiming it complete.
- MK1 unresolved grayscale assets currently lack indexed sidecars in the shared adapter, although evidence packages remain available. Preserve this distinction.
- Long research passes still run on the browser main thread; cancel is checked between steps, not within every loop. Memory can be substantial (thousands of RGBA frames and multiple packages). Move decoding to workers and bound cache/export memory before calling this robust for arbitrary inputs.
- Repeated rescan, source changes during asynchronous loading, empty/nonnumeric inputs, MIDI engine teardown while loading, bank replacement failure, and natural playback-end UI status deserve focused testing/hardening.
- Selection stores unique asset IDs, so repeated use of the same frame in a manually edited chain is not yet supported.
- PNG/APNG export metadata is not embedded in the image; use ZIP/evidence/scene metadata alongside standalone images.

## 13. Reproducing the checks

Node scripts require installed project dependencies. From source root:

```text
npm run lint
npm run build
node scripts/verify-checkpoint.cjs ../fixtures
node scripts/test-asset-exports.cjs
node scripts/probe-mk3.cjs ../fixtures/mk3
```

Python emulation uses project-local `.tools` with Unicorn. `scripts/disasm-mk3.py` uses Capstone; independent image validation uses Pillow. These third-party Python installations are excluded from the source download. Install into `.tools` if rerunning, e.g. `python -m pip install --target .tools unicorn capstone pillow`.

```text
python scripts/verify-mk3-emulation.py
python scripts/verify-mk2-music.py
```

Those two scripts expect sibling `../fixtures/mk3` and `../fixtures/mk2` plus their packaged JSON case/event evidence. They never execute the game natively; they run isolated routines in the emulator. Sandbox-specific note: installed Python packages and esbuild required escalated local execution in this session because the Windows sandbox could not read some installed tool files. This was a tooling restriction, not a game-data finding.

## 14. Recommended continuation order

1. Verify the downloadable archive manifest and fixture hashes; read this current section before historical appendix.
2. Finish browser integration QA: all three ZIPs, asset previews/audio, selected ZIP/APNG/sheet downloads, canvas exports, MIDI soundbank load/play/stop/change. Fix concrete failures and update evidence.
3. Improve per-asset original provenance and indexed sidecars; add progress/cancellation and worker execution; persist composition/selection projects; permit duplicate frames in chains.
4. Finish MK2 U8 loader/range/signedness proof, explicitly resolving the four exceptional headers; then expose qualified WAV exports and preserve originals.
5. Connect MK3 frame palette/index-shift and loader tables to exact records. Prove palette ownership with original-code/runtime evidence before exposing color fighter output.
6. Resolve MK3 ATAB/ATYP relocation, controls and multi-model FHDS joins. Build bounded structural animation IR, compose parts using proven coordinates, preserve loop/control evidence, and separate timing claims.
7. Complete MK2 remaining palette/animation/stage contracts and MK3 stage resource/placement graph. Recognizable source images alone do not establish assembled levels.
8. Revisit MK1 compiled animation assembly and remaining music/SAMPLES.DAT questions without weakening existing boundaries.
9. Run appropriate regression checks, make a new current handoff, and only call the broader goal complete when the requested asset types and usable workflows are actually covered or explicitly scoped with the user.

## 15. Sources and dependency provenance

Primary forensic authority is the user's original game bytes and the executable routines identified above. SDL_image's upstream `src/IMG_lbm.c` was consulted for standard IFF behavior; the DOS-specific reader here was independently implemented and its nonstandard fixture layouts derive from the supplied bytes. Official MIDI documentation was consulted for SMF framing. SpessaSynth official documentation was used for worklet/sequencer integration:

- https://github.com/libsdl-org/SDL_image/blob/main/src/IMG_lbm.c
- https://midi.org/standard-midi-files
- https://spessasus.github.io/spessasynth_lib/getting-started/simple-example/
- https://spessasus.github.io/spessasynth_lib/synthesizer/importing-the-worklet/

No external source supplied the MK3 decompressor or MK2 music format implementation. Local synthesizer bundles retain upstream license notices. No copyrighted game fixture files or soundbanks are included in the downloadable source archive.


---

# Historical appendix — complete handoff through O89

The following document is preserved verbatim as project history. Current status and the latest user request are described above; old pause directions and milestone labels are not current instructions.

# MK DOS Archive — Authoritative Master Project Handover

**Reconciled:** 2026-10-03 (SAST)  
**Coverage:** project inception through Pass 1E.3O.89 verified MK2 slot-9 connected `NJ4.GRA` correct-colour contract, preserving the existing O88 eight-contract integration bundle plus slot-specific/noncanonical shared-NJ boundaries and all unresolved naming/whole-family boundaries
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

**Pass 1E.3O.20** joins that character/ANITAB selector to the independently verified nine-slot normal/alternate palette selector. Both are indexed by the same object character-identity field `+0x48`, but the outputs are distinct semantic axes. The decisive counterexample is IDs 4/5: Scorpion and Sub-Zero share `NINJA_ANITAB` while using different normal/alternate palette pairs. Slots 0..6 can also switch normal/alternate palettes without changing their ANITAB family. Therefore palette context must be explicit in export IR; neither ANITAB nor GRA identity is a sufficient palette key.

**Pass 1E.3O.21** establishes the bounded direct `GET_CHAR_ANI` consumer surface. Canonical code contains 241 direct calls; 220 are immediately preceded by exact constant writes to `A9`, exposing 65 distinct directly observed numeric animation indices, while 21 dynamic/non-adjacent consumers remain explicitly unresolved. Nearest Watcom symbols are context only, not canonical animation names.

**Pass 1E.3O.22** packages the structural/resource/character evidence into the first product-facing animation export manifest: 9 character contexts, 8 ANITAB families, all 739 discovered table entries preserved, and 592 image-bearing entries ready for indexed/composited export. Palette binding and gameplay naming remain separate confidence axes; only three already-qualified palette bindings are promoted.

**Pass 1E.3O.23** proves the first end-to-end correct-color RGBA export fixtures from authentic installation bytes. Kano heart-rip frames are decoded/composited under the independently qualified `BLOOD_P` binding and Rayden normal lightning sprites under `MORPH_P`. The pass renders 8 heart sequence occurrences (7 unique records) plus 13 lightning descriptors for 21 deterministic RGBA payloads, with zero decode failures and zero out-of-palette opaque indices. A fresh post-timeout recheck reproduced semantically identical machine evidence and byte-identical PNGs.

**Pass 1E.3O.24** broadens correct-color rendering only where palette context is already qualified. Across 9 character contexts and 8 ANITAB families, the structurally dominant resource contributes 1,016 unique descriptors / 1,190 character-context descriptor instances, which render into 2,263 explicit normal/alternate RGBA variants with all opaque indices inside the selected 23-color palette records. Shared `NINJA_ANITAB` geometry is rendered under four distinct Scorpion/Sub-Zero palette records. Cross-resource/effect descriptors remain excluded; dominance is not promoted to universal palette ownership. A fresh post-timeout recheck again reproduced semantically identical report content and byte-identical sample PNGs.

**Pass 1E.3O.25** bounds the palette-binding exception surface left by O24 instead of guessing at the excluded descriptors. Of the 1,102 O18 animation-graph descriptors, 86 lie outside each character/table's structurally dominant animation resource: 45 in `STANCE.GRA`, 28 in `FONTS.GRA`, 6 in `VICTORY.GRA`, and 7 Kano heart descriptors in `MISC.GRA`. Only the 7 heart descriptors have an independently qualified cross-resource palette binding (`BLOOD_P`), leaving **79 cross-resource descriptors intentionally unresolved**. O25 also records five ANITAB-reached Rayden lightning descriptors inside dominant `RAIDEN.GRA` that are independently qualified to `MORPH_P`, directly disproving any universal rule that dominant-resource identity implies body-palette ownership. Ten additional qualified off-table effect descriptors are retained as further evidence that the ANITAB graph is not the complete effect universe. Fresh authentic-install rerun is semantically identical. Verdict: `MK1_PALETTE_BINDING_EXCEPTION_SURFACE_BOUNDED`.

**Pass 1E.3O.26** broadens local animation-executor knowledge into an export-side control/timing census. Canonical `DO_NEXT_A9_FRAME` command semantics are reverified (END, stream jump, `FLIP_MULTI`, X/XY adjustments, no-sleep frame assignment, callback, ordinary frame target), and `MFRAMEW` is reverified to use a **caller-supplied EAX dwell argument**, sleeping through `PRCSLP` after ordinary frames while reparsing immediately after opcode 5. Across 514 unique O17 streams, O26 counts 453 END-terminated streams, 61 looping streams, 1,824 frame events (1,818 sleeping + 6 no-sleep), 83 jumps, 14 flips, 27 X adjustments, 175 X/Y adjustments and 34 callbacks. Canonical code also contains 162 direct near tail transfers to `MFRAMEW`; 158 expose immediate dwell arguments and 4 remain dynamic/unclassified. Immediate dwell values range 1..48 across 10 distinct values, but their wall-clock unit is **not established**, and no dwell is assigned universally to every ANITAB entry. Fresh rerun is semantically identical. Verdict: `MK1_STREAM_CONTROL_AND_MFRAMEW_DWELL_SURFACE_ESTABLISHED`.


**Pass 1E.3O.29** follows those O28-created background objects into the canonical renderer and closes several previously explicit unknowns. MK1 has a nine-record plane model; the renderer traverses BAK planes in exact order **8 → 7 → 6 → 5 → 4 → 3 → 2 → 1 → 0**, with five special/non-BAK lists interleaved. Within each list, objects are sorted ascending by object `+0x18` and then signed 16.16 Y (`+0x14`), while exact-equal ties remain insertion/culling-history dependent. O29 also statically promotes O28's coordinate pair to X/Y and proves ordinary BAK placement objects project as `screenX = worldX - planeScrollX`, `screenY = worldY - sharedScrollY`. For `PIT_MOD`, initial scroll is X=211, Y=35. Verdict: `MK1_BACKGROUND_RENDER_ORDER_AND_CAMERA_PROJECTION_ESTABLISHED_EQUAL_KEY_TIES_AND_DYNAMICS_PENDING`.

**Pass 1E.3O.30** directly tests the user's warning that stage backgrounds may themselves animate. The warning is confirmed: canonical MK1 backgrounds include scheduler-driven descriptor animation and positional motion. Across all 24 O27 top-level background modules, O30 finds seven init-callback classes; 10/24 module records use callbacks that directly spawn processes, with eight bounded spawn edges. Qualified descriptor-cycle families include CAVE (28 slots / 6 unique descriptors, 8 scheduler-tick cadence), PILLAR (three independent 8-slot cycles / 24 unique descriptors, plus motion), and ARENA (6-state active cycle), for 58 active frame slots and 36/36 unique authentic GRA descriptor decodes. PIT is also dynamic through a bound-recomputation callback and motion processes even though no equivalent PIT descriptor-cycle table is qualified. O35 later refines that bound callback specifically to `SHAD_SCRNTL` shadow/render state rather than camera mutation. Timing is expressed only in **scheduler ticks**, never milliseconds/FPS. Verdict: `MK1_BACKGROUND_DYNAMIC_PROCESS_AND_DESCRIPTOR_ANIMATION_SURFACE_ESTABLISHED`.

The stage export model must therefore remain time-aware. A static flattened PNG can be a convenience snapshot, but it is not the canonical lossless representation for dynamic stages. The stronger model is now: **resource graph + planes + placements + palettes + camera state + renderer order + dynamic process graph + descriptor-cycle state + positional motion + explicit time/process state**.

**Pass 1E.3O.31** closes the remaining structural join between the O27 scene-entry arrays and O29's nine BAK planes. Canonical `INIT_BAKMODS` writes BMOD scene-entry pointers or literal-one skip markers into consecutive 4-byte `BAK0MODS..BAK8MODS` slots beginning at each top-level module's header `+0x18`, while `MULTI_PLANE` consumes one such slot per 20-byte plane record. All 24 modules / 72 scene slots therefore receive exact plane identities. Expanding the 68 BMOD scene references yields **4,488 instantiated placement objects** while preserving the 2,550 unique underlying BMOD records. The join resolves O30's placement-bound dynamic targets: ARENA maps to 8 plane-3 + 7 plane-4 objects per normal/386 variant; PILLAR's three cycle filters bind to 1 / 1 / 2 exact normal-module placements. ARENA selectors 11 and 0 alias the same `FU2PALS` record at `0x0000F9E2`, and this palette state is runtime-grounded through BAKGND creation plus O30's palette-preserving descriptor swaps. CAVE remains a special-process-object family and is not falsely forced into placement IR. Independent byte-level audit matched the O31 report. Verdict: `MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED`.

**Pass 1E.3O.32** turns that join into the first bounded animated-background export fixture. Normal `ARENA_MOD` has 15 placement objects across planes 3 and 4. The qualified updater traverses both lists, cycles six authentic `FU2HDRS.GRA` descriptors every eight scheduler ticks, and preserves the BAKGND-selected object palette. Plane-3 selector 11 and plane-4 selector 0 alias the same 49-colour `FU2PALS` record `0x0000F9E2`, so all six states render through affirmative runtime-state palette binding rather than resource-name or compatibility inference. The six exported transparent RGBA states have checksums `952a82ef`, `9e5e7284`, `65368091`, `8fe804d9`, `7596a040`, `a836e0c9`; independent Python uGRA/palette reconstruction matched all six emitted PNG RGBA buffers byte-for-byte. A flattened composite is deliberately withheld because each target plane is an exact-equal sort-key group and the 81/82-pixel sprites overlap at roughly 69/70-pixel spacing; O29 leaves that visible tie order runtime-history dependent. Timing remains scheduler ticks and the exported state sequence is normalized rather than claimed as canonical absolute phase. Verdict: `MK1_ARENA_BOUNDED_ANIMATED_SCENE_EXPORT_FIXTURE_ESTABLISHED`.

**Pass 1E.3O.33** qualifies the positional-motion/reset family that O30 had only bounded structurally for `PILLAR_MOD`. The process-created moving clouds are distinct from the four ordinary BMOD placement objects used by PILLAR's 4-tick descriptor cycles. Canonical code creates three multipart cloud groups on BAK plane 6 through `ADD_TO_MASTER_LIST`; `SET_MULTI_NS` marks every part no-scroll, so the renderer bypasses plane-X and shared-Y camera subtraction for these objects. The groups use seven authentic `FU4HDRS.GRA` descriptors and an affirmatively linked 12-colour `cloud_p` record. Initial animation anchors are (16,28), (157,28), and (311,28), yielding raw root integer positions (-33,24), (74,30), and (262,24). Every root receives signed 16.16 X velocity `0x00006666` (0.399993896484375 pixels per display-active object update), propagated to all multipart parts. The process polls every eight scheduler ticks; when signed integer root X exceeds 319 it temporarily zeroes velocity, shifts the complete multipart group by exactly -459 X, and restores velocity while preserving the fractional component. On the explicitly normalized display-active path, first wrap polls occur at ticks 152 (group 3), 616 (group 2), and 888 (group 1). The broader scheduler may traverse without `DISPLAY_ALL`, so no universal scheduler-tick-to-display-update or wall-clock rate is promoted. Independent byte/decode/timing audit matched the implementation. Verdict: `MK1_PILLAR_CLOUD_MOTION_AND_WRAP_SEMANTICS_ESTABLISHED`.

**Pass 1E.3O.34** packages PILLAR's two independently qualified dynamic axes without inventing synchronization between them. The placement-bound descriptor track preserves O31's exact PILLAR bindings: control-high 4 = one plane-0/key-4 object, control-high 3 = one plane-1/key-3 object, and control-high 2 = two plane-1/key-2 objects. Selectors 9 and 12 both alias the same 17-colour `fu4PALS` record at `0x0000FAE0`, and O30's descriptor-swap helper preserves the existing object palette field. This yields 24 correct-colour descriptor-cycle RGBA/PNG states (three tracks × eight states) at a qualified four-scheduler-tick cadence. The separate cloud track exports seven correct-colour `cloud_p` part assets plus a 112-poll normalized motion timeline from tick 0 through the last first-wrap event at tick 888. In total O34 exports **31** deterministic RGBA/PNG payloads with zero decode or palette-range failures. An independent Python uGRA/palette/PNG audit reconstructed all 31 payloads byte-for-byte and independently reproduced the complete normalized cloud timeline. Because canonical absolute phase between the 4-tick descriptor cycles and the 8-tick cloud process is not independently established, the package preserves them as separate normalized tracks and does not claim a canonical flattened PILLAR frame. Verdict: `MK1_PILLAR_BOUNDED_DYNAMIC_SCENE_EXPORT_PACKAGE_ESTABLISHED`.

**Pass 1E.3O.35** resolves the three PIT dynamic callbacks that O30 had intentionally left broad. Callback `0x4920` is now proven to update `SHAD_SCRNTL`, not the PIT camera: every scheduler tick it computes `(2 * CEILING_Y - signedHighWord(WORLDTLY) + 126) << 16`, and `DISPLAY_ALL` consumes that state for the special shadow list. Callback `0x494A` creates ten persistent no-scroll multipart groups on plane/list 2 from eight unique authentic `FU5HDRS.GRA` descriptors using directly linked 14-colour `dcloud_p`. Their exact X-velocity classes are `0x6666`, `0x4CCC` and `0x3333`; the process polls every eight scheduler ticks and shifts an entire multipart group by -459 X when signed integer root X exceeds 319. The conditional `0x4870` family selects one of eight `dcloud_p` silhouette descriptors, creates a no-scroll plane-3 object at (-80,37), moves it with velocity `0x19999`, crosses the first normalized local threshold at tick 250, pauses 288 scheduler ticks, restores velocity at tick 538, and deletes after the second threshold at tick 788. All 16 unique dynamic descriptors independently decode within palette range. No universal scheduler/display/wall-clock equivalence is promoted. Verdict: `MK1_PIT_DYNAMIC_MOTION_SHADOW_BOUND_AND_TRANSIENT_LIFECYCLE_ESTABLISHED`.

**Pass 1E.3O.36** joins that process state to the already-qualified PIT static scene without fabricating unresolved synchronization or camera history. The export contains all 358 ordinary PIT placements and **88** O28 correct-colour placement variants, plus **8** persistent `dcloud_p` part assets and **8** transient silhouette assets: **104 deterministic RGBA/PNG payloads** total. Its normalized persistent track contains 265 eight-tick polls through tick 2112 and 12 exact wrap events; its transient track preserves the exact spawn gate, 32-tick initial process wait, and 250/538/788 object-local lifecycle; its one-tick `SHAD_SCRNTL` track remains symbolic because runtime `CEILING_Y`/`WORLDTLY` inputs are not bound. An independent Python reconstruction matched all 104 PNG raw-RGBA payloads and reproduced the exported motion timelines. Canonical full-stage flattening remains blocked by equal-key order history, runtime camera evolution, conditional/random transient state, unresolved absolute mutual phase and the symbolic shadow-bound inputs. Verdict: `MK1_PIT_BOUNDED_DYNAMIC_SCENE_EXPORT_PACKAGE_ESTABLISHED`.

**Pass 1E.3O.37** closes the CAVE special-process-object gap left open by O30/O31. Unless numeric `GSTATE == 11`, callback `0x4680` spawns process `0x2025` at `0x4699`; the child creates six linked `BAKLST9` objects at exact creation-state offsets `(57,100)`, `(96,112)`, `(128,106)`, `(230,106)`, `(268,112)`, `(396,112)`. Their creation record directly binds descriptor `0x264C` and the three-colour `eyez2` palette at `0x0001003A`. Each object receives one sequential `RANDU(28)-1` result, establishing an initial phase domain 0..27 without establishing RNG seed/state or a joint six-object phase vector. All six unique `FU7HDRS.GRA` cycle descriptors decode successfully within `eyez2`, and the six linked objects advance through the same 28-slot table every eight scheduler ticks. `BAKLST9` renders before plane 8; flags remain `2`, so the qualified creation-state projection uses the plane-8/shared camera rather than no-scroll bypass. Independent byte/decode audit matched the implementation. Verdict: `MK1_CAVE_SPECIAL_OBJECT_RANDOM_PHASE_AND_PALETTE_BINDING_ESTABLISHED`.

**Pass 1E.3O.38** packages CAVE without fabricating its unresolved random state. Both CAVE module variants retain their O31 ordinary scene context (204 placement instances for `CAVE_MOD`, 133 for `CAVE_MOD386`) plus the process-created `BAKLST9` layer. The export contains six unique correct-colour `eyez2` RGBA/PNG payloads and the complete 28-slot normalized phase-zero template at eight scheduler ticks per transition. Each runtime object preserves an explicit 0..27 initial-phase domain with progression `(p+n) mod 28`; phase zero is an export coordinate system, not a claim about runtime startup. Independent Python reconstruction matched all six PNG raw-RGBA buffers exactly and independently matched the 28 canonical cycle slots. No joint phase vector, canonical first rendered frame, wall-clock timing, or full-stage flattened animation is manufactured. Verdict: `MK1_CAVE_BOUNDED_RANDOM_PHASE_DYNAMIC_EXPORT_PACKAGE_ESTABLISHED`.

**Pass 1E.3O.39** resolves O30's only external unresolved stage child through authentic Watcom symbols as `BIGEMP_PROC` at `0x000276B4` in `EMP.ASM`. All three STRIPPED variants unconditionally spawn process `0x2000`. `INIT_MULTI` builds a five-part multipart from local setup `0x000128FE`, directly binds it through `EMPCLP2 +0x0C` to the count-prefixed 23-colour `EMP_P`/`YANG_P` record at `0x00010356`, anchors it at world animation coordinates `(558,42)`, gives every part primary sort `0x00010000`, and inserts every part into `BAKLST4` / renderer plane 4 with ordinary scroll projection. Twelve unique `FU8HDRS.GRA` descriptors decode successfully in palette range. Seven exact five-part frame records are selected every eight scheduler ticks from signed-high-word `WORLDTLX`: index 3 for `x<=169`, otherwise `min(6,floor(abs(589-x)/60))`. The initial STRIPPED camera value 405 selects index 3 / `EMPHEAD1`. Independent canonical-byte/uGRA audit matched all code anchors, palette words, descriptor checksums, frame records, selector samples and projected part positions. Verdict: `MK1_STRIPPED_BIGEMP_MULTIPART_VIEW_SELECTION_ESTABLISHED`.

**Pass 1E.3O.40** packages that qualified process-created multipart without pretending STRIPPED has a canonical whole-stage frame. The three O31 STRIPPED variants retain 201 / 195 / 90 ordinary placement instances. O40 exports 12 direct `EMP_P` descriptor payloads plus seven exact five-part transparent emperor composites: **19 deterministic RGBA/PNG payloads total**. Every composite is 47×91 pixels and preserves renderer secondary-Y ordering. The only exact-Y tie is `EMPBODP1`/`EMPBODP2`; their horizontal rectangles do not overlap, so unresolved equal-key insertion order cannot change composite pixels. Independent Python reconstruction matched all 19 PNGs at raw RGBA level and re-derived the seven EXE frame selections. The selector remains camera-driven state, not an autonomous animation clock; absolute process/display phase, wall-clock timing, later camera evolution and canonical whole-stage flattening remain unclaimed. Verdict: `MK1_STRIPPED_BOUNDED_BIGEMP_VIEW_EXPORT_PACKAGE_ESTABLISHED`.

**Pass 1E.3O.41** resolves the renderer-history mechanism behind O29's exact-equal sort-key uncertainty. Canonical `YZSORT` stably repair-sorts `OBJLST`, `OBJLST2` and `OBJLST3` before active display; list `0x563B8` is qualified as the shadow list rendered under `SHAD_SCRNTL`; and the ordinary BAK maintenance path is now bounded through `BAKCLR`, `BGND_UD1`, `BACKGROUND`, culling and `INSOBJ_V`. `BACKGROUND` updates every eight scheduler ticks; the active rectangle extends the renderer window by 68 horizontal / 48 vertical pixels; off-window objects clear their placement occupancy byte and can later be recreated. Because new exact-equal objects insert before surviving equal peers, arbitrary later tie order genuinely depends on cull/recreate history. A deliberately defined fresh PIT state is nevertheless deterministic: after empty occupancy, camera X=211/Y=35 and first `MULTI_PLANE`, 15 ordinary placements are active, six visible, and plane-1 head-to-tail order is `169→124→72→143→75→58`. Independent direct-EXE audit reproduces all of it. Verdict: `MK1_RENDERER_SPECIAL_LIST_CLIPPING_AND_BACKGROUND_HISTORY_ORDER_SURFACE_ESTABLISHED`.

**Pass 1E.3O.42** consumes only that O41-qualified fresh state and establishes the first deterministic ordinary-background compositor fixture. The 320×200 transparent PIT layer uses two O28 correct-colour source variants and six placement instances in the exact fresh order above. It contains **10,278 opaque pixels**; raw-RGBA SHA-256 is `a0d3f10adf58c9a22dc53898ed618ad07fbb1e5bc0c5a56ce1b877f7d6dbe4bc`. The exact-equal 169/124 pair shares 26 opaque overlap pixels and 22 differing-colour pixels, proving that tie order materially changes the raster. Independent Python reconstruction from authentic EXE/FU5HDRS.GRA bytes matched both source PNGs and the composite exactly (**3/3 raw-RGBA matches**). Process-created PIT dynamics, special lists, later camera/cull history, fighters and HUD remain excluded; this is not a canonical gameplay screenshot. Verdict: `MK1_PIT_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_FIXTURE_ESTABLISHED`.

**Pass 1E.3O.43** generalizes the O41/O42 fresh empty-state/first-population contract across every O27 top-level background module without importing process-created or special-list state. All **24/24 modules qualify** under their O31 initial camera and plane-slot mappings. The generalized fresh state contains **2,575 active ordinary placement instances**, **2,153 viewport-visible placements**, **512 visible exact-equal key groups**, and **521 geometrically overlapping exact-equal pairs**. Every complete per-module renderer-order placement sequence was independently recomputed, and the generalized PIT result exactly reproduces O41/O42's 15-active / 6-visible order `169→124→72→143→75→58`. Verdict: `MK1_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS_ESTABLISHED`.

**Pass 1E.3O.44** turns that census into a deterministic multi-stage ordinary-background export package. From authentic HDRS.GRA payloads and the exact count-prefixed palette record selected by each visible placement, it exports **370 unique correct-colour source variants plus 24 transparent 320×200 module composites = 394 RGBA/PNG payloads**. Independent Python decoding/colorization/compositing matched **370/370 source PNGs and 24/24 composites exactly at raw-RGBA level**. There are **22 unique composite rasters** because `PIT_MOD`/`PIT_MOD386` and `GNINJA_MOD`/`GNINJA_MOD386` are exact duplicates in this deliberately bounded ordinary-layer state. PIT reproduces the O42 composite hash exactly. Process/special-list dynamics remain separate; these are deterministic fresh-initial ordinary BAK layers, not canonical gameplay screenshots. Verdict: `MK1_MULTI_STAGE_FRESH_INITIAL_ORDINARY_BAK_EXPORT_PACKAGE_ESTABLISHED`.

**Pass 1E.3O.45** closes the renderer-facing contract needed to combine those ordinary layers with already-qualified dynamic/special mechanisms without inventing a universal time origin. The canonical traversal is represented as 14 renderer-list slots: first special `0x563CC`, planes 8→1, shadow list `0x563B8`, special `0x563BC`, plane 0, then specials `0x563C4`/`0x563C8`. Eight dynamic-layer contracts are made explicit: ARENA placement mutation, PILLAR placement mutation, PILLAR process clouds, PIT persistent clouds, PIT conditional transient, PIT shadow-bound state, CAVE first-special-list objects, and STRIPPED BIGEMP. Fresh machine evidence also establishes the sort-primary defaults/overrides needed for composition: `INIT_MULTI` initializes multipart `+0x18` to zero, `SET_Z_MULTI` can override it, BIGEMP supplies `0x00010000`, and PIT's transient INITOBJ record uses zero. Five deterministic **normalized test-vector states** are qualified for ARENA/PILLAR/PIT/CAVE/STRIPPED, while runtime shadow values, generic RNG state and absolute cross-process phase remain explicit blockers. Independent EXE audit passed 20/20 checks. Verdict: `MK1_DYNAMIC_SPECIAL_LAYER_COMPOSITOR_CONTRACT_ESTABLISHED`.

**Pass 1E.3O.46** consumes that contract and establishes five exact 320×200 transparent **normalized background compositor fixtures**. ARENA uses state 1 with 11 visible descriptor mutations; PILLAR uses independent track origins with ten post-creation/pre-motion cloud parts and no visible fresh placement-cycle target; PIT uses its persistent post-creation cloud state with 13 part instances, transient explicitly absent and shadow raster symbolic; CAVE uses an explicit six-object all-phase-zero test vector; STRIPPED uses the initial-camera BIGEMP selection-3 state. A separate Python uGRA/palette/compositor implementation reconstructed all five complete rasters from authentic EXE/GRA bytes and matched **5/5 at raw-RGBA level**, with 23/23 audit checks passing. Their raw-RGBA SHA-256 values are ARENA `adbb37df37282cfff1e82541ae4eeb39b0958e6d56c50e64074f8c8dae245007`, PILLAR `e6d5ed7a3c565cafe9945ad89fdeaaefde8987711d5e153ef0cf708a96874de7`, PIT `c0e0dcf5d2d24e463890cedcbb35e59b29a022be7b0053f6eaa886d721af2fe4`, CAVE `feec6d83b3b402e5d94f42db800de6a372febd49d52084c11968c0484d2648f7`, and STRIPPED `c51a14d6b05524e2ea5f541bfaf59a4faddb3da93a5ac2b0ba651c8a07899798`. These are evidence-backed test fixtures, **not canonical gameplay screenshots**. Verdict: `MK1_FIVE_STAGE_NORMALIZED_DYNAMIC_BACKGROUND_COMPOSITOR_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.47** reconciles the now-mature background pipeline into an explicit product export capability matrix for all **24 top-level modules**. Every module has an O44 deterministic fresh ordinary raster and O31 time-aware scene IR. Exactly five modules (`ARENA_MOD`, `CAVE_MOD`, `PILLAR_MOD`, `PIT_MOD`, `STRIPPED_MOD`) additionally have a directly rendered O46 normalized combined fixture. Five process-spawning sibling variants (`ARENA_MOD386`, `CAVE_MOD386`, `PIT_MOD386`, `STRIPPED_MOD386`, `STRIPPED_MOD486`) retain qualified dynamic/process structure but are deliberately not promoted to a direct combined raster. `CHOP_MOD` and `STATUE_MOD` form a separate tier because O30 classifies their init as `STATIC_EXTRA_OBJECT_INIT`; those init-created extras are not part of O44's ordinary layer. The remaining twelve modules honestly expose ordinary raster + time-aware scene IR. Independent reconciliation rebuilt all 24 tier assignments from O30 plus independently verified O31/O44/O46 evidence and matched every ordinary/combined hash. Verdict: `MK1_STAGE_EXPORT_CAPABILITY_COVERAGE_MANIFEST_ESTABLISHED`.

**Pass 1E.3O.48** turns that matrix into a coherent product-facing MK1 stage package without manufacturing unresolved pixels. The package contains **24 stage directories, 24 ordinary 320×200 PNGs, 5 directly verified normalized combined PNGs, 24 per-stage time-aware scene documents and 24 per-stage coverage documents**: 29 raster payloads and 48 per-stage structured documents. The nineteen stages without a direct O46 combined fixture receive no fabricated combined PNG. Independent package audit reparsed every image and matched **24/24 ordinary rasters to O44 raw-RGBA hashes and all 5 permitted combined rasters to O46**, while 24/24 scene documents exactly match O31 rows and 24/24 coverage documents exactly match O47. A fresh extraction of the packaged O48 source reran O47/O48 semantically identically and regenerated all 29 PNGs plus all 48 stage JSON documents byte-identically. Verdict: `MK1_PRODUCT_FACING_STAGE_EXPORT_PACKAGE_ESTABLISHED`. **Later correction:** O49 proves that O44/O46/O48 omitted placement-instance horizontal orientation. O48 remains historically valid for packaging/tier/scene structure, but its affected raster pixels are SUPERSEDED by O50.

**Pass 1E.3O.49** is the visual-review-driven correction pass. Canonical `BAKGND` flag construction and the renderer dispatch table prove that placement control bit `0x0010` selects `fWrtNonZero` / `fClpWrtNonZero`, whose row loops render right-to-left; this is a true **horizontal flip** at draw time. Source uGRA payloads remain authentic and unmirrored. Across the 4,488 O31 instantiated placements, 801 carry the selector; 201 of 2,153 fresh-visible placements across 14 module variants are affected. O49 also closes the shared CHOP/STATUE static-extra path: init callback `0x4850` creates one no-scroll 62×58 moon from `GRAPHICS/MISC.GRA` offset `0x7764`, direct-bound to a 14-colour palette, at screen `(72,15)` on renderer plane 4. Independent canonical-byte audit confirms the dispatch semantics, all placement counts and moon decode/checksum. Verdict: `MK1_BACKGROUND_HORIZONTAL_FLIP_AND_CHOP_STATUE_STATIC_EXTRA_ESTABLISHED`.

**Pass 1E.3O.50** rebuilds the product-facing stage package using the original placement control word at composition time and adds the qualified CHOP/STATUE moon. Exactly 14 ordinary module rasters change; the remaining 10 stay byte/pixel-equivalent, including both PIT variants. The corrected package contains **24 ordinary PNGs, 7 normalized combined PNGs, one shared moon PNG, 24 scene documents and 24 corrected coverage documents**: 32 PNG payloads and 48 per-stage structured documents. Direct combined fixtures are ARENA_MOD, CAVE_MOD, CHOP_MOD, PILLAR_MOD, PIT_MOD, STATUE_MOD and STRIPPED_MOD. Independent Python reconstruction from authentic EXE/GRA bytes passes **122/122 checks**, matching all 24 ordinary rasters and all seven combined fixtures exactly. Verdict: `MK1_CORRECTED_PRODUCT_FACING_STAGE_EXPORT_PACKAGE_ESTABLISHED`.

**Pass 1E.3O.51** qualifies the five process-spawning sibling variants that O47/O50 deliberately left without direct combined rasters: `ARENA_MOD386`, `CAVE_MOD386`, `PIT_MOD386`, `STRIPPED_MOD386`, and `STRIPPED_MOD486`. Qualification is not based on callback-family equality alone. Every row preserves the same authentic resource/file-id context, initialized camera and exact init callback address/classification, plus a mechanism-specific renderer requirement. ARENA386 retains the exact animated `ARENA3BMOD`/`ARENA4BMOD` planes with 15 target objects; PIT386 additionally has an exact ordinary BMOD graph/placement-count match to PIT; CAVE386 and both STRIPPED siblings use the same process-created special/BAK-list mechanisms under matching camera/resource contexts. Independent O30/O31 reconciliation confirms all five qualifications. Verdict: `MK1_FIVE_DYNAMIC_SIBLING_VARIANTS_QUALIFIED_FOR_NORMALIZED_COMPOSITION`.

**Pass 1E.3O.52** renders five exact sibling normalized combined fixtures from each variant's own corrected ordinary topology plus the already-qualified family dynamics. Raw-RGBA SHA-256 values are ARENA386 `6dd30783c5e572b8edd3f9f382beb10b57cb9b4b80b216744a82033e73ca31ad`, CAVE386 `1244625b26d03bd1bbb99976b859d4b1980bb70a2834dac2d2e9bd601079adef`, PIT386 `c0e0dcf5d2d24e463890cedcbb35e59b29a022be7b0053f6eaa886d721af2fe4`, STRIPPED386 `458f866e5c90f60db8d267d66bcdab27886a56715cb14d613d1cb0a3951c2612`, and STRIPPED486 `eee53770400852e6461b5ed693a3dfeb4b83cec73fb52c74979d10cfa838f134`. An independent Python compositor using previously verified O43/O44 and O32/O36/O38/O40 evidence matches **5/5 full 320×200 rasters exactly**. The corrected package now exposes **24 ordinary rasters, 12 direct normalized combined rasters, one shared moon asset, 24 scene documents and 24 coverage documents**. A fresh extraction of the packaged O52 source reruns O51/O52 semantically identically; all **85 per-stage/shared package files** are byte-identical to the accepted package. Verdict: `MK1_FIVE_SIBLING_DYNAMIC_FIXTURES_AND_TWELVE_STAGE_COMBINED_PACKAGE_ESTABLISHED`.

**Pass 1E.3O.53** closes the twelve modules that remained ordinary-only after O52. Their top-level module init pointer is exactly Watcom `0x00004CAA`; on canonical `MK1.EXE`, physical `0x000556FE` is the literal single-byte instruction `C3` (`RET`). O30 independently records the class with zero child callbacks, O31 maps all twelve module init pointers to that same callback/classification, and O45 contains no dynamic/special renderer contract for any member. Independent audit against the pre-O53 O30/O31/O45 evidence and raw EXE bytes passes **8/8 checks**. Verdict: `MK1_TWELVE_NO_OP_STAGE_BACKGROUND_COMPLETENESS_ESTABLISHED`.

**Pass 1E.3O.54** promotes only those twelve O53-proven no-op modules. Their corrected ordinary PNG is copied byte-for-byte into the normalized combined product slot, so no new object, timing state, palette inference, camera state or pixel behavior is invented. The existing twelve O50/O52 combined fixtures remain unchanged. The package now contains **24 corrected ordinary PNGs, 24 normalized background previews, one shared moon PNG, 24 scene documents and 24 coverage documents**. Independent package audit passes **14/14 checks**. A fresh extraction of the packaged O54 source reruns O53/O54 semantically identically; 98 stable package files (excluding run-metadata root reports) are byte-identical to the accepted package. Verdict: `MK1_ALL_24_STAGE_NORMALIZED_BACKGROUND_PREVIEWS_ESTABLISHED`.

**Pass 1E.3O.55** productizes that package in the normal browser/user-directory workflow. The app now builds a one-click downloadable ZIP directly from the already-verified O54 payload/document graph: 49 PNGs, 48 stage JSON documents, three root research reports and the README, for 101 logical entries. PNGs use deterministic browser-safe RGBA8/filter-0/stored-DEFLATE encoding and the existing dependency-free STORE-only ZIP writer; no descriptor decoding, palette selection or stage composition is repeated at download time. Final accepted browser ZIP SHA-256 is `158c0e1c4311fa8eed4d897d50fdc34176b46d44920a35f2d3196b7efbdd34f7`. Verdict: `MK1_BROWSER_USER_DIRECTORY_STAGE_EXPORT_DOWNLOAD_ESTABLISHED`.

**Pass 1E.3O.56** independently parses and validates the browser package. Its validator checks ZIP CRCs, independently inflates the O55 stored-DEFLATE PNG streams, validates PNG CRC/Adler state, and compares all 49 decoded RGBA payloads plus all 48 stage documents and three root reports against the verified O54 graph. A separate Python audit against the actual standalone `MK1_O54_STAGE_EXPORT_PACKAGE.zip` confirms the same 101-file logical inventory, 49/49 exact raw-RGBA matches, 48/48 byte-exact stage documents, byte-exact README and 3/3 semantically equal root reports after removing only expected run metadata. Verdict: `MK1_BROWSER_STAGE_EXPORT_BUNDLE_VALIDATED_AGAINST_O54_CANONICAL_CONTRACT`.


**Pass 1E.3O.57** closes the accumulated UI-results gap without creating dozens of bespoke result panels. The existing `ResearchArtifact[]` stream produced by **Run What's Needed** is now the canonical presentation feed for a new data-driven **Research Results Workspace**. The workspace provides an overview, stable domain grouping, searchable/filterable pass explorer, pass/status/verdict/validation summaries, per-artifact JSON download, lazy raw-report inspection, and a 24-stage visual gallery backed directly by the verified O54 ordinary/normalized RGBA payloads plus exact scene/coverage documents. Existing specialist editors remain separate and unchanged. Direct authentic-fixture smoke confirms all 65 historical artifacts through O56 are representable and all 24 stage entries contain exact 320x200 ordinary + normalized RGBA and both structured documents. Verdict: `MK1_RESEARCH_RESULTS_WORKSPACE_AND_STAGE_GALLERY_ESTABLISHED`.

**Pass 1E.3O.58** independently validates the O57 presentation model. The same generic presentation builder used by the React component is exercised against all 66 artifacts through O57; no prerequisite artifact is dropped. A synthetic future-pass metadata probe is then appended to the artifact array and appears automatically in the product/UI group without any bespoke registration, proving the explorer is future-pass-safe. A separate source-level audit passes 19/19 checks covering the 67 unique pipeline pass labels, O57/O58 ordering, workspace import/state/render wiring, 24-stage gallery, ordinary/normalized toggle, per-artifact JSON download and lazy report view. O58 itself is appended through the same generic path, so the completed UI exposes 67 result artifacts. Verdict: `MK1_RESEARCH_RESULTS_UI_COVERAGE_AND_DATA_DRIVEN_PRESENTATION_VALIDATED`.

**Pass 1E.3O.59** converts the verified O18-O26 animation graph into an explicit product/export capability contract rather than treating all decoded descriptors as equivalently colour-qualified. Exact coverage is 9 character contexts, 8 ANITAB families, 739 table cells, 592 indexed-export-ready image entries, 1,102 decoded descriptors, 2,263 explicit O24 character-context RGBA variants, 21 independently palette-qualified O23 effect payloads, 79 O25 cross-resource descriptors that remain palette-unresolved/indexed-only, and 514 O26 unique streams with structural control/timing metadata. No unresolved palette is guessed, no canonical gameplay animation name is invented, and dwell/tick values are not converted to milliseconds/FPS. Verdict: `MK1_ANIMATION_EXPORT_CAPABILITY_COVERAGE_MANIFEST_ESTABLISHED`.

**Pass 1E.3O.60** materializes that contract as a browser-downloadable MK1 animation package. The verified ZIP contains 2,295 logical entries: 2,263 character-context PNGs, 21 verified-effect PNGs, a lossless 11,230,148-byte indexed descriptor binary covering all 1,102 descriptors, an indexed manifest, an animation asset manifest, seven prerequisite/coverage reports and README. A separate Python decoder/auditor passes 22/22 checks: all 1,102 indexed descriptors are independently decoded from authentic GRA bytes, all 2,263 context PNG aggregates/samples reproduce O24, all 21 effects reproduce O23, and all 79 unresolved palette cases are present indexed while receiving no guessed context RGBA. The app now exposes **Download Animation Package**, the normal pipeline is 69/69, and O59/O60 are grouped under Animation & character export in the Research Results Workspace. Verdict: `MK1_BROWSER_ANIMATION_EXPORT_PACKAGE_ESTABLISHED`.

**Pass 1E.3O.61** independently validates the actual O60 browser ZIP inside the application path rather than invoking the exporter again. Its reader parses STORE ZIP local entries, validates entry CRCs/duplicate absence, validates PNG chunk CRCs and stored-DEFLATE zlib/Adler state, reconstructs all 2,284 RGBA images, reproduces all 16 O24 character/palette aggregates, validates all 21 O23 effects, and reconciles all 1,102 indexed descriptor records against O18. It proves the exact 79 O25 unresolved descriptors are retained indexed while receiving zero character-context RGBA assets. Direct replay against accepted O60 ZIP SHA-256 `b68e80c00a9d44c1be7276c514db0d9b0e6e1110d8d1068a0d8048e7f0f69af7` succeeds. Verdict: `MK1_BROWSER_ANIMATION_EXPORT_BUNDLE_VALIDATED`.

**Pass 1E.3O.62** closes the animation UI visibility gap. The existing Research Results Workspace now has an **Animation Assets** view with three explicit evidence tiers: 2,263 O24 character-context variants, 21 independently qualified O23 effects, and 79 unresolved O25 descriptors displayed only as neutral grayscale one-based index maps under policy `GRAYSCALE_INDEX_MAP_NOT_PALETTE`. The model exposes 2,363 browsable assets across 9 character identities / 16 explicit palette-context modes; unresolved assets are labelled palette-unresolved/not-game-colour, never inferred. The UI is paginated at 72 assets/page, retains the older specialist editors, and the full Run What's Needed path is now 71/71. Independent package/source audit passes 29/29 checks. Verdict: `MK1_ANIMATION_ASSETS_VISUAL_WORKSPACE_ESTABLISHED`.

**Pass 1E.3O.63** establishes the first bounded MK1 audio/music resource graph without inventing gameplay names. The authentic installation contains **244** `SFX/*.WAV` files, all PCM 8-bit mono 11025 Hz. Canonical `sfx.ASM` contains **533 fixed 24-byte sound records** and a 244-path WAV string pool; 243 records bind exactly to installed WAVs and the sole path-pool-only asset is `DUMMY.WAV`. Numeric WAV filenames are exact hexadecimal sound-code identifiers, while `DUNNO01..14` / `XTRA01..07` occupy codes `0x200..0x214`; these are identifiers, not canonical gameplay labels. `play_fx` indexes the record table directly, the bounded 32-byte low-code policy qualifies 11 loop-forever codes, and the single direct application bridge is `MKSOUND.ASM SOUND -> play_fx`, after which the game's sample helpers call Miles digital-sample APIs. Linked Miles MIDI/sequence capability is retained only as linked capability because the bounded direct-call census finds no application-module direct near call into that surface. `SAMPLES.DAT` remains format/purpose UNKNOWN with no qualified direct executable join. A separate Python reconstruction/audit passes **516/516** checks. Verdict: `MK1_AUDIO_MUSIC_RESOURCE_GRAPH_AND_EXPORT_CAPABILITY_CENSUS_ESTABLISHED`.

**Pass 1E.3O.64** productizes only that qualified surface. The browser audio package contains exactly **249 entries**: 244 authentic WAV files byte-for-byte, raw unresolved `SAMPLES.DAT`, two manifests, the O63 report and README. The accepted STORE ZIP is **12,798,744 bytes**, SHA-256 `a636108a4907ff0d1aa5b6ed75b7d0f7f4143674185c78ac8028c6f9a3874613`. The in-app validator confirms all 244 WAVs byte-exact against the authentic installation, raw `SAMPLES.DAT` byte-exact while semantically unresolved, all package metadata and zero unexpected entries. The new **Audio Assets** workspace exposes 244 playable byte-exact WAVs, 243 bound sound-code assets, one path-pool-only asset and 11 bounded loop-forever assets, with explicit warnings that filename/code is not gameplay naming and that `SAMPLES.DAT`/MIDI runtime relationships remain unresolved. An independent Python ZIP audit passes **260/260** checks. Verdicts: `MK1_BROWSER_AUDIO_EXPORT_PACKAGE_ESTABLISHED`, `MK1_BROWSER_AUDIO_EXPORT_BUNDLE_VALIDATED`, and `MK1_AUDIO_ASSETS_WORKSPACE_ESTABLISHED`.

**Pass 1E.3O.65** integrates the already-validated stage, animation and audio product contracts into one machine-readable cross-domain capability/provenance index without strengthening any underlying semantic claim. For the exact current integration run, the nested package identities are O55 stage SHA-256 `f40fd7101b05f7b6c8ef528aa0a548749d3e88b64a5f2d0fb7ba04018b98c119`, O60 animation SHA-256 `9a54d39b5518439c2a76f66e2e3bd12dd01a642e2febf0869345b94accd8461d`, and O64 audio SHA-256 `a636108a4907ff0d1aa5b6ed75b7d0f7f4143674185c78ac8028c6f9a3874613`. The index preserves 49 stage RGBA PNGs plus 48 stage structured documents, 2,263 animation character-context RGBA variants plus 21 verified-effect RGBA assets plus all 1,102 indexed descriptors with exactly 79 palette-unresolved/indexed-only cases, and 244 raw WAV assets plus raw unresolved `SAMPLES.DAT`. It records canonical source provenance, exact package/report/validation hashes, evidence tiers and blockers; it does not invent event names, palettes, timing or canonical gameplay screenshots. Verdict: `MK1_CROSS_DOMAIN_EXPORT_CAPABILITY_AND_PROVENANCE_INDEX_ESTABLISHED`.

**Pass 1E.3O.66** packages those exact current domain deliverables under one browser-downloadable outer STORE ZIP without flattening, transcoding or re-encoding them. The unified archive has **6 outer entries**, is **91,806,796 bytes**, SHA-256 `f642535017027b99d2954049e89bd73657d4911d14260f53863ba21310f580a7`, and nests the exact current O55/O60/O64 package byte streams containing **101 + 2,295 + 249 = 2,645 logical entries**. The in-app validator independently reparses the outer and nested ZIPs, verifies exact nested package bytes/CRCs/counts, and checks the cross-domain manifest/README boundaries. A separate Python audit passes **27/27** checks, while a source/UI integration audit passes **30/30** checks. A clean extraction of the final delivered O66 source ZIP reruns O65/O66 successfully: the regenerated unified archive is byte-for-byte identical at SHA-256 `f642535017027b99d2954049e89bd73657d4911d14260f53863ba21310f580a7`, and the O65/O66/validation reports are semantically identical after removing only fresh timestamp and `*OperationId` bookkeeping; packaged-source acceptance passes **8/8** checks. To make the archive deterministic, only O65 root run metadata (`timestamp`/`operationId`) is omitted from the embedded stable index, while all evidence/provenance content is retained. The normal browser workflow is now **75/75** and exposes **Download Unified MK1 Archive** alongside the three domain-specific download actions. Verdicts: `MK1_UNIFIED_BROWSER_ASSET_ARCHIVE_ESTABLISHED`, `MK1_UNIFIED_BROWSER_ASSET_ARCHIVE_VALIDATED`, and `MK1_UNIFIED_BROWSER_ASSET_ARCHIVE_INDEPENDENTLY_AUDITED`.

**Pass 1E.3O.67** opens the MK2 line from a complete authentic installation fixture rather than inventory metadata or MK1 assumptions. The user-supplied `mk2.zip` is SHA-256 `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2` and contains 614 regular files / 19,921,006 bytes, including 124 root `.GRA` resources, 312 `fx/*.U8` files and five 33-track sound families. Canonical `MK2.EXE` is 861,133 bytes, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. O67 correctly locates the application LE header at physical `0x28F0C` and qualifies the 129-entry executable filename pool containing 123 GRA names, 5 BIN names and `RM.DRV`; `MONKS.GRA` is the only installed root GRA outside that pool. **Historical correction preserved:** O67 initially interpreted the LE data-pages offset as file-relative and therefore classified bytes `0xABD79..EOF` as `UNRESOLVED_POST_LE_OVERLAY`. O72 later proves this interpretation was wrong for the bound DOS/4GW executable and supersedes only that page/file provenance claim, not O67's fixture/resource inventory. Verdict remains `MK2_AUTHENTIC_FIXTURE_RESOURCE_AND_EXECUTABLE_TOPOLOGY_ESTABLISHED` with the page-boundary subclaim superseded by O72.

**Pass 1E.3O.68** independently derives MK2's indexed graphics stream grammar from MK2 Object-1 renderer code bytes: transparent skip, indexed-colour RLE and aligned literal indexed runs. It then closes the first executable/resource/decode chain for `JC0.GRA`. Exactly 35 coherent 12-byte descriptor records—initially classified as overlay records and reclassified by O72 as file-backed Object-2 data—bind resource byte/filename-pool ordinal 109 to authentic `JC0.GRA`; every decoded stream ends exactly at the next descriptor's GRA offset and the final stream ends exactly at EOF, tiling all 120,240 resource bytes. O68 exports 35 one-byte index planes plus opacity masks in a deterministic 74-entry package, SHA-256 `e1449affba806a6a76dfb1bc63b99efe1af5c6182c562b3a68aad6eba5a08390`. The decoded opaque index domain is 1..63. Independent Python reconstruction passes **205/205** checks and source/UI integration audit passes **21/21**. Palette ownership, game-colour RGBA and the runtime consumer/semantic class of the descriptor corpus remain unresolved. Verdict: `MK2_JC0_INDEXED_GRAPHICS_DESCRIPTOR_STREAM_EXPORT_ESTABLISHED`.

**Pass 1E.3O.69** broadens the O68 decoder only through a strict byte-closure gate. An aligned scan of the same descriptor-bearing range—later proven by O72 to be a conservative subset of file-backed Object 2—produces **4,225** grammar-valid descriptor/resource candidates across **109** pooled GRA resources. A resource is promoted only when discovered streams begin at offset 0, every stream ends exactly at the next discovered offset, the final stream ends at EOF and no offset has conflicting geometry/encoded length. Exactly **94 resources / 3,790 unique streams** pass that gate, covering **11,385,532 authentic encoded bytes** and **15,953,739 decoded indexed pixels**. The exact-full opaque index union is **1..175**. Fifteen candidate-bearing resources remain `PARTIAL_OR_AMBIGUOUS`, fourteen pooled GRA resources have no qualifying descriptor candidates, and `MONKS.GRA` remains out-of-pool. Independent reconstruction passes **217/217** checks; source/UI integration passes **23/23**; a clean extraction of the delivered O69 source reproduces the report semantically and reruns both audits successfully, with packaged-source acceptance **6/6**. Palette ownership, correct-colour RGBA, descriptor runtime consumers, partial-resource completion and a shared MK1/MK2 abstraction remain unestablished. Verdict: `MK2_BROAD_INDEXED_GRA_CORPUS_CENSUS_ESTABLISHED`.

**Pass 1E.3O.70** materializes only the O69 exact-full surface as a deterministic browser-downloadable lossless indexed package. The accepted STORE ZIP contains **7,678 entries**: 94 authentic GRA resources preserved byte-for-byte, 3,790 one-byte indexed-pixel planes, 3,790 explicit opacity masks, and four metadata/evidence files. It is **48,792,953 bytes**, SHA-256 `04902dcd5962d5b9ca708b34ce57735d5215ca64d3be762aa8d0652918dd8e97`, preserving exactly **11,385,532 authentic encoded GRA bytes** and **15,953,739 decoded pixels**. The in-app validator reparses the actual ZIP, compares all 94 raw GRA files against the authentic installation and independently reconstructs all 3,790 index/mask pairs. A separate Python auditor passes **109/109** checks; source/UI integration passes **23/23**. The initial independent audit passed 108/109 because the embedded O69 report retained fresh run IDs/timestamps; no asset failed. O70 was corrected to embed a stable O69 evidence snapshot that removes only run-specific timestamp/operation IDs, after which two complete regenerations are byte-identical at the accepted package hash. Clean extraction of the delivered O70 source regenerates that exact package and packaged-source acceptance passes **9/9**. Palette ownership, correct-colour RGBA, descriptor runtime consumers, excluded-resource completeness and shared MK1/MK2 abstraction remain unestablished. Verdicts: `MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_PACKAGE_ESTABLISHED`, `MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_BUNDLE_VALIDATED`, `MK2_O70_INDEXED_GRAPHICS_PACKAGE_INDEPENDENT_AUDIT_PASSED`.

**Pass 1E.3O.71** independently establishes MK2's palette storage/allocation/transfer mechanism without assigning a palette to JC0. Authentic `MK2.EXE` contains the GETPAL/PALSET diagnostic strings and a code-proven counted palette grammar `[u16 colourCount][colourCount × u16 packedColour]`. A 60-entry × 8-byte palette-handle table tracks record pointer, 16-bit reference count and 8-bit DAC start index; object field `+0x30` stores the palette handle. A 32-slot × 8-byte request ring queues source pointer / DAC start / colour count, and the transfer routine writes VGA `0x3C8/0x3C9`, deriving three six-bit DAC components from each packed 16-bit colour. A bounded census finds 15 direct file-backed calls to the allocator, including dynamic-table, pointer/structure-field, control-stream and sequential multi-palette-block paths. The earlier reconnaissance observation of a 223-record structurally compatible byte chain is explicitly **not** promoted to a palette corpus; structural shape alone is insufficient, and relocation-sensitive raw immediates remain unresolved until fixup provenance is independently qualified. O68's JC0 boundary is independently rechecked at 35 streams / opaque indices 1..63, but no affirmative JC0 resource/descriptor-to-palette-record join is established, so JC0 remains indexed-only and no correct-colour RGBA is emitted. O71 passes 29/29 internal checks, an independent Python audit passes **55/55**, source/UI integration passes **29/29**, and clean delivered-source acceptance passes **9/9**. Verdict: `MK2_PALETTE_STORAGE_ALLOCATION_AND_DAC_TRANSFER_ESTABLISHED_JC0_BINDING_UNRESOLVED`.

**Pass 1E.3O.72** closes O71's relocation-sensitive pointer-provenance blocker without claiming JC0 palette ownership. Authentic `MK2.EXE` contains an embedded bound-module MZ header at physical `0x26654`; its `e_lfanew=0x28B8` lands exactly on the known LE header `0x28F0C`. The LE data-pages value `0x3B600` is module-relative in this bound DOS/4GW executable, so the true physical page-data start is `0x61C54`; 113 pages then end exactly at executable EOF `0xD23CD`. This **supersedes** O67's `UNRESOLVED_POST_LE_OVERLAY` interpretation and reclassifies the O68 descriptor corpus as `FILE_BACKED_LE_OBJECT2_DATA`. O69's exact indexed qualifications remain valid for the range actually scanned, now understood as a conservative subset of Object 2. O72 independently parses **27,004** internal LE fixup records: 26,900 type-7 32-bit offset fixups and 104 type-8 self-relative fixups. All 26,900 type-7 authentic source values reproduce their parsed target object offsets exactly, including one final-page cross-boundary source under bounded loader zero-fill. On O71's palette path, relocation-sensitive immediates resolve two Object-2 selector tables of 17 dword slots each; all **34** slot fixups resolve to Object-1 code-valid counted **63-colour** records, representing **29 unique** palette records. This establishes file↔page↔object↔pointer provenance and a concrete selector-record surface, but no affirmative join yet maps `JC0.GRA`/JC0 identity to one selector slot, so no JC0 palette ownership or correct-colour RGBA is promoted. O72 passes 15/15 internal checks, independent Python audit **63/63**, source/UI audit **34/34**, and clean delivered-source acceptance **9/9**. Verdict: `MK2_BOUND_LE_FIXUP_AND_PALETTE_POINTER_PROVENANCE_ESTABLISHED_JC0_SLOT_JOIN_UNRESOLVED`.


**Pass 1E.3O.73** closes O72's JC0 selector-slot provenance gap without using roster order or filename semantics as identity proof. Authentic code at physical `0x91909` reads `dword [object+0x46]` and uses it to index a relocatable 17-slot per-character resource/animation table at Object-2 `0x1D588`. All 17 table entries are authentic LE fixups, and bounded relocatable witnesses reach O69-authenticated GRA descriptors with resource-family skeleton `HH,LK,JC,BA,FN,FN,ST,RD,NJ,NJ,NJ,JX,GO,SK,NJ,NJ,FN`. Shared-family and special slots remain resource-labelled rather than guessed into human fighter names. Decisively, selector value **2** reaches the exact O68 JC0 offset-0 descriptor at Object-2 `0x24784` / physical `0xC53D8`, whose packed resource reference is `0x6D000000` and whose executable resource-pool ordinal 109 is `JC0.GRA`. Because O71/O72's palette selector uses that same object `+0x46` value, JC0 is mechanically joined to **palette selector slot 2**. O72 resolves slot 2 to Object-1 palette records `0x2574A` (physical `0x8739E`) and `0x257CA` (physical `0x8741E`), both counted 63-colour records. O73 does **not** name the two palette contexts, does not complete a unique human-readable 17-slot roster mapping, and emits no correct-colour RGBA. Internal checks pass 69/69, independent Python audit **93/93**, source/UI integration **34/34**, and clean delivered-source acceptance **9/9**. Verdict: `MK2_JC0_RESOURCE_TO_PALETTE_SELECTOR_SLOT_JOIN_ESTABLISHED_HUMAN_SLOT_NAMES_PARTIAL`.

**Pass 1E.3O.74** turns the O73-qualified JC0 ownership join into the first independently verified correct-colour MK2 fighter fixtures without naming the two gameplay contexts. Authentic renderer code at physical `0x659EA` reads the palette-handle DAC-start byte at handle `+0x06`, decrements it, resolves the authentic 256-entry replicated-byte lookup table at Object-2 `0x1084` / physical `0xA1CD8`, and adds that replicated offset to packed source index bytes at physical `0x65A14`. O71 independently established that palette-record colour 0 is transferred beginning at the handle DAC start. Therefore opaque source index **N (1..63) maps to palette-record colour N-1 (0..62)**. O74 applies the two exact O73 slot-2 records (`0x2574A` / physical `0x8739E`, raw SHA-256 `7adc8dc507fe4f8008179bb711de2f0c16e24bcbe989074f33352890080badec`; and `0x257CA` / physical `0x8741E`, raw SHA-256 `f9d2bf2a5327d4dd0b761a948e2c883831ad654820869c214bea797e44a3130e`) to all 35 O68 JC0 streams. The result is **70 deterministic RGBA PNGs** under structural names `selector_table_A_slot_02` and `selector_table_B_slot_02`. Exact MK2 DAC6 triples are preserved; PNG display channels use deterministic `round(component * 255 / 63)` expansion only. The deterministic 75-entry package is **1,617,629 bytes**, SHA-256 `d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7`. A separate Python reconstruction parses all 70 PNGs and matches every raw RGBA buffer byte-for-byte, passing **268/268** checks; source/UI integration passes **31/31**; clean delivered-source acceptance passes **9/9**. O74 does not name either context normal/alternate or player-number, does not promote palette ownership beyond JC0, and does not infer a human name for selector slot 2. Verdict: `MK2_JC0_TWO_UNNAMED_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.75** resolves the gameplay selection semantics of the two 17-slot palette tables without changing O74 pixels or package paths. Authentic creation code at physical `0x85BE3` loads table A (`Object-2 0x1C1B8`) by default. It retains A when unnamed mode global `0x7650A` equals numeric value 4, when side index global `0x75A64` is zero, or when a nonzero-side candidate identity differs from first-side identity global `0x75FCE`. It selects table B (`Object-2 0x1C1FC`) only when side index is nonzero and candidate identity equals the already-selected first-side identity, simultaneously adding object flag `0x40`. Two independent creation sequences establish side index 0 is created first and side index 1 second, but O75 does not promote UI/controller labels `Player 1` / `Player 2`. A separate runtime path at physical `0x85A6B` sets flag `0x40` and switches to B when object `+0x46` becomes equal to first-side identity, and clears the flag / switches back to A when they diverge. Therefore table A is qualified as `DEFAULT_CHARACTER_PALETTE` and table B as `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`. O74 structural contexts `selector_table_A_slot_02` / `selector_table_B_slot_02` gain those semantic aliases for JC0 with no pixel/package change. The meaning of unnamed mode value 4 remains unresolved. Internal checks pass 17/17, independent audit **52/52**, source/UI audit **31/31**, and clean delivered-source acceptance **9/9**. Verdict: `MK2_PALETTE_SELECTOR_DEFAULT_AND_SAME_CHARACTER_DUPLICATE_OVERRIDE_SEMANTICS_ESTABLISHED`.

**Pass 1E.3O.76** establishes the second independently grounded MK2 fighter-resource correct-colour fixture without promoting whole-family ownership. O73 identity slot **0** reaches the exact O69-authenticated `HH0.GRA` offset-0 descriptor at physical `0xC3CB0`; O69 independently qualifies all **36** `HH0.GRA` streams as exact full-resource tiling of the authentic 147,844-byte file. O72 selector slot 0 resolves to counted 63-colour Object-1 records `0x252A0` / `0x25320` at physical `0x86EF4` / `0x86F74`; O75 gives them the already-qualified meanings `DEFAULT_CHARACTER_PALETTE` and `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`. Reapplying the O74 renderer relation `opaque index N -> palette-record colour N-1`, O76 renders **72 deterministic RGBA PNGs** (36 streams × 2 contexts). The accepted 77-entry package is 1,843,277 bytes, SHA-256 `1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2`. A completely separate Python reconstruction passes **281/281** checks and compares every PNG RGBA payload byte-for-byte; source/UI audit passes **33/33**; a second regeneration is byte-identical; clean delivered-source acceptance passes **9/9**. The claim is deliberately `HH0.GRA`-only: `HH1`-`HH5`, `HHFRIEND`, the broader `HH` family and any human fighter name are not promoted. Verdict: `MK2_HH0_SECOND_FIGHTER_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.77** establishes a third independently grounded MK2 fighter-resource correct-colour fixture without promoting whole-family ownership. O73 identity slot **1** reaches the exact O69-authenticated `LK0.GRA` offset-0 descriptor at physical `0xC4878`; O69 independently qualifies all **36** `LK0.GRA` streams as exact full-resource tiling of the authentic 131,528-byte file with opaque index domain 1..63. O72 selector slot 1 resolves to counted 63-colour Object-1 records `0x254A0` / `0x25520` at physical `0x870F4` / `0x87174`, with raw SHA-256 values `63b2271ae86c2ebb59202020df619132aafe1c4b68a8e187355373e0a0774c93` and `431d31b771524d80c2addaa8ccbd724a6e656775f9039eb2a2f1785c04dcab96`; O75 gives them the qualified meanings `DEFAULT_CHARACTER_PALETTE` and `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`. Reapplying the O74 renderer relation `opaque index N -> palette-record colour N-1`, O77 renders **72 deterministic RGBA PNGs** (36 streams × 2 contexts). The accepted 77-entry package is **1,659,164 bytes**, SHA-256 `04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836`. A separate Python reconstruction passes **281/281** checks and compares every PNG RGBA payload byte-for-byte; source/UI audit passes **33/33**; a second regeneration is byte-identical; clean delivered-source acceptance passes **9/9**. The claim is deliberately `LK0.GRA`-only: `LK1+`, the broader `LK` family and any human fighter name are not promoted. Verdict: `MK2_LK0_THIRD_FIGHTER_RESOURCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.78** productizes the three independently verified MK2 correct-colour fighter-resource fixtures without strengthening any underlying semantic claim. The browser-facing outer STORE ZIP nests the exact deterministic O76 HH0 package SHA-256 `1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2`, O77 LK0 package SHA-256 `04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836`, and O74 JC0 package SHA-256 `d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7` byte-for-byte, plus one stable provenance manifest and README. The result has **5 outer entries**, **229 nested logical entries**, **214 already-verified PNGs**, is **5,123,730 bytes**, and has SHA-256 `0b2323d68595f7b20dc2e7801aefe0c3636f64e0e58e5c1ba651a3f96674aad2`. A separate Python integration audit passes **67/67** checks over outer CRCs/STORE encoding, exact nested package identities/counts and manifest boundaries; source/UI integration passes **32/32**; a second regeneration is byte-identical; clean delivered-source acceptance passes **9/9**. O78 explicitly leaves new palette ownership, sibling-resource ownership, human fighter names, Player 1/Player 2 labels, mode-4 meaning and MK1-derived assumptions unpromoted. Verdict: `MK2_THREE_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.

**Pass 1E.3O.79** establishes a fourth independently grounded MK2 fighter-resource correct-colour fixture without promoting whole-family ownership. O73 identity slot **3** reaches the exact O69-authenticated `BA0.GRA` offset-0 descriptor at physical `0xC5FC0`; O69 independently qualifies all **44** BA0 streams as exact full-resource tiling of the authentic **111,300-byte** resource with opaque indices 1..63. O72 slot 3 resolves to counted 63-colour Object-1 records `0x2594A` / `0x259CA` at physical `0x8759E` / `0x8761E`, raw SHA-256 `88c20a63940c97ccd0a8bfd5a534959fd2901ddd65b44e41687cad4d360a8347` / `8e69dfc77db334ce295a2de71fe1db119139a7221733bb9b09592cef0ae0f3eb`; O75 supplies the already-proven default / same-character duplicate semantics. Reapplying the O74 renderer relation yields **88 deterministic RGBA PNGs**. The accepted 93-entry package is **1,299,552 bytes**, SHA-256 `8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133`. A separate Python reconstruction passes **337/337** checks, source/UI integration passes **33/33**, a second regeneration is byte-identical, and the standalone O79 source snapshot passes **5/5** packaged-source acceptance. The claim is deliberately BA0-only: BA1+, broader BA-family ownership and any human fighter name remain unpromoted. Verdict: `MK2_BA0_FOURTH_FIGHTER_RESOURCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.80** deterministically integrates the exact accepted HH0/O76, LK0/O77, JC0/O74 and BA0/O79 package byte streams under one browser-downloadable outer STORE ZIP without recomputing pixels or strengthening semantics. The result has **6 outer entries**, **322 nested logical entries**, **302 already-verified PNGs**, is **6,424,085 bytes**, and has SHA-256 `10e2aa047027e2468112cfdb8582be5a21506d643c6de95a7d6976d5f9934f7c`. A separate Python integration audit passes **81/81** checks; source/UI integration passes **33/33**; a second regeneration is byte-identical; and clean extraction of the delivered O80 source replays O79/O80, regenerates both exact package hashes and passes packaged-source acceptance **8/8**. O80 adds distribution/provenance only and does not promote sibling-resource ownership, whole-family ownership, human fighter names, player-number labels, mode-4 meaning or MK1-derived assumptions. Verdict: `MK2_FOUR_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.

**Pass 1E.3O.81** tightens the shared-FN provenance boundary before promoting a fifth bounded correct-colour MK2 resource fixture. O73 correctly established the 17-slot identity/palette axis and broad `FN` family classification for slots 4/5/16, but its historical slot-4 `FN6.GRA+0xA968` witness was only a loose family witness rather than a connected pointer chain from the slot-4 root. Authentic MK2 LE fixups instead establish the exact connected path `slot-4 root Object-2 0x2194 -> source 0x21AC -> 0x21E0 -> source 0x21EA -> 0x220A -> source 0x220A -> descriptor Object-2 0x27640 / physical 0xC8294 -> FN4.GRA+0`. O69 independently qualifies all **27** `FN4.GRA` streams as exact full-resource tiling of **69,660 bytes**, opaque indices 1..63. O72 selector slot 4 resolves to exact counted 63-colour records Object-1 `0x25B4A` / `0x25BCA` at physical `0x8779E` / `0x8781E`; O75 supplies the already-qualified default / same-character duplicate semantics. O81 therefore renders **54 deterministic RGBA PNGs** (27 × 2) in a 59-entry / 989,065-byte package SHA-256 `f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726`. Independent reconstruction including fresh LE-fixup validation passes **221/221**; source/UI audit **35/35**; frozen-source acceptance **6/6**. O73's older slot-4 FN6 witness is **SUPERSEDED FOR THIS SLOT-4 RESOURCE-OWNERSHIP CLAIM**; slots 5/16 and sibling FN resources remain unresolved at the stronger connected-chain standard. Verdict: `MK2_FN4_SLOT4_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.82** deterministically integrates the exact accepted HH0/O76, LK0/O77, JC0/O74, BA0/O79 and FN4/O81 package byte streams under one browser-downloadable outer STORE ZIP without recomputing pixels or strengthening semantics. The result has **7 outer entries**, **381 nested logical entries**, **356 already-verified PNGs**, is **7,413,956 bytes**, and has SHA-256 `c1fb304d3f7acfb47683be326e87e4fd08f861fc1a3d442040582cc2150a22c9`. A separate Python integration audit passes **95/95** checks; source/UI integration passes **45/45**; a second regeneration is byte-identical; and clean extraction of the delivered O82 source reproduces the exact bundle, semantic report (excluding fresh timestamp/operation ID), independent/source audits and targeted TypeScript, passing packaged-source acceptance **9/9**. O82 adds distribution/provenance only and does not promote sibling-resource ownership, whole-family ownership, human fighter names, player-number labels, mode-4 meaning, slots 5/16 ownership or MK1-derived assumptions. Verdict: `MK2_FIVE_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.

**Pass 1E.3O.83** independently tightens identity slot **5** from O73's loose shared-`FN` family witness to a mechanically connected exact resource-ownership path. Authentic MK2 LE fixups establish `slot-5 root Object-2 0x21B8 -> source 0x21D0 -> 0x2E86 -> source 0x2E86 -> 0x2ECE -> source 0x2ECE -> descriptor Object-2 0x2788C / physical 0xC84E0 -> FN6.GRA+0`. O69 independently qualifies all **46** `FN6.GRA` streams as exact full-resource tiling of the authentic **125,348-byte** file with opaque indices 1..63. O72 selector slot 5 resolves to exact counted 63-colour records Object-1 `0x25D4A` / `0x25DCA` at physical `0x8799E` / `0x87A1E`, with raw record SHA-256 `f267c92cb13bc10aaffa115250579ac8997dfd107e11a3e8c41dce36fba0bad9` / `966975e1af91339efd1fb74184cc897956ec77bd3081ebd74c37793b992297ff`; O75 supplies the already-qualified default / same-character duplicate semantics. O83 therefore renders **92 deterministic RGBA PNGs** (46 × 2) in a 97-entry / 1,584,566-byte package SHA-256 `68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3`. Independent reconstruction including fresh LE-fixup validation passes **354/354**; source/UI audit **35/35**; clean frozen-source replay passes **6/6**. O83 **strengthens** O73's broad FN6 clue into exact slot-5 ownership; it does not create whole-FN ownership. At the O83 checkpoint slot 16 still remained unresolved at the connected-chain standard; O85 later closes that separate slot through its own FN4 path. Verdict: `MK2_FN6_SLOT5_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.84** deterministically integrates the exact accepted HH0/O76, LK0/O77, JC0/O74, BA0/O79, FN4/O81 and FN6/O83 package byte streams under one browser-downloadable outer STORE ZIP without recomputing pixels or strengthening semantics. The result has **8 outer entries**, **478 nested logical entries**, **448 already-verified PNGs**, is **8,999,328 bytes**, and has SHA-256 `adb092f263f4fa0b7ede146b3f748a754ea1eb7919f95853f0d4112eed26ae1b`. A separate Python integration audit passes **109/109** checks; source/UI integration passes **54/54**; a second regeneration is byte-identical; and clean extraction of the delivered O84 source reproduces the exact bundle, semantic report (excluding fresh timestamp/operation-ID bookkeeping), independent/source audits and targeted TypeScript, passing packaged-source acceptance **9/9**. O84 adds distribution/provenance only and does not promote sibling-resource ownership, whole-family ownership, human fighter names, player-number labels, mode-4 meaning, slot-16 ownership or MK1-derived assumptions. Verdict: `MK2_SIX_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.

**Pass 1E.3O.85** closes the remaining shared-FN identity slot at the stronger connected-chain standard. Authentic MK2 LE fixups establish `slot-16 root Object-2 0x208C -> 0x21E0 -> 0x220A -> descriptor Object-2 0x27640 / physical 0xC8294 -> FN4.GRA+0`. O69 independently qualifies all **27** `FN4.GRA` streams as exact full-resource tiling of **69,660 bytes** with opaque indices 1..63. O72 re-derivation shows selector table A slot 16 and table B slot 16 both point to the **same** counted 63-colour record at Object-1 `0x2AD2A` / physical `0x8C97E`, raw SHA-256 `dcb616533af566e337a1c0669f5d4e41121b73630581f26954aacf059d3a7253`. O75 semantics still call A the default character palette and B the same-character duplicate override; for slot 16 the override is therefore a proven visual no-op. O85 preserves both semantic contexts and renders **54 context-specific PNGs**, with all **27/27 A/B pairs byte-identical**. The accepted 59-entry package is **988,909 bytes**, SHA-256 `f15d5425f359ab6db21a31d82650ecd2c90105c9036194d1ef1e61e91e9079ff`; independent audit **223/223**, source/UI **41/41**, clean-source acceptance **7/7**. Slot 16 shares FN4 geometry with slot 4 but not slot-4 identity/palette semantics; no whole-FN ownership or human fighter name is promoted. Verdict: `MK2_FN4_SLOT16_CONNECTED_PROVENANCE_ALIASED_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.86** is integration/distribution only. It nests seven exact independently accepted identity/resource fixture packages: slot 0/HH0, slot 1/LK0, slot 2/JC0, slot 3/BA0, slot 4/FN4, slot 5/FN6 and slot 16/FN4. The two FN4 packages remain intentionally distinct contracts. The deterministic STORE ZIP has **9 outer entries**, **537 nested logical entries**, **502 already-verified context-specific RGBA PNGs**, is **9,989,261 bytes**, and has SHA-256 `6d17d56e676cdc2523efaa823ff716d5f28d3ce4f3350f82f669645b590a97e6`. Independent outer/nested integration audit passes **123/123**, source/UI **46/46**, a second generation is byte-identical, and clean delivered-source acceptance passes **7/7**. O86 adds no new palette ownership, sibling-resource ownership, whole-family ownership, human fighter names, player-number labels, mode-4 meaning or MK1-derived assumptions. Verdict: `MK2_SEVEN_VERIFIED_IDENTITY_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.

**Pass 1E.3O.87** starts from identity slot 8's actual Object-2 root `0x9C54` rather than the earlier loose shared-NJ family witness. Within slot 8's unique prefix, authentic LE fixups close one bounded connected path `0x9C60 -> 0xAC4A -> 0xACA6 -> 0xAD16 -> descriptor 0x285F8` / physical `0xC924C` -> `NJ7.GRA+0`. O69 independently qualifies `NJ7.GRA` as **116 exact-full streams / 241,320 bytes / opaque indices 1..63**. O72/O75 provide two distinct slot-8 counted 63-colour records at physical `0x87F9E` / `0x8801E`; O87 therefore exports **232 deterministic RGBA PNGs** in a 237-entry, **2,535,316-byte** package SHA-256 `b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd`. A separate Python reconstruction passes **846/846** checks and source/UI integration passes **37/37**; clean frozen-source replay passes **6/6**. Crucially, slot 8's root graph also reaches additional NJ-family resources, so `NJ7.GRA` is qualified only as **one connected slot-8 resource contract**, not the complete/canonical slot-8 geometry and not whole-NJ ownership. Verdict: `MK2_NJ7_SLOT8_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

**Pass 1E.3O.88** is integration/distribution only. It nests the exact accepted slot0/HH0, slot1/LK0, slot2/JC0, slot3/BA0, slot4/FN4, slot5/FN6, slot8/NJ7 and slot16/FN4 fixture packages byte-for-byte under one deterministic STORE ZIP. The outer package has **10 entries**, **774 nested logical entries**, **734 already-verified context-specific RGBA PNGs**, is **12,525,359 bytes**, and has SHA-256 `97cc701cf39641acaa2930d3e7568bb44ee6eeb0d84a65d972b7a470ccc49f1e`. Independent outer/nested integration audit passes **139/139**, source/UI integration passes **38/38**, a second generation is byte-identical, and clean delivered-source acceptance passes **9/9**. O88 explicitly preserves the O87 noncanonical-geometry boundary and adds no new palette ownership, sibling/whole-family ownership, human fighter names, player-number labels, mode-4 meaning or MK1-derived assumptions. Verdict: `MK2_EIGHT_VERIFIED_IDENTITY_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.

**Pass 1E.3O.89** starts from identity slot 9's actual five-field Object-2 root `0x9C68` and rejects a tempting shorter route through source `0x9C90` because that source lies outside slot 9's root record. An eight-edge chain of authentic Object-2 type-7 relocations closes `0x9C74 -> 0xB70A -> 0xB736 -> 0xB7AE -> 0xB7E6 -> 0xB832 -> 0xB84A -> 0xB87E -> 0xB89E -> 0xA96A -> 0xA98A -> 0xA9B2 -> 0xA9EA -> 0xA95A -> descriptor Object-2 0x2919C / physical 0xC9DF0 -> NJ4.GRA+0`. O69 independently qualifies `NJ4.GRA` as **24 exact-full streams / 75,512 bytes / opaque indices 1..63**. O72/O75 supply distinct slot-9 counted 63-colour records at physical `0x881D2` / `0x88252`; O89 therefore exports **48 deterministic RGBA PNGs** in a 53-entry, **914,627-byte** package SHA-256 `7bd6be4c260b83f4fb69a9b26734e3ad3a5bc0a3363bc302ecc8426281bf7a7a`. A separate Python reconstruction passes **207/207** checks, source/UI integration passes **32/32**, a second generation is byte-identical, and clean delivered-source replay passes **7/7**. Slot 9's wider NJ graph reaches additional NJ-family resources, so `NJ4.GRA` is qualified only as **one connected slot-9 resource contract**, not the complete/canonical slot-9 geometry and not whole-NJ ownership. O73's older shared `NJ6.GRA` witness is superseded only for this bounded slot-9 fixture. Verdict: `MK2_NJ4_SLOT9_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`.

A full dependency-backed Vite build is **not claimed** in the archival execution environment: `node_modules` are not bundled and the known offline cache remains incomplete. The O63-O66 MK1 core modules remain on their previously accepted targeted TypeScript paths. The O67-O89 MK2 core modules and `MK2FoundationPanel.tsx` pass targeted TypeScript checking with archival React/lucide/Node shims; the O87-O89 Node runners and Python audits are syntax-clean. This is an environment/dependency boundary, not a detected source-level UI failure. Direct human browser inspection remains useful for layout/ergonomics.

This document is the required pause checkpoint after **O89**. The current user rule permits **up to two major verification passes per cycle**, but the retry cycle intentionally froze O89 alone before any O90 integration work. **O90 has not started.**

The product direction remains export-first. The immediate continuation should build from the independently qualified O67-O89 MK2 indexed/palette/fixup/identity/selection surface without importing MK1 semantics. The project now has nine independently grounded identity/resource correct-colour contracts across eight unique resources: HH0/slot 0, LK0/slot 1, JC0/slot 2, BA0/slot 3, FN4/slot 4, FN6/slot 5, NJ7/slot 8, NJ4/slot 9 and FN4/slot 16. Shared-family provenance remains slot-specific: O81/O83/O85 close the three FN slots individually; O87 and O89 independently close one bounded NJ contract each while explicitly preserving additional reachable NJ-family branches and noncanonical-geometry boundaries. O88 still distributes only the first eight exact packages; O90, if undertaken, should add the exact accepted O89 package without semantic promotion. Numeric player-side labels, unnamed mode value 4, human fighter names, sibling-resource ownership, canonical/complete NJ geometry and broad whole-family palette ownership remain unresolved.

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

The current authoritative development source archive is `MK-DOS-1E3O89-source.zip`, SHA-256 `0803b8359311d9201fc25b03e18ccfb919600b647c1fa92848c6ea5675a1b611`; ZIP integrity passes. A clean extraction of that exact delivered source reruns O89 against the untouched authentic MK2 installation, regenerates the exact slot-9/NJ4 package SHA-256 `7bd6be4c260b83f4fb69a9b26734e3ad3a5bc0a3363bc302ecc8426281bf7a7a` byte-for-byte, reproduces the O89 report semantically after removing only fresh timestamp/operation-ID bookkeeping, reruns the independent reconstruction at **207/207**, source/UI audit at **32/32**, passes targeted TypeScript/TSX and runner syntax, and passes packaged-source acceptance **7/7**. The source tree is rooted at `MK-DOS-1E3O89`.

The immediately preceding authoritative O88 snapshot is `MK-DOS-1E3O88-source.zip`, SHA-256 `0d81663336bf02190fc77988cbb68796a691cad16a31dca19386dc8c73b92702`; it remains the recovery point for the eight-contract integration package. The earlier frozen O87 snapshot is `MK-DOS-1E3O87-source.zip`, SHA-256 `ffc31e6136132fb394ee1a9e32e4e19b964ae5ece77ca2bd479e7e8190b64551`; clean-source replay regenerates the accepted slot-8/NJ7 package SHA-256 `b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd`, reruns its independent audit at **846/846** and source/UI audit at **37/37**, and passes frozen-source acceptance **6/6**. This frozen snapshot is the semantic recovery point for O87 independent of later O88 UI integration.

The O89 source preserves the complete MK1 O14-O66 state and MK2 O67-O89 lineage. MK1's established **75/75** workflow remains separate and unchanged; the MK2 panel executes O67→O89 independently. O81/O83/O85 retain the three connected FN identity/resource contracts. O87 adds one connected slot-8/NJ7 contract and O89 adds one connected slot-9/NJ4 contract, both preserving additional reachable NJ-family branches and noncanonical-geometry boundaries. O88 remains deterministic eight-package integration/distribution and is not retroactively treated as containing O89.

Key MK2 modules/artifacts include:

- `src/games/mk2/research/fixtureResourceExecutableTopology.ts` (O67);
- `src/games/mk2/research/indexedGraphicsDecodeFoundation.ts` (O68);
- `src/games/mk2/research/broadIndexedGraphicsCorpusCensus.ts` (O69);
- `src/games/mk2/research/browserIndexedGraphicsExportBundle.ts` and `browserIndexedGraphicsExportBundleValidation.ts` (O70);
- `src/games/mk2/research/paletteStorageSelectionReconnaissance.ts` (O71);
- `src/games/mk2/research/leFixupPointerProvenanceQualification.ts` (O72);
- `src/games/mk2/research/characterResourcePaletteSlotJoin.ts` (O73);
- `src/games/mk2/research/jc0PaletteContextRgbaFixtures.ts` (O74);
- `src/games/mk2/research/paletteSelectorGameplaySemantics.ts` (O75);
- `src/games/mk2/research/hh0PaletteContextRgbaFixtures.ts` (O76);
- `src/games/mk2/research/lk0PaletteContextRgbaFixtures.ts` (O77);
- `src/games/mk2/research/verifiedFighterRgbaBundle.ts` (O78);
- `src/games/mk2/research/ba0PaletteContextRgbaFixtures.ts` (O79);
- `src/games/mk2/research/verifiedFighterRgbaBundleO80.ts` (O80);
- `src/games/mk2/research/fn4PaletteContextRgbaFixtures.ts` (O81);
- `src/games/mk2/research/verifiedFighterRgbaBundleO82.ts` (O82);
- `src/games/mk2/research/fn6PaletteContextRgbaFixtures.ts` (O83);
- `src/games/mk2/research/verifiedFighterRgbaBundleO84.ts` (O84);
- `src/games/mk2/research/fn4Slot16PaletteContextRgbaFixtures.ts` (O85);
- `src/games/mk2/research/verifiedFighterRgbaBundleO86.ts` (O86);
- `src/games/mk2/research/nj7Slot8PaletteContextRgbaFixtures.ts` (O87);
- `src/games/mk2/research/verifiedFighterRgbaBundleO88.ts` (O88);
- `src/games/mk2/research/nj4Slot9PaletteContextRgbaFixtures.ts` (O89);
- `src/components/MK2FoundationPanel.tsx`, exposing O67-O89 without folding MK2 into the MK1 workflow and preserving slot/resource/no-human-name/noncanonical-NJ boundaries;
- the O67-O89 Node runners and independent Python audits, including `scripts/audit-mk2-o87.py`, `scripts/audit-mk2-o88.py`, `scripts/audit-mk2-o89.py` and their source-integration auditors;
- checkpoints through `MK_DOS_Archive_CHECKPOINT_1E3O89_MK2_NJ4_SLOT9_CONNECTED_RGBA_FIXTURES.md`;
- `src/appMetadata.ts` identifying Pass `1E.3O.88 — MK2 Eight Verified Identity/Resource RGBA Integration Bundle`.

O67-O86 are read-only analysis/export/integration work. They do not broaden any binary writer surface. O81/O83/O85 establish three separate shared-FN identity-slot edges rather than a family rule: slot 4 specifically owns `FN4.GRA+0`, slot 5 specifically owns `FN6.GRA+0`, and slot 16 specifically owns `FN4.GRA+0` while its A/B selectors alias one palette record. O86 nests the seven accepted package contracts without recomputing or widening ownership. The line still does not establish palette ownership for sibling resources or whole families, unique human names for shared/special identity slots, gameplay animation names, stage semantics, audio semantics, arbitrary import/write-back, or a shared MK1/MK2 abstraction.

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

## 4.3 Canonical MK2 executable and complete installation fixture

The user supplied a complete authentic MK2 installation archive and O67 independently established its byte identity:

- archive: `mk2.zip`;
- archive SHA-256: `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2`;
- regular files: **614**;
- total regular-file bytes: **19,921,006**;
- root `.GRA`: **124**;
- `fx/*.U8`: **312**;
- `sound/`: exactly 33 files each of `.AWE`, `.GVS`, `.LAP`, `.MID`, `.SBL`.

Canonical executable:

- `MK2.EXE`;
- size: **861,133 bytes** (`0xD23CD`);
- SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`;
- bound DOS/4GW Linear Executable;
- embedded bound-module MZ start: physical `0x26654`;
- embedded `e_lfanew`: `0x28B8`;
- application LE header: physical `0x28F0C`;
- 2 objects / 113 file-backed pages;
- module-relative LE data-pages value: `0x3B600`;
- corrected physical data-pages start: `0x61C54`;
- final file-backed page end exclusive: **`0xD23CD` = executable EOF**;
- O67's former `UNRESOLVED_POST_LE_OVERLAY` classification is **SUPERSEDED** by O72;
- O68 descriptor corpus is now qualified as `FILE_BACKED_LE_OBJECT2_DATA`.

The executable contains a qualified 129-entry filename pool with 123 `.GRA`, 5 `.BIN`, and `RM.DRV`. `MONKS.GRA` is the only installed root GRA outside that pool. This fixture is now the authoritative MK2 byte source. Existing MK2 inventory JSON remains historical/contextual and must not override authentic fixture bytes.

## 4.4 Top-level mounted artifacts

| File | Size | SHA-256 |
|---|---:|---|
| `Continue chat analysis.txt` | 473 B | `fe19d2dbf9a94eff18e7cdb054c2eb0c1b636a14c85b6e0d521d3f6c11295b91` |
| `inventory_mk1_2026-09-02T12-40-50-696Z.json` | 115.6 KB | `a3757652b77aafac90189e13bb46e04a5c8e807e0252ba1a0a0a1e6217afc488` |
| `inventory_mk2_2026-09-02T12-40-37-343Z.json` | 237.7 KB | `ac6c77ae911dac0e98067756de924baa1bbb6d6746dd07d51461c2e14bdfac2f` |
| `mk2.zip` | 9.8 MB | `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2` |
| `MK-DOS-1E3O69-source.zip` | ~21 MB | `6c69695564972424f2f76db65adc0dc810cee23ad8850b03ca2f33655ee8122c` |
| `MK-DOS-1E3O70-source.zip` | previous | `651382efeb80876b8eabe46e1b7809d47d7047286543d0c23d0b1da5ce73593d` |
| `MK-DOS-1E3O71-source.zip` | previous | `23f0834445427fd667a946351dc9443248a589a703a57f10dcbee4b03db5e645` |
| `MK-DOS-1E3O72-source.zip` | current | `7da83f65954a3963c6966cb76a7639851c6e5d3f6bcb6388e1643b84c1b525ee` |
| `MK-DOS-1E3O81-source.zip` | frozen O81 | `bbaaed7f0e093d10aecc5c25045f85e55ac81cd7ee1b98b8a160f1e15c40cb93` |
| `MK-DOS-1E3O82-source.zip` | current O82 | `834bddd96bc74725a8cf523151fafd47a176aab2d031c7de617f7fa09d0c3c71` |
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

The old `mk-dos-archive.zip`, `(1)` through `(10)` archives are historical development snapshots. **Do not infer chronology from the numeric suffix alone.** They are useful for recovering earlier implementation/documentation state and are not automatically authoritative over the current O70 source.

The extracted `/mnt/data/earlydocs/` tree contains historical `CURRENT.md`, `RESEARCH.md`, and metadata snapshots recovered from those older archives.

## 4.5 Historical handoffs available inside the current source lineage

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
- `MK_DOS_Archive_HANDOFF_1E3O20_ANIMATION_PALETTE_CONTEXT_BRIDGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O21_GET_CHAR_ANI_CONSUMER_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O22_CHARACTER_ANIMATION_EXPORT_MANIFEST.md`
- `MK_DOS_Archive_HANDOFF_1E3O23_VERIFIED_PALETTE_BOUND_RGBA_EXPORT_FIXTURES.md`
- `MK_DOS_Archive_HANDOFF_1E3O24_CHARACTER_PALETTE_CONTEXT_VARIANT_RENDERER.md`
- `MK_DOS_Archive_HANDOFF_1E3O25_PALETTE_BINDING_EXCEPTION_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O26_ANIMATION_STREAM_CONTROL_TIMING_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O27_STAGE_BACKGROUND_RESOURCE_GRAPH_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O28_BACKGROUND_PLACEMENT_PIT_SCENE_EXPORT_IR.md`
- `MK_DOS_Archive_HANDOFF_1E3O29_BACKGROUND_RENDERER_ORDER_CAMERA_PROJECTION.md`
- `MK_DOS_Archive_HANDOFF_1E3O30_BACKGROUND_DYNAMIC_PROCESS_ANIMATION_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O31_TIME_AWARE_BACKGROUND_SCENE_IR.md`
- `MK_DOS_Archive_HANDOFF_1E3O32_ARENA_ANIMATED_SCENE_EXPORT_FIXTURE.md`
- `MK_DOS_Archive_HANDOFF_1E3O33_PILLAR_CLOUD_MOTION_RESET.md`
- `MK_DOS_Archive_HANDOFF_1E3O34_PILLAR_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O35_PIT_DYNAMIC_MOTION_SHADOW_BOUND.md`
- `MK_DOS_Archive_HANDOFF_1E3O36_PIT_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O37_CAVE_SPECIAL_OBJECT_RANDOM_PHASE.md`
- `MK_DOS_Archive_HANDOFF_1E3O38_CAVE_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O39_STRIPPED_BIGEMP_PROCESS_QUALIFICATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O40_STRIPPED_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O41_RENDERER_HISTORY_CLIPPING_ORDER.md`
- `MK_DOS_Archive_HANDOFF_1E3O42_PIT_FRESH_INITIAL_ORDINARY_COMPOSITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O43_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O44_MULTI_STAGE_FRESH_INITIAL_ORDINARY_BAK_EXPORT.md`
- `MK_DOS_Archive_HANDOFF_1E3O45_DYNAMIC_SPECIAL_LAYER_COMPOSITOR_CONTRACT.md`
- `MK_DOS_Archive_HANDOFF_1E3O46_NORMALIZED_DYNAMIC_BACKGROUND_COMPOSITOR_FIXTURES.md`
- `MK_DOS_Archive_HANDOFF_1E3O47_STAGE_EXPORT_CAPABILITY_COVERAGE_MANIFEST.md`
- `MK_DOS_Archive_HANDOFF_1E3O48_PRODUCT_STAGE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O49_BACKGROUND_ORIENTATION_STATIC_EXTRA_CORRECTION.md`
- `MK_DOS_Archive_HANDOFF_1E3O50_CORRECTED_STAGE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O51_DYNAMIC_SIBLING_VARIANT_QUALIFICATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O52_DYNAMIC_SIBLING_COMBINED_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O53_NO_OP_STAGE_COMPLETENESS.md`
- `MK_DOS_Archive_HANDOFF_1E3O54_COMPLETE_24_STAGE_NORMALIZED_BACKGROUND_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O49_BACKGROUND_ORIENTATION_STATIC_EXTRA_CORRECTION.md`
- `MK_DOS_Archive_HANDOFF_1E3O50_CORRECTED_STAGE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O37_CAVE_SPECIAL_OBJECT_RANDOM_PHASE.md`
- `MK_DOS_Archive_HANDOFF_1E3O38_CAVE_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
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

## 4.6 Additional project/library handoffs previously surfaced

The wider Project file surface has previously exposed additional handoff/checkpoint files not necessarily present in the mounted O14 ZIP, including:

- `MK_DOS_Archive_HANDOFF_2026-09-05_PAUSE(1).md`
- `MK_DOS_Archive_HANDOFF_2026-09-16_NEXT_VALIDATION_STEPS.md`
- `MK_DOS_Archive_HANDOFF_2026-09-20_B10D_DIRECTION_AND_RECOMPILER_GOAL.md`
- later D/F/G/O handoffs and closeout copies also exist in the Project file surface.

If a future question depends on exact wording or an artifact absent from the current source ZIP, search the Project files rather than guessing.

## 4.7 Key current MK1 research modules

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
- `research/animationResourceDecodeCensus.ts`
- `research/characterAnimationTableSelector.ts`
- `research/animationPaletteContextBridge.ts`
- `research/getCharAniConsumerCensus.ts`
- `research/characterAnimationExportManifest.ts`
- `research/verifiedPaletteBoundExportFixtures.ts`
- `research/characterPaletteContextVariantRenderer.ts`
- `research/paletteBindingExceptionCensus.ts`
- `research/animationStreamControlTimingCensus.ts`
- `research/stageBackgroundResourceGraphCensus.ts`
- `research/backgroundPlacementCompositionQualification.ts`
- `research/backgroundRendererProjectionQualification.ts`
- `research/backgroundDynamicProcessAnimationCensus.ts`
- `research/backgroundTimeAwareSceneIr.ts`
- `research/arenaAnimatedSceneExportFixture.ts`
- `research/pillarCloudMotionResetQualification.ts`
- `research/pillarDynamicSceneExportFixture.ts`
- `research/pitDynamicMotionShadowQualification.ts`
- `research/pitDynamicSceneExportFixture.ts`
- `research/caveSpecialObjectPhaseQualification.ts`
- `research/caveDynamicSceneExportFixture.ts`

## 4.8 Current O37/O38 verification artifacts

- `mk1_cave_special_object_phase_qualification_o37_final.json` — SHA-256 `f9ce715df2f56a3584796559112b83d5afbf58ba2911f73fc7fa5e5d2cc223ad`.
- `mk1_o37_independent_audit_final.json` — SHA-256 `3eafae34b5b68563beb2c2bea7dba9542e104103998cf675f99cfdc55036c942`; independently re-derived canonical machine-code anchors, coordinate table, creation record, palette words, 28-slot cycle, phase domain and all six uGRA payloads.
- `mk1_cave_dynamic_scene_export_fixture_o38_final.json` — SHA-256 `d3152e80dc5f17e8633beae575ce888ccba5b9ba2358e5e1e2f70d820b07cdbb`.
- `mk1_o38_independent_audit_final.json` — SHA-256 `9f5d9080e08b5c24c3ee90bfada40445bdff0e3bb9c4fa3d7036d45f79e304e7`; all six PNG raw-RGBA buffers independently reconstructed and matched exactly, with the 28 canonical cycle slots/ticks independently matched.
- `MK1_CAVE_O38_DYNAMIC_SCENE_ASSETS.zip` — SHA-256 `7b1ad1c18f37920144dc3685d3ee10b0980d2d020340394d3c30643e3d98f1eb`; six PNG payloads plus the exported CAVE dynamic-scene asset directory; ZIP integrity passed.

## 4.9 Evidence management warning

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


## 5.35 1E.3O.20 — animation/palette context separation

O20 combines O19 character->ANITAB selection with the verified character->palette-slot selector and normal/alternate state machine. All three are keyed by object character identity field `+0x48`, but the selector results are not interchangeable.

Nine joined contexts establish: Cage/VANDAN with GRIMM palettes; Kano/KANO with KANO palettes; Rayden/RAIDEN with RAIDEN palettes; Liu Kang/KANG with LUKANG palettes; Scorpion/NINJA with YNINJA palettes; Sub-Zero/NINJA with BNINJA palettes; Sonya/LIZ with LIZ palettes; Goro/GORO with GONGORO; EMP/EMP with YANG_P/EMP_P.

The decisive proof is that Scorpion and Sub-Zero share exactly the same `NINJA_ANITAB` while using distinct normal and alternate palette records. Separately, IDs 0..6 have distinct normal/alternate records while retaining their character ANITAB family. Thus one animation structure can legitimately render under multiple palette contexts.

Machine verdict: `MK1_ANIMATION_PALETTE_CONTEXT_SEPARATION_ESTABLISHED`.

This does not yet bind every effect-specific palette. It establishes the architecture needed to avoid incorrect bulk color exports.

## 5.36 1E.3O.21 — `GET_CHAR_ANI` consumer census

O21 moved from table structure to code-consumer evidence without inventing animation names. Canonical code contains **241 direct calls** to `GET_CHAR_ANI`. Of those, **220** have an immediately adjacent exact constant write to `A9`, exposing **65 distinct directly observed animation indices** spanning 0..85. The remaining **21** calls are preserved as dynamic or non-adjacent consumers rather than guessed.

Every direct call lies inside Watcom-owned code. O21 records module ownership and nearest Watcom symbols only as context; those symbols are not promoted to canonical gameplay labels. Every immediately observed constant index is covered by at least one discovered O17 ANITAB span.

Direct machine evidence: `o21_direct.json`, SHA-256 `21fb3414c2807e360925daf79dec4c322466569e3653f583439201710b492db1`. All O21 validation checks pass.

Direct verdict: `MK1_GET_CHAR_ANI_DIRECT_INDEX_CONSUMER_SURFACE_ESTABLISHED`.

Bounded meaning: O21 establishes a code-consumer context layer for numeric animation indices. It does **not** establish canonical gameplay names, equality of one numeric index across all characters, semantics for the 21 dynamic consumers, palette binding, universal timing, or a complete animation universe.

## 5.37 1E.3O.22 — character animation export manifest

O22 combines O17/O18/O19/O20/O21 into the first product-facing character animation export IR while explicitly keeping four axes separate:

1. structural ANITAB / stream / frame identity;
2. authentic indexed-pixel decode coverage;
3. palette context and palette-binding confidence;
4. code-consumer context and semantic-label confidence.

The manifest carries **9 character contexts** over **8 unique ANITABs**. Across **739/739 table cells**, it classifies **564 structural stream cells**, **559 image-bearing stream cells**, **5 control-only stream cells**, **33 direct-descriptor entries**, **592 image-bearing table entries ready for indexed/composited export**, and **147 non-image / unknown / sentinel / unassigned cells** retained without coercion. All 592 image-bearing entries are indexed-export ready because O18 authenticated and decoded every descriptor they reach.

O22 deliberately sets automatic body-palette application to false. Only three already-qualified palette bindings are promoted: Kano `KANO_ANITAB[67]` -> `BLOOD_P`; Rayden `RAIDEN_ANITAB[60]` -> `MORPH_P`; Rayden `RAIDEN_ANITAB[34]` -> `MORPH_P`. Character normal/alternate palettes remain context until entry-specific ownership is proved.

The O21 consumer evidence for **65 numeric indices** is attached as code context, but every entry retains `canonicalGameplayName = null`; nearest symbols or call-site context are not silently converted into authoritative animation names.

Direct machine evidence: `o22_direct.json`, SHA-256 `75c1a930e9fec15ac1ddbe3a77dea82b6cb6a4a3707d6412417b6c841f28c7b7`. All **10/10** O22 validation checks pass.

Direct verdict: `MK1_CHARACTER_ANIMATION_EXPORT_MANIFEST_ESTABLISHED`.

This is the current export architecture checkpoint:

`Character Context -> ANITAB -> Table Entry / Stream / Frame / Descriptor Graph -> Authentic Indexed Pixels`

with palette context and semantic/code context retained as separate evidence layers. Correct-color export is established only for separately qualified roots, not globally.

## 5.38 1E.3O.23 — verified palette-bound RGBA export fixtures

O23 is the first authentic-install end-to-end color export proof. It deliberately uses only palette bindings established independently before the pass:

- Kano heart-rip composition -> `BLOOD_P`;
- Rayden normal lightning setup/travel -> `MORPH_P`.

A stale historical O2 prerequisite generated from an edited executable was rejected rather than relabeled. O2 was regenerated from the authentic installation with canonical MK1 provenance and zero no-edit mismatch, then used as the fresh prerequisite.

O23 decodes authentic `MISC.GRA` / `RAIDEN.GRA`, applies the verified one-based source-index -> palette-entry alignment, converts verified MK1 palette words to preview RGB, emits transparent RGBA, and composes the already-qualified Kano multi-part heart frame using descriptor-local X/Y. Structural descriptor order is used only as a preview layering policy; final runtime z-order is not claimed.

Direct result: 8 heart sequence occurrences / 7 unique heart frame records / 1 multi-part occurrence + 13 qualified Rayden lightning sprites = **21 deterministic RGBA payloads**, with **0 decode failures** and **0 out-of-palette opaque indices**. All **10/10** validation checks pass.

Direct verdict: `MK1_QUALIFIED_PALETTE_BOUND_RGBA_EXPORT_FIXTURES_ESTABLISHED`.

Evidence:

- direct JSON SHA-256 `e3fb619e637f398c11862c96eb6fbb390510609821907c62b97655b787fce6c3`;
- PNG/report bundle SHA-256 `edb1d32078bd757bc4f6b8b5ede4192b18b7a8d12b002a39af2d1e8ea5f4caa4`;
- source ZIP SHA-256 `4fc9e559c27be79872332d4740255ce8ee963e80c72d7bcb229444a3b2c3da1a`.

Independent post-timeout recheck: after stripping run-specific timestamps/operation IDs, the fresh report is semantically identical to the original direct report, and all 21 regenerated PNGs are byte-for-byte identical by SHA-256. This closes the interrupted-run uncertainty for the bounded O23 claim.

## 5.39 1E.3O.24 — character palette-context variant renderer

O24 extends color rendering only to the structurally dominant animation resource of each O20 character context, using explicit already-qualified normal/alternate palette context. It does not assign body palettes to cross-resource/effect descriptors and labels the selection strategy `STRUCTURAL_DOMINANT_ANITAB_RESOURCE_NOT_UNIVERSAL_PALETTE_KEY`.

Across 9 character contexts / 8 unique ANITABs, the dominant-resource sets contain **1,016 unique descriptors** and **1,190 character-context descriptor instances**. Explicit normal/alternate contexts produce **2,263 RGBA descriptor variants** across **16 palette contexts**. Every selected palette record has 23 colors; every rendered opaque index fits the selected palette.

Dominant-resource coverage: Cage/VANDAN 140 (+10 excluded other-resource); Kano/KANO 146 (+17); Rayden/RAIDEN 148 (+9); Liu Kang/KANG 135 (+14); Scorpion/NINJA 174 (+26); Sub-Zero reuses the same NINJA geometry 174 (+26); Sonya/LIZ 156 (+10); Goro/GGORO 68 (+0); EMP/EMP 49 (+0).

The decisive repeated architecture result is shared ninja geometry: `NINJA_ANITAB` renders under four distinct Scorpion/Sub-Zero normal/alternate palette records (`YNINJA_P`, `YNINJA3_P`, `BNINJA_P`, `BNINJA3_P`). Geometry and palette state remain separate export axes.

All **13/13** O24 validation checks pass. Direct verdict: `MK1_CHARACTER_PALETTE_CONTEXT_VARIANT_RENDERING_ESTABLISHED`.

Evidence:

- direct JSON SHA-256 `d6de0ff9179c2e7421b101658f2424c104a98fc124282d8a2e2fe993512f990f`;
- representative PNG/report ZIP SHA-256 `53fe89a67ba8e6854a2bb24466387153b871e8fc30b463230073b523f7a6f097`;
- source ZIP SHA-256 `ff866b68ee3443deac1571259ef475143392b17f8e3ec162355a7026bc2ed966`.

Independent post-timeout recheck: after stripping run-specific timestamps/operation IDs, the fresh report is semantically identical to the original direct report, and all 16 regenerated representative PNGs are byte-for-byte identical by SHA-256. This closes the interrupted-run uncertainty for the O24 core claim.

O24 does **not** establish automatic per-animation palette ownership, cross-resource effect palettes, universal one-palette-per-GRA behavior, or universal body-resource semantics for the dominant resource.

## 5.40 1E.3O.25 — palette-binding exception census

O25 takes the exact set excluded from O24 and classifies it without promoting compatibility to ownership. O18 contains 1,102 unique ANITAB-reached descriptors; O24's structurally dominant-resource set covers 1,016, leaving 86 cross-resource descriptors. Their exact resource split is:

- `GRAPHICS/STANCE.GRA`: 45 unresolved;
- `GRAPHICS/FONTS.GRA`: 28 unresolved;
- `GRAPHICS/VICTORY.GRA`: 6 unresolved;
- `GRAPHICS/MISC.GRA`: 7 Kano heart descriptors, already qualified to `BLOOD_P`.

Therefore O25 establishes 7 independently qualified cross-resource descriptors and preserves **79 unresolved descriptors across three resources** without assigning a palette. The report retains exact Watcom descriptor symbols and does not use index-range compatibility, filename, proximity, or body-resource dominance as ownership evidence.

A decisive same-resource exception is also preserved: five ANITAB-reached Rayden lightning descriptors (`HANDBO22`, `HANDBO4`, `HANDBO5`, `HANDBO8`, `HANDBO9`) live in structurally dominant `RAIDEN.GRA` but are independently qualified to `MORPH_P`, not the Rayden body palette. Eight additional qualified lightning continuation/persistent-loop descriptors plus two off-table heart-loop descriptors produce **10 qualified off-table effect descriptors**, reinforcing that ANITAB discovery is not the complete animation/effect universe.

Direct authentic-install execution and a fresh deterministic rerun are semantically identical after removing run-specific metadata. O25 is read-only. Verdict: `MK1_PALETTE_BINDING_EXCEPTION_SURFACE_BOUNDED`.

## 5.41 1E.3O.26 — animation stream control + MFRAMEW dwell census

O26 independently re-verifies the canonical animation dispatcher and `MFRAMEW` rather than deriving timing from structural repetition alone. `DO_NEXT_A9_FRAME` recognizes:

- `0` END;
- `1` stream jump / A9 redirect;
- `2` `FLIP_MULTI`;
- `3` signed X adjustment through `MULTI_ADJUST_XY`;
- `4` signed X/Y adjustment through `MULTI_ADJUST_XY`;
- `5` frame assignment with carry set, causing immediate reparse without sleeping;
- `6` embedded callback;
- values `>6` ordinary frame targets with carry clear.

`MFRAMEW` saves the caller's EAX dwell argument, invokes `DO_NEXT_A9_FRAME`, terminates on END/ZF, reparses immediately on carry/opcode 5, and otherwise restores EAX and calls `PRCSLP` before continuing. This establishes **caller-supplied dwell behavior**, not a millisecond/second conversion.

Across the 514 unique O17 streams, O26 records:

- 453 END-terminated, 61 looping;
- 1,824 frame events: 1,818 ordinary/sleeping + 6 opcode-5 no-sleep;
- 83 stream jumps;
- 14 `FLIP_MULTI`;
- 27 X adjustments;
- 175 X/Y adjustments;
- 34 callbacks.

Canonical Segment-1 code contains **162 direct near tail transfers** (`E9`) into `MFRAMEW`: 158 immediate caller-supplied dwell arguments and 4 dynamic/unclassified EAX setups. All 162 lie inside Watcom-owned code. Immediate argument distribution is 1:4 sites, 2:13, 3:40, 4:53, 5:14, 6:23, 7:1, 8:8, 20:1, 48:1. O26 recognizes the Watcom synthetic-call form at 152 sites with exact fall-through return targets and six simpler immediate-EAX forms.

O26 does **not** establish the wall-clock unit, prove that every O17 stream is consumed through `MFRAMEW`, assign a dwell to every ANITAB entry, or resolve the four dynamic timing consumers. Callback semantics remain separately confidence-rated. Direct and fresh rerun reports are semantically identical after stripping run metadata. O26 is read-only. Verdict: `MK1_STREAM_CONTROL_AND_MFRAMEW_DWELL_SURFACE_ESTABLISHED`.

## 5.42 1E.3O.27 — stage/background resource graph census

O27 reconstructs the canonical MK1 background-module resource graph from authentic bytes without assuming arcade-stage names. `INIT_BAKMODS` statically establishes a 28-byte fixed top-level header followed by a variable scene list whose entries are literal control marker `1`, `0xFFFFFFFF` terminator, or an 8-byte `[BMOD ref][packed signed-pair argument]` record.

Authentic-install execution recovers **24** top-level `BGND.ASM` module records over **15** HDRS.GRA resource contexts. Their scene lists contain **68** BMOD references to **41** unique `BGNDTBL.ASM` BMOD records and **4** literal-one control markers. Every referenced BMOD binds to an exact `BGNDPAL.ASM` palette table and a placement table containing exactly the BMOD count of 8-byte records followed by `0xFFFF`.

The 15 descriptor contexts expose **548** contiguous NO_XY descriptor records. Every packed file ID / GRA offset resolves into the corresponding authentic resource, and all **548/548** decode successfully with the established uGRA decoder. The resource families include S1/T1/T2/NG1/NG2/S2, FU1/FU2/FU4/FU5/FU7/FU8, PAGE, ACT1 and ORE1 HDRS.GRA files.

O27 deliberately preserves the first two BMOD header words and all four placement-record words without semantic labels beyond the count/pointer relationships proven at this stage. It also does not map every internal module name to an arcade-facing stage name or claim a final scene raster. Direct and packaged-source reruns are semantically identical after removing run metadata. Verdict: `MK1_BACKGROUND_MODULE_RESOURCE_GRAPH_ESTABLISHED`.

## 5.43 1E.3O.28 — background placement consumer + PIT scene export IR

O28 follows all O27 BMODs into `BAKGND.ASM` symbol `BGND_UD1`. Eleven exact canonical code signatures qualify the inner placement consumer at Watcom offsets `0x4413..0x458A`.

The 18-byte BMOD record is now statically bounded as two culling extents, a placement-record count, a placement-table pointer, a NO_XY descriptor-table pointer and a palette-pointer-table pointer. Each 8-byte placement record is code-grounded as a control word, two signed local position words and a packed selector word. The selector equations are:

- descriptor byte address = `descriptorTableRef + 4 * (selectorWord & 0x0FFF)`;
- all canonical low-12 values are even, so the 8-byte descriptor ordinal is `(selectorWord & 0x0FFF) / 2`;
- palette selector = `((selectorWord >> 8) & 0xF0) | (controlWord & 0x0F)`;
- the two created-object position fields are signed-16 sums of the scene-entry pair and the two local placement words.

Across all **2,550** canonical placement records in all **41** O27 BMODs, descriptor selector failures = 0, palette selector failures = 0, and selected RGBA palette-range failures = 0. This validates **527** unique descriptor/palette combinations across the reached stage population.

The bounded internal `PIT_MOD` fixture consists of `bridge0BMOD` with 25 placements and `bridge1BMOD` with 333 placements. Together they contain **358** placements, reach **85/85** FU5 descriptors, use **23** palette selectors and produce **88** unique deterministic correct-colour descriptor/palette RGBA variants. A fixture package contains `PIT_scene_ir.json` plus the 88 transparent PNG variants. A fresh rerun is semantically identical and all generated fixture files are byte-for-byte identical.

O28 does not promote the remaining control-word bits, copied control high byte, final object/layer z-order, camera/scroll/clipping transform or a canonical full-stage raster. The two stored object position fields are qualified as position coordinates but are not renamed universal world X/Y. O28 is read-only. Verdict: `MK1_BACKGROUND_PLACEMENT_AND_PIT_SCENE_EXPORT_IR_ESTABLISHED`.

## 5.44 1E.3O.29 — background renderer order + camera projection

O29 follows the O27/O28-created objects into the canonical renderer. `MULTI_PLANE` exposes a contiguous nine-record table at Watcom Segment-2 offset `0x000006FC`, each record 20 bytes, followed by a zero first-dword terminator. Each record binds one runtime object-list head, occupancy-bit array, shared scroll accumulator pointer, plane-specific scroll accumulator pointer and `BAKxMODS` destination pointer.

The renderer traverses BAK planes in exact order **8 → 7 → 6 → 5 → 4 → 3 → 2 → 1 → 0**, with five special/non-BAK lists interleaved. Intra-list insertion is ascending first by object `+0x18`, then by signed 16.16 object Y at `+0x14`; the renderer walks head-to-tail. Exact-equal keys are insertion-history dependent because a new equal-key object is inserted before the existing equal. PIT contains 85 equal-key groups covering 295 objects, largest group 22, so O29 does not manufacture a total history-independent order inside those ties.

Renderer clipping statically closes O28's axis ambiguity: object 16.16 `+0x10` / integer `+0x12` is X and object 16.16 `+0x14` / integer `+0x16` is Y; descriptor dimensions map low16 width / high16 height. For ordinary BAK placement objects, object flag `0x4000` is clear under the qualified BAKGND control transform, so projection is:

- `screenX = worldX - currentPlaneScrollX`;
- `screenY = worldY - sharedScrollY`.

Default bounds reset to 320×200. `INIT_BAKMODS` shows module header `+0x08` seeds shared Y scroll and `+0x0A` seeds all nine horizontal scroll accumulators. `PIT_MOD` therefore begins on plane 0 with X scroll 211 and Y scroll 35, giving 358 exact initial projected coordinates.

Fresh packaged-source execution reproduces the same result; script syntax checks pass. O29 is read-only. Verdict: `MK1_BACKGROUND_RENDER_ORDER_AND_CAMERA_PROJECTION_ESTABLISHED_EQUAL_KEY_TIES_AND_DYNAMICS_PENDING`.

## 5.45 1E.3O.30 — background dynamic process + animation census

O30 explicitly tests whether canonical MK1 backgrounds contain time-dependent behavior. They do.

The process system is statically bounded: allocator `0x0001D64D` stores a child callback at process `+0x1C` and initializes wait `+0x06`; wait/yield routine `0x0001D576/0x0001D577` stores the tick count and continuation; scheduler traversal decrements the counter and resumes through `+0x1C` when it reaches `<=0`; process removal is at `0x0001D5D0`. All cadence values in O30 are therefore **scheduler ticks**, with no wall-clock conversion claimed.

All 24 O27 top-level module records fall into seven init-callback classes. Ten records use callbacks that directly spawn processes; eight bounded spawn edges are visible. Qualified descriptor-cycle families are:

- **CAVE** — 28 frame slots / 6 unique descriptors, object `+0x48` phase, bounded random initial phase, 8-tick cadence, `FU7HDRS.GRA`, 6/6 authentic descriptor decodes;
- **PILLAR** — three separate 8-frame cycles on plane-0/plane-1 object subsets, object `+0x44` 1..8 state, 24 unique descriptors in `FU4HDRS.GRA`, 24/24 decodes; a separate process also supplies positional motion;
- **ARENA** — one locally consumed 6-state descriptor cycle on planes 3/4, 8-tick cadence, `FU2HDRS.GRA`, 6/6 decodes. A second six-slot table loaded into a separate scratch global is retained as `LOADED_BUT_NOT_CONSUMED_BY_QUALIFIED_LOCAL_DESCRIPTOR_UPDATE_PATH`, not promoted to active animation.

Across active CAVE/PILLAR/ARENA cycles there are **58 frame slots**, **36 unique descriptors**, and **36/36** authentic GRA decodes.

`PIT_MOD` is also dynamic: one callback continuously recomputes a renderer/camera-related packed bound at 1-tick cadence; another creates a positional motion/reset family reaching an 8-tick loop; a conditional process creates a moving object with bounded random initial descriptor, velocity and threshold-based lifetime behavior. PILLAR has an analogous positional-motion process. STRIPPED spawns an external child at `0x276B4` whose semantics remain unresolved.

Qualified descriptor-swap helpers update descriptor/dimension/pixel/offset state but do not write object palette field `+0x28`; existing object palette state is preserved across these swaps. This does not prove initial palette ownership of every dynamic object.

Fresh packaged-source execution reproduces the same semantic result; script syntax checks pass. O30 is read-only. Verdict: `MK1_BACKGROUND_DYNAMIC_PROCESS_AND_DESCRIPTOR_ANIMATION_SURFACE_ESTABLISHED`.

Export consequence: the canonical lossless stage representation is no longer adequately modeled as a static placement list or one flattened image. It must preserve time/process state, descriptor-cycle state and motion in addition to O27-O29 resource, placement, palette, plane, camera and ordering evidence.

## 5.46 1E.3O.31 — time-aware background scene IR

O31 closes the structural join between top-level scene-entry arrays and O29's nine BAK planes. `INIT_BAKMODS` writes each scene entry into consecutive `BAK0MODS..BAK8MODS` slots, allowing all 24 modules / 72 scene slots to receive exact plane identities. Expanding 68 BMOD scene references yields **4,488 instantiated placement objects** while preserving the 2,550 unique underlying placement records. ARENA's updater joins to 8 plane-3 + 7 plane-4 objects per module variant, while PILLAR's three descriptor-cycle filters bind to exact 1 / 1 / 2 placement populations. Runtime-created CAVE objects remain deliberately outside this BMOD placement IR. Independent byte-level audit matched the report. Verdict: `MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED`.

## 5.47 1E.3O.32 — ARENA animated-scene export fixture

O32 exports the first bounded dynamic background fixture. The ARENA updater cycles six authentic `FU2HDRS.GRA` descriptors every eight scheduler ticks across 15 ordinary placement objects on planes 3 and 4. Selectors 11 and 0 alias the same affirmative 49-colour `FU2PALS` record at `0x0000F9E2`; palette state is preserved through descriptor swaps. Independent Python uGRA/palette reconstruction matched all six emitted PNG RGBA buffers exactly. A flattened composite is intentionally withheld because equal primary/Y sort keys overlap and O29 leaves that tie order runtime-history dependent. Verdict: `MK1_ARENA_BOUNDED_ANIMATED_SCENE_EXPORT_FIXTURE_ESTABLISHED`.

## 5.48 1E.3O.33 — PILLAR process-created cloud motion/reset qualification

O33 separates PILLAR's process-created cloud groups from its ordinary BMOD descriptor-cycle objects. Three no-scroll multipart groups are created on plane/list 6 using seven authentic `FU4HDRS.GRA` descriptors and the directly linked 12-colour `cloud_p` palette. Root X velocity is `0x00006666` signed 16.16; each group moves rigidly and shifts the whole multipart set exactly -459 X when the signed integer root exceeds 319. The process polls every eight scheduler ticks. On an explicitly normalized display-active path, first wraps occur at ticks 152, 616 and 888. Scheduler tick is not promoted to rendered frame or wall-clock time. Independent byte/decode/timing audit matched. Verdict: `MK1_PILLAR_CLOUD_MOTION_AND_WRAP_SEMANTICS_ESTABLISHED`.

## 5.49 1E.3O.34 — PILLAR bounded dynamic-scene export package

O34 preserves PILLAR's two qualified axes independently: three eight-state placement-bound descriptor cycles at four scheduler ticks and the separate process-created cloud motion track at eight scheduler ticks. The placement cycles use affirmative `fu4PALS` selectors and yield 24 correct-colour states; the cloud side exports seven `cloud_p` assets plus a 112-poll normalized timeline through tick 888. All **31** PNG/RGBA payloads were independently reconstructed exactly. Their canonical absolute mutual phase remains unestablished, so O34 does not fabricate a synchronized flattened stage. Verdict: `MK1_PILLAR_BOUNDED_DYNAMIC_SCENE_EXPORT_PACKAGE_ESTABLISHED`.

## 5.50 1E.3O.35 — PIT dynamic motion, shadow-bound and transient lifecycle qualification

O35 refines O30's PIT dynamics. Callback `0x4920` updates `SHAD_SCRNTL`, not camera scroll, from `CEILING_Y` and `WORLDTLY` every scheduler tick. Callback `0x494A` creates ten persistent no-scroll multipart groups on plane/list 2 from eight authentic `FU5HDRS.GRA` descriptors under directly linked 14-colour `dcloud_p`, using three exact signed-16.16 X-velocity classes and the qualified -459 wrap rule. Conditional callback `0x4870` selects one of eight `dcloud_p` silhouettes, creates it at (-80,37), and follows a normalized 250 / +288 / 788 threshold-pause-termination lifecycle. All 16 unique dynamic descriptors independently decode in palette range. Verdict: `MK1_PIT_DYNAMIC_MOTION_SHADOW_BOUND_AND_TRANSIENT_LIFECYCLE_ESTABLISHED`.

## 5.51 1E.3O.36 — PIT bounded dynamic-scene export package

O36 joins PIT's 358-placement ordinary scene to the qualified dynamic family without inventing unresolved camera, random or process phase. The package contains 88 ordinary correct-colour variants + 8 persistent dynamic parts + 8 transient silhouettes = **104** exact RGBA/PNG payloads, a 265-poll persistent motion track through tick 2112 with 12 wrap events, the conditional transient lifecycle, and a symbolic `SHAD_SCRNTL` track. Independent Python reconstruction matched all 104 PNG payloads and timelines. Canonical arbitrary-time full-stage flattening remains blocked. Verdict: `MK1_PIT_BOUNDED_DYNAMIC_SCENE_EXPORT_PACKAGE_ESTABLISHED`.

## 5.52 1E.3O.37 — CAVE special-object random-phase and palette qualification

O37 closes the CAVE process-created object gap. Unless numeric `GSTATE == 11`, init callback `0x4680` spawns process `0x2025` at `0x4699`. The child creates six linked objects on special list `BAKLST9` at exact coordinate-table offsets `(57,100)`, `(96,112)`, `(128,106)`, `(230,106)`, `(268,112)`, `(396,112)`. Creation record `0x00000A26` directly binds initial descriptor `0x0000264C` and palette pointer `0x0001003A` (`eyez2`, three colours). Object flags remain `2`, so scroll bypass bit `0x4000` is not set. Each object receives one sequential `RANDU(28)-1` call, establishing an initial phase domain 0..27 but not the seed or joint phase vector. All six unique authentic `FU7HDRS.GRA` cycle descriptors decode successfully within `eyez2`; the linked set advances through the exact 28-slot table every eight scheduler ticks. Independent audit re-derived the coordinate table, creation record, palette words, random bound, cycle and sprite payloads directly from canonical bytes. Verdict: `MK1_CAVE_SPECIAL_OBJECT_RANDOM_PHASE_AND_PALETTE_BINDING_ESTABLISHED`.

## 5.53 1E.3O.38 — CAVE bounded random-phase dynamic export package

O38 packages both CAVE module variants with O31 ordinary-scene context (204 instantiated placements for `CAVE_MOD`, 133 for `CAVE_MOD386`) plus the six process-created `BAKLST9` objects. It exports six unique correct-colour `eyez2` RGBA/PNG payloads and the complete 28-slot normalized phase-zero template at eight scheduler ticks per transition. Each runtime object retains an explicit 0..27 initial phase and follows `(p+n) mod 28`; phase zero is merely an export coordinate system. Independent Python reconstruction matched all six PNG raw-RGBA buffers and all 28 canonical table slots exactly. RNG seed/state, joint phase vector, canonical first rendered frame, wall-clock timing, later camera evolution and a canonical flattened stage remain intentionally unclaimed. Verdict: `MK1_CAVE_BOUNDED_RANDOM_PHASE_DYNAMIC_EXPORT_PACKAGE_ESTABLISHED`.

## 5.54 1E.3O.39 — STRIPPED BIGEMP process and view-selection qualification

O39 resolves the external child that O30 deliberately left unresolved. Authentic Watcom symbol/class evidence identifies callback `0x000276B4` as `BIGEMP_PROC` in `EMP.ASM`; the adjacent `EMPEROR_CLAP` symbol is not reached by the STRIPPED init path and remains outside this pass. `STRIPPED_MOD`, `STRIPPED_MOD486` and `STRIPPED_MOD386` all unconditionally spawn `BIGEMP_PROC` as process `0x2000`.

The process loads local five-entry multipart setup `0x000128FE`, where `EMPCLP2` directly carries palette pointer `0x00010356`. That record is count-prefixed with 23 RGB555 colours and aliases Watcom symbols `EMP_P` / `YANG_P`. `INIT_MULTI` creates five linked objects under the same palette state, `SET_MULTI_ANIX/ANIY` establishes animation anchor `(558,42)`, `SET_Z_MULTI` assigns primary sort `0x00010000`, and insertion callback `0x00027752` routes every part to `BAKLST4` / renderer plane 4. Object flags are ordinary scroll flags, not 0x4000 no-scroll.

Seven exact local frame records are addressed through table `0x0001283A`. Each state contains one of `EMPHEAD1..7` plus the shared four body descriptors `EMPBODP1..4`. Twelve unique `FU8HDRS.GRA` descriptors across setup/view state decode successfully and every opaque index is inside `EMP_P`. Every eight scheduler ticks `BIGEMP_PROC` samples signed-high-word `WORLDTLX`: values `<=169` force selection index 3; otherwise the index is `min(6,floor(abs(589-x)/60))`. The known initial camera X=405 therefore selects state 3 / `EMPHEAD1`. This is a camera/view-driven selector, not an autonomous descriptor cycle.

Independent Python validation re-read canonical `MK1.EXE` and `FU8HDRS.GRA`, matched 14 exact instruction/data anchors, the count-prefixed palette record, all 12 descriptor geometries/checksums, all seven frame records, representative selector results and world/screen part positions. The only exact secondary-Y tie is between body parts 1/2, whose horizontal rectangles do not overlap. Verdict: `MK1_STRIPPED_BIGEMP_MULTIPART_VIEW_SELECTION_ESTABLISHED`.

## 5.55 1E.3O.40 — STRIPPED bounded BIGEMP view export package

O40 joins the qualified BIGEMP multipart to the O31 STRIPPED ordinary scene contexts: 201 instantiated placements for `STRIPPED_MOD`, 195 for `STRIPPED_MOD486`, and 90 for `STRIPPED_MOD386`. Twelve direct `EMP_P` descriptor RGBA payloads are exported, together with seven deterministic five-part transparent composites keyed by selection index / exact local frame record. Total export is **19 RGBA/PNG payloads**.

All seven composites have a common 47×91 world crop. Renderer secondary-Y ordering is reproduced. `EMPBODP1` and `EMPBODP2` form the sole exact secondary-Y tie; because their horizontal rectangles do not overlap, either equal-key insertion order produces identical pixels, allowing the emperor multipart itself to be composited without inventing renderer history. Independent Python reconstruction from canonical bytes matched all 12 descriptor PNGs and all seven composite PNGs at raw RGBA level; it also independently re-derived the EXE selection-frame table and the 201/195/90 ordinary-placement context.

O40 does not export the setup record as a canonical visible frame and does not flatten the entire STRIPPED stage. Absolute process/display start phase, wall-clock rate, later camera trajectory, ordinary-scene equal-key history and broader clipping/special-list state remain unresolved. Verdict: `MK1_STRIPPED_BOUNDED_BIGEMP_VIEW_EXPORT_PACKAGE_ESTABLISHED`.

## 5.56 1E.3O.41 — renderer history, clipping and equal-key ordering qualification

O41 closes the renderer-history mechanism left deliberately open by O29. Canonical `YZSORT` stably repair-sorts `OBJLST`, `OBJLST2` and `OBJLST3`; exact-equal entries are not swapped. Special list `0x563B8` is qualified as the shadow list, rendered with `SHAD_SCRNTL` substituted as the relevant render bound. Ordinary BAK objects are maintained by the `BACKGROUND` / `MULTI_PLANE` lifecycle every eight scheduler ticks inside a camera-expanded active region extending 68 pixels horizontally and 48 vertically. Off-window objects are removed and their placement occupancy cleared. `INSOBJ_V` inserts newly recreated exact-equal objects ahead of surviving equal peers, proving why arbitrary later tie order can depend on camera/culling history. A deliberately defined fresh empty-state PIT snapshot is deterministic: 15 active placements, six viewport-visible placements and exact plane-1 order `169→124→72→143→75→58`. Independent direct-byte audit reproduced the signatures, placement geometry and order. Verdict: `MK1_RENDERER_SPECIAL_LIST_CLIPPING_AND_BACKGROUND_HISTORY_ORDER_SURFACE_ESTABLISHED`.

## 5.57 1E.3O.42 — PIT fresh-initial ordinary BAK compositor fixture

O42 consumes only the O41-qualified fresh PIT state and emits the first deterministic ordinary-background composite. Two exact correct-colour source variants feed six placement instances into a transparent 320×200 layer. The composite contains 10,278 opaque pixels and has raw-RGBA SHA-256 `a0d3f10adf58c9a22dc53898ed618ad07fbb1e5bc0c5a56ce1b877f7d6dbe4bc`. The exact-equal placements 169/124 overlap in 26 jointly opaque pixels and differ in colour at 22 of those pixels, proving that the qualified tie order is visually consequential. Independent Python EXE/GRA reconstruction matched both source PNGs and the final composite exactly. Process-created PIT dynamics, shadows/special lists, later history, fighters and HUD remain outside this bounded layer. Verdict: `MK1_PIT_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_FIXTURE_ESTABLISHED`.

## 5.58 1E.3O.43 — all-module fresh-initial ordinary BAK compositor census

O43 generalizes the O41 fresh empty-state/first-population ordering and clipping model across all 24 O27 top-level background modules using each module's O31 plane-slot mapping, initial camera and instantiated ordinary placement state. All **24/24 modules qualify**. Across the complete fresh state there are **2,575 active ordinary placement instances**, **2,153 viewport-visible placements**, **512 visible exact-equal key groups**, and **521 geometrically overlapping exact-equal pairs**. Every module has at least one visible placement and at least one overlapping exact-equal pair. The generalized PIT result exactly reproduces the O41/O42 regression anchor: 15 active, six visible, order `169→124→72→143→75→58`. Independent Python recomputation matched global counts and the complete renderer-order placement-ID sequence for every module. Verdict: `MK1_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS_ESTABLISHED`.

## 5.59 1E.3O.44 — multi-stage fresh-initial ordinary BAK export package

O44 turns the O43-qualified orders into product-facing deterministic fresh ordinary-background layers. Each visible placement is decoded from the authentic module HDRS.GRA resource and colourized from the exact count-prefixed palette record selected by that placement; no filename, resource-dominance or visual palette inference is used. The package exports **370 unique correct-colour source variants plus 24 transparent 320×200 module composites = 394 RGBA/PNG payloads**. Independent Python uGRA decoding, count-prefixed palette parsing and clipping/compositing matched **370/370 source PNGs and 24/24 composites** exactly at raw-RGBA level. There are **22 unique composite rasters**: `PIT_MOD`/`PIT_MOD386` and `GNINJA_MOD`/`GNINJA_MOD386` are exact duplicate pairs in this bounded state. PIT reproduces O42's composite SHA-256 exactly. A fresh extraction of the packaged O44 source reran O43/O44 semantically identically, and all 394 generated PNGs were byte-identical to the accepted set. These remain ordinary placement-derived initial layers only; process-created objects, special lists/shadows, dynamic absolute phase, fighters/HUD and later history are not silently composited. Verdict: `MK1_MULTI_STAGE_FRESH_INITIAL_ORDINARY_BAK_EXPORT_PACKAGE_ESTABLISHED`.

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
| O18 authentic animation-resource decode census | STATICALLY VERIFIED | 1,102/1,102 reached descriptors decode from real GRA resources; 0 failures |
| O19 character identity -> ANITAB selector | STATICALLY VERIFIED | 9 runtime identities map to 8 ANITAB families; Scorpion/Sub-Zero share NINJA_ANITAB |
| O20 animation/palette context separation | STATICALLY VERIFIED | character identity co-selects ANITAB and palette context; table identity is not a palette key |
| O21 GET_CHAR_ANI direct consumer census | STATICALLY VERIFIED | 241 direct calls; 220 immediate constant consumers; 65 distinct indices; 21 dynamic/non-adjacent preserved |
| O22 character animation export manifest | STATICALLY VERIFIED / PRODUCT-FACING IR | 9 character contexts; 739/739 entries retained; 592 image-bearing entries indexed-export ready; only 3 qualified palette bindings promoted |
| O23 qualified palette-bound RGBA fixtures | VERIFIED ON AUTHENTIC INSTALL | Kano heart/BLOOD_P + Rayden lightning/MORPH_P; 21 deterministic RGBA payloads; fresh deterministic recheck + identical PNGs |
| O24 explicit character palette-context variants | VERIFIED ON AUTHENTIC INSTALL | 1,016 dominant-resource descriptors; 2,263 normal/alternate RGBA variants; shared NINJA geometry under four palette records; effects excluded |
| O25 palette-binding exception census | VERIFIED ON AUTHENTIC INSTALL | 86 cross-resource descriptors: 7 qualified heart/BLOOD_P, 79 intentionally unresolved; 5 same-resource Rayden/MORPH_P overrides disprove universal dominant-resource palette inheritance |
| O26 stream control + MFRAMEW dwell census | VERIFIED ON AUTHENTIC MK1 | 514 streams classified; 1,824 frame events; 162 direct MFRAMEW tail transfers, 158 immediate dwell args + 4 dynamic; wall-clock unit not established |
| O27 stage/background resource graph census | VERIFIED ON AUTHENTIC MK1 | 24 top-level BGND modules; 41 unique BMODs / 68 scene refs; 15 HDRS.GRA contexts; 548/548 descriptors decode |
| O28 background placement + PIT scene export IR | VERIFIED ON AUTHENTIC MK1 | 2,550 placement records; 527 descriptor/palette pairs; 0 selector/range failures; PIT fixture 358 records, 85 descriptors, 23 palettes, 88 RGBA variants |
| O29 background renderer order + camera projection | VERIFIED ON AUTHENTIC MK1 | 9 BAK planes; exact 8→0 traversal; X/Y axes and camera subtraction established; PIT X=211/Y=35 initial projection; exact-equal ties remain runtime-history dependent |
| O30 background dynamic process + animation census | VERIFIED ON AUTHENTIC MK1 | 24 modules classified; 10 process-spawning module records; 8 spawn edges; CAVE/PILLAR/ARENA descriptor cycles; 58 active slots, 36/36 descriptors decode; PIT/PILLAR motion families bounded |
| O31 time-aware background scene IR | VERIFIED ON AUTHENTIC MK1 | 72 exact plane-addressed scene slots; 4,488 instantiated placement objects; ARENA/PILLAR dynamic targets joined without forcing process-created CAVE objects into placement IR |
| O32 ARENA animated-scene export | VERIFIED ON AUTHENTIC MK1 | six 8-tick states with affirmative FU2 palette binding; 6/6 independent RGBA/PNG matches; flattened tie-order composite withheld |
| O33 PILLAR cloud motion/reset | VERIFIED ON AUTHENTIC MK1 | three process-created no-scroll cloud groups; `cloud_p`; +0x6666 16.16 X velocity; -459 wrap; normalized first wraps 152/616/888 |
| O34 PILLAR dynamic export package | VERIFIED ON AUTHENTIC MK1 | 24 placement-cycle + 7 cloud RGBA/PNG payloads = 31; all independently matched; 4-tick and 8-tick tracks intentionally unsynchronized |
| O35 PIT dynamic qualification | VERIFIED ON AUTHENTIC MK1 | `SHAD_SCRNTL` updater, 10 persistent groups, 8 transient variants, `dcloud_p`, exact velocity/wrap and normalized 250/538/788 transient lifecycle |
| O36 PIT dynamic export package | VERIFIED ON AUTHENTIC MK1 | 88 ordinary + 16 dynamic = 104 exact RGBA/PNG payloads; 265 persistent polls / 12 wraps; symbolic shadow-bound track |
| O37 CAVE special-object/random-phase qualification | VERIFIED ON AUTHENTIC MK1 | six BAKLST9 objects; exact coordinate table; direct 3-colour `eyez2`; RANDU(28)-1 gives per-object phase 0..27; 28-slot/8-tick cycle |
| O38 CAVE bounded dynamic export package | VERIFIED ON AUTHENTIC MK1 | six exact correct-colour payloads; complete 28-slot phase automaton; CAVE/CAVE386 ordinary context 204/133; unknown joint RNG phase preserved |
| O63 audio/music resource graph | VERIFIED ON AUTHENTIC INSTALL | 244 WAVs; 533 sound records; 243 exact record→WAV bindings; 11 bounded loop-forever codes; `SOUND -> play_fx -> Miles digital-sample` bridge; gameplay names / `SAMPLES.DAT` role / MIDI runtime remain unresolved |
| O64 browser audio package + workspace | VERIFIED / PRODUCT UI | 249-entry STORE ZIP; 244 WAVs byte-exact + raw unresolved `SAMPLES.DAT`; 244 playable workspace assets; independent audit 260/260 |
| broad MK1 animation indexed/composited export | STRUCTURAL EXPORT MANIFEST ESTABLISHED | O22 preserves 739/739 entries; 592 image-bearing entries indexed-export ready from authentic GRA bytes |
| broad MK1 correct-color export | PARTIAL / BOUNDED | O23/O24 prove qualified effect/body contexts; O25 precisely bounds the remaining ANITAB-reached cross-resource surface at 79 unresolved descriptors and preserves same-resource effect overrides |
| general arbitrary frame growth/relocation | NOT ESTABLISHED | O9 zero runs are not qualified free space |
| uGRA pixel encoding/import | NOT ESTABLISHED | major future compiler lever |
| gameplay/collision/hitbox authoring | NOT ESTABLISHED | deliberately separated from visual placement |
| stage/background scene reconstruction | TIME-AWARE BOUNDED EXPORT IR ESTABLISHED | O27-O31 establish resource/placement/renderer/time-aware IR; O32/O34/O36/O38 provide independently verified bounded ARENA/PILLAR/PIT/CAVE dynamic exports; STRIPPED, equal-key history, some control bits and canonical arbitrary-time full-stage rasters remain unresolved |
| audio resource graph/export package | VERIFIED BOUNDED SURFACE | O63/O64 establish byte-exact WAV export + bounded sound-code/playback metadata; canonical event naming, SAMPLES.DAT role, runtime MIDI relationship and audio import/compiler remain unestablished |
| MK2 deep extraction/export foundation | VERIFIED BOUNDED SURFACE | O67-O86 independently establish indexed graphics, palette/fixup/identity selection and seven bounded identity/resource correct-colour contracts over six unique resources (HH0/LK0/JC0/BA0/FN4 slot 4/FN6 slot 5/FN4 slot 16); no whole-family or human-name promotion |
| MK3 deep format parity | NOT ESTABLISHED | only detection/inventory foundation currently mature |
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

## 9.11 O63 path-pool tiling assumption was corrected by authentic bytes

The first O63 implementation assumed the 244 NUL-terminated `SFX\*.WAV` path strings consumed the `sfx.ASM` data range exactly to its symbol end. The authentic fixture rejected that assumption: after `XTRA07.WAV` there is one additional zero padding byte at Watcom offset `0x22BEB`, and the module data end is `0x22BEC`. The corrected model records the path pool and the trailing pad separately. Lesson: even a semantically coherent string table must not be forced to tile a symbol range when the final authentic byte says otherwise. Preserve padding/unknown bytes explicitly.

---

# 10. Current source/package reconciliation status

1. **Current source lineage** — O89 is the active source line. `MK-DOS-1E3O89-source.zip` SHA-256 is `0803b8359311d9201fc25b03e18ccfb919600b647c1fa92848c6ea5675a1b611`; ZIP integrity passes. It preserves accepted MK1 O66 and MK2 O67-O88 and adds the bounded slot-9/NJ4 connected RGBA fixture. O88 remains the immediately preceding integration snapshot SHA-256 `0d81663336bf02190fc77988cbb68796a691cad16a31dca19386dc8c73b92702`.
2. **Authentic complete installation** — `mk1.zip` remains the preferred authentic MK1 resource fixture; canonical `MK1.EXE` SHA-256 remains `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.
3. **O18 authentic-resource evidence** — all 1,102 O17 descriptors decode from real GRA files with zero failures.
4. **O19/O20 selector-context evidence** — runtime character identity maps to ANITAB family while palette context remains a separate axis; shared NINJA geometry is the decisive counterexample to table-as-palette-key.
5. **O21-O26 animation export/control evidence** — 739 ANITAB cells retained; 592 image-bearing entries export-ready; bounded correct-colour fixtures/context variants remain valid; 79 cross-resource palette bindings remain unresolved; 514 streams and MFRAMEW caller-dwell surface remain bounded without wall-clock overclaim.
6. **O27-O31 background foundation** — 24 top-level modules, 41 unique BMODs, 72 plane-addressed scene slots, 4,488 instantiated placement objects, 548/548 header descriptors decoded, 2,550 placement records qualified, exact nine-plane traversal/camera/no-scroll semantics, and dynamic-process families preserved in time-aware scene IR.
7. **O32-O40 bounded dynamic exports** — ARENA, PILLAR, PIT, CAVE and STRIPPED dynamic families have evidence-backed state/export representations; palette ownership, motion, random phase and camera-driven BIGEMP selection remain separated rather than collapsed into static stage images.
8. **O41 renderer history/clipping** — exact special-list repair sorting, shadow-bound substitution, eight-tick BAK cull/recreate lifecycle and the mechanism for later equal-key history dependence are established; the bounded fresh empty-state/first-population contract is deterministic.
9. **O42 PIT compositor anchor** — final PIT composite raw-RGBA SHA-256 `a0d3f10adf58c9a22dc53898ed618ad07fbb1e5bc0c5a56ce1b877f7d6dbe4bc`; two source variants + composite independently matched exactly.
10. **O43 all-module census** — final report SHA-256 `9fb37d6089c2540adbc9bf52d7ea76781355dc89d77c868cdc50a634a13dd757`; all 24 modules qualify, with 2,575 active / 2,153 visible ordinary placement instances, 512 visible exact-equal groups and 521 overlapping exact-equal pairs. Independent audit SHA-256 `0a6b7d5344657106f3b974f32c9de95fc05b87267841cc824df9b7ddbc30fed4` matches the complete renderer-order placement-ID sequence for every module and reproduces the PIT regression anchor exactly.
11. **O44 multi-stage ordinary export** — final report SHA-256 `ed9dbc787d8f8835392d1c7af5579d90251827a983988a7d1d78ff34bc5a5063`; 370 unique correct-colour source variants + 24 320×200 module composites = 394 payloads. Independent audit SHA-256 `d4771b0e93e7b6f911f9f0d35e88832955d49bb51e54e1c8e9cf4f19840e2149` passes 370/370 source and 24/24 composite raw-RGBA comparisons. Asset ZIP SHA-256 `c413c842864b92a17cd20b7fcfe0f4cb8d021d4fbd28b19536bd1da54cb0b2a1`.
12. **O45 dynamic/special compositor contract** — final report SHA-256 `e7b989ceac122a8d536d7ac4a41f9c328d25ca126b77be8f307022d34a6e11d3`; it formalizes 14 renderer-list slots, eight renderer-facing dynamic contracts and five normalized compositor candidates. Independent audit SHA-256 `54f5ab06be2e5e5770026f47ea9023b351e93adbb18c926069958652f7f3f957` passed 20/20 checks from canonical EXE evidence.
13. **O46 normalized combined-background fixtures** — final report SHA-256 `a92dde16574a5f971a46f05e3d4949368d6b28aab4baa7d5fd888c9d7b8a41c1`; five distinct 320×200 combined ordinary+dynamic/special background rasters are established for ARENA, PILLAR, PIT, CAVE and STRIPPED under explicit normalized state vectors. Independent audit SHA-256 `9c7f095909209ea8f0a4d5f63c482074b074d9c7c37698fa718cd616835cdcf3` passed 23/23 checks and matched 5/5 complete rasters exactly at raw RGBA level. Asset ZIP SHA-256 `3e3e8f71ce59dc6df1328293306e9f0b0da49c33f5e950a3f068d3348121bd91`; ZIP integrity passed.
14. **O47 stage capability manifest** — final report SHA-256 `77b064b48f93338c3b35c16e17fa6763f88c5cb94e95d648f31e5c28cc872fb6`; independent audit SHA-256 `9ef18f3d2631ecce0b6d080ce81b841718d278964ad709e3492246c5c13b4914`. Tier split is exactly 5 direct normalized combined / 5 qualified dynamic structure without direct combined raster / 2 static-extra-object pending / 12 ordinary+scene-IR only.
15. **O48 product-facing stage package — historically verified / raster pixels partly SUPERSEDED** — final report SHA-256 `9ad4f04922f92cec6064134e210b0b10dcd9c0a44864191d4d2d67c306343760`; independent audit SHA-256 `9f778b8a6d8e51f8f165b8995c2d789f16d0b257a411ad0c6d2aadcc04b34fe0`; original package ZIP SHA-256 `3ec5f20709bf6a5ea609ab228218d2ee256cc4eba05f5f5ee316080c06735c10`. Its packaging/scene/coverage structure remains valid, but O49 proves a missing horizontal-orientation step in affected placement rasters.
16. **O49 orientation/static-extra correction** — final report SHA-256 `0b92f0e302388ce4ac8385715ead14af0b0d175f1fb1f55e8d943064b4fba2f6`; independent audit SHA-256 `aac0222a480e3dec30a17ebf22647662e4ac06f093e78268ca4df086e69b3b9e`. Exact counts: 801/4,488 instantiated and 201/2,153 fresh-visible placements are horizontally flipped across 14 module variants. Shared CHOP/STATUE static moon is 62×58 MISC.GRA, `(72,15)`, plane 4, direct 14-colour palette, checksum `fdc1634a`.
17. **O50 corrected product package** — final report SHA-256 `51725dee2143dc507b5e46f5f1e3b3239526b61a516353552c63969b3cd303b9`; independent audit SHA-256 `cce2b9d4f638f5e6d6f1e81d9d399503a64c520afc548bcc96ff9b103e4284e8`; corrected package ZIP SHA-256 `cd1aee694734bb27221a29e231addf1d6bf6383c5ac57102a827887cf29361bc`. Package contains 24 corrected ordinary PNGs, seven normalized combined PNGs, one shared moon PNG and 48 per-stage JSON documents. Independent audit passed 122/122 checks.
18. **O51 sibling qualification** — final report SHA-256 `e0d9c8169e9ebb3bd9642890685946af77623ecfb71716fea756867551904fd6`; independent audit SHA-256 `e670354e1f2b0499820b1646eb40869367e727cc62a8d3cb7a3d0096207fe4f9`. Five variants qualify under resource/camera/callback plus mechanism-specific evidence; ARENA386 retains 15 exact animated targets and PIT386 has an exact ordinary-graph match.
19. **O52 sibling fixtures/product refresh** — final report SHA-256 `f57f7ec8d145d21e00ca0c0f2fc6d25dc7b248f2981b1cd09df38f4f128ae852`; independent audit SHA-256 `836ede43054ff00a59dbb69b6dd516b1c7f88454565bd9d04ec91cde872cf071`; stage package ZIP SHA-256 `6fe7dcdeaba779f4216df0b19c7d68a56bd1dafe7571916f1ea69b19046c8086`. Five new direct normalized combined rasters are independently exact, bringing the package to 12 direct combined stage previews.
20. **O53 no-op completeness** — final report SHA-256 `5aaf64d1f59d3e96d60ed344bd7fed03896a3ec182d2a319093f027b3bd17871`; independent audit SHA-256 `782958290e2d54d876a2dad42bf75b47b283b35b6b6fbaf31aad753f6e41f0fe`. All twelve remaining ordinary-only modules resolve to literal `RET` at Watcom `0x4CAA`, with zero child callbacks and zero O45 dynamic/special contracts.
21. **O54 all-stage normalized package** — final report SHA-256 `942bef10cbf705580c26445dfc26cf154a2b96964d3ab2644c5cb5f963941d75`; independent audit SHA-256 `768451d838f80ba86ab842371a66a59457e357a99f37f375d3c69ddb5e206fc5`; stage package ZIP SHA-256 `c8f74dd94b9d6d127c13d5442199da607879cae5f9bae27739f7d2e50b8008b9`. The package contains 24 ordinary + 24 normalized background previews + one shared moon and 48 structured stage documents.
22. **O59 animation coverage** — final report SHA-256 `180ef62e536bf9afe6c4c0531b1952f4a78e7246cb7214f0035966b8e9a204ee`; exact coverage: 739 cells, 592 indexed-ready entries, 1,102 descriptors, 2,263 context RGBA variants, 21 verified effects, 79 unresolved indexed-only descriptors, 514 streams.
23. **O60 browser animation package** — final report SHA-256 `8a76f5be0bb0aaf8c648660b296347b17917f89083301d549f4695ddd1e7d6eb`; package ZIP SHA-256 `b68e80c00a9d44c1be7276c514db0d9b0e6e1110d8d1068a0d8048e7f0f69af7`; 2,295 entries / 2,284 PNGs / 11,230,148-byte indexed payload. Independent audit SHA-256 `c27b83707385b2ff905905bcc549ef033a455e81b27bca0554aa9341411843ca` passes 22/22 checks.
24. **O61 independent browser-package validation** — final report SHA-256 `25ea7a2ceaa5d6a2892840e25cb55919b09a944d418a6ab682cdfca7e329b559`; exact validated surface: 2,295 entries, 2,284 PNGs, 2,263 character-context PNGs, 21 effect PNGs, 1,102 indexed descriptors, 11,230,148 indexed bytes, 16 O24 aggregates, 79 unresolved indexed descriptors and zero unresolved RGBA assets. Verdict `MK1_BROWSER_ANIMATION_EXPORT_BUNDLE_VALIDATED`.
25. **O62 Animation Assets workspace** — final report SHA-256 `b7513c87251a591a207291299f3f636c29bdde2221b21b7ffe2d7d646ea692ba`; exact UI model: 2,263 character-context assets / 9 identities / 16 palette modes + 21 verified effects + 79 indexed-only unresolved = 2,363 browsable assets. Unresolved policy is `GRAYSCALE_INDEX_MAP_NOT_PALETTE`.
26. **O61/O62 independent source/package audit** — SHA-256 `449ab14d5fcc3465b93c7a477074ded5e91076625c495c6e2125002b88415bce`; **29/29 checks passed**, including accepted O60 ZIP SHA, 71-stage pipeline, UI tier labels/warnings, pagination, package parser independence and app metadata.
27. **O62 packaged-source acceptance** — recheck SHA-256 `c8e90c830a84615f212ba782fd589a16b62b07679ad6d34b37fe17b7a3bca300`; 7/7 checks pass. A clean extraction of `MK-DOS-1E3O62-source.zip` reruns O61/O62 semantically identically after stripping only run metadata; 11/11 key source/handoff files are byte-identical; both runners parse; targeted TypeScript with archival shims passes.
28. **O63 audio/music resource graph** — accepted report preserves 244 authentic WAVs / 533 records / 243 exact bindings / 11 loop-forever low-code entries and the bounded `SOUND -> play_fx -> Miles digital sample` bridge. Independent Python audit passes **516/516** checks. `SAMPLES.DAT` and runtime MIDI/sequence use remain unresolved by design.
29. **O64 browser audio package + validation** — accepted package SHA-256 `a636108a4907ff0d1aa5b6ed75b7d0f7f4143674185c78ac8028c6f9a3874613`; 249 entries / 12,798,744 bytes / 244 WAVs byte-exact / raw unresolved `SAMPLES.DAT`; independent Python package audit passes **260/260** checks.
30. **O64 Audio Assets workspace** — 244 playable byte-exact WAV assets; 243 bound sound-code assets; one path-pool-only `DUMMY.WAV`; 11 bounded loop-forever assets; filenames/codes are explicitly installation identifiers rather than gameplay names.
31. **O65 cross-domain capability/provenance index** — one machine-readable contract spans stage, animation and audio while retaining domain-specific evidence tiers and blockers. Current exact nested package identities are stage `f40fd7101b05f7b6c8ef528aa0a548749d3e88b64a5f2d0fb7ba04018b98c119`, animation `9a54d39b5518439c2a76f66e2e3bd12dd01a642e2febf0869345b94accd8461d`, audio `a636108a4907ff0d1aa5b6ed75b7d0f7f4143674185c78ac8028c6f9a3874613`; combined nested inventory is 2,645 logical entries. No unresolved tier is promoted.
32. **O66 unified browser archive** — accepted outer ZIP SHA-256 `f642535017027b99d2954049e89bd73657d4911d14260f53863ba21310f580a7`; 6 outer entries / 91,806,796 bytes; nested stage/animation/audio logical counts are 101 / 2,295 / 249. Exact current domain package byte streams are nested without transcode or flattening.
33. **O66 independent validation/reproducibility** — in-app validator passes the exact nested byte/CRC/count/manifest contract; separate Python audit passes **27/27** checks; source/UI integration audit passes **30/30** checks. A clean extraction of the final delivered source ZIP regenerates the unified ZIP byte-for-byte at the same SHA-256 and reproduces the O65/O66/validation reports semantically after removing only fresh timestamp/`*OperationId` bookkeeping; packaged-source acceptance passes **8/8** checks. Historical O55/O60 package hashes remain run-instance identities where embedded report metadata differs.
34. **Normal-app integration through O66** — the MK1 research workflow remains **75/75**. The UI retains Stage, Animation, Audio and Unified MK1 downloads plus the established Animation/Audio workspace warnings.
35. **O67 MK2 authentic foundation** — `mk2.zip` SHA-256 `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2`; `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`; LE header `0x28F0C`; 129-entry resource filename pool. O67's page-end/`UNRESOLVED_POST_LE_OVERLAY` subclaim is **SUPERSEDED by O72**, while its fixture/resource inventory remains valid.
36. **O68 MK2 JC0 indexed export** — 35 descriptor records / 120,240 authentic `JC0.GRA` encoded bytes tiled exactly / 194,096 decoded pixels / opaque index union 1..63. Deterministic 74-entry package SHA-256 `e1449affba806a6a76dfb1bc63b99efe1af5c6182c562b3a68aad6eba5a08390`; independent audit **205/205**; source/UI audit **21/21**. O72 reclassifies the descriptor corpus as file-backed Object-2 data; palette/runtime-consumer claims remain unresolved.
37. **O69 MK2 broad indexed census** — 4,225 grammar-valid candidates across 109 pooled GRA resources; 94 exact-full resources / 3,790 unique streams / 11,385,532 encoded bytes / 15,953,739 indexed pixels; opaque index union 1..175. Fifteen resources remain partial/ambiguous, fourteen pooled GRA resources have zero qualifying descriptor candidates, and `MONKS.GRA` remains out-of-pool. O72 establishes that the scanned range was a conservative subset of file-backed Object 2. Independent audit **217/217**; source/UI audit **23/23**.
38. **O69 packaged-source acceptance** — authoritative source `MK-DOS-1E3O69-source.zip` SHA-256 `6c69695564972424f2f76db65adc0dc810cee23ad8850b03ca2f33655ee8122c`; clean-source replay acceptance passes **6/6** and reproduces O69 semantically after excluding fresh run bookkeeping.
39. **O70 MK2 browser indexed package** — deterministic 7,678-entry STORE ZIP; 94 raw GRA files byte-exact + 3,790 index planes + 3,790 opacity masks + four metadata entries; 48,792,953 bytes; accepted SHA-256 `04902dcd5962d5b9ca708b34ce57735d5215ca64d3be762aa8d0652918dd8e97`. In-app all-stream validation passes; independent audit **109/109**; source/UI audit **23/23**.
40. **O70 packaged-source acceptance** — authoritative source `MK-DOS-1E3O70-source.zip` SHA-256 `651382efeb80876b8eabe46e1b7809d47d7047286543d0c23d0b1da5ce73593d`; clean-source replay regenerates the accepted package byte-for-byte and acceptance passes **9/9**.
41. **O71 MK2 palette mechanism** — authentic code proves `[u16 count][u16 packed colours…]` record grammar, a 60-entry × 8-byte palette-handle table, object palette handle at `+0x30`, a 32-entry × 8-byte DAC transfer ring, VGA `0x3C8/0x3C9` output and 15 direct allocator call sites. JC0 ownership remains unresolved. Internal checks pass 29/29; independent audit **55/55**; source/UI audit **29/29**.
42. **O71 correction boundary** — the intermediate 223-record structural scan is not promoted to a verified palette corpus. No correct-colour RGBA is emitted.
43. **O71 packaged-source acceptance** — authoritative source `MK-DOS-1E3O71-source.zip` SHA-256 `23f0834445427fd667a946351dc9443248a589a703a57f10dcbee4b03db5e645`; clean-source semantic replay succeeds and acceptance passes **9/9**.
44. **O72 bound-LE mapping correction** — authentic embedded MZ module base `0x26654` + `e_lfanew 0x28B8` lands on LE `0x28F0C`; module-relative data-pages value `0x3B600` maps to physical `0x61C54`; all 113 pages terminate exactly at executable EOF `0xD23CD`. O67's post-LE overlay classification is superseded and O68 descriptors are reclassified `FILE_BACKED_LE_OBJECT2_DATA`.
45. **O72 LE fixup qualification** — **27,004** internal records parse; 26,900 type-7 32-bit offset sources all exactly reproduce target object offsets, 104 type-8 self-relative records are retained, and the single truncated-final-page cross-boundary source is reconciled by bounded loader zero-fill. Independent audit passes **63/63**.
46. **O72 palette-pointer surface** — two relocation-sensitive 17-slot selector tables resolve through **34** authentic slot fixups to **29 unique counted 63-colour records**. Pointer provenance is established; `JC0/resource identity -> selector slot` remains unresolved and no RGBA is promoted. Source/UI audit passes **34/34**.
47. **O72 packaged-source acceptance** — authoritative source `MK-DOS-1E3O72-source.zip` SHA-256 `7da83f65954a3963c6966cb76a7639851c6e5d3f6bcb6388e1643b84c1b525ee`; clean-source semantic replay succeeds, independent/source audits rerun cleanly and acceptance passes **9/9**.
49. **O73 MK2 character/resource identity selector** — authentic code at physical `0x91909` reads object `+0x46` and indexes the 17-slot Object-2 table `0x1D588`; all 17 entries are relocatable and bounded witnesses establish resource-family skeleton `HH,LK,JC,BA,FN,FN,ST,RD,NJ,NJ,NJ,JX,GO,SK,NJ,NJ,FN`. Shared/special slots remain resource-labelled rather than promoted to unique human fighter names.
50. **O73 JC0 palette-slot join** — slot 2 reaches the exact O68 JC0 offset-0 descriptor at physical `0xC53D8`; because the O71/O72 palette selector uses the same object `+0x46`, JC0 is joined to palette slot 2 and exact 63-colour Object-1 records `0x2574A` / `0x257CA`. Palette-context names remain unresolved and no RGBA is emitted. Internal 69/69; independent audit **93/93**; source/UI audit **34/34**.
51. **O73 packaged-source acceptance** — authoritative O73 source `MK-DOS-1E3O73-source.zip` SHA-256 `4217d703a9290f65c171bd89fe21a33bfdb306a38a0b64818366ee6d02c09c60`; clean-source semantic replay succeeds and acceptance passes **9/9**.
52. **O74 JC0 two-context RGBA fixtures** — all 35 O68 JC0 streams render under both O73-qualified slot-2 records for **70 deterministic RGBA PNGs**. Renderer evidence proves source index N maps to record colour N-1. The contexts remain `selector_table_A_slot_02` / `selector_table_B_slot_02`; gameplay names are not promoted. Accepted 75-entry package SHA-256 `d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7`; independent audit **268/268**; source/UI audit **31/31**.
53. **O74 packaged-source acceptance** — authoritative source `MK-DOS-1E3O74-source.zip` SHA-256 `057afa63f9676a9388e1ccfd0e0bf3e4dd809d695344530a561b9edda5b44d0d`; clean-source semantic replay succeeds, the O74 package regenerates byte-for-byte, and acceptance passes **9/9**.
54. **O75 palette-selector gameplay semantics** — creation code selects table A by default and table B only for a nonzero side whose candidate identity equals the already-selected first-side identity (unless unnamed mode value 4 bypasses the override); runtime code independently toggles flag `0x40` and table B/A as identity equality changes. Table A is therefore `DEFAULT_CHARACTER_PALETTE`; table B is `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`. Internal 17/17; independent audit **52/52**; source/UI audit **31/31**.
55. **O75 packaged-source acceptance** — authoritative source `MK-DOS-1E3O75-source.zip` SHA-256 `664eb537982f6f4649cf25d940b4b6ace22b74a6220bc98a8f9f3e1d6a5c6977`; clean-source semantic replay succeeds and acceptance passes **9/9**.
56. **O76 HH0 second-fighter correct-colour fixture** — O73 slot 0 reaches `HH0.GRA+0`; O69 qualifies all 36 HH0 streams as exact full-resource tiling; O72 slot-0 palettes are Object-1 `0x252A0` / `0x25320`; O75 semantics identify them as default / same-character duplicate override. O76 exports **72** deterministic RGBA PNGs in a 77-entry, 1,843,277-byte ZIP SHA-256 `1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2`. Independent reconstruction **281/281**; source/UI **33/33**; HH0-only boundary preserved.
57. **O76 packaged-source acceptance** — authoritative source `MK-DOS-1E3O76-source.zip` SHA-256 `d886260fb3c00f0ad0fedf7acd38926177816bb67a444d6f028982f6abcd603a`; clean-source semantic replay succeeds, the O76 package regenerates byte-for-byte, and acceptance passes **9/9**.
58. **O77 LK0 third-fighter-resource correct-colour fixture** — O73 slot 1 reaches `LK0.GRA+0` at physical `0xC4878`; O69 qualifies all 36 LK0 streams as exact full-resource tiling of 131,528 bytes; O72 slot-1 palettes are Object-1 `0x254A0` / `0x25520`; O75 semantics identify them as default / same-character duplicate override. O77 exports **72** deterministic RGBA PNGs in a 77-entry, 1,659,164-byte ZIP SHA-256 `04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836`. Independent reconstruction **281/281**; source/UI **33/33**; LK0-only boundary preserved.
59. **O77 packaged-source acceptance** — accepted source `MK-DOS-1E3O77-source.zip` SHA-256 `1fedb703f521bb73c842671ad05406d5f8a3eba445a50e344f34761c204e675b`; clean-source semantic replay succeeds, the O77 package regenerates byte-for-byte, and acceptance passes **9/9**.
60. **O78 verified fighter-resource RGBA integration bundle** — exact accepted O76 HH0, O77 LK0 and O74 JC0 package byte streams are nested under one deterministic 5-entry STORE ZIP with stable manifest + README. Aggregate nested inventory is **229 logical entries / 214 verified PNGs**. Accepted outer bundle is 5,123,730 bytes, SHA-256 `0b2323d68595f7b20dc2e7801aefe0c3636f64e0e58e5c1ba651a3f96674aad2`. Independent integration audit **67/67**; source/UI **32/32**; no new ownership/naming claim.
61. **O78 packaged-source acceptance** — authoritative source `MK-DOS-1E3O78-source.zip` SHA-256 `14a4803c9e9df11fc4784ad206f9bc4be2eb1dcc6bc8f88dbe801b7a239a8191`; clean-source semantic replay succeeds, the O78 bundle regenerates byte-for-byte, and acceptance passes **9/9**.
62. **O79 BA0 fourth fighter-resource correct-colour fixture** — slot 3 reaches `BA0.GRA+0` at physical `0xC5FC0`; O69 qualifies 44 exact-full streams / 111,300 bytes; O72 supplies slot-3 default/duplicate palette records; O79 exports **88 deterministic RGBA PNGs** in a 93-entry / 1,299,552-byte package SHA-256 `8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133`. Independent reconstruction **337/337**; source/UI **33/33**; BA0-only boundary preserved.
63. **O79 packaged-source acceptance** — frozen source `MK-DOS-1E3O79-source.zip` SHA-256 `479f9086710e64ee22bfd40db7a0194ecc6a74eed850614320e1b5ae3f15e7be`; clean-source package hash/audits pass **5/5**.
64. **O80 four-fixture verified fighter-resource RGBA integration bundle** — exact accepted HH0/LK0/JC0/BA0 package byte streams are nested under one deterministic 6-entry STORE ZIP with stable manifest + README. Aggregate nested inventory is **322 logical entries / 302 verified PNGs**. Accepted outer bundle is 6,424,085 bytes, SHA-256 `10e2aa047027e2468112cfdb8582be5a21506d643c6de95a7d6976d5f9934f7c`. Independent integration audit **81/81**; source/UI **33/33**; no new ownership/naming claim.
65. **O80 packaged-source acceptance** — authoritative source `MK-DOS-1E3O80-source.zip` SHA-256 `cbbfe58a41b201e1cc9b4d1011e5f003b6a85cdc4dc854c5eadb86b0d397e305`; clean-source replay regenerates exact O79/O80 package hashes and acceptance passes **8/8**.
66. **O81 FN4 slot-4 connected-provenance correct-colour fixture** — authentic LE fixups close `0x2194 -> 0x21E0 -> 0x220A -> descriptor 0x27640 -> FN4.GRA+0`; O69 qualifies 27 exact-full FN4 streams / 69,660 bytes; O72/O75 supply slot-4 default/duplicate palette records/semantics. O81 exports **54** deterministic RGBA PNGs in a 59-entry / 989,065-byte package SHA-256 `f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726`. Independent reconstruction **221/221**; source/UI **35/35**. O73's loose slot-4 FN6 witness is superseded for exact slot-4 ownership; slots 5/16 remain unresolved at the connected standard.
67. **O81 packaged-source acceptance** — frozen source `MK-DOS-1E3O81-source.zip` SHA-256 `bbaaed7f0e093d10aecc5c25045f85e55ac81cd7ee1b98b8a160f1e15c40cb93`; clean-source replay regenerates the exact O81 package and acceptance passes **6/6**.
68. **O82 five-fixture verified fighter-resource RGBA integration bundle** — exact accepted HH0/LK0/JC0/BA0/FN4 package byte streams are nested under one deterministic 7-entry STORE ZIP with stable manifest + README. Aggregate nested inventory is **381 logical entries / 356 verified PNGs**. Accepted outer bundle is 7,413,956 bytes, SHA-256 `c1fb304d3f7acfb47683be326e87e4fd08f861fc1a3d442040582cc2150a22c9`. Independent integration audit **95/95**; source/UI **45/45**; no new ownership/naming claim.
69. **O82 packaged-source acceptance** — authoritative source `MK-DOS-1E3O82-source.zip` SHA-256 `834bddd96bc74725a8cf523151fafd47a176aab2d031c7de617f7fa09d0c3c71`; clean-source replay regenerates the exact O82 bundle byte-for-byte and acceptance passes **9/9**.
70. **O83 FN6 slot-5 connected-provenance correct-colour fixture** — authentic LE fixups close `0x21B8 -> 0x2E86 -> 0x2ECE -> descriptor 0x2788C -> FN6.GRA+0`; O69 qualifies 46 exact-full FN6 streams / 125,348 bytes; O72/O75 supply slot-5 default/duplicate palette records/semantics. O83 exports **92** deterministic RGBA PNGs in a 97-entry / 1,584,566-byte package SHA-256 `68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3`. Independent reconstruction **354/354**; source/UI **35/35**. O73's loose FN6 family clue is strengthened into exact slot-5 ownership; slot 16 remained unresolved at the O83 checkpoint and is later closed independently by O85.
71. **O83 packaged-source acceptance** — frozen source `MK-DOS-1E3O83-source.zip` SHA-256 `e8da3a8a9532b0a17d27e0901699175ea3f43ae91fe6f6d7e32cc6a02e0a565f`; clean-source replay regenerates the exact O83 package and acceptance passes **6/6**.
72. **O84 six-fixture verified fighter-resource RGBA integration bundle** — exact accepted HH0/LK0/JC0/BA0/FN4/FN6 package byte streams are nested under one deterministic 8-entry STORE ZIP with stable manifest + README. Aggregate nested inventory is **478 logical entries / 448 verified PNGs**. Accepted outer bundle is 8,999,328 bytes, SHA-256 `adb092f263f4fa0b7ede146b3f748a754ea1eb7919f95853f0d4112eed26ae1b`. Independent integration audit **109/109**; source/UI **54/54**; no new ownership/naming claim.
73. **O84 packaged-source acceptance** — authoritative source `MK-DOS-1E3O84-source.zip` SHA-256 `d37177b60206eaef4e24558df599fcea7d8aedc80c9cf174e351845d27ef3d3b`; clean-source replay regenerates the exact O84 bundle byte-for-byte and acceptance passes **9/9**.
74. **O85 FN4 slot-16 connected-provenance aliased-palette fixture** — authentic LE fixups close `0x208C -> 0x21E0 -> 0x220A -> descriptor 0x27640 -> FN4.GRA+0`; O69 qualifies 27 exact-full FN4 streams / 69,660 bytes. Slot-16 palette tables A/B both resolve to the same 63-colour record Object-1 `0x2AD2A` / physical `0x8C97E`, so the duplicate override is a visual no-op. O85 exports **54** context-specific PNGs with **27/27 identical A/B pairs** in a 59-entry / 988,909-byte package SHA-256 `f15d5425f359ab6db21a31d82650ecd2c90105c9036194d1ef1e61e91e9079ff`. Independent reconstruction **223/223**; source/UI **41/41**.
75. **O85 packaged-source acceptance** — frozen source `MK-DOS-1E3O85-source.zip` SHA-256 `3a403da09ce816f83b8099330dd746d372222f5b79b3f9ebf267723468853ddf`; clean-source replay regenerates the exact O85 package and acceptance passes **7/7**.
76. **O86 seven verified identity/resource RGBA integration bundle** — exact accepted slot0/HH0, slot1/LK0, slot2/JC0, slot3/BA0, slot4/FN4, slot5/FN6 and slot16/FN4 package byte streams are nested under one deterministic 9-entry STORE ZIP with stable manifest + README. Aggregate nested inventory is **537 logical entries / 502 verified PNGs**. Accepted outer bundle is 9,989,261 bytes, SHA-256 `6d17d56e676cdc2523efaa823ff716d5f28d3ce4f3350f82f669645b590a97e6`. Independent integration audit **123/123**; source/UI **46/46**; no new ownership/naming claim.
77. **O86 packaged-source acceptance** — authoritative source `MK-DOS-1E3O86-source.zip` SHA-256 `8ebc28cddd5ddc9351e836fb37e392064c838415b9ab1a7b6a2f46cfb0f79547`; clean-source replay regenerates the exact O86 bundle byte-for-byte and acceptance passes **7/7**.
78. **O87 NJ7 slot-8 connected-provenance correct-colour fixture** — slot 8 actual root Object-2 `0x9C54` has a connected unique-prefix path `0x9C60 -> 0xAC4A -> 0xACA6 -> 0xAD16 -> descriptor 0x285F8 / physical 0xC924C -> NJ7.GRA+0`. O69 qualifies **116 exact-full NJ7 streams / 241,320 bytes**; O72/O75 supply distinct slot-8 default/duplicate palette records. O87 exports **232 deterministic RGBA PNGs** in a 237-entry / 2,535,316-byte package SHA-256 `b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd`. Independent reconstruction **846/846**; source/UI **37/37**. The slot-8 root graph reaches additional NJ-family resources, so NJ7 is one bounded connected contract rather than complete/canonical slot-8 geometry.
79. **O87 packaged-source acceptance** — frozen source `MK-DOS-1E3O87-source.zip` SHA-256 `ffc31e6136132fb394ee1a9e32e4e19b964ae5ece77ca2bd479e7e8190b64551`; clean-source replay regenerates the exact O87 package and acceptance passes **6/6**.
80. **O88 eight verified identity/resource RGBA integration bundle** — exact accepted slot0/HH0, slot1/LK0, slot2/JC0, slot3/BA0, slot4/FN4, slot5/FN6, slot8/NJ7 and slot16/FN4 package byte streams are nested under one deterministic 10-entry STORE ZIP with stable manifest + README. Aggregate nested inventory is **774 logical entries / 734 verified PNGs**. Accepted outer bundle is 12,525,359 bytes, SHA-256 `97cc701cf39641acaa2930d3e7568bb44ee6eeb0d84a65d972b7a470ccc49f1e`. Independent integration audit **139/139**; source/UI **38/38**; no new ownership/naming/canonical-geometry claim.
81. **O88 packaged-source acceptance** — authoritative source `MK-DOS-1E3O88-source.zip` SHA-256 `0d81663336bf02190fc77988cbb68796a691cad16a31dca19386dc8c73b92702`; clean-source replay regenerates the exact O88 bundle byte-for-byte and acceptance passes **9/9**.
82. **O89 NJ4 slot-9 connected-provenance correct-colour fixture** — starting strictly from slot 9's five-field root Object-2 `0x9C68`, an eight-edge authentic type-7 fixup chain reaches descriptor Object-2 `0x2919C` / physical `0xC9DF0` -> `NJ4.GRA+0`; a tempting path through source `0x9C90` is rejected because it lies outside the slot-9 root record. O69 qualifies **24 exact-full NJ4 streams / 75,512 bytes**; O72/O75 supply distinct slot-9 default/duplicate palette records. O89 exports **48 deterministic RGBA PNGs** in a 53-entry / 914,627-byte package SHA-256 `7bd6be4c260b83f4fb69a9b26734e3ad3a5bc0a3363bc302ecc8426281bf7a7a`. Independent reconstruction **207/207**; source/UI **32/32**. The broader slot-9 graph reaches additional NJ-family resources, so NJ4 is one bounded connected contract rather than complete/canonical slot-9 geometry.
83. **O89 packaged-source acceptance** — authoritative source `MK-DOS-1E3O89-source.zip` SHA-256 `0803b8359311d9201fc25b03e18ccfb919600b647c1fa92848c6ea5675a1b611`; clean-source replay regenerates the exact O89 package byte-for-byte, reproduces the report semantically after excluding fresh timestamp/operation-ID bookkeeping, reruns independent/source audits at **207/207** and **32/32**, and acceptance passes **7/7**.
84. **Writer/shared-abstraction scope unchanged** — O18-O89 add no arbitrary relocation/import capability. O67-O89 are read-only MK2 research/export/integration work and do not promote a shared MK1/MK2 implementation abstraction.
85. **Pause discipline** — the current user rule permits **up to two major verification passes per cycle**. The retry cycle completed and froze **O89 only**; **O90 has not started**.

# 11. Current epistemic boundary

The project now establishes a broad MK1 executable-to-resource export graph, a time-aware background-scene layer, and a bounded digital-audio graph:

`runtime character identity -> ANITAB -> stream/control events -> descriptor/vector -> GRA payload -> indexed pixels -> explicit palette context when qualified`

and

`background module -> scene slot/plane -> BMOD placements -> descriptor/palette state -> renderer sort/camera/no-scroll semantics -> dynamic process/descriptor-cycle tracks -> bounded time-aware export state`.

Established at this checkpoint includes:

- 9 runtime character contexts over 8 ANITAB families;
- all 739 discovered ANITAB cells structurally retained and 592 image-bearing entries export-ready;
- 1,102 ANITAB-reached descriptors authenticated/decoded;
- bounded explicit character/effect palette contexts while 79 O25 cross-resource cases remain intentionally unresolved;
- stream/control census for 514 streams and caller-supplied MFRAMEW dwell without wall-clock conversion;
- O61 independent browser-package validation of all 2,295 O60 entries / 2,284 PNGs / 1,102 indexed descriptors, preserving exactly 79 unresolved indexed-only palette cases;
- O62 visual animation workspace exposing 2,363 assets across explicit character-context, verified-effect and grayscale indexed-unresolved tiers without strengthening palette/timing/name claims;
- 24 top-level background modules, 41 unique BMODs, 72 plane-addressed scene slots and 4,488 instantiated placement objects;
- 2,550 unique BMOD placement records and the 358-placement / 88-variant PIT ordinary scene fixture;
- exact nine-plane renderer traversal, sort keys, camera subtraction and no-scroll behavior;
- CAVE/PILLAR/ARENA descriptor-cycle families in scheduler ticks, with CAVE now joined to its six process-created special-list objects and direct palette/random-phase mechanism;
- ARENA six-state correct-colour dynamic export with runtime-preserved object palette;
- PILLAR placement-cycle plus process-created cloud motion exported as independent normalized tracks;
- PIT `0x4920` proven to be `SHAD_SCRNTL` shadow/render-bound state, not camera mutation;
- PIT persistent process family: 10 no-scroll groups, 8 unique visual parts, exact velocity classes and wrap semantics;
- PIT conditional transient: exact spawn gate, 8 random variants and normalized 250/538/788 local lifecycle;
- PIT bounded export: 104 exact RGBA/PNG payloads, 265 persistent snapshots through tick 2112, 12 wrap events, symbolic shadow-bound track and explicit initial camera X=211/Y=35;
- CAVE special-object qualification: six `BAKLST9` objects, exact coordinate table, direct three-colour `eyez2`, six sequential `RANDU(28)-1` calls and 28-slot/8-tick cycle;
- CAVE bounded export: six independently matched correct-colour payloads plus complete 28-slot normalized phase automaton and explicit 0..27 per-object phase domains for both module variants;
- STRIPPED external child resolved as `BIGEMP_PROC` / EMP.ASM, with five plane-4 multipart parts, direct 23-colour `EMP_P`, 12 decoded descriptors and exact seven-state camera/view selector;
- STRIPPED bounded export: 12 source descriptors plus seven independently matched 47×91 multipart composites, with 201/195/90 ordinary placement context preserved.
- renderer history/clipping qualification: YZSORT stable special-list repair, shadow-list `SHAD_SCRNTL`, ordinary BAK 8-tick cull/recreate maintenance and exact mechanism for later equal-key history dependence;
- bounded fresh-initial PIT ordinary compositor: deterministic six-instance order, viewport clipping, 10,278 opaque pixels, and independently verified 3-payload RGBA export.
- generalized O43 fresh-initial ordinary BAK census across all 24 modules: 2,575 active placements, 2,153 visible placements, 512 visible exact-equal groups and 521 overlapping equal-key pairs, with complete independently matched module draw sequences;
- O44 deterministic fresh ordinary-background package: 370 unique correct-colour source variants, 24 exact 320×200 composites, 394 total RGBA/PNG payloads and 22 unique module rasters, with PIT/PIT386 and GNINJA/GNINJA386 exact duplicate pairs in this bounded state;
- O45 common dynamic/special compositor contract: exact 14-slot renderer traversal, eight qualified dynamic layer contracts, multipart sort-primary defaults/overrides, and five explicit normalized state vectors;
- O46 normalized combined-background fixtures: five independently exact 320×200 rasters for ARENA/PILLAR/PIT/CAVE/STRIPPED, with unresolved RNG/shadow/phase axes represented explicitly rather than silently fixed.
- O49 renderer-orientation correction: placement control bit `0x0010` is mechanically established as horizontal flip through the DOS `fWrtNonZero`/`fClpWrtNonZero` dispatch path; 201 fresh-visible placement instances across 14 module variants require this orientation. Source uGRA payloads themselves remain unmirrored.
- O49 CHOP/STATUE static-extra qualification: one shared no-scroll 62×58 moon from `MISC.GRA`, direct 14-colour palette, screen `(72,15)`, renderer plane 4.
- O50 corrected product package: 24 corrected ordinary rasters, seven directly qualified normalized combined rasters, one shared moon asset and 48 structured stage documents, independently reconstructed with 122/122 checks passing.
- O51 sibling-variant qualification: five process-spawning siblings mechanically qualified without callback-only inference; ARENA386 keeps the exact 15 animated targets and PIT386 matches the parent ordinary graph exactly.
- O52 product refresh: five independently exact sibling normalized combined fixtures, raising direct combined preview coverage to 12/24 modules while preserving unresolved-state blockers for the remaining 12.
- O53/O54 complete the normalized stage preview surface without fabricating dynamics: twelve remaining modules have a direct no-op init (`RET`) and therefore legitimately reuse their corrected ordinary raster as the normalized preview; all 24 stage modules now have both ordinary and normalized background previews under explicit capability metadata.
- O55/O56 productize and independently validate the stage browser package: 101 logical entries containing 49 PNGs, 48 stage JSON documents, three root research reports and README under the qualified O54 contract.
- O63/O64 establish and productize the digital-audio surface: 244 byte-exact WAVs, 533 executable sound records, 243 exact sound-record/WAV bindings, 11 bounded loop-forever low codes, raw unresolved `SAMPLES.DAT`, and a 249-entry independently validated audio ZIP; filenames/codes remain identifiers rather than event names.
- O65 cross-domain integration preserves those domain contracts in one provenance index: 49 stage RGBA assets + 48 stage documents; 2,263 animation character-context RGBA + 21 effect RGBA + 1,102 indexed descriptors with exactly 79 unresolved palette cases; 244 raw WAVs + one raw unresolved `SAMPLES.DAT` resource.
- O66 unifies distribution, not semantics: one deterministic 6-entry outer archive nests the exact current stage/animation/audio package bytes (2,645 nested logical entries total) plus stable cross-domain manifests/README; independent validation and Python audit confirm byte identities, counts and caveat preservation.
- O67 independently establishes the authentic MK2 fixture, LE-header location and executable resource filename pool; O72 **supersedes** O67's former `UNRESOLVED_POST_LE_OVERLAY` page-boundary interpretation with a bound-module mapping that reaches EOF.
- O68-O70 establish a lossless indexed MK2 graphics surface: 35 exact JC0 streams first, then 94 exact-full GRA resources / 3,790 streams, then a deterministic 7,678-entry browser package preserving raw GRA + index/mask payloads.
- O71 independently establishes MK2 palette mechanism structure: counted 16-bit palette records, 60 reference-counted palette handles, object handle field `+0x30`, 32 queued DAC-transfer requests, VGA DAC write path and 15 direct allocator calls.
- O72 independently establishes the bound-module LE file/page/fixup mapping and resolves two 17-slot selector tables through 34 authentic fixups to 29 unique 63-colour palette records.
- O73 establishes object `+0x46` as the shared 17-slot resource/animation and palette-selector identity axis, bounds all 17 slots to resource families, and mechanically joins `JC0.GRA` to identity/palette slot 2 and exact palette records `0x2574A` / `0x257CA`.
- O74 establishes source-index→palette-entry mapping and 70 correct-colour JC0 RGBA fixtures; O75 proves table A is the default character palette and table B the same-character duplicate override.
- O76 independently repeats the identity/resource/palette/render chain for slot 0 / `HH0.GRA`: 36 exact-full streams × two slot-0 semantic palette contexts = 72 verified RGBA fixtures. This is HH0-only evidence, not broad `HH` family ownership.
- O77 independently repeats the same bounded chain for slot 1 / `LK0.GRA`: 36 exact-full streams × two semantic palette contexts = 72 verified RGBA fixtures; LK0-only evidence.
- O79 independently repeats it for slot 3 / `BA0.GRA`: 44 exact-full streams × two contexts = 88 verified RGBA fixtures; BA0-only evidence.
- O81 corrects/tightens shared-FN provenance for slot 4: a connected authentic fixup chain reaches `FN4.GRA+0`, O69 qualifies 27 exact-full FN4 streams, and O81 exports 54 verified RGBA fixtures under the exact slot-4 palettes. O73's older slot-4 FN6 witness is superseded for exact slot-4 ownership.
- O83 independently tightens shared-FN provenance for slot 5: a separate connected authentic fixup chain reaches `FN6.GRA+0`, O69 qualifies 46 exact-full FN6 streams, and O83 exports 92 verified RGBA fixtures under the exact slot-5 palettes.
- O85 independently closes slot 16 at the same standard: its own root reaches `FN4.GRA+0`; both slot-16 selector tables alias one exact palette record, so its same-character duplicate override is a proven visual no-op while preserving a distinct identity-slot contract from slot 4.
- O86 is integration/distribution only: exact slot0/HH0, slot1/LK0, slot2/JC0, slot3/BA0, slot4/FN4, slot5/FN6 and slot16/FN4 package bytes are nested into one deterministic 502-PNG / 537-entry archive without semantic widening.

Still unestablished or intentionally blocked:

- canonical palette ownership for the 79 O25 unresolved cross-resource descriptors;
- universal body-palette inheritance or one-palette-per-GRA behavior;
- canonical gameplay names for every ANITAB/A9 index or proof ANITABs are complete animation/effect universes;
- wall-clock meaning of MFRAMEW/background scheduler ticks or a universal scheduler-tick-to-display-update ratio;
- canonical absolute phase between concurrently spawned background processes/tracks;
- runtime evolution of PIT camera scroll after its qualified initial state;
- numeric `SHAD_SCRNTL` timeline without runtime `CEILING_Y` / `WORLDTLY` state;
- deterministic presence/variant/absolute phase of PIT's conditional random transient in a generic stage capture;
- history-independent exact relative draw order inside equal primary+Y ties for arbitrary later snapshots; O41 does establish exact order for a specifically defined fresh empty-state/first-population snapshot;
- canonical full-stage raster at an arbitrary named time/process state for PIT, PILLAR, ARENA, CAVE or STRIPPED where unresolved ordering/camera/phase axes matter;
- CAVE RNG seed/state, the joint six-object phase vector, canonical first rendered CAVE frame and later runtime camera evolution;
- semantic meaning of BMOD placement control-word bits other than the now-qualified horizontal-flip path where not already established;
- a universal/canonical composition of process-created/special-list/shadow layers with ordinary BAK layers at arbitrary gameplay state; O46 only establishes five explicitly normalized fixtures;
- absolute dynamic phase and cross-process synchronization required for a canonical full-stage moment;
- runtime numeric shadow-bound state where `CEILING_Y` / `WORLDTLY` inputs are not fixed by the bounded export state;
- canonical gameplay/event naming for the 244 WAV assets;
- `SAMPLES.DAT` format/purpose or a qualified direct runtime join;
- runtime MIDI/sequence use beyond the bounded O63 negative direct-near-call observation;
- audio editing/transcoding/import/re-encoding;
- generic uGRA pixel encoding/import or arbitrary EXE allocation/relocation;
- gameplay/collision/hit semantics from visual descriptors;
- broad MK2 GRA palette ownership beyond the nine bounded identity/resource contracts now established (`HH0.GRA` slot 0, `LK0.GRA` slot 1, `JC0.GRA` slot 2, `BA0.GRA` slot 3, connected `FN4.GRA` slot 4, connected `FN6.GRA` slot 5, one connected `NJ7.GRA` contract for slot 8, one connected `NJ4.GRA` contract for slot 9, and connected `FN4.GRA` slot 16); repeated/shared geometry does not generalize to sibling GRA files or shared palette identity, and O87/O89 explicitly do not establish NJ7/NJ4 as complete/canonical slot geometry;
- verified classification of the earlier 223-record structural candidate chain as a palette corpus; O71 explicitly rejects that promotion;
- unique human-readable fighter names for every O73 selector slot, especially shared `FN`/`NJ` and special resource-only slots; resource-family identity is qualified but human slot semantics remain partial;
- numeric Player 1 / Player 2 naming for side indices 0/1 and the semantic meaning of O75's mode value 4; default vs same-character-duplicate palette semantics themselves are now established;
- full MK2/MK3 resource-format parity or shared MK-DOS abstractions not independently repeated across games.

Known palette counterexamples remain mandatory context: `RAIDEN.GRA` body and lightning sprites do not share universal palette ownership; Kano heart uses `MISC.GRA` with `BLOOD_P`; PILLAR ordinary BMOD objects use `fu4PALS` while process-created clouds from the same broad stage resource family use `cloud_p`; PIT process-created `FU5HDRS.GRA` dynamics use direct `dcloud_p`; CAVE process-created `FU7HDRS.GRA` objects use direct `eyez2`; STRIPPED process-created `FU8HDRS.GRA` BIGEMP uses direct `EMP_P`. **Resource identity is not palette ownership.**

# 12. Recommended immediate continuation

## 12.1 Current authoritative checkpoint

Treat the project as:

**MK1 remains closed through O66 with its verified 75/75 workflow, unified stage/animation/audio export archive and all prior evidence boundaries intact. MK2 is independently established through O89: O67 authentic fixture/resource/executable inventory; O68 indexed stream grammar and JC0 export; O69 broad exact-full GRA census; O70 deterministic indexed browser package; O71 palette mechanics; O72 bound-LE page/fixup provenance and 17-slot palette tables; O73 shared identity/resource/palette axis; O74/O75 JC0 correct-colour plus default/duplicate semantics; O76 HH0, O77 LK0 and O79 BA0 bounded fixtures; O81/O83/O85 close the shared-FN slots individually; O87 closes one bounded slot-8/NJ7 contract; O88 integrates the first eight exact contracts; O89 independently closes one bounded slot-9/NJ4 contract while preserving additional NJ-family branches and a noncanonical-geometry boundary.**

The project is paused after **O89**. The current operational rule permits **up to two major verification passes per cycle**, but this retry cycle intentionally froze O89 before any integration pass. **O90 has not started.**

Mandatory MK1 boundaries remain unchanged: exactly 79 O25 cross-resource animation descriptors remain palette-unresolved/indexed-only; O26 timing remains structural rather than milliseconds/FPS; normalized stage previews remain bounded export states rather than canonical gameplay screenshots; MK1 audio filenames/codes are installation identifiers, `SAMPLES.DAT` remains UNKNOWN, and linked MIDI/sequence APIs are not runtime music proof.

Mandatory MK2 boundaries remain explicit. O78/O80/O82/O84/O86/O88 are integration/distribution only and are not new ownership evidence. O81 proves slot 4 through connected `FN4.GRA+0`; O83 proves slot 5 through connected `FN6.GRA+0`; O85 proves slot 16 through connected `FN4.GRA+0` with an aliased A/B palette no-op. O87 proves a slot-8 unique-prefix connected path to `NJ7.GRA+0`, and O89 proves an eight-edge slot-9 root-connected path to `NJ4.GRA+0`; both root graphs reach additional NJ-family resources, so NJ7 and NJ4 are each one qualified connected contract, **not** complete/canonical slot geometry. Slots 10/14/15 remain unresolved at this connected-resource standard. Palette ownership remains unestablished for sibling resources unless separately proven. Human fighter names, numeric Player 1/Player 2 labels and mode value 4's meaning remain unpromoted. Fifteen O69 resources remain partial/ambiguous; fourteen pooled GRA resources still have no qualifying descriptor candidates; `MONKS.GRA` remains outside the executable pool; O71's naive 223-record shape scan remains unverified as a palette corpus.

## 12.2 Recommended next bounded block

The user currently permits **up to two passes per cycle**. O89 is independently frozen, so the next work should begin with distribution rather than immediately widening shared-NJ ownership.

1. **O90 — integrate the exact accepted O89 slot-9/NJ4 package into the deterministic identity/resource RGBA bundle.** O90 should nest the existing O88 eight packages plus the exact O89 package byte-for-byte, update stable provenance/counts, and add no new palette ownership, sibling-resource ownership, canonical-geometry claim, human fighter name, player-number label, or MK1-derived assumption.
2. **Only after O90 closes cleanly, decide whether the same cycle has room for a new semantic pass.** The next research candidate should be slot 10 from its own actual root, not an inferred NJ sibling relationship. If time/validation budget is tight, pause after O90 and refresh the handoff instead of forcing a second semantic pass.

After O90 (or any later bounded second pass): **pause, report, and refresh/persist the full handoff before further work.**

## 12.3 Product package semantics to preserve

O54/O55 remain the MK1 stage product contract; O60/O61 the MK1 animation contract; O63/O64 the MK1 audio contract; O65/O66 the MK1 integration/distribution contract. For MK2, O70 remains the broad lossless indexed graphics package. O74/O76/O77/O79/O81/O83/O85/O87/O89 are semantic authorities for nine bounded identity/resource correct-colour contracts; O78/O80/O82/O84/O86/O88 merely integrate exact accepted package bytes and must never be used to strengthen palette, sibling-resource, whole-family, canonical-geometry or human-name claims.

Original internal module/resource identifiers remain canonical until user-facing names are independently qualified. Any later visual discrepancy should trigger the same correction discipline used for O81/O83/O85/O87/O89: trace the authentic identity root, LE fixups, exact descriptor/resource offset and palette selector records before changing labels or pixels. Do not fix by eye, filename prefix, roster expectation or family-level witness.

## 12.4 Palette/timing/audio discipline remains unchanged

Do not assign unresolved palettes by resource compatibility, filenames or visual plausibility. Do not promote a family witness into slot ownership without a connected pointer path, and do not promote one connected resource as canonical geometry when the root graph reaches other family resources. Do not convert scheduler ticks or MFRAMEW dwell values into milliseconds/FPS without independent timing evidence. For MK1 audio, do not promote WAV filenames/sound codes to gameplay event names, call `SAMPLES.DAT` music, or infer runtime MIDI/sequence use merely from linked library symbols.

## 12.5 Longer export-first roadmap

1. O90: integrate the exact accepted O89 slot-9/NJ4 package into the deterministic identity/resource bundle without semantic promotion;
2. after O90, audit shared-NJ identity slot 10 from its own root only if a fresh semantic pass is justified;
3. continue tightening shared-NJ slots 10/14/15 independently rather than inferring them from family prefixes or O87/O89;
4. continue expanding correct-colour coverage only through independently proven identity-slot -> exact resource -> exact palette joins;
5. separately investigate O69 partial/ambiguous resource mechanisms where doing so materially expands extraction coverage;
6. independent MK3 investigation after mechanisms are understood enough to compare;
7. promote shared MK-DOS abstractions only after independent repetition across games.

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
- Do not treat a background module as inherently static; O30 proves scheduler-driven descriptor animation and positional motion in canonical MK1 stages.
- Do not convert background process waits from scheduler ticks into milliseconds/FPS without independent timing evidence.
- Do not flatten dynamic stages into a single canonical image unless the exported time/process state and remaining ordering assumptions are explicit.
- Do not rename O46 normalized test-vector composites as canonical gameplay screenshots; normalized RNG/transient/shadow/process assumptions must remain explicit in product-facing metadata.
- Do not promote a sibling module to a direct combined-raster tier merely because it shares a process callback family; O47 requires module-specific direct evidence for that raster tier.
- Do not treat O44 fresh ordinary layers as complete stage visuals for `CHOP_MOD` or `STATUE_MOD`; O47 explicitly records their unexported static init-created object layer.
- Do not manufacture a combined PNG in the O48 package for a stage whose coverage row does not directly qualify one.
- Do not promote WAV filenames or sound-code values into gameplay event names without an independently qualified semantic join.
- Do not label `SAMPLES.DAT` as music/sample-bank content until its format and runtime relationship are mechanically established.
- Do not infer runtime MIDI/sequence use solely from linked Miles library symbols; O63 only establishes a bounded absence of direct application-module near calls to the selected sequence API surface.
- Preserve the one trailing zero padding byte after the O63 `sfx.ASM` WAV path pool; it is not another path and must not be silently normalized away.

---

# 14. Practical agent takeover checklist

1. Read this master handover completely.
2. Inspect the current O86 source snapshot plus this handoff before adding further MK2 identity/resource ownership or export logic; use older pass checkpoints only when exact local provenance is needed.
3. Use the user-supplied `mk1.zip` as the authentic MK1 resource fixture; confirm archive and embedded canonical EXE identity when re-materialized.
4. Read O17 before changing animation graph logic; its unknown auxiliary classes and table-boundary cautions remain active.
5. Preserve O18's 1,102/1,102 decode result as resource/decode evidence, not palette evidence.
6. Preserve O19's selector mapping as character organization, not per-index semantic labeling.
7. Preserve O20's separation result: ANITAB/resource identity is not a palette key.
8. Preserve O21's nearest-symbol/call-site evidence as context only; do not auto-promote gameplay names.
9. Treat O22 as the structural product-facing animation export IR, O23 as bounded effect-color proof, O24 as explicit character palette-context rendering, O25 as the palette-exception boundary, O26 as the stream-control/caller-dwell boundary, O27 as the background resource graph, O28 as background placement/palette selection, O29 as renderer/camera qualification, O30 as the background dynamics census, O31 as the plane/placement/process scene join, O32 as the ARENA bounded animated fixture, O33/O34 as PILLAR motion + two-track export, O35/O36 as PIT motion/shadow/transient + bounded export, O37/O38 as CAVE random-phase qualification/export, O39/O40 as STRIPPED BIGEMP qualification/export, O41 as renderer history/clipping, O42 as the PIT fresh compositor anchor, O43 as the all-module fresh ordinary-layer census, O44 as the 24-module fresh ordinary export package, O45 as the renderer-facing dynamic/special-layer contract, O46 as the five-stage normalized combined compositor proof, O47 as the all-module export capability matrix, and O48 as the product-facing 24-stage package/orchestrator; keep structure, palette, resource, control/timing, render-order, random/dynamic-state, normalization, product-tier and semantic-confidence layers separate.
10. Do not reopen O15 relocation unless an extraction need genuinely depends on it.
11. O23/O24 timed-out-run uncertainty is closed by fresh authentic-install rechecks; do not reopen it absent contradictory evidence.
12. Preserve O25's 79 unresolved cross-resource descriptors as unresolved; do not assign body palettes by convenience.
13. Preserve O26's timing boundary: dwell arguments are caller units, not established wall-clock durations, and four direct MFRAMEW consumers remain dynamic.
14. Preserve the O29-O48 render/time/product boundary: BAK traversal, sort keys, camera/no-scroll projection, ARENA/PILLAR/PIT/CAVE dynamics, STRIPPED BIGEMP view selection and normalized exports are bounded; equal-key history, universal scheduler/display timing, cross-process absolute phase, runtime camera evolution where not qualified, CAVE RNG seed/joint phase, and canonical arbitrary-time full-stage rasters remain unresolved.
15. Preserve O63/O64 audio boundaries: 244 authentic WAVs / 533 records / 243 bindings are qualified; gameplay event naming, `SAMPLES.DAT` purpose and runtime MIDI/sequence relationship are not.
16. Preserve the O64 package contract: 249 entries, 244 byte-exact WAVs, raw unresolved `SAMPLES.DAT`, no transcoding, and Audio Assets presentation does not strengthen semantics.
17. **Operational cadence:** the current user rule permits up to two major verification passes per cycle. If a second pass is attempted, the first must already be technically closed and the second must be tightly bounded. Pause and refresh/persist the authoritative handoff after the block, or immediately after any contradiction/failure.

---


# 15. Handover trigger policy from this point onward

The current user rule permits **up to two major verification passes per cycle**. This supersedes the temporary one-pass rule used for O69-O76. A second pass is optional, not mandatory: attempt it only when the first pass is already closed and the follow-on is bounded. At the end of the block—or immediately after a material contradiction/failure—update and persist the complete authoritative handoff.

A handover is also warranted immediately if:

- a major failure or contradiction changes the continuation strategy;
- palette-context binding materially changes safe correct-color export coverage;
- ANITAB index semantics are materially qualified;
- stage/background reconstruction reaches a useful checkpoint;
- audio/music relationship recovery materially changes export scope;
- MK2 or MK3 independently validates/rejects an MK1 mechanism;
- a major runtime result changes an established semantic boundary;
- the project changes agents or pauses unexpectedly after substantial new work.

- **O72 supersedes O67's post-`0xABD79` overlay interpretation.** The bound module begins at `0x26654`, physical LE page data begins at `0x61C54`, and the 113-page image terminates at executable EOF `0xD23CD`; the O68 descriptor corpus is file-backed Object-2 data. Preserve the historical error as a correction lesson, but do not revive the overlay classification.
- Do not generalize MK1's observed 1..23 animation index domain to MK2; O69's exact-full indexed surface uses 1..175.
- Do not infer MK2 palette ownership or correct colours from filename/resource identity, index compatibility, visual plausibility, or MK1 palette structures.
- For shared MK2 resource families, require a connected identity-root -> LE-fixup -> exact offset-0 descriptor chain before promoting slot ownership. O81 proves slot 4 -> FN4; O83 proves slot 5 -> FN6; O85 proves slot 16 -> FN4. Preserve slot 4 and slot 16 as separate identity/palette contracts despite shared geometry.
- Do not promote O69's 15 partial/ambiguous resources to full-resource coverage; do not treat the 14 zero-candidate pooled resources or `MONKS.GRA` as unused.
- Do not promote a shared MK1/MK2 decoder/descriptor abstraction solely because O68 observed the same three structural command forms; cross-game abstraction remains explicitly unpromoted.
- Do not call the O71 223-record structural scan a verified palette corpus; record-shape compatibility is not ownership or even definitive record classification.
- O72 now qualifies the relevant relocation-sensitive pointer provenance and two 17-slot selector tables. Do not extend that result to semantic slot identities or JC0 ownership without an affirmative MK2 identity/selection join.
- O74 permits correct-colour rendering only for the 35 O68 JC0 streams under the two exact O73-qualified slot-2 records. Do not generalize those palettes to JC1..JC5 or any other resource family without affirmative ownership evidence.
- Preserve object palette handle `+0x30`, the 60-entry handle table and 32-slot request queue as bounded MK2 facts, not as MK1/MK3 assumptions.
- Use at most two major verification passes per cycle under the current user instruction. Treat the first pass as an internal checkpoint before starting the second; if it fails or changes strategy, stop rather than forcing pass two.

Every authoritative handover must regenerate the complete project history/current state, not only list deltas.

---


# 16. One-paragraph restart summary

MK DOS Archive is an export-first forensic reconstruction project for DOS MK1/MK2/MK3. MK1 remains mature through O66 with its verified 75/75 workflow and deterministic unified stage/animation/audio archive; all prior MK1 palette/timing/audio boundaries remain intact. Authentic MK2 fixture `mk2.zip` SHA-256 is `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2`. O67-O75 establish MK2 fixture/resource topology, indexed decode/export coverage, palette machinery, bound-LE/fixup provenance, the 17-slot identity/resource/palette axis, JC0 correct-colour rendering and default-vs-same-character-duplicate palette semantics. O76 closes HH0 slot 0, O77 LK0 slot 1 and O79 BA0 slot 3. O81/O83/O85 close the three shared-FN slots independently. O87 closes one connected slot-8/NJ7 contract (116 streams / 232 RGBA PNGs) while preserving additional NJ branches and a noncanonical-geometry boundary; O88 integrates the first eight exact contracts into a 734-PNG deterministic bundle. O89 then audits slot 9 from its actual five-field root `0x9C68`; it rejects an invalid shortcut through neighboring source `0x9C90` and closes an eight-edge authentic relocation chain to `NJ4.GRA+0`. O69 gives 24 exact-full NJ4 streams; O89 exports 48 RGBA PNGs in a 53-entry / 914,627-byte package SHA-256 `7bd6be4c260b83f4fb69a9b26734e3ad3a5bc0a3363bc302ecc8426281bf7a7a`, with independent audit 207/207, source/UI 32/32, deterministic replay and clean-source acceptance 7/7. NJ4 is one connected slot-9 contract, not complete/canonical slot-9 geometry or whole-NJ ownership. The authoritative source is `MK-DOS-1E3O89-source.zip` SHA-256 `0803b8359311d9201fc25b03e18ccfb919600b647c1fa92848c6ea5675a1b611`. The project permits up to two bounded verification passes per cycle and is paused after O89. **O90 has not started.** Recommended next: O90 integration-only, nesting the exact accepted O89 package into the existing O88 bundle without semantic promotion; only afterward consider slot 10 from its own root.

---

# Appendix A — Current available handoff inventory

- `MK_DOS_Archive_CHECKPOINT_1E3O89_MK2_NJ4_SLOT9_CONNECTED_RGBA_FIXTURES.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O85_MK2_FN4_SLOT16_CONNECTED_ALIASED_RGBA_FIXTURES.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O86_MK2_SEVEN_VERIFIED_IDENTITY_RESOURCE_RGBA_INTEGRATION_BUNDLE.md`
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

- `MK_DOS_Archive_HANDOFF_1E3O21_GET_CHAR_ANI_CONSUMER_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O22_CHARACTER_ANIMATION_EXPORT_MANIFEST.md`
- `MK_DOS_Archive_HANDOFF_1E3O23_VERIFIED_PALETTE_BOUND_RGBA_EXPORT_FIXTURES.md`
- `MK_DOS_Archive_HANDOFF_1E3O24_CHARACTER_PALETTE_CONTEXT_VARIANT_RENDERER.md`
- `MK_DOS_Archive_HANDOFF_1E3O25_PALETTE_BINDING_EXCEPTION_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O26_ANIMATION_STREAM_CONTROL_TIMING_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O27_STAGE_BACKGROUND_RESOURCE_GRAPH_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O28_BACKGROUND_PLACEMENT_PIT_SCENE_EXPORT_IR.md`
- `MK_DOS_Archive_HANDOFF_1E3O29_BACKGROUND_RENDERER_ORDER_CAMERA_PROJECTION.md`
- `MK_DOS_Archive_HANDOFF_1E3O30_BACKGROUND_DYNAMIC_PROCESS_ANIMATION_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O31_TIME_AWARE_BACKGROUND_SCENE_IR.md`
- `MK_DOS_Archive_HANDOFF_1E3O32_ARENA_ANIMATED_SCENE_EXPORT_FIXTURE.md`
- `MK_DOS_Archive_HANDOFF_1E3O33_PILLAR_CLOUD_MOTION_RESET.md`
- `MK_DOS_Archive_HANDOFF_1E3O34_PILLAR_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O35_PIT_DYNAMIC_MOTION_SHADOW_BOUND.md`
- `MK_DOS_Archive_HANDOFF_1E3O36_PIT_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O37_CAVE_SPECIAL_OBJECT_RANDOM_PHASE.md`
- `MK_DOS_Archive_HANDOFF_1E3O38_CAVE_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O39_STRIPPED_BIGEMP_PROCESS_QUALIFICATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O40_STRIPPED_DYNAMIC_SCENE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O41_RENDERER_HISTORY_CLIPPING_ORDER.md`
- `MK_DOS_Archive_HANDOFF_1E3O42_PIT_FRESH_INITIAL_ORDINARY_COMPOSITOR.md`
- `MK_DOS_Archive_HANDOFF_1E3O43_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS.md`
- `MK_DOS_Archive_HANDOFF_1E3O44_MULTI_STAGE_FRESH_INITIAL_ORDINARY_BAK_EXPORT.md`
- `MK_DOS_Archive_HANDOFF_1E3O45_DYNAMIC_SPECIAL_LAYER_COMPOSITOR_CONTRACT.md`
- `MK_DOS_Archive_HANDOFF_1E3O46_NORMALIZED_DYNAMIC_BACKGROUND_COMPOSITOR_FIXTURES.md`
- `MK_DOS_Archive_HANDOFF_1E3O47_STAGE_EXPORT_CAPABILITY_COVERAGE_MANIFEST.md`
- `MK_DOS_Archive_HANDOFF_1E3O48_PRODUCT_STAGE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O49_BACKGROUND_ORIENTATION_STATIC_EXTRA_CORRECTION.md`
- `MK_DOS_Archive_HANDOFF_1E3O50_CORRECTED_STAGE_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O51_DYNAMIC_SIBLING_VARIANT_QUALIFICATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O52_DYNAMIC_SIBLING_COMBINED_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O53_NO_OP_STAGE_COMPLETENESS.md`
- `MK_DOS_Archive_HANDOFF_1E3O54_COMPLETE_24_STAGE_NORMALIZED_BACKGROUND_PACKAGE.md`

- `MK_DOS_Archive_HANDOFF_1E3O55_BROWSER_STAGE_EXPORT_DOWNLOAD.md`
- `MK_DOS_Archive_HANDOFF_1E3O56_BROWSER_STAGE_EXPORT_VALIDATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O57_RESEARCH_RESULTS_WORKSPACE.md`
- `MK_DOS_Archive_HANDOFF_1E3O58_RESEARCH_RESULTS_UI_VALIDATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O59_ANIMATION_EXPORT_CAPABILITY_COVERAGE_MANIFEST.md`
- `MK_DOS_Archive_HANDOFF_1E3O60_BROWSER_ANIMATION_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_HANDOFF_1E3O61_BROWSER_ANIMATION_EXPORT_VALIDATION.md`
- `MK_DOS_Archive_HANDOFF_1E3O62_ANIMATION_ASSETS_VISUAL_WORKSPACE.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O63_AUDIO_MUSIC_RESOURCE_GRAPH.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O64_BROWSER_AUDIO_PACKAGE_WORKSPACE.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O65_CROSS_DOMAIN_PROVENANCE_INDEX.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O66_UNIFIED_ASSET_ARCHIVE.md`
- `MK_DOS_Archive_MASTER_HANDOFF_2026-10-01_FULL_PROJECT_THROUGH_O64_PAUSE.md`
- `MK_DOS_Archive_MASTER_HANDOFF_2026-10-02_FULL_PROJECT_THROUGH_O66_PAUSE.md`

- `MK_DOS_Archive_CHECKPOINT_1E3O67_MK2_FIXTURE_RESOURCE_EXECUTABLE_TOPOLOGY.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O68_MK2_JC0_INDEXED_GRAPHICS_EXPORT.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O69_MK2_BROAD_INDEXED_GRA_CORPUS_CENSUS.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O70_MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_PACKAGE.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O71_MK2_PALETTE_STORAGE_SELECTION_RECONNAISSANCE.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O72_MK2_BOUND_LE_FIXUP_POINTER_PROVENANCE.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O73_MK2_JC0_RESOURCE_PALETTE_SELECTOR_SLOT_JOIN.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O74_MK2_JC0_PALETTE_CONTEXT_RGBA_FIXTURES.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O75_MK2_PALETTE_SELECTOR_GAMEPLAY_SEMANTICS.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O76_MK2_HH0_SECOND_FIGHTER_RGBA_FIXTURES.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O77_MK2_LK0_THIRD_FIGHTER_RGBA_FIXTURES.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O78_MK2_VERIFIED_FIGHTER_RGBA_INTEGRATION_BUNDLE.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O79_MK2_BA0_FOURTH_FIGHTER_RGBA_FIXTURES.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O80_MK2_FOUR_VERIFIED_FIGHTER_RGBA_INTEGRATION_BUNDLE.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O81_MK2_FN4_SLOT4_CONNECTED_RGBA_FIXTURES.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O82_MK2_FIVE_VERIFIED_FIGHTER_RGBA_INTEGRATION_BUNDLE.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O83_MK2_FN6_SLOT5_CONNECTED_RGBA_FIXTURES.md`
- `MK_DOS_Archive_CHECKPOINT_1E3O84_MK2_SIX_VERIFIED_FIGHTER_RGBA_INTEGRATION_BUNDLE.md`
- `MK_DOS_Archive_MASTER_HANDOFF_2026-10-02_FULL_PROJECT_THROUGH_O84_PAUSE.md`
- `MK_DOS_Archive_MASTER_HANDOFF_2026-10-02_FULL_PROJECT_THROUGH_O70_PAUSE.md`
- `MK_DOS_Archive_MASTER_HANDOFF_2026-10-02_FULL_PROJECT_THROUGH_O71_PAUSE.md`
- `MK_DOS_Archive_MASTER_HANDOFF_2026-10-02_FULL_PROJECT_THROUGH_O72_PAUSE.md`
- `MK_DOS_Archive_MASTER_HANDOFF_2026-10-02_FULL_PROJECT_THROUGH_O78_PAUSE.md`

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
