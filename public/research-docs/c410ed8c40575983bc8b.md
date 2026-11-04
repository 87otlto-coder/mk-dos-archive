# O200 — MK2 Forest original callback object-field derivation (2026-10-15)

**Baseline:** O199.1 syntax hotfix (`MK_DOS_Archive_Source_O199_1_Syntax_Hotfix_2026-10-15.zip`).  **Scope:** source-only Forest callback interpretation, bounded original-game fixture checks, read-only Laboratory viewer, portable forensic evidence export. No original MK2 files are changed or distributed.

## New source-proven finding

O199 identified two original callback registrations in Forest's initializer, the second conditional on nonzero stage mode. O200 traces the **second registered callback at physical `MK2.EXE` `0x82C44`** through the original object-setup helper at `0x82CB0` and packed-coordinate helper at `0x64A19`. It finds three distinct original `MOV EDX, imm32` operands and calls to the shared object helper:

| Operand instruction physical offset | Packed `EDX` | High signed 16 bits | Low signed 16 bits | Object field `+0x1E` | Object field `+0x1A` |
| --- | --- | --- | --- | --- | --- |
| `0x82C44` | `0x00650106` | 101 | 262 | 76 | 197 |
| `0x82C54` | `0x00650232` | 101 | 562 | 76 | 422 |
| `0x82C64` | `0x00650352` | 101 | 850 | 76 | 638 |

The original helper at `0x64A19` separates the signed 16-bit halves, computes `n - (n >> 2)` (arithmetic right shift) for each, and stores the results with `mov word [edi+0x1E],dx` at `0x64A2A` and `mov word [edi+0x1A],dx` at `0x64A41`. A first source helper call reaches `0x64548` (object setup/flags); the coordinate helper runs at `0x64A19`; a subsequent original tail jump reaches `0x665D4` (record-list insertion). The source accesses `0x16F14` in the setup call and `0x84350` in the list route. Their comprehensive runtime roles are not proven.

**Careful conclusion:** these are the values the original code is structured to write into object fields on this path, *if the callback executes and the corresponding helper path succeeds*. They are **not runtime-screen positions, not object identities, not proof of a rendered sprite, and not a measured Forest gameplay state**. No Forest scene layout was inferred from them.

The **first registered callback at `0x82B04`** independently reads a source state operand `0x7650A` and compares against `1`; the equal branch exits to task cleanup `0x67189`. A later source block sets a loop counter to `3` at `0x82BB6`, decrements it at `0x82C37`, and jumps back conditionally. Those are source-coded counts, **not an authenticated number of animation frames, seconds or runtime invocations**. The O135 coroutine precedent for the common scheduler at `0x6710F` remains relevant; scheduler cadence was not established here.

## Implementation

- `src/core/experiments/o200.ts` is an additive, read-only binary verifier and exporter. It chains O199's canonical executable hash/pointer checks, rechecks the original coordinate instructions, and exports exact original byte windows, all operands, output fields, and limitations.
- `src/components/O200ForestObjectFieldsWorkbench.tsx` adds the Laboratory O200 card with an explicit *source object-field / not gameplay position* visualization and complete forensic export. It does not modify existing O194–O199 engines.
- `scripts/verify-o200-fixture.cjs` and **independent** `scripts/verify-o200-export.py` compare computations and evidence against the canonical original EXE. The latter does not import the TypeScript producer.
- `TEST_O200.cmd` runs Windows syntax and verification checks against a user-selected original MK2 directory, then independent ZIP verification.

Forensic ZIP format `mkdos_o200_forest_callback_coordinates_v1`: `SUMMARY.md`, `MANIFEST.json`, full `evidence/report.json`, `evidence/object_coordinates.json`, exact `evidence/callback_instruction_windows.json`, schematic SVG, `diagnostics/limits.json`, `reproduce/README.md`. No original commercial executable or GRA is bundled.

## Verification and limits

- New O200 fixture test: **PASS** (canonical source, three original packed operands, signed split + shift, two field stores, first callback guard/loop, eight-entry deterministic ZIP, corrupted-source rejection).
- Independent O200 Python verifier: **PASS** (original byte windows, calls and relative branch destinations, arithmetic, all exported instruction windows, ZIP integrity and omissions of commercial source files).
- Original MK2 O194–O199 fixture tests: **PASS** after making uppercase aliases in a *temporary local Linux test fixture only*. O194 originally requires DOS-uppercase filenames, but the fixture ZIP is lowercase; the actual source and fixtures were not altered by the aliasing.
- MK1 compilation regression: **PASS** (17 original candidates, 18 SHA-256 source fingerprints).
- Research Library/UI structure and TypeScript syntax gates: rerun after documentation indexing; results in final handoff and audit.
- Full React/Vite build and DOSBox gameplay activation **not verified**. The offline npm package cache lacks `yallist@3.1.1`.

## Next decisive evidence

Run the existing O199 control-vs-second-registration-NOP game test kit in DOSBox, select Forest and compare a short recording of each test copy with matched setup and time. Any visible difference must be correlated against original object IDs and the source positions before calling any particular graphical element controlled. If there is no change, that is inconclusive because the callback might not be scheduled, might be mode-gated, or the output may be visually hidden.
