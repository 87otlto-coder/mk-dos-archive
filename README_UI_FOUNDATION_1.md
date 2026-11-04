# MK DOS Archive — UI Foundation 1

Checkpoint: **UI.1 / O192** (2026-10-14)

## Design concept

**A museum above, a research laboratory below.** This is a new navigation and presentation layer over the original MK1, MK2 and MK3 research. Nothing in the existing decoders, authoring verification gates or original source documentation has been rewritten for the redesign.

### Museum

- Overview: game identity, directory coverage and quick navigation.
- Asset library: pre-existing source decoding, search, inspection, export and composition tool; now independently navigable. O191 MK1 read-only fallback remains present.
- Stage gallery: derived from the actual original `.GRA` files found in the selected directory, with honest completeness labels. The visual tiles are **abstract navigation markers**, not reconstructed game art.
- Original MK2 effects: Portal, Tomb and Tower have an on-demand, strict source-verified frame viewer. Select a stage tile's **Original frames** action. Its animation speed is a user-adjustable preview, not claimed native FPS. Decoding failures remain isolated to that preview.

### Laboratory

- Research workbench: existing MK1 and MK2 advanced panels behind independently opened research groups. These are deliberately not prerequisites for asset browsing.
- Research archive: searchable original markdown history. You can browse even when no game directory has been selected. All displayed documents are byte-exact copies of the original markdown records.
- File inventory: existing detection evidence and original directory/file inspection.

## Run on Windows

Unzip the source to a development folder. The source ZIP contains a single `MK-DOS-Archive` root folder.

The easiest path is to double-click `RUN_UI_FOUNDATION_1.cmd` in that folder. Node.js/npm are required; on first launch the script will install the project npm dependencies, perform the source-document checks and launch Vite. Open **http://localhost:3000** in the browser.

To run the additional production-build validation, double-click `TEST_UI_FOUNDATION_1.cmd`. It performs the source checks, TypeScript check and full Vite build.

You may also run from a terminal:

```
npm ci
npm run verify:ui-foundation
npm run lint
npm run build
npm run dev
```

The research markdown index can be regenerated without changing the original records:

```
npm run refresh:research-library
```

## Use

1. Choose **Open Game Directory** and select `mk1`, `mk2` or `mk3`, or select **Open Game ZIP**. For GOG installations with many test copies, select the exact original `mk2` directory rather than a parent containing multiple `MK2.EXE` files.
2. Browse **Museum → Asset library**, then click **Decode & browse** to use the existing asset tools.
3. Browse **Museum → Stage gallery**. For MK2, click **Original frames** on Tomb, Portal or Tower to see the extracted source frames.
4. Browse **Laboratory → Research archive** for O-series checkpoint names and historical handoffs.
5. Browse **Laboratory → Research workbench** for the earlier research and specialist authoring tools.

## Evidence boundaries

- The O187 Portal seven-pose visual matching remains recorded, but the game clock and final composite stage position remain unresolved.
- The stage gallery is a resource browser, **not a complete deterministic stage composer**.
- The original browser editor and research tool safety contracts remain untouched.
- A strict original game executable or `.GRA` fingerprint may be needed for particular lab tests. This requirement does not block the general museum resource listing.

## Verification and provenance

- Direct source-level type syntax check: passed for all modified TSX files using the local TypeScript compiler.
- `npm run verify:ui-foundation`: 398 checks passed, including 388 original markdown records copied byte-for-byte.
- Original MK2 fixture decoder: Portal 20 frames in 3 lists, Tomb 16 in 2, Tower 7 in 1 — all passed source checks.
- File integrity: all 2,333 O191 source files remain present. See `UI_FOUNDATION_1_INTEGRITY_AUDIT.json`.
- O138 loose evidence recovered from its earlier preserved ZIP under `legacy_evidence/o138/`.

**Runtime boundary:** `npm ci` could not complete in the current execution environment due to an unreachable npm registry; full `npm run lint`, `npm run build` and live React/browser interaction have not been verified here. Use `TEST_UI_FOUNDATION_1.cmd` in your normal Windows development environment before considering the UI build qualified. Do not claim runtime build success until it actually runs.
