> **CURRENT VERIFIED RUNTIME EVIDENCE — 2026-10-14 O187:** User-supplied slowed Portal gameplay video (102.47 s at 30 capture FPS) shows the blue-modified large hanging figure in motion; seven original `portal_swaying` source poses independently matched against video crops (corrected blue-mask F1 0.901–0.921, runner-up margins 0.114–0.148). Source trace/repro report, independent video verifier and comparison image are archived. Capture FPS is not original effect FPS; native timing, all seven small `portal_hanging` poses, and actual on-disk patch hashes in Windows remain unverified. Read `CHECKPOINT_2026-10-14_O187_PORTAL_RUNTIME_SEVEN_POSE_VERIFICATION.md`. O186 root-folder F9 stage-select kit remains the default. Older headers below are historical.

> **CURRENT AUTHORITY — 2026-10-13 O181:** O177 full 43-frame source-index/mask/PNG ZIP exporter, O178 contiguous encoded source spans/no-edit SHA, O179 single-pixel source-RLE edit probe, O180 43/43 reversible source-pixel probes, O181 original Python-witness hash hardening. 988+236+63+526+437 independent assertions; 38 adversarial cases rejected. 235 inherited tests and 509 browser/Python checks passed. Actual playback, source edit runtime behavior and full Vite app build remain unverified. See `CHECKPOINT_2026-10-13_O177_O181_ORIGINAL_EFFECT_ARCHIVE_SOURCE_EDIT.md`. Older status banners below are historical.

> **Current source research authority (2026-10-12): O165.** Original IRQ9 keyboard handler records break/make scan-code state at table `+0x50`. This identifies IRQ8 timer gate fields `+0x88` and `+0x69` as keyboard scan-code slots `0x38` and `0x19` (normally Alt and P in PC set-1). Original game timing/pause runtime unverified. Original two-file MK2.EXE + RM.DRV O153–O165: 560 independent source assertions; 62 new regression tests. See root `CHECKPOINT_2026-10-12_O153_O165_RM_DRIVER_IRQ_KEYBOARD_TIMING.md`; older banners below preserve historical scope.

> **Current source research authority (2026-10-12): O164.** Original MK2 `RM.DRV` IRQ8 handler conditionally updates shared scheduler counter `+0x24`; protected-mode MK2 waits on/clears that counter. A separate `+0x28` counter and gate `+0x3C` have original code-backed control/data joins. O153–O164: 519 independent source assertions, 52 new regression tests, and inherited O139–O152 tests rerun. No measured animation FPS or live trigger. See `CHECKPOINT_2026-10-12_O153_O164_ORIGINAL_RM_DRIVER_TIMING_SOURCE.md` (root). Older checkpoints below preserve their historical scope.

> **CURRENT STATUS — O120 (2026-10-11):** O119 confirmed in-game effects from the original Tomb/Portal 80-color palette records. O120 connects them to 10 relocation-backed 18-byte graphics setup records, 34 palette-table entries and the conditional `ESI+0x0E` allocator consumer, with independent tests. Actual ESI/runtime palette handle/DAC bank remain unknown. See `CHECKPOINT_2026-10-11_O120_STAGE_PALETTE_SETUP_GRAPH.md`. Prior README status paragraphs below are historical.

> **CURRENT AUTHORITY (2026-10-11):** O110V remains 13/30 independently counted passes. O110W–O110Z have controlled MK2 DOSBox runtime observations: F9 hidden background-selection patch; authenticated TOMB/PORTAL packed raster tail edits appear as altered arena floors in user screenshots. See `CHECKPOINT_2026-10-11_O110W_TO_O110Z_RUNTIME_VALIDATION.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-11_FULL_PROJECT_THROUGH_O110Z_RUNTIME.md`. Gameplay palette handle-1 ownership and complete stage composition remain unqualified. Earlier status banners below are historical.

> **2026-10-10 research in progress:** checkpoint cadence is now **30 substantive passes** (see `docs/AGENT_EXECUTION_CADENCE.md`). **O110H–O110J: 3/30 complete**, three independently verified palette-handle provenance passes; see `RESEARCH_NOTE_2026-10-10_O110H_O110J_PALETTE_HANDLE_PROVENANCE.md`. No gameplay stage palette ownership is claimed. This is an interim development state, **not** a consolidated checkpoint.

> **Current research continuation (2026-10-10): O110F/O110G.** Original MK2.EXE contains **23** exact Object-1 direct `E8` byte encodings to palette allocator `0x7B439` (earlier O71 listed 15); **14** have immediately preceding type-7 relocated palette loads (13 requests for the 48-word record, one for the 64-word record). Two source-local paths request the 48-word record before setting stage-index literals **5** (packed ARMORY source) and **6** (zero table entry). This does **not** prove the actual stage palette handle or a complete colored stage. Independently verified, with negative controls. Read `CHECKPOINT_2026-10-10_O110F_O110G_PALETTE_REQUEST_STAGE_SELECTOR.md`; MK2 remains OPEN.

> **Current continuation checkpoint (2026-10-08): O95O.** Two newly strict terminal-qualified selected-pointer routes: Family A `0x69C3D` and Family B `0x95B69`. Current coverage: **210/253 strict terminal**, **239/253 strong consumer**, **14/253 without strong consumer**. Four held paths are conditional, ten structural. O95O also corrects O95N's alternate-branch interpretation for `0x71579` and `0x73F8A`. Separate Python verifier: **152 checks / 0 failures**. MK2 research remains OPEN; next: **O95P animation/exportability closure ledger**. See `CHECKPOINT_2026-10-08_O95O.md` and the latest full master handoff.

> **Current continuation checkpoint (2026-10-08): O95M.** MK2 remains open. O95M classifies all 15 O95H `SCHEDULER_OR_RESELECT` routes: **14 terminal-qualified** through authenticated scheduler/yield provenance into dynamic consumer `0x6435A`, and **1 structural-only** route (`0x699EA`) where the original selected cursor is explicitly overwritten by a packed Family-B reselection before qualified consumption. Strict terminal-qualified coverage is now **185/253**; strong selected-pointer consumer-qualified coverage is **211/253**, leaving **42/253** without a strong qualified consumer. Independent O95M verification passes **75 checks / 0 failures**; fresh O95H-L regressions remain clean. Continue with **O95N generic unresolved-route continuation census**, starting only with the 31 O95H `UNRESOLVED` routes. See `CHECKPOINT_2026-10-08_O95M.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-08_FULL_PROJECT_THROUGH_O95M.md`.

> **CURRENT CONTINUATION AUTHORITY — 2026-10-08 O95M:** The mandatory order remains **finish MK2 research completely -> finish MK1 -> finish MK3 -> discuss UI/usability -> only then build the extractor**. Product/browser integration remains deferred. Do not conflate scheduler preservation with timing semantics, and do not treat the post-`0x699EA` Family-B selection as consumption of the overwritten Family-A pointer.

> **Current continuation checkpoint (2026-10-08): O95L.** MK2 remains open. O95L classifies the 17 O95H `LOCAL_CURSOR_DATA` plus 3 `CURSOR_STACK_OR_STATE` routes: **10 terminal-qualified, 4 strong nonterminal consumer-qualified, 2 conditional and 4 structural-only**. Strict terminal-qualified coverage is now **171/253**; strong selected-pointer consumer-qualified coverage is **197/253**, leaving **56/253** without a strong qualified consumer. Independent O95L verification passes **78 checks / 0 failures**; O95B-K regressions remain clean. Continue with **O95M scheduler/reselection selected-pointer provenance**. See `CHECKPOINT_2026-10-08_O95L.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-08_FULL_PROJECT_THROUGH_O95L.md`.

> **CURRENT CONTINUATION AUTHORITY — 2026-10-08 O95L:** The mandatory order remains **finish MK2 research completely -> finish MK1 -> finish MK3 -> discuss UI/usability -> only then build the extractor**. Product/browser integration remains deferred. Strong consumer-qualified, terminal-qualified, conditional and structural-only route classes are distinct and must not be merged.

> **Current continuation checkpoint (2026-10-08): O95K.** MK2 remains open. O95K qualifies all **22** O95H `RELATED_OBJECT_STATE` routes as having an authenticated first-composition selected-pointer consumer: 20 through helper `0x679F2`, one direct through `0x64019`, and one distinct manual path at `0x69B43`. Strict terminal-qualified coverage remains **161/253**; the broader consumer-qualified metric is now **183/253**, leaving **70** routes with no qualified selected-pointer consumer. Independent O95K verification passes **55 checks / 0 failures**; O95H and O95J regression checks remain clean. Continue with **O95L local-cursor/data and cursor-stack/state continuation qualification**. See `CHECKPOINT_2026-10-08_O95K.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-08_FULL_PROJECT_THROUGH_O95K.md`.

> **CURRENT CONTINUATION AUTHORITY — 2026-10-08 O95K:** The user-directed order remains **finish MK2 research completely -> finish MK1 -> finish MK3 -> discuss UI/usability -> only then build the extractor**. Product/browser integration remains deferred. Consumer-qualified and terminal-qualified route counts are distinct metrics and must not be merged.

> **Current continuation checkpoint (2026-10-08): O95J.** MK2 remains open. O95J follows all 23 O95I segment-navigation routes after their exact skip count. **20/23** preserve the selected stream into the already-qualified standard composition interpreter family; **3/23** reach an explicit `0x75A78` replacement before any qualified terminal consumer and remain unresolved. Corrected terminal-qualified coverage is now **161/253** lookup routes, with **92** structural-handoff/unresolved. Independent O95J verification passes **58 checks / 0 failures** and O95B-I regressions remain clean. Continue with **O95K remaining structural-handoff continuation triage**. See `CHECKPOINT_2026-10-08_O95J.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-08_FULL_PROJECT_THROUGH_O95J.md`.

> **CURRENT CONTINUATION AUTHORITY — 2026-10-08 O95J:** The user-directed order remains **finish MK2 research completely -> finish MK1 -> finish MK3 -> discuss UI/usability -> only then build the extractor**. O95J supersedes older next-pass prose where it conflicts. Product/browser integration remains deferred.


> **Current continuation checkpoint (2026-10-08): O95I.** MK2 remains open. O95I refines the nonstandard selected-pointer paths from O95H. Consumer `0x6334A` is now machine-qualified as a **segment skipper / cursor-navigation primitive**, not a terminal consumer: 23 lookup routes invoke it 36 times total (13 routes skip one segment, 7 skip two, 3 skip three). O95I also qualifies the Family-A index-5 reverse sequence across all 11 unique roots and refines the specialized direct-descriptor token classes. Independent O95I verification passes **54,272 checks / 0 failures**; O95B-H regressions remain clean. Continue with O95J segment-navigation downstream continuation census. See `CHECKPOINT_2026-10-08_O95I.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-08_FULL_PROJECT_THROUGH_O95I.md`.

> **CURRENT CONTINUATION AUTHORITY — 2026-10-08 O95I:** The user-directed order remains **finish MK2 research completely -> finish MK1 -> finish MK3 -> discuss UI/usability -> only then build the extractor**. Product/browser integration is deferred until research closure. O95I supersedes O95H's wording that 164 routes had qualified final consumers: at the O95H category boundary only **141** were terminal-qualified; the 23 `0x6334A` routes are navigation routes awaiting downstream classification. The exact 253-call O95H partition itself remains valid.

# Latest: 1E.3O.89 MK2 NJ4 Slot-9 Connected RGBA Fixture

O89 starts from identity slot 9's own five-field root at Object-2 `0x9C68` and follows an eight-edge authentic relocation chain to the exact `NJ4.GRA+0` descriptor. O69 proves all 24 NJ4 streams tile the authentic 75,512-byte resource exactly; O72/O75 supply the two slot-9 default/duplicate palettes. The deterministic O89 package contains 48 RGBA PNGs / 53 entries, is 914,627 bytes, SHA-256 `7bd6be4c260b83f4fb69a9b26734e3ad3a5bc0a3363bc302ecc8426281bf7a7a`; independent reconstruction passes 207/207 and source/UI integration 32/32. NJ4 is one connected slot-9 contract only, not complete/canonical slot-9 geometry or whole-NJ ownership.

See `MK_DOS_Archive_CHECKPOINT_1E3O89_MK2_NJ4_SLOT9_CONNECTED_RGBA_FIXTURES.md`.

# Latest: 1E.3O.87 MK2 NJ7 Slot-8 Connected RGBA Fixtures

O87 starts from identity slot 8's actual NJ root at Object-2 `0x9C54` and proves one connected unique-prefix path through `0x9C60 -> 0xAC4A -> 0xACA6 -> 0xAD16` to the exact `NJ7.GRA+0` descriptor at Object-2 `0x285F8` / physical `0xC924C`. O69 proves all **116** NJ7 streams tile the authentic 241,320-byte resource exactly; O72/O75 provide the two exact slot-8 default/duplicate palette records. O87 exports **232** verified RGBA PNGs in a deterministic 237-entry package SHA-256 `b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd`. Independent reconstruction passes **846/846** and source/UI audit **37/37**. Because slot 8's root graph reaches additional NJ-family resources, NJ7 is not promoted as the complete/canonical slot-8 geometry and no whole-NJ ownership or human fighter name is inferred.

See `MK_DOS_Archive_CHECKPOINT_1E3O87_MK2_NJ7_SLOT8_CONNECTED_RGBA_FIXTURES.md`.

# Latest: 1E.3O.86 MK2 Seven Verified Identity/Resource RGBA Integration Bundle

O86 nests the exact accepted HH0/slot0, LK0/slot1, JC0/slot2, BA0/slot3, FN4/slot4, FN6/slot5 and FN4/slot16 RGBA fixture packages under one deterministic STORE-only outer ZIP. The result contains 9 outer entries, 537 nested logical entries and 502 already-verified context-specific PNGs, is 9,989,261 bytes, and has SHA-256 `6d17d56e676cdc2523efaa823ff716d5f28d3ce4f3350f82f669645b590a97e6`. O86 is distribution/provenance only; it preserves the separate slot-4 and slot-16 FN4 identity contracts and adds no new palette/resource ownership or human naming claims. Independent integration audit passes 123/123 and source/UI audit 46/46.

See `MK_DOS_Archive_CHECKPOINT_1E3O86_MK2_SEVEN_VERIFIED_IDENTITY_RESOURCE_RGBA_INTEGRATION_BUNDLE.md`.

# Latest: 1E.3O.85 MK2 FN4 Slot-16 Connected Aliased Palette-Context RGBA Fixtures

O85 closes identity slot 16 at the stronger connected-chain standard. Slot 16 root Object-2 `0x208C` directly reaches `0x21E0`, then `0x220A`, then the exact O69-authenticated `FN4.GRA+0` descriptor at Object-2 `0x27640` / physical `0xC8294`. O69 proves all 27 FN4 streams are exact-full. O72 shows both slot-16 palette selector entries alias the same 63-colour record at Object-1 `0x2AD2A` / physical `0x8C97E`, so O75's same-character duplicate override is a visual no-op for slot 16. O85 exports 54 context-specific PNGs and independently proves all 27 A/B pairs byte-identical. Whole-FN-family ownership and human fighter naming remain unpromoted.

See `MK_DOS_Archive_CHECKPOINT_1E3O85_MK2_FN4_SLOT16_CONNECTED_ALIASED_RGBA_FIXTURES.md`.

# Latest: 1E.3O.66 Unified MK1 Asset Archive + Cross-Domain Provenance Index

O65 integrates the already-validated stage, animation and digital-audio product contracts into one machine-readable capability/provenance index without changing their semantics. The index records three exact current nested package identities, **2,645** combined logical entries, stage raster/document tiers, animation RGBA/indexed tiers, all **79** palette-unresolved cross-resource descriptors, all **244** authentic WAVs, and raw unresolved `SAMPLES.DAT`. Domain blockers remain explicit.

O66 nests the exact current O55 stage, O60 animation and O64 audio browser packages byte-for-byte under one STORE-only browser archive. The accepted unified archive has **6 outer entries**, is **91,806,796 bytes**, and has SHA-256 `f642535017027b99d2954049e89bd73657d4911d14260f53863ba21310f580a7`. Its nested packages contain 101 + 2,295 + 249 = **2,645** logical entries. The in-app validator confirms all three nested package byte streams exactly and reparses each nested STORE ZIP. A separate Python audit passes **27/27 checks**. A second standalone O65/O66 replay with identical prerequisite package/report inputs regenerates the unified archive byte-for-byte with the same SHA-256.

The normal browser workflow is now **75/75** and adds **Download Unified MK1 Archive** while retaining the separate Stage, Animation and Audio package actions. No assets are transcoded, no unresolved palettes are guessed, no animation timing is converted to wall-clock units, no audio filenames/codes become gameplay names, `SAMPLES.DAT` remains UNKNOWN, and no binary writer/import capability is added. O65 + O66 are the completed two-major-verification integration block and the project is paused for the required handoff refresh.

See `MK_DOS_Archive_CHECKPOINT_1E3O65_CROSS_DOMAIN_PROVENANCE_INDEX.md`, `MK_DOS_Archive_CHECKPOINT_1E3O66_UNIFIED_ASSET_ARCHIVE.md`, and the refreshed authoritative master handoff.

# Latest: 1E.3O.64 Browser Audio Package + Audio Assets Workspace

O64 closes the O63/O64 audio block. The browser audio package preserves all **244** authentic `SFX/*.WAV` files byte-for-byte, carries all 533 O63 sound records and bounded playback metadata in its manifest, and preserves `SAMPLES.DAT` only as a raw unresolved resource. The accepted STORE ZIP contains **249 entries**, is **12,798,744 bytes**, and has SHA-256 `a636108a4907ff0d1aa5b6ed75b7d0f7f4143674185c78ac8028c6f9a3874613`.

The in-app O64 validator confirms 244/244 WAV payloads byte-exact against the authentic installation, raw `SAMPLES.DAT` byte-exact while still semantically UNKNOWN, all package metadata, and zero unexpected entries. A separate Python ZIP audit passes **260/260 checks**. The Research Results Workspace now includes an **Audio Assets** tab with 244 playable installation assets, bounded sound-code/playback metadata where O63 proved it, and explicit warnings that filenames/codes are not canonical gameplay names and that `SAMPLES.DAT` / MIDI runtime relationships remain unresolved.

The normal workflow is now **73/73** and exposes **Download Audio Package**. O63 + O64 are the completed two-major-verification audio block; this is the required pause checkpoint. See `MK_DOS_Archive_CHECKPOINT_1E3O64_BROWSER_AUDIO_PACKAGE_WORKSPACE.md` and the refreshed authoritative master handoff.

# Latest: 1E.3O.63 MK1 Audio/Music Resource Graph and Export-Capability Census

O63 is the first half of the O63/O64 audio block and is now direct-authentic-fixture validated. It inventories 244 installed `SFX/*.WAV` assets, reconstructs the 533-record / 24-byte `sfx.ASM` sound-code table, binds 243 records exactly to WAV paths/sizes, preserves the path-pool-only `DUMMY.WAV`, qualifies the low-code loop/one-shot policy and the `MKSOUND.ASM SOUND -> play_fx -> Miles digital sample API` bridge, and keeps gameplay/event naming unresolved.

All 244 WAVs are PCM 8-bit mono 11025 Hz. Numeric WAV filenames are exact hexadecimal sound-code identifiers; `DUNNO01..14` and `XTRA01..07` map to `0x200..0x214`. `SAMPLES.DAT` remains opaque and unjoined, and linked Miles MIDI/sequence APIs are recorded only as linked capability because the bounded census found no direct application-module near call into that surface. An independent Python audit passes 516/516 checks. The app workflow is now **72/72**. O64 has not started.

See `MK_DOS_Archive_CHECKPOINT_1E3O63_AUDIO_MUSIC_RESOURCE_GRAPH.md` for the bounded evidence contract.

# Latest: 1E.3O.62 Animation Assets Visual Workspace

Current verified checkpoint: O61 independently validates the complete browser-produced O60 animation package from inside the application path. It parses the STORE ZIP, validates all 2,284 deterministic PNGs, reproduces all 16 O24 character-palette aggregate checksums, reconciles all 1,102 indexed descriptors, and proves the 79 unresolved cross-resource palette descriptors remain indexed-only with zero accidental character-context RGBA promotion.

O62 extends the Research Results Workspace with a paginated **Animation Assets** browser. It exposes all 2,263 explicit character-context variants, 21 verified effects, and all 79 unresolved descriptors. The unresolved tier is visualized only as a grayscale raw-index map and is explicitly labelled as **not palette evidence**. The app workflow is now **71/71**.

The archival dependency boundary remains unchanged: a full Vite production build is not claimed because `node_modules` are not bundled and the offline cache is incomplete. O61/O62 research modules and the modified workspace/quick-action TSX paths pass targeted TypeScript checks with archival React/lucide declaration shims. This is the required two-major-verification pause; O63 has not started.

# Latest: 1E.3O.17 MK1 ANITAB Structural Comparison

## Pass 1E.3O.17 — repeated animation-table export structure

O17 is read-only and export-first. Blind Watcom suffix discovery finds eight Segment-2 DATA symbols ending in `_ANITAB` (EMP, GORO, KANG, KANO, LIZ, NINJA, VANDAN, RAIDEN). Their symbol-bounded spans are not uniform (41..106 dword cells), so the tool does not impose a shared table length.

Direct canonical validation accounts for all 739 cells without forcing unknown semantics, and resolves every grammar-compatible frame event through the repeated direct-descriptor / zero-terminated-descriptor-vector model. Across the eight tables: 564 stream cells, 514 unique stream starts, 1,144 unique frame targets and 1,102 unique descriptors. Multi-part vectors repeat in five independent tables. EMP contains six packed signed-word pairs whose meaning remains UNKNOWN; KANG contains three data-pointer-like auxiliary values, including exact `MSU_KANG`, that are deliberately not coerced into animation-stream semantics.

This establishes a bounded MK1 ANITAB structural export mechanism, not complete animation universes or MK2/MK3 grammar. The next product-critical step is to resolve this descriptor graph against the original GRA payload bytes from the user's complete MK1 installation.

# Latest: 1E.3O.16 Kano Animation Exportability Census

## Pass 1E.3O.16 — export-first KANO_ANITAB structural census

O15 is now closed VERIFIED from the user's canonical 24/24 export. The direct heart_0 dword inbound surface is established, but no safe allocation site or relocation writer is established. Because the product goal is asset extraction/reconstruction rather than game modding, relocation is parked unless a future extraction question genuinely requires it.

O16 is read-only and returns to the export path. It bounds `KANO_ANITAB` by Watcom symbols (`0x13F6C..0x14100`, 404 bytes / 101 dword cells), independently rechecks the known animation bytecode dispatcher, classifies all 101 table cells, normalizes unique reachable streams/frame targets/descriptors, records aliases and resource dependencies, and preserves the known O14 off-table `BEAT_LOOP` as explicit proof that the table is not the complete Kano animation universe.

Direct canonical developer validation currently reports: 101/101 cells classified; 84 stream cells / 79 unique streams; 168 unique frame targets (156 descriptor-vector, 12 direct-descriptor); 163 unique descriptors across STANCE/FONTS/MISC/VICTORY/KANO resources; three two-part vector targets plus the verified three-part heart frame; and zero unresolved cells. This is structural/exportability evidence, not blanket runtime qualification of every animation index.

# Latest: 1E.3O.11 Controlled Heart-Rip Fourth-Part Topology Write

## Pass 1E.3O.11 — First bounded topology write

O10 verified that a full four-object `RESHAPE_MULTI` frame terminates by linked-object chain exhaustion and therefore needs no fifth zero dword. O11 uses that result to replace only `heart_2`'s existing fourth-slot zero at `0xB260` with the already-qualified `KHEART5B` descriptor pointer. The frame allocation remains 16 bytes; no relocation or sequence-pointer rewrite is used. The writer requires exact whole-EXE diff accounting, semantic reparse, preservation of the following `heart_3` record, and exact reversal. Generic add/remove-part authoring remains blocked.

# Latest: 1E.3O.10 RESHAPE_MULTI Full-Capacity Termination Semantics

## Pass 1E.3O.10 — Full-capacity termination semantics

O9 verified that the observed three-part `heart_2` record has no spare bytes for a conventional four-pointer-plus-zero representation. O10 now tests the consumer instead of assuming that representation is mandatory at maximum setup capacity. It inspects the canonical `RESHAPE_MULTI` control flow and asks whether the non-zero descriptor path advances through the linked-object chain and exits when the fourth/final object has no successor, before attempting another descriptor read.

If established, the bounded four-part `heart_2` record remains 16 bytes: its existing zero dword at `0xB260` becomes the fourth descriptor pointer, the next `heart_3` record at `0xB264` stays untouched, and no relocation or sequence-pointer rewrite is required. O10 is read-only and enables no topology writer.

See `MK_DOS_Archive_HANDOFF_1E3O9_HEART_RIP_STRUCTURAL_GROWTH_RELOCATION_CENSUS.md` for the current implementation checkpoint. The verified O8 and O7 handoffs are retained as closed prerequisites.

# MK DOS Archive


> **Current research checkpoint — O95C (2026-10-07):** MK2 has a verified shared selected-pointer stream interpreter, bounded 0..9 control dispatch, descriptor-composition builder, and one caller-connected eight-frame `GO.GRA` sequence for identity slot 12 / nested index 7 terminating on token 0. An earlier exploratory association of that caller with stream `0x248A` failed closed and is REJECTED. MK2 remains open; next is O95D runtime-connected stream-corpus expansion. The user-directed order remains **finish MK2 -> finish MK1 -> finish MK3 -> discuss UI/usability -> build extractor**.

Forensic reverse-engineering, asset reconstruction, preservation, editing, and future deterministic recompilation tooling for the DOS PC releases of Mortal Kombat (MK1, MK2, and MK3).

Long-term target:

**binary → structured/lossless IR → editable assets/canvas → deterministic compiler → binary**

## Current checkpoint

**Pass 1E.3O.9** is the first read-only structural-growth pass after the now-VERIFIED O8 editor. It asks whether the three-part `heart_2` frame can accept the fourth linked object that `MSU_HEART` already allocates, whether the record can grow in place, and what reference/storage evidence is needed before any relocation writer can exist. O9 performs no binary mutation.

O8 makes storage aliasing explicit rather than hiding it. In particular, `KHEART5A` / frame record `heart_4` is referenced by both `PRIMARY:4` and `BEAT_LOOP:2`; moving that descriptor intentionally affects both appearances. The editor shows descriptor usage before compilation.

The compiler path remains `mk1_animation_ir_v1 -> serializeMK1BoundedAnimationIr -> canonical MK1.EXE clone`. Frame records, part counts, descriptor pointers, dimensions, packed GRA references, MISC.GRA pixels, BLOOD_P, relocation/allocation, topology and collision/gameplay state remain read-only.

O8 is independently VERIFIED on the canonical fixture: 22-region no-edit round trip exact, controlled multi-descriptor edit exact, alias behavior explicit, semantic reparse exact, zero unexpected bytes, and exact reversal. O9 source-level validation passes for its core, panel, 18-stage quick-run integration, and smoke-script syntax; direct O9 canonical-fixture execution remains pending in this source snapshot.

The independently validated O7 closeout established exact canonical no-edit round trip, bounded three-part write-back, exact reversal and fail-closed behavior. O8 builds on that verified result; it does not reopen O7 or the unrelated O6 hit/contact branch.

### Prior authoring checkpoint

**Pass 1E.3O.5** promotes the now runtime-verified Rayden lightning placement mechanism into the project's first bounded interactive canvas authoring control.

The qualified fixture remains deliberately narrow:

- Rayden character ID `2`;
- normal lightning projectile route;
- setup descriptor `HANDBO22`;
- twelve qualified travel descriptors `HANDBO4/5/8/9/10..17`;
- persistent visible loop `HANDBO14 → HANDBO15 → HANDBO16 → HANDBO17`;
- File ID 36 / `GRAPHICS/RAIDEN.GRA`;
- 7-colour `MORPH_P` palette;
- writable fields: signed-int16 descriptor-local **X and Y only**.

The editor now allows a user to:

- select any of the 13 qualified descriptor frames;
- preview its decoded RAIDEN.GRA sprite on an anchored canvas;
- drag the sprite directly or enter X/Y numerically;
- compare current placement with a translucent original-position ghost;
- apply the selected frame's translation to the persistent loop, all travel frames, or the entire setup+travel descriptor set;
- compile only the dirty semantic descriptor coordinates into a fresh canonical `MK1.EXE`;
- inspect the exact changed-byte count and edited SHA-256;
- export a runtime bundle containing the edited executable and edit manifest.

The no-edit editor model re-encodes all qualified X/Y fields and produces **0 executable mismatches** and the canonical SHA-256:

`750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

A direct canonical-fixture smoke also translated the four persistent-loop descriptors by `+8 X / -6 Y`: 4 descriptors changed, 8 executable bytes changed, 0 unexpected bytes, and exact reversal restored the canonical hash.

### Runtime evidence carried forward

The user completed the 1E.3O.4 DOSBox test and reported that the +24 local-Y lightning displacement **worked perfectly** while the move otherwise behaved normally. That runtime observation closes the visual-placement mechanism used as the basis for this editor. The generated O4 artifact itself remains a static qualification artifact; the runtime result is project-history evidence rather than fabricated machine provenance.

## Scope boundary

1E.3O.5 is **not** yet a universal MK1 animation editor. It intentionally blocks:

- descriptor relocation/growth;
- width/height editing;
- packed GRA-reference editing;
- sprite-pixel/uGRA replacement;
- palette editing from this canvas;
- adding/removing animation parts;
- animation-stream restructuring;
- world-position, velocity, collision, damage, or input/move edits.

This pass proves the authoring/compiler interaction pattern on a mechanically and runtime-qualified fixture before that pattern is generalized.

## Setup & Running

```bash
npm install
npm run dev
```

Direct fixture smokes (Node 22+):

```bash
npm run smoke:palette-round-trip -- /path/to/mk1 /path/to/evidence
npm run smoke:palette-edit -- /path/to/mk1 /path/to/evidence
npm run smoke:palette-entry-edit -- /path/to/mk1 /path/to/evidence
npm run smoke:opponent-access -- /path/to/mk1 /path/to/evidence
npm run smoke:ladder-grammar -- /path/to/mk1 /path/to/evidence
npm run smoke:shang-morph -- /path/to/mk1 /path/to/evidence
npm run smoke:animation-stream -- /path/to/mk1 /path/to/evidence
npm run smoke:multi-part-ir -- /path/to/mk1 /path/to/evidence
npm run smoke:multi-part-edit -- /path/to/mk1 /path/to/evidence
npm run smoke:rayden-lightning -- /path/to/mk1 /path/to/evidence
npm run smoke:rayden-canvas-editor -- /path/to/mk1 /path/to/evidence
npm run smoke:multi-part-composition-editor -- /path/to/mk1 /path/to/evidence
```

Authoritative research/authoring runs must use an untouched MK1 installation whose `MK1.EXE` SHA-256 is the canonical value above.

## Pass 1E.3O.9 — Heart-rip structural growth / relocation census

O8 is now independently VERIFIED on the canonical fixture. Pass 1E.3O.9 is the first structural-growth pass and remains read-only. It focuses on the already-qualified `heart_2` frame (`[KHEART3A,KHEART3B,KHEART3C,0]`). `MSU_HEART` already allocates four linked part objects, so the established `RESHAPE_MULTI` grammar can mechanically consume a fourth descriptor pointer without changing the setup-list capacity. The current frame record is 16 bytes; a four-part record would require 20 bytes.

O9 does not guess that those four additional bytes are available. It verifies the target record boundary against the following structure, scans the complete executable for raw little-endian occurrences of every qualified frame-record value, distinguishes the already-qualified sequence cells from numeric coincidences, and inventories zero-filled runs only inside runtime-addressable Object 2 file-backed bytes. Those zero runs remain reconnaissance only: zeros or absence of a Watcom symbol do not prove free storage.

The O9 result deliberately cannot enable a topology writer. A future writer requires one relocation site to be separately qualified and then a controlled pointer-rewrite experiment with whole-EXE diff and exact reversal. Collision/hit detection remains unrelated.

Direct O9 smoke:

```bash
npm run smoke:heart-rip-relocation-census -- /path/to/mk1 /path/to/evidence
```


## Pass 1E.3O.10–1E.3O.12 — Full-capacity semantics and fixed-capacity topology authoring

O10 refined the multi-part grammar for the four-object Kano heart setup. Under capacity, `RESHAPE_MULTI` still consumes a zero-terminated pointer list and pads the remaining linked objects with `NULL_IMAGE`. At full four-object capacity, the linked-object chain ends after the fourth pointer and the routine returns before reading another descriptor dword. Therefore `heart_2` can use its existing 16-byte allocation as four pointers with no trailing zero.

O11 then proved one controlled in-place 3→4 topology mutation by replacing the existing fourth-slot zero with `KHEART5B`. Static validation produced exactly three expected executable byte changes, zero unexpected changes, semantic reparse, preservation of the following frame, and exact reversal. The user subsequently ran the isolated fixture: Kano's heart-rip fatality completed normally, the heart presentation was visibly more detailed / the throb more prominent, and no crash or obvious corruption occurred. The bounded fourth-object mechanism is therefore runtime verified; the exact sprite identity was not visually asserted by the user.

O12 promotes that bounded mechanism into authoring for **`heart_2` only**:

- 1–4 unique parts;
- selectable only from the nine O8-qualified KHEART descriptors;
- add, remove, replace and reorder;
- 1–3 parts encode as pointers followed by a zero terminator inside the existing 16-byte allocation;
- 4 parts encode as four pointers and terminate by O10-qualified linked-object chain exhaustion;
- duplicate descriptor pointers, arbitrary pointers, zero parts, >4 parts, other frame records, relocation/allocation, descriptor bytes, GRA pixels, palette, collision and gameplay edits remain blocked.

The compiler always fresh-reads canonical `MK1.EXE`, serializes all established semantic regions, independently computes the expected 16-byte target allocation, diffs the complete executable, reparses the authored topology, verifies the following frame, and requires exact reversal.

Direct O10–O12 smokes:

```bash
npm run smoke:reshape-multi-full-capacity -- /path/to/mk1 /path/to/evidence
npm run smoke:heart-rip-fourth-part-topology -- /path/to/mk1 /path/to/evidence
npm run smoke:heart-rip-fixed-capacity-topology -- /path/to/mk1 /path/to/evidence
```

## Pass 1E.3O.13 — Atomic heart_2 topology + placement authoring

O13 composes two already-qualified authoring mechanisms into one semantic transaction:

- O12 fixed-capacity `heart_2` topology (1–4 unique qualified KHEART pointers inside the existing 16-byte allocation);
- O8 signed-int16 descriptor-local X/Y placement.

The transaction may add/remove/replace/reorder `heart_2` parts and change X/Y for descriptors selected into that same authored topology. Shared descriptor storage remains explicit: moving a descriptor such as `KHEART1` can also move its existing occurrence elsewhere in the heart-rip animation, and the exported report lists every affected preview key.

The compiler independently derives expected topology bytes and placement bytes, diffs the whole executable, reparses both semantic layers, verifies the following frame, and requires exact reversal. Duplicate pointers, arbitrary pointers, other-frame topology, relocation, dimensions, packed references, pixels, palette and gameplay/collision remain blocked.

Direct smoke:

```bash
npm run smoke:heart-rip-atomic-composition -- /path/to/mk1 /path/to/evidence
```

## Pass 1E.3O.14 — Full heart-rip fixed-layout composition authoring

O14 broadens the verified O13 transaction from only `heart_2` to all seven unique Kano heart-rip frame records while preserving every existing binary allocation.

- `heart_2` remains the verified 16-byte variable-composition frame and supports 1–4 unique qualified KHEART descriptor pointers.
- `heart_0`, `heart_1`, `heart_3`, `heart_4`, `heart_5`, and `heart_6` remain 8-byte single-part records and permit descriptor replacement only.
- signed-int16 descriptor-local X/Y placement may be edited for any qualified descriptor used by the authored animation;
- descriptor reuse across distinct frame records is allowed and every resulting frame/preview alias is reported explicitly;
- the reused `heart_4` frame-record identity shared by `PRIMARY:4` and `BEAT_LOOP:2` remains one record, so edits to it intentionally affect both occurrences;
- record growth, relocation/allocation, arbitrary pointers, duplicate pointers inside `heart_2`, sequence rewrites, setup-count changes, dimensions, packed references, pixels, palette and gameplay/collision remain blocked.

The compiler writes only the seven established frame allocations plus requested descriptor X/Y bytes, independently derives the complete expected diff, compares the entire executable, reparses all seven frame records and requested placements, and requires exact reversal to canonical SHA-256.

Direct smoke (requires installed project dependencies):

```bash
npm run smoke:heart-rip-full-fixed-layout-composition -- /path/to/mk1 /path/to/evidence
```

## Pass 1E.3O.18 — Authentic-resource animation decode census

O18 ingests the user's complete original MK1 installation and resolves the broad O17 animation graph against actual GRA bytes. All **1,102 / 1,102** unique O17 descriptors decode successfully through the established uGRA decoder across 12 authentic GRA resources; the known 58x104 Kano offset-0 checksum `09961980` reproduces exactly. Across the graph, opaque indices are **1..23** and all 25 structural multi-part frames have pairwise-overlapping opaque bounds after descriptor-local X/Y placement.

This establishes resource/decode backing for the cross-table graph. It does **not** establish a single palette per GRA file or correct-color PNG export for every context. Palette binding remains contextual.

Direct smoke:

```bash
npm run smoke:animation-resource-decode-census -- /path/to/mk1 /path/to/evidence
```

## Pass 1E.3O.19 — Runtime character identity to ANITAB selector

O19 establishes the canonical `GET_CHAR_ANI` bridge. The routine reads object character ID at `+0x48`, indexes the nine-dword selector at Watcom `0x9914`, then uses `A9` to index the selected ANITAB. The exact mapping is:

- 0 CAGE -> `VANDAN_ANITAB`
- 1 KANO -> `KANO_ANITAB`
- 2 RAYDEN -> `RAIDEN_ANITAB`
- 3 LIU KANG -> `KANG_ANITAB`
- 4 SCORPION -> `NINJA_ANITAB`
- 5 SUB-ZERO -> `NINJA_ANITAB`
- 6 SONYA -> `LIZ_ANITAB`
- 7 GORO -> `GORO_ANITAB`
- 8 EMP -> `EMP_ANITAB`

This is a read-only export-organization result. Individual ANITAB-index gameplay names and complete animation-universe claims remain open.

Direct smoke:

```bash
npm run smoke:character-animation-selector -- /path/to/mk1 /path/to/evidence
```

The current export-critical research boundary is palette context: successful indexed-pixel decode is not palette ownership, and one GRA can legitimately participate in different palette contexts.

## Pass 1E.3O.20 — Animation palette context bridge

O20 proves that animation-table identity and palette identity are separate export dimensions. The same object character-identity field `+0x48` indexes both the O19 ANITAB selector and the verified normal/alternate palette tables, but the mappings are not equivalent. Scorpion and Sub-Zero both use `NINJA_ANITAB` while using distinct palette pairs, and character IDs 0..6 can switch normal/alternate palettes without changing ANITAB family.

Direct verdict: `MK1_ANIMATION_PALETTE_CONTEXT_SEPARATION_ESTABLISHED`.

Bulk correct-color export must therefore carry explicit palette context rather than assigning one palette per GRA or per ANITAB.


## Pass 1E.3O.21 — GET_CHAR_ANI consumer census

Read-only census of direct calls to `GET_CHAR_ANI`. Immediate adjacent `A9` animation indices are recorded as bounded consumer evidence; dynamic/non-adjacent consumers remain explicit and nearest Watcom symbols are context only, not gameplay-name proof.


## Pass 1E.3O.22 — character animation export manifest

Read-only product-facing IR joining structural ANITAB entries, authentic indexed-pixel decode coverage, character identity, explicit palette context, and direct consumer context. No arbitrary resource-to-palette mapping or canonical animation names are invented.


## Pass 1E.3O.23 — verified palette-bound RGBA export fixtures

Read-only end-to-end color export proof for two already-qualified contexts: Kano heart with `BLOOD_P` and Rayden normal lightning with `MORPH_P`. Other animation palettes remain unresolved rather than guessed.


## Pass 1E.3O.24 — character palette-context variant renderer

O24 combines the authentic O18 descriptor/resource graph, O20 character palette contexts, and the verified one-based renderer palette-shift bridge. For each character ANITAB it identifies the structurally dominant resource and renders every descriptor from that resource under the explicit normal/alternate palette context(s), without assigning those palettes automatically to cross-resource/effect entries. Direct authentic-install validation covers 1,016 unique dominant-resource descriptors across eight ANITABs, 1,190 character-context descriptor instances, and 2,263 descriptor/palette RGBA variants with zero out-of-range opaque indices. The shared NINJA geometry renders under four distinct Scorpion/Sub-Zero normal/alternate palette records. This is explicit contextual rendering, not a universal one-palette-per-GRA or per-animation palette rule.


## Pass 1E.3O.27 — Stage/background resource graph census

Read-only authentic-install census of BGND/BGNDTBL/BGNDPAL structures. It establishes 24 top-level background-module records, 41 unique BMOD scene records, 15 HDRS.GRA resource contexts and 548 successfully decoded NO_XY descriptors while deliberately leaving placement-record bitfield semantics and final scene pixel composition unresolved.


## Pass 1E.3O.28 — Background placement + PIT scene export IR

Read-only authentic-install qualification of the BAKGND placement consumer. Across 2,550 canonical placement records, every descriptor and palette selector resolves in range and every selected decoded opaque index fits its selected palette record. PIT_MOD is exported as a bounded two-BMOD scene IR with 358 placement records, all 85 FU5 descriptors, 23 used palette selectors and 88 deterministic correct-colour descriptor/palette variants. Final renderer z-order, clipping/scroll transform and a canonical full-stage raster remain unresolved.


## Pass 1E.3O.29 — Background Renderer Order + Camera Projection
Read-only authentic-install qualification establishes nine BGND planes, BAK plane renderer traversal 8→7→6→5→4→3→2→1→0, per-list sort keys, X/Y axes, ordinary camera subtraction, 320×200 default view bounds, and PIT_MOD initial plane-0 projection. Equal sort-key tie history remains a runtime insertion/culling detail.

## Pass 1E.3O.30 — Background Dynamic Process + Animation Census
Read-only authentic-install qualification proves that MK1 backgrounds include scheduler-driven descriptor cycles and positional motion. CAVE, PILLAR and ARENA expose bounded descriptor-cycle families with tick cadences; PIT and PILLAR also spawn motion processes. Timing is preserved in scheduler ticks only, and unresolved external callbacks/palette ownership are not guessed.

## Pass 1E.3O.31 — Time-Aware Background Scene IR

O31 joins O27–O30 into a single read-only scene model. Canonical `INIT_BAKMODS` / `MULTI_PLANE` code proves that top-level scene entries are written into consecutive `BAK0MODS..BAK8MODS` slots, giving every one of the 72 scene slots an exact plane identity. The resulting IR expands 68 BMOD scene references into 4,488 instantiated placement objects while preserving the 2,550 unique underlying BMOD records, exact descriptor/palette state, initial camera projection, renderer sort keys, scheduler/process context and unresolved equal-key ordering.

The join also resolves placement-bound dynamic targets: ARENA binds to 8 plane-3 + 7 plane-4 objects per normal/386 variant, and PILLAR's three cycle filters bind to 1 / 1 / 2 normal-module placements. CAVE remains a special-process-object cycle and is not forced into placement IR. Verdict: `MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED`.

## Pass 1E.3O.32 — Bounded ARENA Animated Scene Export Fixture

O32 uses the O31 plane/palette join to export the first bounded animated background fixture. `ARENA_MOD` has 15 placement objects across planes 3 and 4. Runtime palette selectors 11 and 0 alias one 49-colour `FU2PALS` record (`0x0000F9E2`), and the qualified ARENA updater preserves that object palette while cycling six authentic `FU2HDRS.GRA` descriptors every 8 scheduler ticks. Six deterministic RGBA state payloads are exported with zero decode or palette-range failures.

A canonical flattened composite is deliberately blocked: the eight plane-3 objects and seven plane-4 objects each form an exact-equal sort-key group, their animated sprites overlap, and O29 leaves equal-key runtime order history-dependent. O32 therefore exports state sprites plus time-aware instance metadata rather than inventing overlap order. Independent Python uGRA/RGBA reconstruction matched all six PNG payloads byte-for-byte. Verdict: `MK1_ARENA_BOUNDED_ANIMATED_SCENE_EXPORT_FIXTURE_ESTABLISHED`.


## Pass 1E.3O.33 — PILLAR cloud motion / wrap qualification

O33 follows `PILLAR_MOD` child `0x4A1A` into three process-created multipart cloud groups. Seven authentic `FU4HDRS.GRA` cloud descriptors decode against directly linked 12-colour `cloud_p`. The groups are anchored at `(16,28)`, `(157,28)`, `(311,28)`, inserted into `BAKLST6` (plane 6), marked `0x4000` no-scroll, registered in the master velocity list, and given root X velocity `0x00006666` signed 16.16. `DISPLAY_ALL` propagates root velocity to every multipart part before position integration. Every 8 scheduler ticks the process tests signed integer root X; `X > 319` shifts the complete multi by `-459` X while preserving velocity and fractional position. On the explicitly bounded display-active path, first wraps are normalized ticks 152 / 616 / 888 for groups 3 / 2 / 1. Wall-clock timing and a universal scheduler/display ratio remain unclaimed. Verdict: `MK1_PILLAR_CLOUD_MOTION_AND_WRAP_SEMANTICS_ESTABLISHED`.

## Pass 1E.3O.34 — bounded PILLAR dynamic-scene export package

O34 packages PILLAR's two qualified dynamic axes as independent normalized time tracks. Three placement-bound 8-state descriptor cycles on planes 0/1 use BAKGND selectors 9/12, which alias the same 17-colour `fu4PALS` record at `0x0000FAE0`; 24 correct-colour RGBA states export with zero range failures. O33's three plane-6/no-scroll cloud groups export as seven `cloud_p`-backed RGBA parts plus a 112-snapshot normalized process-poll timeline through tick 888. Total export: **31 RGBA/PNG payloads**. Independent Python reconstruction matched all 31 PNG RGBA buffers exactly and reproduced the full normalized poll timeline. The descriptor-cycle and cloud tracks share scheduler units but their canonical mutual phase is not established; no wall-clock timing or whole-stage flattened raster is invented. Verdict: `MK1_PILLAR_BOUNDED_DYNAMIC_SCENE_EXPORT_PACKAGE_ESTABLISHED`.

## Pass 1E.3O.35 — PIT dynamic motion / shadow-bound / transient qualification — VERIFIED

O35 resolves the three PIT child callbacks bounded by O30. Callback `0x4920` is refined from the earlier broad “camera or render-bound” label: it updates `SHAD_SCRNTL` every scheduler tick using `CEILING_Y` and the signed integer high word of `WORLDTLY`; it does **not** mutate the established PIT camera/scroll globals. Callback `0x494A` creates ten persistent plane-2/no-scroll multipart groups backed by `FU5HDRS.GRA` and the directly linked 14-colour `dcloud_p`. The groups use exact signed-16.16 X velocities `0x6666`, `0x4CCC` and `0x3333`, poll every 8 scheduler ticks, and wrap the whole multipart group by -459 X when signed integer root X exceeds 319. The conditional `0x4870` family chooses one of eight `dcloud_p` silhouettes, creates a plane-3/no-scroll object at (-80,37), uses velocity `0x19999`, crosses its first threshold at normalized display-active tick 250, pauses 288 ticks, and deletes after its second threshold at tick 788. All 16 unique dynamic descriptors decode from authentic bytes with palette indices in range. Independent byte/decode/timeline audit passed. Verdict `MK1_PIT_DYNAMIC_MOTION_SHADOW_BOUND_AND_TRANSIENT_LIFECYCLE_ESTABLISHED`.

## Pass 1E.3O.36 — bounded PIT dynamic-scene export package — VERIFIED

O36 joins O28's 358 ordinary PIT placements / 88 correct-colour variants and O29/O31 initial camera state to O35's process-created dynamics. It exports 88 ordinary variants, 8 persistent `dcloud_p` parts and 8 transient silhouettes: **104 deterministic RGBA/PNG payloads**. The persistent normalized track contains 265 eight-tick poll snapshots through tick 2112 and 12 exact wrap events; the transient track preserves its spawn gate, 32-tick initial process wait and local 250/538/788 lifecycle; the one-tick `SHAD_SCRNTL` track remains symbolic because its runtime inputs are not bound. Independent canonical-byte reconstruction matched all 104 PNG raw-RGBA payloads and independently reproduced the timelines. A full-stage raster remains blocked by equal-key ordering, runtime camera evolution, conditional/random transient state, unresolved absolute mutual phase and symbolic shadow-bound inputs. Verdict `MK1_PIT_BOUNDED_DYNAMIC_SCENE_EXPORT_PACKAGE_ESTABLISHED`.

## Pass 1E.3O.37 — CAVE special-object random-phase / palette qualification — VERIFIED

O37 closes the CAVE special-process-object gap left by O31. Unless numeric `GSTATE == 11`, callback `0x4680` spawns process `0x2025` at `0x4699`. The child creates six `BAKLST9` objects from exact offsets `(57,100)`, `(96,112)`, `(128,106)`, `(230,106)`, `(268,112)`, `(396,112)`. Their creation record directly binds descriptor `0x264C` and the three-colour `eyez2` palette at `0x0001003A`; all six unique FU7 cycle descriptors decode with every opaque index in range. Each object receives one sequential `RANDU(28)-1` call, establishing an initial visible phase domain of 0..27 without establishing the RNG seed/state. The linked six-object set advances through the same 28-slot table every eight scheduler ticks. `BAKLST9` is rendered before plane 8 using `WORLDTLX8` and shared `WORLDTLY`; object flags remain `2`, so 0x4000 scroll bypass is absent and creation-state projected offsets equal the coordinate table. Independent byte/decode audit passed. Verdict `MK1_CAVE_SPECIAL_OBJECT_RANDOM_PHASE_AND_PALETTE_BINDING_ESTABLISHED`.

## Pass 1E.3O.38 — bounded CAVE random-phase dynamic export package — VERIFIED

O38 packages both CAVE module variants with their O31 ordinary scene context (204 placements for `CAVE_MOD`, 133 for `CAVE_MOD386`) and the process-created `BAKLST9` layer. It exports six unique correct-colour `eyez2` RGBA/PNG payloads and the complete 28-slot phase-zero template at eight scheduler ticks per transition. Each of the six runtime objects retains an explicit 0..27 initial-phase domain; visible progression is `(p+n) mod 28`. Independent Python reconstruction matched all six PNG raw-RGBA buffers exactly and independently matched the 28 canonical table slots. No joint random phase vector, canonical first frame, wall-clock timing, or whole-stage flattened animation is fabricated. Verdict `MK1_CAVE_BOUNDED_RANDOM_PHASE_DYNAMIC_EXPORT_PACKAGE_ESTABLISHED`.

**Historical pause checkpoint:** O37 + O38 completed the then-current two-major-verification block at 47/47.



## Pass 1E.3O.39 — STRIPPED BIGEMP process / view-selection qualification — VERIFIED

O39 resolves O30's only external unresolved stage child as Watcom `BIGEMP_PROC` at `0x276B4` in `EMP.ASM`, while deliberately excluding adjacent `EMPEROR_CLAP` because the STRIPPED init route does not call it. All three STRIPPED variants unconditionally spawn the process. `INIT_MULTI` creates five linked parts from local setup `0x128FE`, binds them directly through `EMPCLP2 +0x0C` to the count-prefixed 23-colour `EMP_P`/`YANG_P` record at `0x00010356`, anchors the multipart at `(558,42)`, sets primary sort `0x00010000`, and inserts every part into `BAKLST4` / plane 4. Twelve unique `FU8HDRS.GRA` descriptors decode successfully with opaque indices in range. Seven exact five-part frame records are selected every eight scheduler ticks from signed-high-word `WORLDTLX`: index 3 when `x<=169`, otherwise `min(6,floor(abs(589-x)/60))`. The initial STRIPPED camera value 405 selects index 3 / `EMPHEAD1`. Independent canonical-byte/uGRA audit matched code anchors, palette, descriptor checksums, frame records and projected part positions. Verdict `MK1_STRIPPED_BIGEMP_MULTIPART_VIEW_SELECTION_ESTABLISHED`.

## Pass 1E.3O.40 — bounded STRIPPED BIGEMP dynamic-scene export package — VERIFIED

O40 joins the O31 ordinary scene context (201 / 195 / 90 instantiated placements for `STRIPPED_MOD` / `STRIPPED_MOD486` / `STRIPPED_MOD386`) to O39's process-created multipart. It exports 12 direct `EMP_P` descriptor RGBA/PNG payloads and seven deterministic five-part transparent emperor composites, **19 payloads total**. Each composite is 47×91 pixels. Renderer secondary-Y ordering is preserved; the sole exact-Y tie (`EMPBODP1`/`EMPBODP2`) has non-overlapping horizontal rectangles, so unresolved equal-key insertion order cannot alter composite pixels. Independent Python reconstruction matched all 19 PNGs at raw RGBA level and re-derived all seven frame selections from canonical bytes. The selector remains camera-driven state, not an autonomous animation clock; process/display phase, wall-clock rate, later camera evolution and a canonical whole-stage STRIPPED raster remain unclaimed. Verdict `MK1_STRIPPED_BOUNDED_BIGEMP_VIEW_EXPORT_PACKAGE_ESTABLISHED`.

**Historical pause checkpoint:** O39 + O40 completed the then-current two-major-verification block at 49/49.

## Pass 1E.3O.41 — Renderer history, clipping and equal-key order — VERIFIED

O41 closes the mechanism behind O29's equal-key uncertainty. `YZSORT` stably repair-sorts `OBJLST`, `OBJLST2` and `OBJLST3`; `0x563B8` is qualified as the shadow list rendered under `SHAD_SCRNTL`; and `BAKCLR` + the eight-tick `BACKGROUND` process establish the ordinary BAK active-set lifecycle. The active rectangle is expanded by 68 horizontal / 48 vertical pixels. Culled placements clear occupancy and can later be recreated; `INSOBJ_V` inserts newly recreated exact equals before surviving peers, so arbitrary later tie order genuinely depends on cull/recreate history.

A bounded fresh PIT state is deterministic: after empty occupancy, PIT camera X=211/Y=35 and first `MULTI_PLANE`, 15 ordinary placements are active, six are visible, and the plane-1 head-to-tail order is `169→124→72→143→75→58`. Verdict: `MK1_RENDERER_SPECIAL_LIST_CLIPPING_AND_BACKGROUND_HISTORY_ORDER_SURFACE_ESTABLISHED`.

## Pass 1E.3O.42 — PIT fresh-initial ordinary BAK compositor — VERIFIED

O42 consumes only that O41-qualified fresh state. It clips and composes the six visible ordinary BAK instances onto a transparent 320×200 RGBA layer using two O28 correct-colour source variants. The composite contains 10,278 opaque pixels and has raw-RGBA SHA-256 `a0d3f10adf58c9a22dc53898ed618ad07fbb1e5bc0c5a56ce1b877f7d6dbe4bc`. The exact-equal 169/124 pair has 26 opaque overlap pixels, 22 with differing colours, proving the fresh tie order materially affects pixels. Independent canonical-byte/uGRA reconstruction matched both source PNGs and the composite exactly (3/3 payloads). Process-created PIT dynamics, special lists, later camera/cull history, fighters and HUD remain excluded. Verdict: `MK1_PIT_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_FIXTURE_ESTABLISHED`.

**Historical pause checkpoint:** O41 + O42 completed the then-current two-major-verification block at 51/51.

## Pass 1E.3O.43 — generalized fresh-initial ordinary BAK compositor census — VERIFIED

O43 generalizes O41's bounded fresh-state ordering proof across all 24 O31 top-level background modules without promoting arbitrary later history. The qualified state is deliberately narrow: `BAKCLR`/empty ordinary placement occupancy, the module header-defined initial camera and the first placement-derived `MULTI_PLANE` population. Per-plane placement records are created in increasing record-index order; exact-equal sort keys therefore appear head-to-tail in reverse fresh creation order because `INSOBJ_V` inserts a new exact equal ahead of existing peers. Renderer plane traversal remains `8→7→6→5→4→3→2→1→0`.

Across all 24 modules the bounded state contains **2,575 active** ordinary placements and **2,153 viewport-visible** placements, with **512 visible exact-equal key groups** and **521 geometrically overlapping equal-key pairs**. PIT reproduces O41 exactly: 15 active, six visible and plane-1 order `169→124→72→143→75→58`. Independent Python recomputation matched every module's complete renderer-order placement-ID sequence. Init-callback/process-created objects, special lists, dynamic descriptor evolution and later cull/recreate history remain excluded. Verdict: `MK1_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS_ESTABLISHED`.

## Pass 1E.3O.44 — multi-stage fresh-initial ordinary BAK export package — VERIFIED

O44 renders every O43-qualified module state as a transparent 320×200 correct-colour ordinary-background layer. Across the **2,153 visible placement instances**, **370 unique source variants** are required; each source variant is independently decoded from its authentic `HDRS.GRA` uGRA payload and colourized from the exact count-prefixed palette record referenced by BAKGND creation. The package exports those 370 source variants plus **24 module composites = 394 RGBA/PNG payloads**. There are **22 unique composite rasters** because `PIT_MOD`/`PIT_MOD386` and `GNINJA_MOD`/`GNINJA_MOD386` are identical under this bounded ordinary-layer state. PIT reproduces O42's raw-RGBA SHA-256 `a0d3f10adf58c9a22dc53898ed618ad07fbb1e5bc0c5a56ce1b877f7d6dbe4bc`.

An independent Python uGRA decoder, palette colorizer, clipping compositor and PNG parser matched **370/370 source PNGs and 24/24 module composites exactly at raw RGBA level**. Process-created dynamics, special lists/shadows, dynamic descriptor-cycle evolution, later camera/cull history, fighters and HUD remain excluded. Verdict: `MK1_MULTI_STAGE_FRESH_INITIAL_ORDINARY_BAK_EXPORT_PACKAGE_ESTABLISHED`.

**Historical pause checkpoint:** O43 + O44 completed the then-current two-major-verification block at 53/53.



## Pass 1E.3O.45 — dynamic/special-layer compositor contract — VERIFIED

O45 joins the exact O29/O41 renderer traversal to the already-qualified ARENA, PILLAR, PIT, CAVE and STRIPPED dynamic mechanisms. Eight renderer-facing layer contracts are now explicit: two placement-descriptor mutation families, four process-created ordinary-BAK families, the CAVE first-traversed special-list family, and the symbolic PIT shadow-bound track. Authentic machine-code anchors independently confirm that `INIT_MULTI` initializes multipart sort-primary to zero, `SET_Z_MULTI` can override that value, BIGEMP uses `0x00010000`, CAVE occupies `BAKLST9` at renderer ordinal 0, PIT persistent/transient objects occupy planes 2/3, and the shadow list remains renderer ordinal 9.

The pass deliberately defines **five normalized compositor states** rather than a fictional universal frame zero: ARENA state 1; PILLAR cycle state 1 plus clouds immediately after creation/pre-motion; PIT persistent clouds immediately after creation with the optional transient explicitly absent and `SHAD_SCRNTL` symbolic; CAVE with spawn enabled and an explicit all-six-phase-zero test vector; and STRIPPED under the initial camera with BIGEMP selection 3. RNG state, absolute process phase, scheduler/display ratio, later camera history and wall-clock time remain noncanonical axes. Independent canonical-byte audit passed all 20 checks. Verdict `MK1_DYNAMIC_SPECIAL_LAYER_COMPOSITOR_CONTRACT_ESTABLISHED`.

## Pass 1E.3O.46 — five normalized combined dynamic-background compositor fixtures — VERIFIED

O46 combines O43/O44 fresh ordinary BAK layers with those O45-qualified dynamic/special layers into **five deterministic 320×200 background-only compositor test vectors**. ARENA substitutes state 1 into 15 qualified cycle targets (11 visible in the fresh viewport). PILLAR keeps its four placement-cycle targets normalized to state 1—none intersect this viewport—and adds ten process-created cloud-part instances at exact post-creation/pre-motion coordinates. PIT adds 13 persistent multipart cloud-part instances, explicitly normalizes the optional transient absent and leaves the runtime shadow-bound layer symbolic. CAVE draws six `BAKLST9` objects under an explicit all-phase-zero test vector. STRIPPED combines the fresh ordinary state with the five-part BIGEMP selection-3 view under the initial camera.

The five composites are all distinct. Raw-RGBA SHA-256 values are: ARENA `adbb37df37282cfff1e82541ae4eeb39b0958e6d56c50e64074f8c8dae245007`; PILLAR `e6d5ed7a3c565cafe9945ad89fdeaaefde8987711d5e153ef0cf708a96874de7`; PIT `c0e0dcf5d2d24e463890cedcbb35e59b29a022be7b0053f6eaa886d721af2fe4`; CAVE `feec6d83b3b402e5d94f42db800de6a372febd49d52084c11968c0484d2648f7`; STRIPPED `c51a14d6b05524e2ea5f541bfaf59a4faddb3da93a5ac2b0ba651c8a07899798`. A separate Python uGRA decoder/colorizer/compositor reconstructed all five from authentic EXE/GRA bytes plus the already-verified O43 draw-order evidence and matched **5/5 full rasters exactly at raw RGBA level**. These are normalized background compositor fixtures, not canonical gameplay screenshots. Verdict `MK1_FIVE_STAGE_NORMALIZED_DYNAMIC_BACKGROUND_COMPOSITOR_FIXTURES_ESTABLISHED`.

**Pause checkpoint:** O45 + O46 are the current completed two-major-verification block. Normal research workflow is **55/55**. O47 has not started.

## Pass 1E.3O.47 — stage export capability/coverage manifest — VERIFIED

O47 reconciles all 24 top-level MK1 background modules into explicit product export tiers. Every module has an O44 fresh ordinary raster and O31 time-aware scene IR. Five modules have direct O46 normalized combined fixtures; five process-spawning sibling variants retain qualified dynamic structure but no direct combined raster; CHOP_MOD and STATUE_MOD are flagged for unexported static init-created objects; twelve modules currently require only the ordinary raster + scene-IR tier. Verdict `MK1_STAGE_EXPORT_CAPABILITY_COVERAGE_MANIFEST_ESTABLISHED`.

## Pass 1E.3O.48 — product-facing stage export package/orchestrator — VERIFIED

O48 packages all 24 stages without fabricating unresolved pixels: 24 ordinary PNGs, five directly verified normalized combined PNGs, 24 time-aware scene documents and 24 coverage documents. Independent audit matches all 29 packaged rasters to previously verified raw-RGBA hashes and all 48 per-stage JSON documents to their source evidence. Verdict `MK1_PRODUCT_FACING_STAGE_EXPORT_PACKAGE_ESTABLISHED`.

**Pause checkpoint:** O47 + O48 complete the current two-major-verification block. Normal research workflow is **57/57**. O49 has not started.


## Pass 1E.3O.49 — background horizontal-orientation + CHOP/STATUE static-extra correction — VERIFIED

User visual review of the O48 package exposed a real raster-composition omission. O49 proves from canonical `BAKGND` flag construction and the renderer dispatch table that placement control bit `0x0010` selects the horizontally flipped `fWrtNonZero` / `fClpWrtNonZero` raster path. The authentic descriptor, palette, position and order evidence from O31/O43/O44 remains valid; the missing step was instance orientation at draw time. Across 4,488 instantiated placements, 801 carry the flip selector; 201 of the 2,153 fresh-visible placement instances are flipped across 14 module variants. Source uGRA payloads remain unmirrored and are flipped only during composition.

The same pass closes O47's CHOP/STATUE static-extra blocker. Shared init callback `0x4850` creates one no-scroll 62×58 moon from `GRAPHICS/MISC.GRA`, direct-bound to a 14-colour palette, at screen `(72,15)` on renderer plane 4. Independent canonical-byte/uGRA audit reproduces the dispatch semantics, all flip counts, setup record, palette range and moon checksum. Verdict `MK1_BACKGROUND_HORIZONTAL_FLIP_AND_CHOP_STATUE_STATIC_EXTRA_ESTABLISHED`.

**Correction note:** O44/O46/O48 raster pixels are superseded where affected by O49. Their descriptor decoding, palette bindings, fresh draw-order evidence, scene IR and product-tier reasoning remain valid unless explicitly updated by O50.

## Pass 1E.3O.50 — corrected product-facing stage export package — VERIFIED

O50 propagates each placement's original control word through the fresh-visible IR and applies horizontal flip only at final composition time. It regenerates all 24 ordinary stage rasters and the five previously qualified normalized dynamic composites, then adds directly verified combined CHOP_MOD and STATUE_MOD fixtures by drawing the plane-4 moon behind their corrected ordinary layers. The corrected package therefore contains 24 ordinary rasters, seven normalized combined rasters, one shared moon asset, 24 scene-IR documents and 24 corrected coverage documents: 32 PNG payloads total plus 48 per-stage structured documents.

Fourteen module variants change at the ordinary-raster level; the ten unaffected variants remain exact, including both PIT variants. Independent Python reconstruction from authentic EXE/GRA bytes matches all 24 corrected ordinary rasters and all seven combined fixtures at raw-RGBA level. The product-facing package remains background-only and does not claim canonical gameplay screenshots. Verdict `MK1_CORRECTED_PRODUCT_FACING_STAGE_EXPORT_PACKAGE_ESTABLISHED`.

**Pause checkpoint:** O49 + O50 complete the current two-major-verification correction block. Normal research workflow is **59/59**. O51 has not started.

## Pass 1E.3O.51 — dynamic sibling variant qualification — VERIFIED

O51 qualifies the five process-spawning sibling variants that O47 deliberately left without direct combined rasters: `ARENA_MOD386`, `CAVE_MOD386`, `PIT_MOD386`, `STRIPPED_MOD386`, and `STRIPPED_MOD486`. Promotion is not based on callback-family equality alone. Every row must preserve the authentic resource/file-id context, initialized camera, exact init callback address/classification, and the mechanism-specific renderer target required by its family. ARENA386 retains the exact ARENA3BMOD/ARENA4BMOD animated planes with 15 targets; PIT386 additionally has the exact PIT ordinary BMOD graph and placement count; CAVE386 and both STRIPPED siblings use the same already-qualified process-created special/BAK-list mechanisms under matching camera/resource contexts. Verdict `MK1_FIVE_DYNAMIC_SIBLING_VARIANTS_QUALIFIED_FOR_NORMALIZED_COMPOSITION`.

## Pass 1E.3O.52 — sibling normalized-combined fixtures + package refresh — VERIFIED

O52 renders five new normalized 320×200 background-only combined fixtures from each sibling's own corrected fresh ordinary topology plus the already-qualified family dynamics. ARENA386 uses state 1 on all 15 plane-3/4 targets; CAVE386 enables the spawn gate with all six phases normalized to zero; PIT386 uses persistent clouds post-creation/pre-motion with the transient absent and shadow state symbolic; both STRIPPED siblings use BIGEMP selection 3 under the initialized camera. Independent Python composition from O43/O44 and O32/O36/O38/O40 evidence matches all five full rasters exactly at raw RGBA level. PIT386 exactly matches PIT's parent combined raster, as required by their identical ordinary graph/camera/process state. The corrected product package now has 24 ordinary rasters and 12 direct normalized combined stage rasters, while all remaining unresolved modules retain structured blockers rather than invented pixels. Verdict `MK1_FIVE_SIBLING_DYNAMIC_FIXTURES_AND_TWELVE_STAGE_COMBINED_PACKAGE_ESTABLISHED`.

**Pause checkpoint:** O51 + O52 complete the current two-major-verification block. Normal research workflow is **61/61**. O53 has not started.

## Pass 1E.3O.53 — remaining no-op stage completeness — VERIFIED

O53 closes the twelve modules that still had only ordinary-raster product coverage after O52: `COINPAGE_MOD`, `END1_MOD`, `END2_MOD`, `GNINJA_MOD`, `GNINJA_MOD386`, `HSTD_MOD`, `INITIALS1_MOD`, `INITIALS2_MOD`, `MENU_MOD`, `MOVIE1_MOD`, `PILLAR_MOD386`, and `STATUE_MOD386`. Their canonical top-level init field points to Watcom offset `0x00004CAA`; the authentic `MK1.EXE` byte at physical `0x000556FE` is literally `C3` (`RET`). O30 records zero child callbacks for this init class, O31 confirms all twelve module init pointers/classifications, and O45 has no dynamic/special renderer contract for any member. Independent Python audit against pre-O53 evidence passes 8/8 checks. Verdict `MK1_TWELVE_NO_OP_STAGE_BACKGROUND_COMPLETENESS_ESTABLISHED`.

## Pass 1E.3O.54 — complete 24-stage normalized background package — VERIFIED

O54 promotes only those twelve O53-proven no-op modules. Their corrected fresh ordinary raster is copied byte-for-byte into `normalized_combined_background.png`; no new layer, timing state, object or pixel behavior is invented. The existing twelve O50/O52 combined fixtures remain unchanged. The product package now contains 24 corrected ordinary PNGs, **24 normalized background previews**, one shared CHOP/STATUE moon asset, 24 time-aware scene documents and 24 coverage documents. Independent package audit passes 14/14 checks: all twelve new no-op combined PNGs are byte-identical to their ordinary PNGs, all twelve existing O52 combined PNGs remain unchanged, all 24 ordinary PNGs remain unchanged, and all 24 scene documents remain unchanged. These are normalized background-only previews, not canonical gameplay screenshots. Verdict `MK1_ALL_24_STAGE_NORMALIZED_BACKGROUND_PREVIEWS_ESTABLISHED`.

**Pause checkpoint:** O53 + O54 complete the current two-major-verification block. Normal research workflow is **63/63**. O55 has not started.


## Pass 1E.3O.57 — data-driven Research Results Workspace + 24-stage gallery — VERIFIED

O57 fixes the accumulated UI catch-up problem without recreating dozens of bespoke result panels. The existing `ResearchArtifact[]` output stream is converted into a generic pass presentation model with stable domain grouping, verdict/status/validation summaries, search/filter controls, lazy full-report inspection and per-artifact JSON download. The verified O54 package graph is retained as UI state and exposed through a 24-stage visual gallery with ordinary-versus-normalized preview toggles plus the exact coverage and time-aware scene documents. Specialist authoring/editor panels remain separate and unchanged. The O57 model confirms all 65 historical artifacts through O56 are represented and all 24 stages have exact 320×200 ordinary/normalized RGBA payloads. Verdict `MK1_RESEARCH_RESULTS_WORKSPACE_AND_STAGE_GALLERY_ESTABLISHED`.

## Pass 1E.3O.58 — UI coverage / future-pass validation — VERIFIED

O58 independently exercises the same generic presentation builder used by the UI against all 66 prerequisite artifacts through O57, verifies that no artifact is dropped, rechecks the complete 24-stage preview/document model and injects a synthetic future-pass metadata probe. The extra pass appears automatically in the product/UI group with no bespoke registration. Source-level audit also confirms the workspace import/state/render wiring, the O57/O58 ordering, ordinary/normalized stage toggle, per-artifact JSON download and lazy report viewer. The final UI therefore exposes 67 completed result artifacts after O58 is appended through the same generic path. Verdict `MK1_RESEARCH_RESULTS_UI_COVERAGE_AND_DATA_DRIVEN_PRESENTATION_VALIDATED`.

**Pause checkpoint:** O57 + O58 complete the current two-major-verification UI catch-up block. Normal research workflow is **67/67**. O59 has not started. The animation export manifest/browser-package work previously planned for O57/O58 should resume as **O59/O60**.


## Pass 1E.3O.59 — animation export capability/coverage manifest — VERIFIED

O59 converts O18–O26 into a product-facing evidence-tier contract: 9 character contexts, 8 ANITAB families, 739 table cells, 592 indexed-ready image entries, 1,102 lossless decoded descriptors, 2,263 explicit character-context RGBA variants, 21 verified effect RGBA payloads, 79 unresolved cross-resource palette bindings retained indexed-only, and 514 unique streams with structural timing/control metadata. No palette guesses, canonical gameplay names or wall-clock units are introduced. Verdict `MK1_ANIMATION_EXPORT_CAPABILITY_COVERAGE_MANIFEST_ESTABLISHED`.

## Pass 1E.3O.60 — browser animation export package — VERIFIED

O60 materializes the O59 tiers into `MK1_O60_BROWSER_ANIMATION_EXPORT_PACKAGE.zip`: 2,295 entries, including 2,284 PNGs (2,263 character-context + 21 verified effects), one 11,230,148-byte lossless indexed descriptor binary for all 1,102 descriptors, two manifests, seven prerequisite/coverage reports and README. A separate Python decoder/auditor passes 22/22 checks and proves the 79 unresolved descriptors remain indexed while receiving no guessed context-RGBA output. The app retains the bundle and exposes `Download Animation Package`; the Research Results Workspace automatically groups O59/O60 as animation results. Verdict `MK1_BROWSER_ANIMATION_EXPORT_PACKAGE_ESTABLISHED`.

**Pause checkpoint:** O59 + O60 complete the current two-major-verification animation-productization block. Normal research workflow is **69/69**. O61 has not started.


## Pass 1E.3O.61 — in-app browser animation package validation — VERIFIED

O61 independently reads the actual O60 STORE-only ZIP rather than calling the O60 exporter again. It validates entry CRCs and deterministic PNG structure, decodes and checks all 2,263 character-context PNGs plus all 21 verified-effect PNGs, reproduces every one of the 16 O24 palette-context aggregate/sample checksums from decoded RGBA, reconciles all 1,102 indexed descriptor records and index/mask statistics against O18, verifies all seven embedded evidence reports, and proves the exact 79 O25 unresolved cross-resource descriptors are present indexed while receiving zero character-context RGBA assets. Verdict `MK1_BROWSER_ANIMATION_EXPORT_BUNDLE_VALIDATED`.

## Pass 1E.3O.62 — Animation Assets visual workspace — VERIFIED

O62 makes the O60/O61 animation surface inspectable in the existing Research Results Workspace. The new **Animation Assets** tab is paginated and filterable, with 2,263 explicit fighter palette-context variants grouped by character/mode, 21 separately qualified effect assets, and 79 indexed-only unresolved descriptors. Unresolved descriptors are rendered only through a neutral grayscale map of raw one-based pixel indices and are visibly labelled `Palette unresolved` / `not game colour`; no guessed palette is created. The data model exposes 2,363 browsable assets across 9 character identities and 16 explicit palette modes while preserving the distinction between character-context rendering, verified effects and unresolved index data. Verdict `MK1_ANIMATION_ASSETS_VISUAL_WORKSPACE_ESTABLISHED`.

**Pause checkpoint:** O61 + O62 complete the current two-major-verification animation-validation/UI block. Normal research workflow is **71/71**. O63 has not started.


## 2026-10-07 — MK2 O95D runtime-connected lookup/interpreter route census — VERIFIED

O95D authenticates 28 direct O95B lookup -> O95C interpreter routes: 11 Family A and 17 Family B. Twenty-seven routes have adjacent immediate nested indices; one Family-A route keeps a runtime/non-adjacent index. Only the O95C identity-slot-12/index-7 witness currently has fixed numeric identity provenance at the route. The other 27 remain symbolic `Family[object.identity][index]` routes and are deliberately not cross-producted across all identity roots. Qualified contiguous root extents are used only as a boundary marker, not as proof that an identity is runtime-impossible. Independent O95D verification passes 54,335 checks with zero failures. O95E then establishes related-object identity provenance for the dynamic direct wrapper, the delayed Family A/B wrapper encoding, and a second fixed numeric identity animation witness: slot 7 / Family B / index 1 resolves to stream `0xD5D8`, containing six authenticated `RD0.GRA` frame compositions followed by token 0. A separate delayed Family-B call proves index 1 plus a 12-byte entry displacement while preserving numeric identity as unknown. O95E independent verification passes 54,186 checks with zero failures. O95F then adds slot 6 / Family A / index 0 -> seven `ST0.GRA` frames -> token 1 structural loop and qualifies 24 object-identity writes. O95G follows delayed/specialized constant-identity paths and proves two more witnesses: slot 1 / Family B / index 1 -> six `EXPLODE.GRA` standard-composition frames -> token 0, and slot 0 / Family B / index 2 -> five direct `HH2.GRA` descriptors -> token 0 through a distinct consumer. This rejects a universal Family-B stream grammar. MK2 animation closure remains open; this historical next-step note is superseded by O95H at the top of this README, whose current continuation is O95I.

## 2026-10-08 O95N current continuation

O95N closes the former 31-route generic `UNRESOLVED` class to 23 terminal-qualified, 3 strong nonterminal, and 5 structural-only routes. Current coverage: **208/253 terminal-qualified**, **237/253 strong consumer-qualified**, **16/253 without strong qualified consumer**. Next: O95O final 16 held/problematic routes. Research order remains MK2 -> MK1 -> MK3 -> UI/usability discussion -> extractor build.


### O122 indexed stage layer reconstruction (2026-10-11)
Verified 49 original MK2 indexed-sprite streams and 10 setup-local mosaics, including the 320×168 Portal backdrop and Tomb architectural layer. Python and browser RGBA/index/opacity outputs cross-checked; an independent region of Portal control gameplay matched exactly. Select the user-supplied original MK2 directory and open Advanced Research → MK2 original indexed stage sprite layers. The output is not a final stage composite or runtime camera/handle trace. Full React build not validated in the offline environment.
