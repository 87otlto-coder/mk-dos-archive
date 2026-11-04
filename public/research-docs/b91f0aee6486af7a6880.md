# MK DOS Archive — Master Handoff Through UI.1 / O192

**Date:** October 14, 2026  
**Authority:** UI.1 / O192 (navigation + historical library) on top of O191 source.  
**Previous historical research:** O191 and every earlier research file retained; full O191 handoff preserved verbatim below.

## User decision

The project remains a **research tool** for us, but will be presented as a **museum above, forensic laboratory below**. The separate future extractor/compiler product roadmap remains distinct. This release addresses discoverability and research browsing, not source reconstruction mechanisms.

## UI.1 changes

- New persistent Museum / Laboratory sidebar and game identity header.
- Museum overview, file-aware asset library, stage gallery.
- Strict on-demand Portal/Tomb/Tower original effect sequence viewer (20/16/7 source frames). Preview animation timing is editable but is explicitly not a proven native FPS.
- Laboratory workbench grouping the original MK1/MK2 tools behind independent, intentional launches.
- Searchable historical markdown research library with 385 byte-exact source records, browsable without selecting a game directory.
- Existing O191 MK1 read-only fallback unchanged in principle, with a small pre-filter hook for library navigation.
- O138 loose historical evidence now incorporated into `legacy_evidence/o138/` as preserved original files.
- One-click Windows development/test runners supplied, and UI guide added.

## Validation

- New UI modules parsed/transpiled cleanly with local TypeScript.
- `scripts/verify-ui-foundation.mjs`: 395 passed checks, including the source/research index comparisons.
- Original MK2 fixture validation: Portal 3 tracks/20 frames, Tomb 2/16, Tower 1/7.
- O191-to-UI.1 SHA-256 audit: no files removed; existing changes restricted to the app integration, app metadata, a small asset library hook, and package scripts. Research engines and inherited source records remain unchanged.
- The new source does NOT bundle original commercial `.EXE` / `.GRA` files.

### Remaining required test

Npm package downloads were blocked in this runtime (`EAI_AGAIN` / incomplete `npm ci`). **Full React/Vite build and actual web UI interaction are not yet executed or certified**. The Windows `TEST_UI_FOUNDATION_1.cmd` runs the required checks after npm dependencies install. This release is suitable for hands-on UI feedback but should be treated as *source-verified / browser runtime pending*.

## Next UI work

1. User checks the Museum/Laboratory navigation and the read-only asset browser using an actual MK1/MK2 directory.
2. Fix any live browser issues before expanding features.
3. Develop the proper stage composer from independent original layers (not screenshot cleanup), following Portal as the reference.
4. Add bidirectional source/asset provenance links and persistent cached research results.

