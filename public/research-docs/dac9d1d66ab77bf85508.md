# Pass 1E.3I validation closeout — 25 September 2026

The bounded normal-Kano magenta palette test is complete.

## Browser and bundle evidence

Reviewed browser export: mk1_palette_controlled_edit_2026-09-25T07-45-11-788Z.json.
Operation: palette_controlled_edit-mugnogv7-xyfib.
Reviewed uploaded bundle: mk1-kano-magenta-test-1E3I.zip. All ZIP CRC checks passed.

Independent Python verification against the original MK1.EXE confirmed:
- All 123 NEWPALS records parse exactly to the module boundary.
- All 23 KANO_P color words are changed to 0x7C1F, producing exactly 45 byte changes.
- The bundled executable equals the independently constructed edit, byte for byte.
- All 122 other palette records and all record headers remain byte-identical.
- Original and edited module bytes, hashes, and full executable hashes match the browser report.
- Reversing the 23 edits restores the original executable byte for byte.
- The bundled report agrees with the browser report on edit plan, target, and evidence.
- All ten browser validation gates report success.

Original executable SHA-256:
750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14

Edited executable SHA-256:
fbd23d8b6d322919f4f57e2cbb14f6670ab32c52345efb810816582f6ad201dd

## Runtime observation and limits

The user's earlier DOSBox screenshot shows bright-magenta Kano with Cage and the courtyard retaining their expected appearance. This supplies visual runtime confirmation for the bounded normal-Kano test. A screenshot does not establish extended gameplay stability or alternate-palette behavior, and cannot independently prove the hash of the executable running at capture time.

The machine-generated JSON correctly retains NOT_TESTED for runtime: the application did not observe DOSBox. The screenshot observation is separate evidence; the uploaded report has not been altered.

## Next bounded milestone

Implement individual KANO_P color-entry editing with original/edited swatches, explicit word values, and the existing exact-difference and reversible-export safeguards. Validate normal Kano first. Alternate KANO3_P selection and broader fighter ownership remain separate follow-up work.

Authoritative implementation remains the repaired 1E3I source package; this closeout supersedes the earlier handoff's browser-export/runtime-pending notes only for the bounded normal-Kano test. No source-code changes were needed for this review.
