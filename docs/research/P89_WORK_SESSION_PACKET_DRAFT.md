# P89 Deep Research — work-session packet (PREPARATION DRAFT)

**Status:** DRAFT before P88 original-Windows acceptance. No P89 original tests or new decoder are claimed. Finalize on a separate P89 branch after P88 is accepted. This packet reduces Work mode usage by pointing to existing qualified research and defining exact questions, tests, results and stop conditions.

**Authoritative base:** `87otlto-coder/mk-dos-archive`, accepted interim branch `interim/p83-mk2-stage-library`, P87 merged at `87694e9`, P88 [draft PR #29](https://github.com/87otlto-coder/mk-dos-archive/pull/29). Verify current P88 accepted head at session start; do not treat this draft commit as a completed P88 checkpoint. Local workspace: `F:\Dev\MKEXT\SOURCE` code, `TOOLS` utilities, `FIXTURES` commercial originals and private generated evidence.

## Session governing question

What reusable, source-backed relationships most directly increase **usable extraction, preview, reconstruction or export** across original DOS MK1/MK2/MK3? Prioritize new native indexed source material and playable/presentable source-backed sequences. Avoid gameplay, damage/collision, input controls and open-ended executable archaeology.

**Research order:** R1 MK3 leading raw continuation content → R2 MK1 ANITAB source graph → R3 MK2 stages → R4 palette ownership targeted to a blocked asset → R5 audio associations only if R1–R4 stall. Complete one source family before transferring conclusions to another.

**Do not re-derive accepted facts.** Source and observation records below are starting preconditions, not conclusions of this session.

## R1 — MK3 P79 continuation records (highest estimated new image coverage)

**Known/verified:** `docs/EXTRACTOR_P79_MK3_LEADING_SPAN.md`, `scripts/mk3_p79_leading_span.py`, `scripts/verify_mk3_p79_leading_span.py`. Canonical `DATA.MK3` SHA256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`. P79 interval [667866,2508500), first 320×200 index plane (64,000 bytes) and **216 additional RAW records** tagged 3, six empty records 120–125, 14-byte headers, 1,772,828 source payload bytes. The two additional 32-bit record fields are **UNKNOWN**. These 216 raw continuation entries are **not** the distinct **216 already-decoded P77 chained image records** in 19 other source regions.

**Hypotheses to test, not assert:** per-record compressed visual deltas; independent raster records; control/metadata blocks; mixed record types.

**Preparation tests:**
- Immutable source audit: independent raw-byte interval walk, count, header/source-offset/tags, sizes and all-zero empty records, cumulative SHA and no overlap/gap.
- Structural feature inventory per raw record: first/last bytes, tags, length, field-A/B distributions, minimum/maximum, inferred bounds, deterministic entropy/signature and cross-record comparisons; do **not** identify compression solely from entropy or string resemblance.
- For each candidate decoder: sandboxed bounds checks, deterministic index/paint mask, full consumed-byte accounting, original source roundtrip where possible, altered-header/length/row-pointer negative controls.
- Independent verifier must NOT import candidate codec and must compare source bytes and every emitted index pixel.
- Discriminating runtime evidence if needed: unmodified DOS capture or controlled reversible source edit with original-DOS reproducibility and input/output SHA. No game binary or derived raster to GitHub.

**Pass:** novel decoder independently reconstructs at least one original-source-backed raster, with repeatable original byte/plane verification; any broader record-family claim requires independent examples. Otherwise, valid negative classification and clearly bounded remaining structures. **Not a pass:** 216 invented animation frames or palette ownership from adjacent RGB bytes.

## R2 — MK1 original ANITAB to inspectable animation relationships

**Known/verified:** `docs/EXTRACTOR_P65_MK1_ANITAB_INDEXED_STREAMS.md`, `src/core/assets/mk1AnitabIndexedStreamsP65.ts`, `scripts/verify-mk1-p65-anitab-streams.cjs`; 8 tables, 739 entries, 514 unique original stream starts, 1,824 source frame events, 786 control events, 1,102 descriptor records, 1,853 frame-part occurrences. P88 preview source sidecars/diagnostic PNGs, when accepted, are the visual inspection surface.

**Hypotheses to test:** a bounded subset of source streams can be traversed deterministically for a *source-graph preview*; control instructions/loop endpoints may require runtime state not available statically.

**Preparation tests:**
- Recheck P65 original pointer/opcode readback against the canonical `MK1.EXE`; enumerated source graph table/edge/target/descriptor relationships must have zero unresolved source references in the qualified corpus.
- Parse every source event into typed graph nodes/edges. Detect cycles, conditional alternatives, nontermination and source-instruction encounter order. Distinguish deterministic static paths from runtime-dependent traversal.
- Create **illustrative source-graph previews only** where path constraints are explicit; preserve part vectors individually with original X/Y and masks, avoiding invented compositor Z order or native timings.
- Test source iteration against independent original executable pointers and selected P88 PNG/index planes; negative controls: swapped descriptor keys, illegal jump destinations, wrong table/character palette, infinite traversal and invented milliseconds.
- Test selected character palette context only through `src/games/mk1/research/animationPaletteContextBridge.ts` and separately qualified selector evidence, never from ANITAB symbol alone.

**Pass:** verified source graph and reusable per-stream descriptor presentation with explicit conditional/loop uncertainty. **Not a pass:** native play-speed, clip names, universal painter order or palette attribution without runtime proof.

## R3 — MK2 Tomb/Portal accurate source-stage composition

**Known/verified:** `docs/EXTRACTOR_P82_MK2_NATIVE_STAGE_PACK.md`, `scripts/export-mk2-p82-native-stage-pack.py`, `scripts/verify-mk2-p82-native-stage-independent.py`, `docs/EXTRACTOR_P83_MK2_STAGE_LIBRARY_CANDIDATE.md`. Tomb and Portal original 896-column floor source planes, 29 standalone native source streams, eight setup-local layer mosaics, 115 independently verified PNG source files / 939,425 source index positions. P83 actual Chrome optional import and three byte-exact downloads accepted.

**Hypotheses to test:** identified source-local position/visibility rules can explain a bounded part of the final screen; different stage setups may differ. A flattened 896-wide panorama is not a verified runtime camera view.

**Preparation tests:**
- Source SHA, layer extent, source placements, source mask parity, and independent readback against existing P82 ZIP. Reject mutated geometry/mask/offset.
- For each proposed composite, produce a manifest of contributing source layers, explicit X/Y transform, crop, mask rule, visible pixels and source confidence; layer order unknown until separately witnessed.
- Compare unmodified capture condition/source camera position to projected original indexed/colour pixels, count exact matches, contested overlaps and occluded/unobservable positions. Preserve screenshots and derived scene privately.
- Repeat a successfully evidenced rule independently for Tomb and Portal before generalizing. Falsify incorrect Z order/camera/palette through alternatives, not visual plausibility.

**Pass:** bounded, reproducible source-to-scene composition with independently verified pixels and placement confidence. **Not a pass:** full gameplay stage/pan/animation merely from matching native sprite dimensions.

## R4 — Palette ownership (only for a demonstrable export blocker)

**Known/verified:** MK1 O20 character identity co-selects animation/palette context, but ANITAB alone is insufficient. `src/games/mk1/research/animationPaletteContextBridge.ts`, `docs/EXTRACTOR_P58_MK2_COLOUR_EVIDENCE_COMPARISONS.md`, and MK3 P72/P73 candidate/CMAP records distinguish native palette ownership from source adjacency and screenshot colour witnesses.

**Tests:** trace original selector→specific source palette→specific indexed asset with explicit runtime/character/variant state; compare against original unmodified capture/controlled byte edit and independent holdout. Reject general-palette inference from filenames, adjacent RGB8, table proximity, or attractive appearance. Output asset+context evidence mapping only if verified.

**Pass:** a conditioned, source- and runtime-evidenced colour assignment; otherwise preserve diagnostic grayscale or candidate variant labels.

## R5 — Audio linkage (lower priority; probe only if evidence allows)

**Known/verified:** P62 244 MK1 WAVs with source/provenance; P63 1,024 MK3 WAV records; P64 33 MK2 scores/212 source streams; P70 46 original CUE-linked OGG tracks. Source filenames and score tables are not equivalent to gameplay event identities.

**Tests:** bounded original executable references to source audio records, independently reconstructed reference paths and at least one witness where needed. No audio transcoding or new sound codec investigation unless a specific completeness gap is demonstrated.

## Preflight design (prepare in P89 before Work execution)

One source-only Python 3.11+ runner should:
1. Print exact Git HEAD/tree, dirty tracked file status, branch and command versions. Fail on missing dependency or dirty source; don't silently change branch.
2. Verify scripts and SHA pins of the three canonical commercial original inputs *only if private files are present*. Record a fixture-availability matrix; absence is **UNAVAILABLE**, never PASS.
3. Verify `F:\Dev\MKEXT\SOURCE`/`TOOLS`/`FIXTURES` separation. Reject writes to original game installation and to source checkout. Produce reports in a **new** `FIXTURES\VALIDATION\P89-<unique>` folder.
4. Run synthetic negative controls first. Enable original-source probes only when explicitly supplied; do not attempt raw fixture uploads, GitHub Actions artifacts containing original data or screenshot captures.
5. Record each research claim with `observation`, `evidenceRefs`, `sourceSha256`, `independentTest`, `classification` (VERIFIED/INFERRED/HYPOTHESIS/UNKNOWN/VALIDATION PENDING), and `extractorImpact`.

**Work acceptance:** original fixture access or reproducible private fixture report; preflight complete; at least one independently checked new extraction capability *or* a well-supported negative blocker and reprioritization; no source changes merged without synthetic and original acceptance appropriate to scope. Preserve old workbench and all historical evidence. Return an implementation-ready P90 handoff.

## Stop conditions and usage discipline

- Do not spend time searching already audited O95/O110 MK2 animation and palette regions unless a **specific** testable blocker references them.
- Work performs one bounded hypothesis at a time. On unsupported or ambiguous evidence, record it and move on; don't invent frame count, palette owner, native timings or scene ordering.
- Do not rebuild an independent codec where a verified source decoder already exists.
- Keep candidate implementations in separate commits from research observation reports. Original media remains private, CI is Windows-only with synthetic data, browser artifacts opt-in, protected P77/P78/P80 source kits retained.
- No automatic `main`/`develop` promotion; P91 scheduled for the next five-pass consolidation review.

## Preparation deliverables before consuming a Work session

- [ ] P88 accepted original Windows source PNG test and merged interim branch.
- [ ] A dedicated P89 branch, exact source identity, this packet reconciled to latest accepted code.
- [ ] P89 read-only preflight executable and synthetic refusal controls committed and Windows-CI green.
- [ ] R1–R3 original-binary probe entry points committed with `--help`, pure structure readback, deterministic output and explicit unresolved fields.
- [ ] Independent validators for any proposed new codec, source-graph sequence or stage composition.
- [ ] One PowerShell launcher starting with `Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext'`, all private outputs under `FIXTURES\VALIDATION`, no prompt or per-suite intervention.
- [ ] One Work task pointing at this packet; Work executes and interprets rather than rebuilding the harness.
