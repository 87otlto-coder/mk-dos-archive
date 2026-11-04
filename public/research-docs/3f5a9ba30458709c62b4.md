# MK DOS Archive — O96B Indexed-Row Producer and Control-Word Provenance

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED BOUNDED MACHINE-CODE PROVENANCE / MK2 RESEARCH OPEN

## Basis

O96B continues O96A's authentic code/data chain from indexed table Object-2 `0x2EF54` through guarded source-row consumer `0x9E118` and packed-resource routine `0x659C6`. The executable is the original verified `MK2.EXE` (SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`). The O96A original machine-readable report is byte-hash checked and retained intact.

## Finding 1: exact local source of selected-table index

Authentic code at physical `0x82321` reads DWORD `[0x75A80]` into EAX, and at physical `0x82326` writes EAX to `[0x7747F]`, the exact global later read by O96A's consumer `0x9E165`. The writer's immediate, local provenance is now established.

Before the `0x82321` routine returns, it also:

1. multiplies EAX (the captured original scalar) by 4;
2. chooses one of three **relocation-authenticated Object-2 bases**, `0x15BEC`, `0x15C68`, `0x15CE4`, according to tests on global `0x3014C`;
3. loads the chosen indexed DWORD;
4. **replaces `[0x75A80]` with that fetched value**;
5. calls `0x81EB2`, then proceeds through additional bounded actions.

All three pointer immediate sites (`0x82330`, `0x8233E`, `0x8234C`) are independently checked as type-7 LE relocations to Object 2. The table-base address separations are observable, but **table lengths, legal numerical indices, and runtime branch/ordering with the later renderer are NOT proven**. As in O96A, a scalar being stored to a global does not establish it is a gameplay stage ID or a visible layer order.

## Finding 2: guarded source-control tuple to O96A consumer

Original routine at physical `0x93547` reads a DWORD from control cursor global `[0x75A98]`, then advances that cursor by four. Its explicitly bounded cases include:

- token DWORD zero: branches toward a separate exit path;
- signed token `-1` (`0xFFFFFFFF`): advances through exactly **three further DWORD fields**;
- positive and other negative values: execute *different, not fully generalized* paths.

For the `-1` branch, the three bounded fields are used as follows:

1. first DWORD: loaded as a pointer and **dereferenced once more** to produce ESI;
2. second DWORD: loaded into EDI;
3. third DWORD: loaded into EBX.

The routine commits the updated cursor to `[0x75A98]` **before** calling `0x9E118` at machine-authenticated callsite `0x93585`. O96A then bounds the guarded source-row read: index through `[0x7747F]`, resolve packed `.GRA` source through resource handles, process 80 DWORDs per inner loop and advance source rows by `0x380` (896) bytes.

This is an executable-established **one-control-branch grammar and consumer relationship**, not a universal stage-script language, animation cadence, playback timebase or verified screen geometry. Runtime index and row-count ranges still require bounded upstream proof.

## Reproducibility

Evidence: `mk2_packed_row_control_index_provenance_o96b_2026-10-08.json`. Producer: `scripts/run-mk2-o96b-row-control-provenance.mjs`; independent verifier: `scripts/verify-mk2-o96b-row-control-provenance.py`.

- Producer: **PASS** on authentic original fixture.
- Independent Python verifier: **27,150 checks / zero failures**, including its own reparse of 27,004 LE fixups, independent opcode slices, three table relocations, source-global overwrite, token dispatch, `-1` tuple and exact downstream rel32 call.
- Three falsification tests all rejected: fabricated bounded runtime index, altered tuple register, altered table target.
- O96A **27,170/0**, O95Y **83/0**, O95Z **1,526/0**, O95X **62/0** were already independently clean within the same bounded continuation. Existing corpus and original fixture remain unmodified.

## Limits and next

No additional fighter/move/stage identities, source-image geometry, correct-color palettes, FPS/time, static `.GRA` exact-full qualifications or fully reconstructed scenes are claimed. MK2 research remains OPEN.

**O96C is the next bounded target:** establish the upstream producers of `0x75A80` and `0x75A98` for the command route, and callers' source-row and clipping argument bounds; attempt specific runtime numeric joins, not guessed cross-products. If inconclusive, shift to another MK2 closure area rather than repeating the same provenance census.

Mandatory research order: **MK2 → MK1 → MK3 → UI/usability discussion → extractor implementation**.
