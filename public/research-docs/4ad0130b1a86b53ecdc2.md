# MK DOS Archive — O191 MK1 Asset Browser Guard Isolation

Date: 2026-10-14

## Trigger

The user loaded an MK1 installation and clicked **Decode & browse**. The Asset Browser rendered:

`1E.3O.4 is bound to the canonical MK1.EXE fixture`

This was a user-facing workflow failure, not evidence loss. The shared MK1 browser backend called `runMK1Pipeline`, which unconditionally invoked the Rayden-specific O4 fixture gate, despite the user only requesting read-only asset browsing.

## Correction

- Keep the original O4 / Rayden editor's canonical SHA-256 and exact-writer guards intact.
- In the browser-only `scanAssets` route, preflight the selected MK1.EXE SHA-256 against the qualified source identity.
- If it differs, load `scanMK1ReadOnlyFallback`; do not execute editor/reassembly code on the modified EXE.
- If the identity matches but a later research step still rejects the source, fall back read-only and expose the original failure reason in the evidence report. Abort requests are not converted into fallback.
- Browse and losslessly export original `.GRA` files from the selected installation.
- Independently attempt the previously authenticated 187-descriptor Kano run ONLY when the original EXE/file-size and first-descriptor anchors still match. Every descriptor and every uGRA decode is checked; a failed or partial run produces no pseudo-verified sprite count.
- Optional previews are explicitly grayscale source indices, **not** original palette ownership.
- Show a persistent amber read-only notice, even if the evidence accordion is collapsed.

## Validation

- Targeted TypeScript type-check for changed core source: PASSED (test-only Node process declaration used in this isolated dependency environment).
- Synthetic modified EXE + two original-sized `.GRA` resources: read-only browsing path returned usable raw assets and no crash.
- Synthetic metadata-only Kano descriptor layout + constructed noncommercial transparent RLE rows: 187/187 indexed previews decoded and surfaced.
- Deliberately corrupted Kano descriptor: preview was withheld, raw GRA remained exportable.
- Missing GRA resource: hard failure with a specific diagnostic.
- No source byte writes occur in the fallback.
- Full React/Vite build, browser interaction, real Windows file picker, and patched actual MK1 installation remained untested in this environment.

## Verification discipline

This pass fixes the **browser-only rejection path** and does not promote a new universal MK1 format, original palette selection, or compiler write support. No MK2 source modules were changed. Original research scripts and historic data are retained byte-identically.

## User acceptance

Select the same MK1 directory and click `Decode & browse`. A modified MK1 should now enter read-only mode with an amber explanation and browsable GRA resource cards. If original Kano descriptor anchors are intact, 187 grayscale Kano previews should appear. Use the canonical untouched MK1 installation for the specialized editing/reassembly workflows.
