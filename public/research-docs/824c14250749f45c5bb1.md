# MK DOS Archive — O95I nonstandard selected-pointer consumer grammar expansion

Date: 2026-10-08 (SAST)

## Status

**VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN**

O95I refines the three nonstandard selected-pointer areas bounded by O95H: the `0x6334A` DWORD walker, the single reverse-DWORD consumer route, and the specialized direct-descriptor consumer. It corrects one O95H classification without weakening any earlier machine evidence.

Machine verdict:

`MK2_O95I_NONSTANDARD_CONSUMERS_REFINED_SEGMENT_SKIP_REVERSE_COMPOSITION_SEQUENCE_AND_SPECIALIZED_TOKEN_CLASSES`

## 1. O95H correction — `0x6334A` is navigation, not a final consumer

O95H grouped 23 Family-A/B lookup routes under a zero-terminated DWORD “consumer” and included them in its count of 164 qualified final-consumer routes.

O95I authenticates the helper itself:

- physical `0x6334A`;
- shared cursor global `0x75A78`;
- read one DWORD at the cursor;
- advance the cursor by four bytes;
- repeat while the value is nonzero;
- return only after the zero terminator has been consumed.

Therefore each invocation leaves `0x75A78` at the **first DWORD after one zero-terminated segment**.

Across the 23 lookup routes previously assigned to this helper:

- Family A routes: **1**;
- Family B routes: **22**;
- immediate helper invocations: **36** total;
- 13 routes skip **1** segment;
- 7 routes skip **2** segments;
- 3 routes skip **3** segments.

Many of these paths then enter the standard O95C composition interpreter or another already-bounded state/consumer path. The helper is therefore a **segment skipper / cursor-navigation primitive**, not a standalone resource grammar.

**Correction:** O95H's wording “164 qualified final-consumer routes” is superseded. At the O95H category boundary, 141 routes had a genuinely terminal qualified consumer (138 standard + 1 reverse + 2 specialized), while the 23 walker routes are navigation routes whose downstream final semantics must be classified separately. O95H's exact 253-call partition remains mechanically correct; only the “final consumer” label for this category was too strong.

## 2. Family-A index-5 reverse sequence

The sole reverse route is authenticated at:

- nested index write `5` at physical `0x922D2`;
- Family-A lookup call `0x922DC`;
- caller scheduler argument `EAX=2` at `0x922E1`;
- tail jump to reverse consumer `0x8684E` at `0x922F7`.

Numeric runtime identity at this route remains **UNKNOWN**.

The reverse consumer:

1. scans forward to the trailing zero;
2. backs up one DWORD;
3. writes each payload value to object field `+0x42`;
4. invokes scheduler `0x6710F` with the saved caller argument;
5. continues backward until it reaches the zero immediately before the selected sequence.

The standard composition builder at `0x640DF` also writes its active composition pointer to object `+0x42`, establishing that this is the same structural object field. No wall-clock meaning is assigned to the caller value `2`.

### 2.1 Root-variant structural census

Family A has 11 unique qualified roots. For **all 11** roots, index 5 resolves to a sequence with:

- a zero DWORD immediately before the selected pointer;
- a zero terminator after the payload.

Payload-length distribution:

- **9** root variants contain 3 payload DWORDs;
- **1** contains 5;
- **1** contains 7.

Across those variants:

- **37** payload DWORDs are relocation-backed pointers to one-part composition arrays;
- each of those arrays is `[O69-qualified 12-byte descriptor pointer, 0]`;
- raw value **5** occurs in only the slot-12 and slot-13 root variants.

The meaning of raw value `5` in this reverse path remains **UNKNOWN**. It must not be assigned the O95C token-5 meaning merely because the numeric value matches; this consumer has different machine behavior.

## 3. Specialized direct-descriptor consumer refinement

O95H's second specialized route remains:

`Family B[current EDI object identity][2] -> 0x86C99/0x86CC5`

Specifically:

- index `2` is written at `0x68C95`;
- Family-B lookup call is `0x68C9F`;
- tail jump to specialized loop `0x86C99` occurs at `0x68CE0`;
- Family-B lookup itself reads identity from `[EDI+0x46]`.

No bounded numeric identity write reaches this route without intervening provenance ambiguity, so the identity remains **symbolic**. No cross-product against all 17 roots is promoted as runtime execution evidence.

### 3.1 Bounded token classes at `0x86CC5`

The specialized consumer now has these machine-qualified classes:

- if `token & 0xFFF00000 != 0`, the token is passed to direct descriptor renderer `0x9377C`;
- tokens with upper 16 bits `0x0002` update low state bits in global `0x75A68` before the next token is examined; gameplay meaning is not assigned;
- token `0` returns with carry set, terminating wrapper `0x86C99`;
- token `1` redirects the shared cursor using the DWORD at original token address `+8`; the intervening DWORD at `+4` is not semantically assigned by O95I;
- other low tokens return with carry clear without being promoted to descriptor/render semantics.

This is a bounded consumer grammar, not a claim that every Family-B index-2 stream has the same shape.

## 4. New implementation/evidence

Added:

- `src/games/mk2/research/animationNonstandardConsumerGrammarExpansion.ts`
- `scripts/run-mk2-animation-nonstandard-consumer-grammar-expansion.mjs`
- `scripts/verify-mk2-o95i-animation-nonstandard-consumer-grammar-expansion.py`
- `mk2_animation_nonstandard_consumer_grammar_expansion_o95i_2026-10-08.json`
- package smoke command `smoke:mk2-animation-nonstandard-consumer-grammar`

## 5. Validation

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent O95I verifier: **54,272 checks / 0 failures**. It independently reconstructs the LE fixups, the 23 lookup->skipper routes, all 11 unique Family-A index-5 variants, their composition-pointer payloads, and the specialized consumer code classes.

Regression gates remain clean:

- O95B: **54,200 / 0 failures**
- O95C: **54,199 / 0 failures**
- O95D: **54,335 / 0 failures**
- O95E: **54,186 / 0 failures**
- O95F: **54,213 / 0 failures**
- O95G: **54,215 / 0 failures**
- O95H: **323 / 0 failures**

## 6. Boundary / closure status

O95I does **not** establish:

- numeric identity for the reverse route;
- semantic meaning of reverse-path raw value `5`;
- wall-clock meaning of scheduler argument `2`;
- numeric identity for the second specialized route;
- semantic meaning of the `0x0002xxxx` specialized state bits;
- final downstream consumer classification for every segment-skip route;
- complete animation coverage, timing or human move names.

All O95A non-animation blockers remain open: stages/backgrounds/dynamics, eight unqualified palette slots, final relevance classification of non-exact-full GRA resources, non-MID music independent verification, and remaining unknown/support classification.

**MK2 closure remains OPEN.**

## 7. Next small pass

**O95J — segment-navigation downstream continuation census.**

For the 23 O95I segment-navigation routes:

1. follow the cursor after the exact 1/2/3 skipped segments;
2. classify the first terminal consumer reached without cursor replacement;
3. separate routes that enter standard composition rendering from routes that hand the post-skip cursor into state/related-object machinery;
4. do not infer identity, timing or human names from segment count;
5. preserve any route whose cursor is overwritten before a terminal consumer as unresolved.

This pass is intended to repair the “final-consumer” coverage count before broader animation-corpus reconstruction.
