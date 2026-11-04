# MK DOS Archive — O190 UI Browsing Guide

Date: 2026-10-14

## Purpose

This note explains how to browse the current MK2 findings in the browser UI using the verified source package through O190.

## Current UI status

The source tree contains a browser UI centered around `src/App.tsx`. For MK2 directories, the app currently exposes the following major surfaces:

- `AssetBrowser` — broad file/asset browsing for detected MK2 directories
- `MK2FoundationPanel` — O67–O89 foundation, indexed graphics, palette and fighter bundle work
- `MK2ObservedStageFloorPanel` — observed and native floor previews
- `MK2IndexedStageMosaicsO122` — stage browsing, setup-local indexed previews, native floor browsing, and O136/O176 original effect-frame browsing/export

These surfaces are already the main entry points for browsing background findings and comparing what has been discovered across stages.

## Recommended browse flow

1. Start the Vite app in the normal development environment.
2. Select an original MK2 installation directory.
3. After detection resolves to MK2, use:
   - `AssetBrowser` for broad resource inspection.
   - `MK2ObservedStageFloorPanel` for floor-specific evidence.
   - `MK2IndexedStageMosaicsO122` for stage-by-stage browsing.
4. In `MK2IndexedStageMosaicsO122`, switch between stages such as Tomb, Portal and Tower to compare:
   - indexed setup-local preview output
   - full-width native floor layers
   - original effect sequences, where available

## Important scope notes

- The UI is suitable for browsing the current findings and comparing discovered stage/background evidence.
- O188/O189 Portal scene-context renders remain research outputs, not yet integrated as a first-class deterministic scene compositor in the browser.
- Full runtime-accurate stage compositing is still an open research target.

## Build verification boundary

This environment does not contain installed npm dependencies, so a full local `vite build` / live browser run was not executed here. The source package is updated to reflect the O190 checkpoint and browsing guide, but the complete browser build still needs to be run in the ordinary project environment.
