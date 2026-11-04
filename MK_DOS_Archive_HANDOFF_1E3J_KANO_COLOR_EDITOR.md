# Pass 1E.3J — Individual Kano color editor

25 September 2026

## Delivered behavior

Start from the repaired 1E.3I implementation. Load your original MK1 installation and run **Run What's Needed**. The **Kano color editor · 1E.3J** appears after successful validation.

Each of the 23 normal-Kano palette entries has an original swatch and word, an edited color picker, an editable hexadecimal word (0000–7FFF), and Reset. Reset all restores the original draft. Invalid values and unchanged drafts cannot export. The color picker quantizes to the supported 15-bit words. Swatches use the qualified odd-valued 6-bit DAC transfer mapped to an 8-bit display; they are not sprite previews.

**Download edited test bundle** fresh-reads and hashes the source executable, validates the baseline, rebuilds only the selected words, compares every executable byte with the expected changes, reparses the module, and verifies reversal. The ZIP contains MK1.EXE, the edit JSON, and test instructions. Export Latest and Export All include the latest successful custom edit evidence. Draft changes do not modify previous exports or the installation.

The existing 1E.3I magenta test remains available. KANO3_P and all other records are unchanged by custom normal-Kano edits.

## Validation

- TypeScript check and production build passed; existing Vite large-chunk warning remains.
- 40 targeted tests passed, including exhaustive round-trip conversion of all 32,768 supported color words through display swatches.
- Authentic MK1 fixture chain passed: ground truth, selection graph, selection semantics, hardware transfer, no-edit round trip, and custom edit.
- Three selected entries (UI entries 1, 8, 23; zero-based indices 0, 7, 22) changed to 7C1F, 03E0, 001F, respectively. Exactly six bytes changed.
- Independent Python reconstruction matched the exported ZIP executable byte for byte. ZIP CRC checks passed.
- A single-entry, single-byte change also passed export verification.
- Fourteen malformed/tampered/no-op cases were rejected.
- Reversal restored original SHA-256 750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14.
- Three-color output SHA-256: 0c022bca565e41779e19d7ca2714919a21a49479216bf153a700b77995cf3cda.

## Pending user validation

The browser controls have not been exercised in a live browser here. The custom three-color edit has not yet been run in DOSBox. The earlier magenta screenshot establishes only the bounded 1E.3I runtime observation; it does not validate these new color choices or extended gameplay.

Extract the source ZIP completely, run Launch_Source.bat, load the original installation, and run the validation chain. Change one or more entries, download the custom bundle, and test its executable in a separate full installation copy. Return its JSON and a screenshot of Kano against a different fighter.

The included standalone three-color test ZIP can also be used directly in a separate installation copy. It changes only entries 1, 8, and 23, so it should not make the entire fighter magenta. Unchanged colors remain original.

## Main files and reproducibility

- src/components/KanoPaletteEditor.tsx
- src/components/ResearchQuickActions.tsx
- src/games/mk1/research/paletteEntryEdit.ts
- src/games/mk1/research/paletteEntryColors.ts
- src/tests/paletteEntryColors.test.ts
- scripts/run-palette-entry-edit.mjs

Run npm run lint, npm run build, and npm test -- src/tests/paletteEdit.test.ts src/tests/paletteRoundTrip.test.ts src/tests/paletteEntryColors.test.ts.

Run npm run smoke:palette-entry-edit -- /path/to/original/mk1 /path/to/output for the real-fixture checks. No fixture executable is included in the source package. The standalone test bundle contains the edited executable.

## Next scope

Close the custom-editor browser/runtime check before qualifying alternate-Kano behavior or expanding ownership to other fighters. Sprite rasterization and MK2/MK3 editing are outside this pass.

---

## Continuation — Pass 1E.3K alternate Kano color editor

The editor has been extended without redefining 1E.3J. Normal `KANO_P` entry editing remains Pass 1E.3J. A separate Pass **1E.3K** target exposes the adjacent verified 23-color `KANO3_P` record.

The UI now has explicit **Normal · KANO_P · 1E.3J** and **Alternate · KANO3_P · 1E.3K** targets with independent draft/reset state. Alternate exports use the same exact-byte-difference, reparsing, SHA-256, and reversal safeguards as normal exports. The unselected Kano palette and all unrelated executable bytes must remain unchanged.

Runtime qualification remains pending. The bounded 1E.3K runtime test is **Kano versus Kano**, because 1E.3F established that the same-character equality edge selects `ALTERNATE_PALETTES`, where Kano's corresponding slot is `KANO3_P`. This implementation does **not** assert which player-side object receives the alternate palette, and does not broaden ownership claims to other fighters.
