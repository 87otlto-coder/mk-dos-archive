# Spelunk 010 — MK2 source-program export contract and P18 integration hazards

**Date:** 2026-11-17  
**Branch:** `research/spelunk-010-mk2-source-export-contract`, from verified Spelunk 009 HEAD `5974070d0de6c702c98c8d0294c9c1a74d6366bc`.  
**Classification:** **SOURCE-OBSERVED EXISTING IMPLEMENTATION** and **CARRIED VERIFIED STATIC ORIGINAL-SOURCE EVIDENCE**; proposed exporter graph is **INFERRED DESIGN, NOT IMPLEMENTED OR RUNTIME VERIFIED**.

## Extraction-first objective

Turn the nine earlier MK2 spelunks into an exportable program description without a new generic pointer scan, a speculative animation strip, a P91 runtime capture claim, or a UI rebuild. This is a documentation-only architectural research pass; original MK2 bytes were **not reopened or re-tested in Spelunk 010**. The original-file evidence is inherited from the cited exact 001–009 reproducers/ledgers. GitHub was inspected directly, including the committed P18 source; no tests, Windows runs, browser exports or new asset packages were executed here.

## New practical finding: existing P18 is deliberately narrow

Committed `src/core/assets/mk2OrderedSequenceBundlesP18.ts` defines a fixed `TRACKS` array of **eight groups / 57 entries** (43 Tomb/Portal/Tower stage-effect entries and 14 Pit bridge entries). Its producer rejects inputs unless `effectCount === 43 && bridgeCount === 14`; each spec has one fixed list root and `ZERO_TERMINATED` or `ONE_MARKER_BACK_REFERENCE`, with a boolean `sourceLoopBack`. The existing P18 `sequence.json` is a useful faithful **restricted** export, not an extensible program grammar.

**Observed compatibility hazard:** adding newly discovered effects to P18's stage/bridge input arrays can trigger its exact-count refusal. Merely adding new list roots to `TRACKS` would also lose BLOOD's **interior rewind target**, SOUL's phase change, SUCK's nested selector/command records, BANG's signed-X-stopped procedural expansion and original direct-constructor alternatives. It would misrepresent the evidence even if the PNGs export successfully.

**Design decision (INFERRED):** do not rewrite P18, do not relax its gates merely to accept extra input, and do not change its existing ZIP contract. Develop a separate source-program exporter that reuses accepted indexed assets and the existing ZIP serializer, with exact source identity checks and a new manifest version. Add it alongside P18 after independent private fixture regressions.

## Evidence-backed program taxonomy

| Distinct source construct | Existing exact source evidence | Required graph representation |
|---|---|---|
| Ordered descriptor pointer list | P18 eight groups; 003 Armory **12 references/12 unique** and Forest **20/7**; 005 BANG **11 choices, 95 references/93 unique** | Unique sprite nodes with **ordered references** preserving duplicate occurrences and original terminator |
| Finite list / full or interior rewind | 007 BLOOD **18 entries: intro 0–5, rewind 6–17**; **14 entries: intro 0–6, rewind 7–13** | Edge from end marker **to exact entry ordinal**; not merely `loop: true` |
| Entry-point selection into one underlying list | 007 BLOOD table `0x1D028` starts one 12-entry list at ordinals **0,3,5,8** | Selector choices reference entry ordinals; they do not duplicate four resource streams |
| Multi-phase and conditional alternative | 004 SOUL **3-entry rewind phase**, then **14-entry finite phase**; FIRESKEL two conditional six-entry lists | Explicit phase/branch graph; source scheduler arguments kept as evidence, never milliseconds |
| Nested selector and source command records | 006 SUCK **12 slots → nine distinct source groups → 65 unique prefix sprites**; 005 three separate suffix lists (5,5,8) | Selector slots separately reference source group nodes; command records are not ordinary frame pointers |
| Descriptor+signed-coordinate procedural records | 009 BANG `0x1B7DC` group has **6 records, first 5 accepted, sixth X=0 sentinel**, followed by structurally distinct 1-record and 8-record candidates | Record nodes, signed-X sentinel and **conditional eight-call constructor fanout**; do not emit 40 displayed sprites/frames |
| Direct constructor and placement record | 008 BLOOD 25 non-list sprites classified 9+13+3; original four constructor callsites to descriptor seeds; Pit separate paired placements | Explicit constructor edge or placement data, never an implied contiguous animation |
| Palette-source relation | 008 **22** BLOOD and 009 **12** BANG explicit descriptor+12 pointers to Object1 `0x26CC4`; 001/002 scene palette setup/channel selection | Typed source-pointer reference only; **no live bank, per-sprite palette owner or final RGB claim** |

These rows are **construct types**, not additive animation totals. A sprite descriptor may participate in more than one construct, a selector can alias an underlying group, and a valid group without a proved consumer remains only structural.

## Minimal source-safe export graph

Maintain separate record collections rather than polymorphic, overloaded "frame" objects:

1. **`indexedSprites`** — stable identity per game/resource/typed descriptor; original source offset and length, original dimensions, signed descriptor-local coordinates, optional hashes for private indexed/mask sidecars. Never include pixels or original palette words in a GitHub research manifest.
2. **`programs`** — typed `ordered_list`, `phase_chain`, `entry_selector`, `nested_group_selector`, `paired_xy_constructor`, `direct_constructor`; refer to sprite identities via ordered edges, not duplicated artwork.
3. **`conditionsAndControl`** — exact source branch conditions, zero vs one/back-reference and **back-reference target ordinal**, stop sentinels, alternative selector slots, verified consumer/cursor writers and any uncertain branch.
4. **`sourceColourLinks`** — separately typed `Object2 descriptor+12 → Object1 counted record` or source setup/palette-table links. A link records the original relocation-backed relation, **not** runtime DAC assignment.
5. **`runtimeObservations`** — optional, initially **absent/null**: reached selector, actual presented order/dwell, loaded object positions, palette handles, DAC bank contents, final framebuffer parity and occlusion. Only populate from independently accepted native capture.

Every address must carry an explicit `addressSpace`: `exe_physical`, `object1` or `object2`. Numeric equality across spaces is **not** a pointer identity. Every proposed public program records its input SHA-256 provenance, original-code consumer classification and supporting research/validation record. Keep `VERIFIED_STATIC` distinct from `VERIFIED_RUNTIME`, `STRUCTURAL_ONLY`, `INFERRED_DESIGN` and `VALIDATION_PENDING`.

**Proposed output names (not implemented):** `source_programs.json` for the source graph, `indexed/` per unique verified source sprite and `assets/` optional diagnostic preview. Conventional timing-based APNG/GIF should be **user-timed/diagnostic** unless a witnessed native timeline is independently verified.

## Non-obvious refusal rules that protect correctness

- Reject a `program` pointing to nonexistent sprite nodes or a rewind target outside that same original list. Preserve repeated reference ordinals even if they resolve to one source sprite.
- Reject source resource/hash mismatches, incomplete compressed-range identities, wrong LE address-space conversions or original EXE source identity. Exact source coverage and typed links are separate gates.
- Do not automatically create timed animation tracks from structurally valid but consumer-unknown BLOOD roots **`0x1D010,0x1D1D0,0x1D1F0,0x1D22C,0x1D2E0`** or BANG's later **`0x1B810,0x1B81C`** coordinate groups.
- Do not map the 12 SUCK selector slots to 12 new unique sprite streams: slots 4/5 alias one group and slots 8/9/10 alias another.
- A source call fanout is a number of possible constructor callsites under source control, **not an observed number of allocations or presented pixels**.
- Original palette-source pointer count is **not** a palette-count, DAC-width, DAC-bank or per-frame color assignment. Missing runtime evidence stays unknown.
- Keep P18's original **eight-group / 57-entry** ZIP/Asset Library output byte-identical; new exports are additive and separately versioned.

## Separate P91 research aid from pinned upstream source

Upstream DOSBox-X `029bd65c5dcc7cdc7f2e14e35278620d9707d969` ships `README.video-debug-overlay.md`, which documents **RPAL** as raw VGA DAC state, **EPAL/CSPAL** as presentation-related palette information, displays **DAC width 6/8**, and exposes **PEL mask (PMxx)** and horizontal panning. [Pinned source document](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/README.video-debug-overlay.md).

**HYPOTHESIS / independent diagnostic candidate:** if the exact pinned tool's overlay can be enabled during the same original MK2 scene without invalidating capture provenance, its palette/mask annotations may independently corroborate P91 palette and scanout interpretation. **Not an accepted capture, not a synchronized palette-file oracle, not evidence of native timing**; no claim that a particular distributed Windows binary exposes the feature or that overlay activation was tested. Do not replace P91's four-phase raw native packet with screenshot-derived state.

## Validation plan (NOT YET EXECUTED for Spelunk 010)

1. **Source-only contract controls:** one finite list, full rewind, interior rewind, repeated descriptors, alternate list entry, nested aliases, sentinel-stopped coordinate records, one failed consumer, two address spaces, and no palette ownership. Reject malformed references, forged runtime fields and invented FPS.
2. **Private exact-input bridge:** run 003–009 committed reproducers on canonical untouched original `mk2.zip`, reconcile their output identities, and build the graph in memory. For BANG/SUCK/BLOOD specifically check unique-stream corpus and exact resource byte partitions remain 101/83/178, with repeat/alias preservation.
3. **P18 no-regression:** reproduce 57 source-index/mask frames and eight existing ZIP manifests unchanged. Test additive new program artifacts separately; do not broaden P18 input count without redesign.
4. **Runtime boundary:** P91's source-only/portable observer build is not an original MK2 Tomb runtime packet. Native timing, scene placement, palette allocation and viewport parity remain independently **VALIDATION PENDING**.

## Decision and next action

This design study closes the question **"can verified stage/effect frames all be represented as a flat FPS animation?"** with a source-backed **NO**. Use the seven source construct families above as a practical, bounded exporter contract, then implement the smallest no-UI headless adapter that makes a selected source program inspectable/exportable. First adapters: Armory/Forest ordinary lists and BLOOD's verified interior-rewind lists; handle SUCK nested commands and BANG procedural fanout as distinct later adapters rather than forcing them into P18. Do not start another broad MK2 binary scan until there is a specific extraction gap.

**No tests, original game runs, app edits, release or runtime captures were completed in this pass; only source/document inspection and research preservation.** Commercial files, indexed planes, graphics, sounds and palette words remain private in `F:\Dev\MKEXT\FIXTURES\`. P18, P90, P91 and stable branches are unchanged.
