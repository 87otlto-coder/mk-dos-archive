# Repository policy and checkpoint practice

## Primary milestone

Complete a faithful, previewable, exportable asset extractor for MK1, MK2 and MK3 DOS. Research only what improves the extractor; preserve the broader forensic workbench rather than deleting established work.

## Branches

- `main`: accepted source checkpoint and durable project documentation.
- `develop`: intermediate code changes, protected by focused fixture tests and reversible patches.
- Every five substantive passes: consolidate and **only** issue a full checkpoint if functionality and regressions justify it.
- **Never equate a GitHub documentation commit with a complete source import.**

## Source import guardrails

- Start from frozen **P6** (not a guessed mixture of O270 or old numbered ZIPs).
- Verify P6 source ZIP SHA-256: `49cf14b72475189bcb8be53fe6ad1d11e4b145205b9e4012c4c2320235a7735e`.
- Keep P7→P10 small patches in order; no history rewrite or source deletion.
- Do not commit original commercial `MK1.EXE`, `MK2.EXE`, `MK3.EXE`, game directories, `.GRA`, `.FTR`, audio/music extracted from commercial fixtures, DOSBox captures, original game ZIPs, or confidential/sensitive files.
- Review repository paths and ignore rules before the initial source import. Preserve **research code and reports** that are safe to publish privately; separately handle evidence containing original game bytes.
- Avoid committing `node_modules`, build outputs, fixture caches and transient verification files.
- Never commit secrets, PATs or authorization tokens.

## Confidence and test requirements

- Verified, inferred, hypothesis and unknown must remain distinct.
- Exact source indices/decoding ≠ verified palette ownership.
- Identified sequence ≠ canonical runtime duration or display placement.
- Headless scanner verification ≠ browser UI verification.
- Preserve executable/resource hashes and source provenance in evidence records.

## Project continuity

A new MK Dos Extractor conversation should start with `PROJECT_STATUS.md`, the latest verified source commit, the current branch, and the outstanding checkpoint issue before making source modifications.
