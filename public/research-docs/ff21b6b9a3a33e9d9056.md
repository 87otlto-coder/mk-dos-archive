# Architecture

## Conceptual Layers

1. **FORENSICS**: Directory discovery, file inventory enumeration, signature identification, and evidence-based game detection.
2. **RAW ASSETS**: Reading raw binary streams, basic header inspection, and candidate categorizations without full semantic decoding.
3. **RELATIONSHIPS**: Mapping pointers, object tables, sprite indices, palettes, and sequence definitions extracted from executables and data files.
4. **RECONSTRUCTION**: Assembling semantic assets (fighters, frames, palettes, animation sequences, arenas) ready for inspection and export.

## Hard Architectural Boundaries

- **UI Boundary**: UI components must never directly parse game binary formats or executables. All analysis is driven through core and game engines.
- **Game Isolation**: All game-specific logic, heuristics, and format specifications must remain isolated under `src/games/`.
- **Generic Core Utilities**: Reusable binary readers, filesystem abstractions, and generic signature classifiers reside strictly under `src/core/`.
- **Preservation Principle**: Unknown resources are preserved as first-class entries with full metadata rather than discarded or ignored.
- **Provenance Retention**: Source file provenance (path, relative directory, size, original offset) must survive every transformation and processing layer.
