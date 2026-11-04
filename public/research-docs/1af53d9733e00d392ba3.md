# MK DOS Archive — Pass 1E.3I continuation handoff

## Current state

- 1E.3G: VERIFIED / CLOSED, including direct comparison of browser evidence with original executable bytes.
- 1E.3H: VERIFIED / CLOSED. Browser export `mk1_palette_round_trip_2026-09-24T21-58-30-024Z.json` independently reconciled against original MK1.EXE and the direct TypeScript result: 123 records, 5,488 module bytes, zero executable differences, original SHA-256 preserved, 10/10 checks passed.
- 1E.3I: IMPLEMENTED — AUTHENTIC-FIXTURE STATIC EDIT VALIDATION PASSED — BROWSER EXPORT AND IN-GAME VALIDATION PENDING.

This is the current operational handoff. Older handoffs remain historical checkpoints.

## Controlled question

Can we change only specified color words in a qualified palette record, regenerate the existing module through the lossless IR, account for every changed executable byte, and reverse the edit exactly?

The implementation answers that static question on the supplied fixture. The visible game effect is still an expected outcome awaiting observation.

## Fixture and result

| Item | Value |
| --- | --- |
| Original file | MK1.EXE, 1,157,222 bytes |
| Original SHA-256 | `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14` |
| Target | KANO_P, ground-truth record 84 |
| Record physical span | `[0x9CBFA, 0x9CC2A)` |
| Color payload span | `[0x9CBFC, 0x9CC2A)` |
| Header | 23 colors; untouched |
| Aliases at this address | KANO_P only |
| Other records with identical complete content | None in this fixture |
| Edit preset | KANO_P_ALL_MAGENTA_V1 |
| Requested replacement | All 23 words → `0x7C1F` |
| Exact changed-byte count | 45 |
| Unexpected byte differences | 0 |
| Other palette records | 122 unchanged, including KANO3_P |
| Edited file length | 1,157,222 bytes |
| Edited SHA-256 | `fbd23d8b6d322919f4f57e2cbb14f6670ab32c52345efb810816582f6ad201dd` |
| Reversal SHA-256 | Identical to original above |
| Static export checks | 10/10 passed |
| Runtime result | NOT_TESTED |

There are 46 bytes in the requested payload. Only 45 differ because one original byte already equals its replacement. The report records actual differing bytes rather than counting every byte covered by the word edits.

The recovered transfer arithmetic predicts channel output `(63, 1, 63)` for `0x7C1F`, giving a conspicuous magenta test color. This predicts the visual result but does not substitute for a runtime observation.

## Implementation

### Bounded edit codec

`src/games/mk1/research/paletteEditCodec.ts`:

- Edits use record index, zero-based color-word index, expected original u16, and replacement 15-bit word.
- Rejects bad indices, duplicate/conflicting targets, stale original words, no-op edits, and values outside the supported replacement range.
- Clones IR; does not mutate the input or change record order, offsets, lengths, or executable length.
- Serializes the complete module from typed fields.
- Computes expected differing bytes directly from each word edit, independently of the serializer.
- Compares the entire original and edited executable and requires exact equality between actual and expected change lists.
- Reparses the edited module and checks it against edited IR.
- Applies inverse edits and requires an identical original executable and SHA-256.

The controlled fixture's original words are all 15-bit. Generic raw u16 preservation remains in the 1E.3H codec; 1E.3I replacement and inverse-edit rules deliberately qualify only 15-bit colors.

### Authentic fixture binding and export

`src/games/mk1/research/paletteControlledEdit.ts`:

- Validates the 1E.3H baseline and rejects synthetic sources.
- Re-reads the executable and checks its size and SHA-256 against the baseline.
- Requires one KANO_P symbol record with the qualified 23-color length.
- Reports aliases and equal-content records at other addresses; equal content is not treated as shared storage.
- Creates fresh `palette_controlled_edit-...` provenance.
- Rebuilds and recomputes the edit evidence on export, checks the output buffer hash, and refuses inconsistent reports.
- Keeps runtime status explicitly NOT_TESTED.
- Creates a ZIP containing edited `MK1.EXE`, `mk1_palette_controlled_edit.json`, and `READ_ME_FIRST.txt`.

The source installation is never overwritten. The edited executable exists in memory until explicitly downloaded or written by the direct smoke script into the designated output directory.

### App workflow

`ResearchQuickActions.tsx` now has six dependency-ordered stages. The last stage prepares the controlled edit in memory.

- **Export Latest** saves the 1E.3I JSON.
- **Export All** includes all six successful research artifacts.
- **Download Kano Test Bundle** revalidates and downloads the edited executable with instructions.
- Source identity and run generation guards discard obsolete async results when a selected directory changes.

This pass exposes a fixed, reproducible experiment in the UI. It does not expose an unrestricted palette editor, resizing, relocation, or ownership-table modification.

## Verification completed

- Targeted Vitest: 37/37 passed across palette editing and round-trip tests.
- Whole-app `npx tsc --noEmit`: passed.
- `npm run build`: passed; existing large-bundle warning remains.
- Authentic fixture chain through 1E.3I: passed, all 10 static checks.
- Ten fail-closed probes: altered edit, alias metadata, change count, operation ID, synthetic flag, prerequisite hash, fabricated runtime status, modified output buffer, modified original buffer, changed source read — all rejected.
- Independent Python check of the actual generated ZIP: its MK1.EXE equals an independently constructed original-plus-23-word patch; actual differences equal the report's exact 45 offsets and old/new bytes; header and all outside-payload bytes preserved; inverse words restore the original binary and hash.
- ZIP integrity checks passed.
- No in-game execution was performed. No DOSBox executable was available in the current environment.
- Browser interaction for the sixth stage has not yet been observed.
- Full historical Vitest suite was not rerun for this bounded pass.

Repeat direct validation without executing the game:

```bash
npm install
npm run smoke:palette-edit -- /path/to/mk1 /path/to/evidence
```

Node 22+ is supported for the direct script. It produces the JSON and test ZIP after all checks and negative probes pass.

## User test and closeout

### Browser evidence

1. Launch this source snapshot and select the original MK1 installation.
2. Click **Run What's Needed**, then **Export Latest**.
3. Return `mk1_palette_controlled_edit_*.json` for independent reconciliation.

### In-game experiment

The separately delivered `mk1-kano-magenta-test-1E3I.zip` is already statically verified and can be used directly. The app's download button generates the same controlled executable for the same original fixture.

1. Make a separate copy of the complete original installation.
2. Replace MK1.EXE only in that test copy with the bundled file.
3. Launch using the usual DOS setup.
4. Select Kano against a different fighter. The normal-palette Kano pixels are expected to be magenta.
5. Capture a screenshot showing both fighters and the stage, and report whether the game boots, enters the match, and plays normally.
6. Compare with the untouched installation. Record unexpected visual effects, crashes, or no visible change.
7. Restore by copying MK1.EXE from the untouched installation.

Avoid using a same-character match as the first visual test, because the independently recovered alternate-palette selection introduces a second variable. KANO3_P remains unedited.

Only classify runtime behavior as observed after reviewing the user's evidence or directly executing the edited installation. A passing binary comparison or successful browser download does not establish game compatibility.

## Scope and future work

The established result is a same-size edit of KANO_P with exact binary change accounting and reversible serialization. It does not yet establish full asset compilation, safe relocation, all rendering modes, all consumers of a named palette, or MK2/MK3 applicability.

After browser and runtime closeout, the next bounded candidate is a per-entry color editor using the same preconditions, alias display, byte accounting, and isolated export workflow. Additional palette ownership/runtime coverage should be qualified independently before expanding that interface.
