# Pass 1E.3O.7 — Interactive Multi-Part Composition Placement Editor

## Independent fixture validation — 2026-09-27

**Final status: VERIFIED. O7 is safe to close from the requested static fixture evidence.** This supersedes the previous UNRESOLVED note: the authentic O7 archive is now available. No implementation correction was required and no corrected source ZIP was produced.

Scope: descriptor-local signed-int16 X/Y editing of the existing frame `[KHEART3A, KHEART3B, KHEART3C, 0]`. No collision, contact or world-position investigation was performed. No DOSBox runtime or browser interaction test is claimed.

## Inputs and source inspection

Source archive: `MK-DOS-1E3O7-source.zip`.
SHA-256: `1d2c38529b5a55156189f220dfbb018796a68d84c56c55cecbb81a341688bb79`.
The archive's original handoff was inspected. All 197 checked implementation/configuration files under src, scripts and package/TypeScript/Vite configuration paths still match the archive byte-for-byte after validation.

Inspected `src/games/mk1/research/multiPartCompositionCanvasEditor.ts`, `src/components/MultiPartCompositionCanvasEditor.tsx`, O2 `multiPartFrameLosslessIr.ts`, and `scripts/run-multi-part-composition-editor.mjs`.

The editor restricts edits to KHEART3A/B/C in heart_2 / PRIMARY:2. Its request interface accepts symbol and X/Y; UI controls position existing parts. Compilation clones qualified semantic IR, changes coordinates and calls `serializeMK1BoundedAnimationIr`. Serialized regions are applied to an EXE clone, followed by whole-file expected-diff and exact-reversal checks. Authentic-source and canonical identity checks precede write-back. No discrepancy requiring correction was found.

## Canonical fixture and resource

Installation: `C:\Users\87otl\Desktop\MKDOSEXT Project\OG Game\mk1`.

- MK1.EXE: **1,157,222 bytes**; SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.
- GRAPHICS/MISC.GRA: **104,444 bytes**; SHA-256 `2aacd1389e687b2e895d24d92ce0e80d573a8ccc80d4dc9b72082a01506ab486`.

Both authentic files were read and remained unchanged after testing. No synthetic graphics were substituted. Original installation and synced project sources were not modified; generated EXEs are separate test outputs.

## No-edit round trip

Built the real model through its prerequisite qualification chain. Serialized all **22 qualified regions** into a canonical EXE clone without edits. Whole-EXE mismatch count: **0**. Rebuilt hash exactly equals canonical.

## Independent controlled edit

| Descriptor | Original X,Y | Delta X,Y | Reparsed X,Y |
|---|---|---|---|
| KHEART3A | 18, -18 | +8, 0 | 26, -18 |
| KHEART3B | 19, -18 | 0, -6 | 19, -24 |
| KHEART3C | 19, -18 | -5, +4 | 14, -14 |

Expected bytes were independently calculated from the canonical fixture and symbol inventory **before compiler invocation**, without relying on its manifest. See independent-expectation-before-compile.json.

| Physical EXE byte offset | Before hex | After hex | Field |
|---|---|---|---|
| 0xA8680 (689792) | 12 | 1A | KHEART3A X low byte |
| 0xA868E (689806) | EE | E8 | KHEART3B Y low byte |
| 0xA8698 (689816) | 13 | 0E | KHEART3C X low byte |
| 0xA869A (689818) | EE | F2 | KHEART3C Y low byte |

Actual whole-EXE differences matched this table exactly: **4 changed bytes; 0 unexpected bytes; no missing semantic edits**. High bytes were unchanged. Repeated compilation produced identical output.

Edited SHA-256: `7091928b5c060c7d54c525cc6ef4fdba83ba24bad792e098af1c27f4e4c400bd`.

## Semantic reparse and exact reversal

Existing O2 byte readers and pointer-list parser were exposed only in an ephemeral validation bundle, without editing production source. All 22 semantic regions were reconstructed from actual edited bytes using the canonical region layout. Canonical-authoring provenance was not spoofed or weakened to admit the edited file.

Requested coordinates matched. Dimensions remained A=15x9, B=13x16, C=13x16. Packed references remained 33627560, 33627740, 33628004 respectively. Frame references remained 113704, 113716, 113728, zero in the same order. All **19 non-target qualified regions** remained byte-identical. Reserializing the reparsed edited IR reproduced the entire edited EXE exactly. Whole-file comparison excludes any other EXE changes; MISC.GRA remained unchanged.

Reversing only the actual four edited bytes restored byte-for-byte canonical equality. Reversal SHA-256: **`750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`**.

## Fail-closed tests

**24 rejection checks passed:** unknown symbol; duplicate edit; X and Y each set to -32769, 32768, 1.5, NaN, Infinity; empty edits; no-op edits; noncanonical EXE; synthetic-source flag; baseline IR width, height, packed-reference and descriptor-offset changes; frame part addition, removal, pointer replacement and reordering.

Extra unsupported request properties (width, height, packedReference, descriptorRef, parts) were ignored, producing exactly the same binary as the X/Y-only request. Unsupported structural changes introduced through the callable model's baseline IR were rejected before output was returned. These are representative contract checks, not an exhaustive adversarial audit. No rejection mechanisms were added.

## Commands and results

Validation workspace:
`C:\Users\87otl\.codex\.chatgpt-projects\g-p-6a997d9946948191a1dc7b805f518e5f\validation-o7`

Source was extracted to `source\MK-DOS-1E3O7` under that directory. Existing local dependencies were reused without changing source dependencies.

Executed from the project workspace (parent of validation-o7):

```powershell
node validation-o7/validate-o7.mjs "C:\Users\87otl\Desktop\MKDOSEXT Project\OG Game\mk1"
```

Executed from validation-o7/source/MK-DOS-1E3O7:

```powershell
npm run lint
npm test
npm run build
npm run smoke:multi-part-composition-editor -- "C:\Users\87otl\Desktop\MKDOSEXT Project\OG Game\mk1" "C:\Users\87otl\.codex\.chatgpt-projects\g-p-6a997d9946948191a1dc7b805f518e5f\validation-o7\evidence\smoke"
```

- Independent runner: **VERIFIED**.
- Lint / tsc --noEmit: **passed**.
- Tests: **36 files, 525 tests passed**, Vitest 4.1.11.
- Build: **passed**, Vite 6.4.3, 1793 modules; advisory chunk-size warning only.
- Supplied O7 smoke: **SUCCESS**, 3 parts, exact no-edit round trip, 3 changed descriptors / 4 fields / 4 bytes, 0 unexpected bytes, exact reversal.

The supplied smoke uses different deltas (+3 X, -4 Y, +5 X/+2 Y). Its separate edited hash is `8cac06bf614eb77c16f7c255724426c078eb52816fc8667b58c3470674723346`; do not confuse it with the independent edit above.

Initial sandbox attempts for the independent runner, tests and build encountered a Windows/esbuild directory-access restriction. The same checks passed with approved execution outside that restriction. This was a tooling limitation, not a fixture failure.

The implementation's literal report status `STATIC_VALIDATION_PASSED_RUNTIME_PENDING` remains unchanged. This independent **VERIFIED** classification follows the user's static fixture criteria; no runtime requirement was added. Browser gestures were inspected in source, not exercised end-to-end.

## Evidence and delivery

Companion folder `O7-validation-evidence` beside this handoff contains the independent report, precomputed expectations, rejection results, model/compiler reports, source integrity report, supplied smoke reports, and validation runner. To rerun the copied runner, place it alongside `source\MK-DOS-1E3O7` with dependencies available, matching the validation workspace layout above. It writes `evidence` beside itself.

Only validation artifacts and this handoff were authored. **No implementation changes; no corrected source archive required.** The supplied MK-DOS-1E3O7-source.zip remains the validated source artifact.
