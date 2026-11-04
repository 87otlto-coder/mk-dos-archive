# O199.1 — Vite parse-error hotfix (2026-10-15)

O199 remains the research checkpoint. **O199.1 is a source-release repair**, not a new Forest research discovery.

## Cause

`src/core/experiments/o199.ts` line 119 incorrectly used a Python-style `'''...'''` delimiter in a TypeScript `utf8.encode(...)` call. The string contains escaped `\n` sequences and begins with Markdown `# Instruction-level interpretation`. Since JavaScript has no triple-single-quote string syntax, Vite/esbuild parsed the Markdown heading as source code and stopped at line 119. In the original release the generated `evidence/source_instruction_explanation.md` was also empty.

## Fix

- Change only the malformed quoted Markdown literal in `src/core/experiments/o199.ts`, retaining the explanatory text byte-for-byte.
- Tighten `scripts/verify-o199-fixture.cjs` to **surface TypeScript transpilation errors** and use project-local TypeScript on Windows instead of requiring a Linux-only absolute path.
- Add `scripts/check-source-syntax.cjs`, which parses all TS/TSX source files using TypeScript and fails if any have syntax diagnostics.
- Add `npm run test:syntax` to package scripts.

No decoding algorithm, executable offset, byte verifier, branch analysis, palette, renderer, or game binary was modified.

## Updating an existing O199 checkout

**Quick fix:** Extract `MK_DOS_Archive_O199_1_Quick_Patch_2026-10-15.zip` into your existing `MK-DOS-Archive` root folder, allowing its relative paths (`src/...`, `scripts/...`, `package.json`) to replace the corresponding files.

**Full replacement:** Extract `MK_DOS_Archive_Source_O199_1_Syntax_Hotfix_2026-10-15.zip` to a clean folder and use it instead of the previous O199 source folder. The full source ZIP intentionally does not include commercial MK2 EXE/GRA files.

## Verify on Windows

From `MK-DOS-Archive` after `npm ci`:

```cmd
npm run test:syntax
npm run build
npm run dev
```

The syntax gate and fixture test passed in the authoring environment. **A full React/Vite build and browser smoke test were not run here:** `npm ci --offline` cannot find `yallist@3.1.1` in the local npm cache. You can run the build in your environment with installed dependencies.

## Verification and limits

- All 349 TS/TSX source files parse with zero errors after the hotfix.
- The original O199 `o199.ts` emits two parser errors; the fixed version emits none.
- O199 original MK2 fixture check passes against the canonical `MK2.EXE`, including rejection of a modified executable and deterministic forensic ZIP generation.
- Forensic export has the same nine entries as the previous O199 evidence archive; the only changed entry is `evidence/source_instruction_explanation.md`, which is now correctly populated (1,051 bytes versus 0 bytes).
- The source integrity audit records exact SHA-256 hashes and the changed/new-file list. No O199 inherited files have been deleted.

