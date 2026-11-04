# MK DOS Archive — Handoff — Pass 1E.3O.21 GET_CHAR_ANI Consumer Census

Date: 2026-09-29

## Status

**STATICALLY VERIFIED AGAINST CANONICAL MK1.EXE / READ-ONLY / NORMAL-APP INTEGRATION IMPLEMENTED**

Direct verdict:

`MK1_GET_CHAR_ANI_DIRECT_INDEX_CONSUMER_SURFACE_ESTABLISHED`

O21 is an export-labeling reconnaissance pass. It does not modify the game and it does not assign gameplay names merely because a nearby Watcom debug symbol is suggestive. Its purpose is to establish the bounded direct call surface to the already-qualified `GET_CHAR_ANI` selector and to recover immediately adjacent constant `A9` animation indices where the machine code proves them.

## Authentic fixture

The pass ran against the canonical `MK1.EXE` from the user's complete original installation:

- size: **1,157,222 bytes**;
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.

Prerequisites:

- O17 cross-table structural comparison — successful;
- O19 character identity -> ANITAB selector — successful;
- valid Watcom permanent-class/address-info evidence.

## Exact question

O19 established that `GET_CHAR_ANI` selects a character's ANITAB from the object identity and then indexes it by `A9`.

O21 asks:

> Which canonical code locations directly call `GET_CHAR_ANI`, and which of those calls have a machine-provable immediately adjacent constant write to `A9`?

This is intentionally narrower than "name every animation".

## Direct call census

Canonical code scan result:

- direct rel32 calls to `GET_CHAR_ANI`: **241**;
- calls immediately preceded by exact `MOV [A9], imm32`: **220**;
- direct calls with dynamic or non-adjacent `A9` setup: **21**;
- distinct directly observed immediate indices: **65**;
- observed immediate range: **0..85**.

Every direct call lies inside a Watcom Segment-1 module-owned range.

Every immediately observed index is in range for at least one O17 ANITAB. This is a bounded consumer observation, not evidence that an index has the same semantic meaning in every character table.

## Watcom symbol context

For each call site O21 records:

- owning Watcom module;
- nearest preceding code symbol within that module;
- distance from that symbol;
- immediate `A9` index when the exact adjacent instruction shape is present.

These names are retained as **context only**. For example, contexts include symbols such as `KANO_DEATH_BLOW`, `RAIDEN_DEATH_BLOW`, `SUBZERO_DEATH_BLOW`, `DO_BLOCK_HI`, `SHOW_ENDING_SEQ`, and others. O21 does not promote those names into authoritative animation labels because nearest-symbol proximity alone does not prove a one-to-one semantic assignment.

The already independently qualified Kano heart route remains a stronger special case: previous passes directly established KANO_ANITAB index 67 as part of that bounded fatality mechanism. O21 does not weaken or replace that earlier evidence.

## Dynamic consumers are preserved

The 21 direct calls without an immediately adjacent constant write are not discarded. They remain classified as:

`DIRECT_GET_CHAR_ANI_DYNAMIC_OR_NONADJACENT_A9`

This prevents the export graph from pretending all animation selection is statically constant at the call site.

## What O21 establishes

**STATICALLY VERIFIED:**

- direct canonical `GET_CHAR_ANI` call surface: 241 calls;
- exact adjacent constant-index consumer surface: 220 calls;
- 65 distinct immediately observed indices;
- 21 dynamic/non-adjacent consumers retained;
- module ownership for every direct call;
- contextual nearest Watcom symbols captured without semantic promotion.

**Not established:**

- canonical gameplay names for all ANITAB indices;
- equivalence of one numeric index across all character tables;
- complete animation universe;
- semantics of the 21 dynamic consumers;
- palette binding;
- frame timing beyond earlier bounded grammar evidence;
- MK2/MK3 parity.

## Export consequence

O21 provides a safe evidence layer for future export manifests:

`character identity -> ANITAB -> index -> structural stream/frame graph`

can now be supplemented with:

`index -> direct code consumer contexts`

without turning contextual debug names into unsupported canonical labels.

## Source changes

Added:

- `src/games/mk1/research/getCharAniConsumerCensus.ts`;
- `scripts/run-get-char-ani-consumer-census.mjs`;
- this handoff.

Integrated into `ResearchQuickActions` as stage **30/30**.

App milestone:

`Milestone 1 — Pass 1E.3O.21 — MK1 GET_CHAR_ANI Consumer Census`

Report format:

`mk1_get_char_ani_consumer_census_v1`

## Validation

Direct canonical result:

- status: `SUCCESS`;
- direct calls: 241;
- immediate adjacent consumers: 220;
- dynamic/non-adjacent: 21;
- unique immediate indices: 65;
- all immediate indices covered by at least one ANITAB: true;
- all calls inside Watcom module ownership: true;
- all 9 O21 validation checks: passed.

Additional validation performed during integration:

- O21 targeted TypeScript compile with a local Node declaration shim: **PASS**;
- smoke-script syntax: **PASS**;
- smoke execution against the authentic extracted MK1 installation: **PASS**;
- smoke output equals the earlier direct report after removing timestamp/operation IDs: **exactly equal**.

The local type declaration shim is validation-only and is not included as a runtime dependency.

## Recommended continuation

The next export-first step should combine O17/O18/O19/O20/O21 into a character-oriented animation export manifest that keeps four things separate:

1. structural animation/table identity;
2. decoded indexed frame composition;
3. palette context / palette-binding confidence;
4. code-consumer context / semantic-label confidence.

Known palette-bound fixtures such as Kano heart (`BLOOD_P`) and Rayden lightning (`MORPH_P`) can be promoted explicitly; unresolved streams should remain indexed-color exports rather than being assigned a body palette merely because they reside in a fighter GRA.
