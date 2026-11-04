# MK DOS Archive — O95L Local-Cursor/Data + Cursor-Stack/State Continuation Qualification

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN

## Scope

O95L addresses exactly the O95H categories `LOCAL_CURSOR_DATA` (**17 routes**) and `CURSOR_STACK_OR_STATE` (**3 routes**), for **20 authenticated Family-A/B lookup callsites total**. The purpose is to follow the selected pointer only as far as the executable proves its use and to distinguish terminal parser/renderer consumption from nonterminal support-data use, conditional paths, and structural cursor/state manipulation.

No fighter names, move names, gameplay roles, wall-clock timing, or whole-stream semantics are inferred from these routes.

## Result

All 20 target routes are classified:

- **10** `TERMINAL_QUALIFIED`
- **4** `CONSUMER_QUALIFIED_NONTERMINAL`
- **2** `CONDITIONAL_CONSUMER_PATH`
- **4** `STRUCTURAL_ONLY`

Conservative coverage therefore becomes:

- strict terminal-qualified: **171 / 253** (O95J baseline 161 + 10)
- strong selected-pointer consumer-qualified: **197 / 253** (O95K baseline 183 + 10 terminal + 4 strong nonterminal)
- no strong qualified selected-pointer consumer: **56 / 253**

The two conditional routes are deliberately **not** counted in the strong consumer-qualified total.

## Qualified terminal routes

Ten routes reach an authenticated parser/renderer without relying on an unresolved control-transfer branch:

- Family A `0x68B5F`: three exact segment skips, secondary cursor `0x75A80`, wrapper `0x64823`, standard interpreter.
- Family A `0x71D4C`: selected cursor reaches dynamic dispatcher `0x6435A`, whose nonzero-token branches are already-qualified `0x86CC5` or `0x63E79` consumers.
- Family A `0x7E3B1`: same authenticated dynamic-dispatch consumer class.
- Family A `0x91829`: same authenticated dynamic-dispatch consumer class after scheduler resume.
- Family B `0x68BD8`: selected cursor is preserved, interpreted from `+4`, restored, and interpreted again by the standard composition interpreter.
- Family B `0x69221`: after two segment skips, exactly six consecutive DWORD pointers are read and passed to direct renderer `0x9377C`; this is a fixed-count direct-descriptor path, not standard-interpreter grammar.
- Family B `0x7A5DC`: selected cursor is preserved, interpreted from `+4`, restored, and interpreted again with scheduler calls between passes.
- Family B `0x67DDA`: original selected cursor is stack-preserved while a secondary path is prepared, then restored into dual standard-interpreter handling.
- Family B `0x7C481`: selected cursor reaches dynamic dispatcher `0x6435A` directly in the bounded loop.
- Family B `0x965A9`: original selected cursor is stack-preserved, immediately consumed by the standard interpreter, later restored and carried into dual wrapper `0x868AE`.

## Strong nonterminal consumers

Four routes have an authenticated selected-pointer or provenance-preserving derivative consumer but are intentionally not counted as terminal:

- Family A `0x68A70`: after two skips, the post-skip cursor is consumed first by related-object helper `0x679F2`; a later secondary standard-interpreter path exists, but a branch can leave before that later consumption.
- Family A `0x83963`: selected-cursor first DWORD is copied to scratch and consumed by object initialization `0x64548 -> 0x64522`; the cursor is retained separately.
- Family A `0x8458A`: same bounded first-DWORD object-initialization pattern.
- Family A `0x950AF`: selected cursor is dereferenced through two pointer levels, field `+0x0C` is consumed by `0x74653/0x746B7`, stored into an indexed runtime table, and its leading word is read. **The semantic resource type remains UNKNOWN.** This support-data consumer does not establish animation grammar.

## Conditional consumer paths

Two routes have a real path to qualified dynamic consumer `0x6435A`, but helper `0x70F30` executes first and contains a bounded `jmp ebx` transfer at `0x70FFB`. O95L therefore refuses to count these as strong consumer-qualified:

- Family A `0x716E1`
- Family A `0x721A4`

The existence of a possible later known consumer is not treated as guaranteed consumption.

## Structural-only routes

Four routes manipulate/read cursor state without a qualified semantic selected-stream consumer in the bounded path:

- Family A `0x63345`: falls directly into segment skipper `0x6334A`; exact cursor navigation only.
- Family A `0x68EAE`: nested selected-pointer field `+0x0C` is read, but cursor `0x75A78` is then replaced and the packed Family-B wrapper overwrites EAX before the local value has a qualified downstream consumer.
- Family A `0x7E629`: helper `0x7E62E` scans the selected cursor to a zero terminator and backs it up by eight bytes; cursor transform only.
- Family A `0x91D3D`: selected cursor address is stored at object `+0x38` and later used as a pointer-distance baseline against current `0x75A78`; no qualified stream-content consumer is established.

## Dynamic consumer helper qualification

Helper `0x6435A` is bounded as a runtime consumer dispatcher. For a nonzero token at selected cursor `0x75A78`, it branches only to:

- direct-descriptor consumer `0x86CC5`, or
- standard composition interpreter `0x63E79`.

This does not mean every caller necessarily reaches the helper; the two conditional routes above are explicitly excluded from the strong count because control can leave first.

## Fixed-count direct renderer path

Family-B route `0x69221` is a distinct grammar:

1. skip two zero-terminated segments;
2. set count global `0x75A70 = 6`;
3. read DWORD pointer from current cursor;
4. advance cursor by four bytes;
5. pass pointer to renderer `0x9377C`;
6. repeat exactly six times.

This must not be forced through the O95C standard interpreter grammar.

## Validation-gate correction caught during implementation

The first O95L TypeScript run failed its own `first_dword_0x83963` machine-code gate. The intended instruction began one byte earlier than the initial check encoded. The check was corrected from `load+7` to `load+6`, and the pass was rerun from scratch. No failed intermediate report was promoted.

A second implementation correction was made before the accepted run: the branch at `0x6930E` is a six-byte `0F 85 rel32` conditional jump, so O95L uses a dedicated relative-JCC decoder rather than a five-byte CALL/JMP decoder.

These were verifier/implementation errors, not changes to the game interpretation.

## Validation

Authentic TypeScript execution against canonical MK2.EXE: **PASS**.

Independent Python verifier:

- **78 checks**
- **0 failures**
- 20 routes reproduced
- 10 terminal-qualified
- 4 strong nonterminal consumer-qualified
- 2 conditional
- 4 structural-only
- strict terminal-qualified after O95L: **171 / 253**
- strong consumer-qualified after O95L: **197 / 253**
- without a strong qualified consumer: **56 / 253**

Regression verifiers O95B through O95K were rerun against the authentic fixture and all reported zero failures. Their accepted counts remain:

- O95B **54,200 / 0**
- O95C **54,199 / 0**
- O95D **54,335 / 0**
- O95E **54,186 / 0**
- O95F **54,213 / 0**
- O95G **54,215 / 0**
- O95H **323 / 0**
- O95I **54,272 / 0**
- O95J **58 / 0**
- O95K **55 / 0**

## Boundaries that remain open

O95L does **not** establish:

- semantics of the support-data pointer installed by `0x74653/0x746B7`;
- semantic meaning of the six-pointer direct-render block at `0x69221` beyond exact renderer consumption;
- whether either conditional route actually reaches `0x6435A` in every relevant runtime path;
- human fighter/move/effect names;
- wall-clock animation timing;
- complete MK2 animation coverage.

The remaining **56 / 253** routes without a strong qualified selected-pointer consumer consist of:

- 15 O95H `SCHEDULER_OR_RESELECT` routes;
- 1 O95H `CURSOR_TRANSFORM_UNRESOLVED` route;
- 31 O95H `UNRESOLVED` routes;
- 3 O95J navigation routes unresolved after cursor replacement;
- 4 O95L structural-only routes;
- 2 O95L conditional routes.

## Next pass

**O95M — scheduler/reselection selected-pointer provenance.**

Start with the 15 O95H `SCHEDULER_OR_RESELECT` routes. Follow the exact selected pointer across scheduler or reselection machinery. Promote a consumer only when pointer provenance survives the handoff. Keep the 31 generic unresolved routes for a later pass rather than mixing them into this one.

The governing project roadmap remains:

**finish MK2 completely -> finish MK1 -> finish MK3 -> discuss UI/usability with the user -> build the extractor.**
