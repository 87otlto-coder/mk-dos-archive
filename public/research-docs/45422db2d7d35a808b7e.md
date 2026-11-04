# MK DOS Archive — O95K related-object selected-pointer consumer qualification

Date: 2026-10-08 (SAST)

## Status

**VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN**

O95K revisits the **22** O95H routes previously classified as `RELATED_OBJECT_STATE` and asks a narrower question than O95J: does the selected Family-A/B pointer have an authenticated consumer before the route becomes related-object/state machinery?

Machine verdict:

`MK2_O95K_ALL_22_RELATED_OBJECT_STATE_ROUTES_HAVE_AUTHENTICATED_FIRST_COMPOSITION_CONSUMERS_WITH_STRICT_TERMINAL_COUNT_UNCHANGED`

## 1. Result

All **22/22** routes have an authenticated selected-pointer consumer.

They divide into three bounded forms:

- **20** routes enter related-object helper `0x679F2`;
- **1** route (`0x835D2`) calls inner cursor constructor `0x64019` directly;
- **1** route (`0x69B43`) manually dereferences the selected cursor first DWORD and feeds it into distinct object-initialization helper `0x64522`.

Family split remains the O95H split:

- Family A: **9** routes;
- Family B: **13** routes.

## 2. Shared helper path

Helper `0x679F2` immediately calls `0x64019`.

The authenticated `0x64019 -> 0x64069 -> 0x640DF` chain establishes:

1. `0x64019` reads selected cursor global `0x75A78`;
2. it dereferences the cursor's **first DWORD** and stores that value in scratch `0x75A6C`;
3. `0x64069` dereferences that frame-composition pointer to obtain its first descriptor pointer while setting up a new object;
4. control reaches the already-qualified `0x640DF` composition builder;
5. `0x640DF` stores the composition pointer in object `+0x42` and walks its zero-terminated descriptor-pointer list.

Therefore these routes are not merely state handoffs: the selected stream has a machine-authenticated immediate **first-composition consumer**.

The outer helper then publishes the newly constructed object through global `0x75A7C`, copies the original object's identity field `+0x46` into the constructed object's `+0x46`, and writes the constructed object to related-object field `[ESI+0x34]`.

This is a structural object relationship only. No gameplay name or role is assigned.

## 3. Direct `0x64019` route

Family-B lookup `0x835D2` calls `0x64019` directly at `0x835D7`.

This is the same authenticated first-DWORD → composition-builder construction mechanism without the outer `0x679F2` identity/link wrapper at that point.

O95K qualifies this immediate consumer only. It does not generalize the later repeated construction/state operations in that routine.

## 4. Manual `0x69B43` route

Family-B lookup `0x69B43` uses a distinct bounded path:

1. selected cursor `0x75A78` is mirrored to secondary cursor `0x75A80`;
2. the same selected cursor is copied to scratch `0x75A6C`;
3. its first DWORD is dereferenced and replaces `0x75A6C`;
4. helper `0x64522` is called;
5. `0x64522` allocates/initializes a new object from that first-DWORD pointer, storing it at object `+0x3C` and reading fields at pointer `+0` and `+8` into the new object.

This route does **not** use the standard `0x640DF` composition loop in the bounded path, so O95K preserves it as a distinct consumer subtype rather than forcing it through the shared helper grammar.

## 5. Coverage-accounting correction

O95J's strict terminal-qualified count remains:

- **161 / 253**.

O95K does **not** raise that number, because several related-object routes preserve or reuse the cursor after the first-composition construction.

Instead O95K introduces a broader, explicitly different metric:

- routes with **at least one qualified selected-pointer consumer**: **183 / 253**;
- routes still lacking any qualified selected-pointer consumer: **70 / 253**.

This distinction is mandatory in later handoffs. `consumer-qualified` must not be silently rewritten as `terminal-qualified`.

## 6. New implementation/evidence

Added:

- `src/games/mk2/research/animationRelatedObjectConsumerQualification.ts`
- `scripts/run-mk2-animation-related-object-consumer-qualification.mjs`
- `scripts/verify-mk2-o95k-animation-related-object-consumer-qualification.py`
- `mk2_animation_related_object_consumer_qualification_o95k_2026-10-08.json`
- package smoke command `smoke:mk2-animation-related-object-consumer`

## 7. Validation

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent O95K verifier: **55 checks / 0 failures**. It independently authenticates the helper/constructor/builder slices, reconstructs the 22-route O95H related-object set with instruction-boundary disassembly, reproduces the **20 / 1 / 1** subtype split, and validates the distinct manual path.

Regression spot checks:

- O95H independent verifier: **323 / 0 failures**;
- O95J independent verifier: **58 / 0 failures**.

O95I's correction of the O95H `164 final consumer` wording remains authoritative. O95K does not reverse it.

## 8. Boundary / closure status

O95K does **not** establish:

- that any of these 22 selected streams terminate after the first composition;
- human fighter/move/effect names;
- wall-clock timing;
- semantic meaning of the constructed related object;
- complete animation coverage;
- closure of the 17 local-cursor/data routes, 3 cursor-stack/state routes, scheduler/reselection routes, cursor-transform route, or other unresolved routes.

All O95A non-animation blockers remain open: stages/backgrounds/dynamics, eight unqualified palette slots, final relevance classification of non-exact-full GRA resources, non-MID music independent verification, and remaining unknown/support classification.

**MK2 closure remains OPEN.**

## 9. Next small pass

**O95L — local-cursor/data and cursor-stack/state continuation qualification.**

Prioritize:

1. the **17** O95H `LOCAL_CURSOR_DATA` routes;
2. the **3** `CURSOR_STACK_OR_STATE` routes;
3. qualify a consumer only where the exact selected pointer remains traceable through the local dereference or save/restore sequence;
4. keep scheduler/reselection and the broader unresolved set separate unless the selected pointer provenance remains exact;
5. preserve `terminal-qualified` versus `consumer-qualified` accounting;
6. do not infer identities, move names, timing, or gameplay meaning from data shape.
