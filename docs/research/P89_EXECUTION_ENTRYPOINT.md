# P89 — Work mode execution entry point and test inventory

**Status: preparation candidate; source-only Windows acceptance and original-private research execution must be checked independently.** No new MK3 image decoder, MK1 native playback reconstruction, MK2 full stage scene, runtime palette or audio event association is claimed here.

Repository: `87otlto-coder/mk-dos-archive`  
Review branch: `research/p89-extraction-unknowns`  
Accepted base: P88 interim merge `97d67a14b2bd6c854d3e749247226ab1d5023f1a`  
Foundational plan: [P89 Work Session Packet Draft](P89_WORK_SESSION_PACKET_DRAFT.md)  
No `main` or `develop` changes. P91 remains the fifth-pass consolidation target.

## Prepared tests (read-only evidence, no speculative decoding)

| Suite | Entry point | Existing accepted original oracle | Research output | Forbidden claim |
| --- | --- | --- | --- | --- |
| Preflight | `scripts/research/p89/preflight.py` | SHA pins for MK1.EXE, MK2 EXE/three GRA, MK3 EXE/DATA.MK3 | commit/tree, clean checkout, tool versions, exact fixture availability | original files checked when unavailable |
| R1 MK3 | `scripts/research/p89/structures.py r1` | `scripts/verify_mk3_p79_leading_span.py` | 216 raw record headers, lengths, source offsets, field-A/B, SHA256, zero fractions and entropy estimates | 216 decoded frames / known compression / native palette |
| R2 MK1 | `scripts/research/p89/structures.py r2` | `scripts/mkext.py verify --game mk1` → existing P87/P65 original byte oracle | 8 ANITAB source graphs, stream events, control kinds, descriptor links/parts | actual play order, milliseconds, native Z order |
| R3 MK2 | `scripts/research/p89/structures.py r3` | `scripts/verify-mk2-p82-native-stage-independent.py` | Tomb/Portal native source layer dimensions, counts, source hashes and unknown placement fields | final scene, camera, parallax, layer order |

**Critical R1 distinction:** P79's 216 **undecoded raw continuation records** are a different source family from the P77/P78 **216 already decoded images**. Do not repeat P77 or label P79 records as native frames. The six zero-length P79 records 120–125 are preserved.

**Source-only negative tests:** `python scripts/research/p89/test_structures.py` (20 original-free cases). Windows Actions runs those tests, Python syntax, PowerShell launcher parse and all inherited source regressions/Vite/TypeScript/Chrome smoke. A green hosted result does **not** establish any original DOS test or new format claim.

## The single private Windows launcher

All source is under `F:\Dev\MKEXT\SOURCE\mkdosext`; private originals and outputs remain under `F:\Dev\MKEXT\FIXTURES`. The launcher expects the previously accepted private P87 ZIP, original DOS MK1/MK2/MK3 installations, Python 3.11+, Node and Pillow.

```powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext'
pwsh -NoProfile -File '.\scripts\research\p89\launch_private_windows.ps1'
```

The launcher safely fetches and fast-forward-switches to the **P89 research branch**, prints Git HEAD/tree, runs the 20 synthetic tests, verifies exact original file hashes and existing source archive identities, creates *new* P79/P82 private ZIPs, then runs R1–R3 structural probes against them with the existing independently qualified original-source verifiers. It never edits the original game files or overwrites previous validation output.

The new private `FIXTURES\VALIDATION\P89-<unique>` folder contains:

- `preflight.json` — Git identity and original-input SHA checks.
- `p79-source.zip` — private original-source P79 record preservation (do not upload).
- `p82-source.zip` — private original-source P82 stage PNGs (do not upload).
- `r1-mk3-raw-records.json` — numeric structural evidence only.
- `r2-mk1-source-graph.json` — numeric graph, event and descriptor evidence only.
- `r3-mk2-stage-layers.json` — source stage-layer metadata only.

Only the **four JSON reports** are suitable for a subsequent research handoff after verifying that they contain no copyrighted source payload or personal paths that should remain private. Never upload the two original-derived ZIPs, commercial executables, original sound files or screenshots.

## Work mode execution contract

1. Read this file, the foundational P89 packet, P88 accepted source handoff and relevant P79/P65/P82 records. No broad repository audit.
2. Verify current PR head and successful Windows source CI. If executing on local Windows with access to `F:\Dev\MKEXT\FIXTURES`, run the private launcher. If private game files are inaccessible, run **source-only** tests and inspect provided reports; do **not** claim original source execution or spend effort repeatedly hunting for private files.
3. Investigate in order: R1 novel P79 continuation payload grammar; R2 source graph to bounded visual sequencing; R3 source layer to bounded real scene composition. R4 targeted palette proof and R5 audio identity only where a specific extraction blocker justifies them.
4. Any *new* decoder or composition candidate requires its **own independently authored original-byte/index/mask and adversarial verifier**. A structural inventory pass is not proof of a new interpretation. Report unknowns honestly.
5. Stop when repeated hypotheses cannot discriminate with available evidence; record offsets, hashes, rejected interpretations and the next necessary reproducible witness. No gameplay reverse-engineering drift.
6. Deliver an implementation-ready P90 handoff: new verified source mechanism or clearly falsified blocker, exact evidence and confidence per claim, tests/repro instructions, targeted extractor change, and separate source/fixture/real-browser validation status.

Research results may commit only safe source code and nonmedia evidence manifests. Do not generate unnecessary heavy Actions artifacts, run Windows CI only, preserve protected P77/P78/P80 source kits and avoid large browser builds unless specifically needed. Existing workbench, P86/P87/P88 accepted source and private originals remain unchanged.

## Acceptance checklist

- [ ] Source-only hosted Windows tests pass on exact P89 source.
- [ ] Private original P89 preflight and R1/R2/R3 structural evidence accepted on exact source/tree, or original unavailability explicitly documented.
- [ ] Work tests discriminating R1/R2/R3 hypotheses with original-source independent validation and no unsupported runtime claims.
- [ ] P90 implementation handoff ready; P89 branch retained until accepted and consolidated appropriately.
