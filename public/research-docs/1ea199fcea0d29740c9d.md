# Architecture & Design Decisions

- **D001 — Directory-first source selection**: The tool operates directly against user-selected local directories via the File System Access API without uploading files or relying on pre-packaged static ROM bundles.
- **D002 — Preserve unknown files/resources**: Any unrecognized file extension or binary header is retained as a first-class `Unknown` entry in the inventory, ensuring full forensic visibility.
- **D003 — UI cannot parse game formats**: UI components are restricted to presentation and interaction dispatch; data extraction and format detection are executed purely in `src/core/` and `src/games/`.
- **D004 — Game-specific parsers remain isolated**: Logic specific to MK1, MK2, or MK3 is strictly contained within its respective `src/games/mkX` directory.
- **D005 — Provenance is first-class data**: Every asset and inventory entry permanently tracks source path, size, and origin.
- **D006 — Research confidence is explicit**: Confidence values (`verified`, `inferred`, `hypothesis`, `unknown`) are surfaced directly in models and UIs.
- **D007 — English-only personal-use scope**: Focus is maintained on research and asset reconstruction for the DOS PC releases without out-of-scope regional localization layers.
