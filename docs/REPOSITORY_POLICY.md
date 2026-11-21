# Repository policy and checkpoint practice

## Active product milestone — 2026-11-21

Deliver an **MK2-first creative toolkit** for Living Forest and later stage wallpapers, source-backed sprite animation exports, WAV effects and MIDI/music. Finish MK2 v1 before beginning MK1 and then MK3. Do not gate useful creative exports on exact original DOS palette ownership, framebuffer parity, native timing or hardware-perfect music. Keep original source pixels, masks and audio/music data correct; mark visually chosen placement, palette and timing **CREATIVE**. The detailed, authoritative [active SOP](MK2_CREATIVE_TOOLKIT_SOP.md) supersedes historical priority instructions.

## Branches

- `main`: accepted source checkpoint and durable project documentation.
- `develop`: intermediate code changes, protected by focused fixture tests and reversible patches.
- Work one end-to-end user deliverable at a time. First: a visually reviewed, playable **Living Forest Wallpaper v0.1**. Run focused regressions and consolidate when results justify a checkpoint; a fixed five-pass research cadence is no longer mandatory.
- **Never equate a GitHub documentation commit with a complete source import.**

## Source import guardrails

- **Historical P6 import procedure only:** initial import started from frozen P6. **Do not restart new product development at P6**; extend the verified headless MK2 branch and reuse existing audited legacy implementations.
- Verify P6 source ZIP SHA-256: `49cf14b72475189bcb8be53fe6ad1d11e4b145205b9e4012c4c2320235a7735e`.
- Keep P7→P10 small patches in order; no history rewrite or source deletion.
- Do not commit original commercial `MK1.EXE`, `MK2.EXE`, `MK3.EXE`, game directories, `.GRA`, `.FTR`, audio/music extracted from commercial fixtures, DOSBox captures, original game ZIPs, or confidential/sensitive files.
- Review repository paths and ignore rules before the initial source import. Preserve **research code and reports** that are safe to publish privately; separately handle evidence containing original game bytes.
- Avoid committing `node_modules`, build outputs, fixture caches and transient verification files.
- Never commit secrets, PATs or authorization tokens.

## Confidence and test requirements

- Verified, inferred, hypothesis and unknown must remain distinct. Creative visual/audio presentation choices must be labeled CREATIVE and must never be presented as native runtime proof.
- Exact source indices/decoding ≠ verified palette ownership.
- Identified sequence ≠ canonical runtime duration or display placement.
- Headless scanner verification ≠ browser UI verification.
- Preserve executable/resource hashes and source provenance in evidence records.

## Project continuity

A new MK Dos Extractor conversation should start with [the active SOP](MK2_CREATIVE_TOOLKIT_SOP.md), `PROJECT_STATUS.md`, the latest verified source commit, the current branch, and the outstanding checkpoint issue before making source modifications.
