# MK DOS Archive — O95M Scheduler/Reselection Selected-Pointer Provenance

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN

## Scope

O95M addresses exactly the **15** O95H routes classified `SCHEDULER_OR_RESELECT`. The question is narrow: after Family A/B selects a pointer into global cursor `0x75A78`, does that exact selected pointer (or an explicit `+4` derivative) survive scheduler/reselection machinery into an already-qualified consumer?

The 31 O95H generic `UNRESOLVED` routes are intentionally excluded from this pass. No fighter names, move/effect names, gameplay roles, or wall-clock timing are inferred.

## Result

All 15 target routes are classified:

- **14** `TERMINAL_QUALIFIED`
- **1** `STRUCTURAL_ONLY` because the original selected cursor is explicitly overwritten by a new packed Family-B selection before any qualified consumer is established.

Coverage therefore advances from the O95L boundary:

- strict terminal-qualified: **185 / 253** (171 + 14)
- strong selected-pointer consumer-qualified: **211 / 253** (197 + 14)
- without any strong qualified consumer: **42 / 253**

The remaining 42 are exactly:

- 31 O95H `UNRESOLVED` routes;
- 1 O95H `CURSOR_TRANSFORM_UNRESOLVED` route;
- 3 O95J routes unresolved after cursor replacement;
- 4 O95L structural-only routes;
- 2 O95L conditional routes;
- 1 O95M reselection-overwrite route (`0x699EA`).

## Scheduler provenance contract

Process-yield routine `0x6710F` preserves the selected cursor as process state:

- `0x67131` reads global `0x75A78`;
- `0x67137` stores it to process field `[ESI+0x14]`;
- on resume, `0x67178` reloads `[ESI+0x14]`;
- `0x6717B` restores global `0x75A78`.

This is a bounded provenance result: process yield/restore does not by itself destroy the selected-pointer relationship.

Dynamic consumer `0x6435A` reads the current selected cursor and, for a nonzero first token, dispatches only to already-qualified consumer families:

- specialized direct-descriptor consumer `0x86CC5`; or
- standard composition interpreter `0x63E79`.

O95M therefore treats arrival at `0x6435A` with preserved cursor provenance as terminal-qualified for the selected-pointer relationship. This does **not** imply one universal downstream stream grammar; O95G/O95H already prove consumer heterogeneity.

## Scheduler wrapper contract

Wrapper entries `0x63936` and `0x6394C` preserve an authenticated selected pointer across scheduling by using bit 31 as a temporary marker:

1. OR bit 31 into `0x75A78`;
2. signed-test the marked cursor and skip the wrapper's nested reselection block;
3. clear bit 31 with mask `0x7FFFFFFF`;
4. yield through `0x6710F`;
5. later enter dynamic consumer `0x6435A`.

Entry `0x63936` also zeros callback global `0x75A70` itself.

Entry `0x6394C` does not zero that callback, so O95M separately authenticates that all four target callers entering `0x6394C` explicitly set `0x75A70 = 0` before selection:

- route `0x7159E`: zero at `0x7158A`;
- route `0x73ECB`: zero at `0x73EA6`;
- route `0x73FBB`: zero at `0x73F96`;
- route `0x77D2B`: zero at `0x77D06`.

Thus no unknown optional callback is introduced on these bounded routes before selected-pointer consumption.

## Six direct yield → dynamic-consumer routes

The selected cursor survives an explicit `0x6710F` yield and later reaches `0x6435A`:

- Family A `0x69005` — cursor delta 0;
- Family A `0x7BA84` — explicit selected-cursor `+4` derivative;
- Family A `0x7ECFB` — cursor delta 0; bounded intervening helpers audited for no `0x75A78` reference;
- Family A `0x83B25` — cursor delta 0;
- Family A `0x94BA9` — cursor delta 0;
- Family B `0x7CA42` — cursor delta 0.

For route `0x7ECFB`, bounded helpers `0x63198`, `0x640DF..0x642C4`, `0x642C5`, and `0x63370` were explicitly checked for absence of direct `0x75A78` references before the cursor reaches `0x6435A`.

## Eight scheduler-wrapper → dynamic-consumer routes

These reach `0x63936` or `0x6394C`, preserve the selected pointer through the authenticated wrapper contract, and later reach `0x6435A`:

- Family A `0x7159E` — wrapper entry `0x6394C`, delta 0;
- Family A `0x73ECB` — `0x6394C`, delta 0;
- Family A `0x73FBB` — `0x6394C`, delta 0;
- Family A `0x77D2B` — `0x6394C`, delta 0;
- Family A `0x7BBEB` — `0x63936`, explicit `+4` derivative;
- Family A `0x7BEE8` — `0x63936`, explicit `+4` derivative;
- Family A `0x7CDE8` — `0x63936`, explicit `+4` derivative;
- Family B `0x9530F` — `0x63936`, delta 0.

The `+4` routes are qualified as provenance-preserving derivatives of the selected cursor, not as a semantic “next frame” claim.

## One rejected/original-pointer-overwritten route

Family-A route `0x699EA` is deliberately **not** consumer-qualified.

After selection, bounded helper calls at `0x69A04`, `0x69A0D`, and `0x69A20` do not establish consumption of the selected cursor. O95M audits their bounded bodies for no direct `0x75A78` reference. Then:

- `0x69A25` explicitly writes `0x00040001` to `0x75A78`;
- `0x69A39` transfers to packed Family-B wrapper `0x63B4B`.

Therefore any later Family-B consumption belongs to the **new** reselection, not the original Family-A selected pointer. O95M preserves the original route as structural-only.

## Machine-code hashes used by the pass

- scheduler/yield `0x6710F`, length `0x7A`: `60209e25a96a3f93ff84ef4482e2665d32aca825337569d57290708870335c5f`
- dynamic consumer `0x6435A`, length `0x34`: `51be30b495b2193ae81758d17162fe22011a2edbd4808b84548de5f91b79a3a2`
- scheduler wrapper `0x63936`, length `0xD6`: `5078f7cd709dc90787c6103f49dbedaa146b925fcc334eda5d4b93bc633fa538`
- helper `0x63198`, length `0x21`: `0d4c088b488f7205c8994fecf99fe77b4a1bfd2fe34be497901b9cd1b17f2016`
- helper `0x642C5`, length `0x3D`: `df987ddab5c2ab05fe2cad54c551a52d7308ba78b18bb5a2fef30d71036b885d`
- helper `0x63370`, length `0x18`: `d0011e38b3e450a5a66109ab59764301d302548d4e9ccf2a8b4d713b339538fe`

These hashes authenticate bounded machine-code slices; they do not by themselves assign higher-level semantics.

## Validation

Authentic TypeScript execution against canonical MK2 fixture: **PASS**.

Independent Python verifier:

- **75 checks**
- **0 failures**
- 15 routes reproduced
- 14 new terminal-qualified routes
- 1 reselection-overwrite structural-only route
- strict terminal-qualified after O95M: **185 / 253**
- strong consumer-qualified after O95M: **211 / 253**
- without strong qualified consumer: **42 / 253**

Fresh regression runs on O95H–O95L remain clean:

- O95H **323 / 0**
- O95I **54,272 / 0**
- O95J **58 / 0**
- O95K **55 / 0**
- O95L **78 / 0**

Earlier O95B–G accepted regression counts remain part of the preceding checkpoints and are not weakened by O95M.

## Boundaries that remain open

O95M does **not** establish:

- human fighter/move/effect names;
- wall-clock animation timing;
- semantic meaning of scheduler arguments;
- semantic meaning of a `+4` cursor derivative beyond exact byte displacement;
- semantics of the newly selected Family-B stream after `0x699EA` overwrites the original cursor;
- the 31 generic O95H unresolved routes;
- complete animation coverage or MK2 research closure.

## Next pass

**O95N — generic unresolved-route continuation census.**

Start with only the **31** O95H `UNRESOLVED` routes. Do not mix the held O95H transform route, the three O95J cursor-replaced routes, the four O95L structural-only routes, the two O95L conditional routes, or the O95M reselection-overwrite route into the first O95N census unless executable data flow naturally joins them later.

The governing project roadmap remains:

**finish MK2 completely -> finish MK1 -> finish MK3 -> discuss UI/usability with the user -> build the extractor.**
