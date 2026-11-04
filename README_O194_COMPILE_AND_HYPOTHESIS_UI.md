# MK DOS Archive O194 — how to use the new workflows

This is a research application. Run these workflows against **copies or unmodified original source directories**. Nothing in O194 writes to an MK game file.

## Windows setup

1. From the `MK-DOS-Archive` source folder, install dependencies with `npm ci` (requires internet access for the package registry), then run `npm run build` and `npm run dev`.
2. Open `http://localhost:3000`.
3. Select the folder containing the actual source files of one game (MK1 or MK2). This selection stays on your computer.
4. Open **Laboratory → Compile & hypotheses**.

## Compile All Knowns

Click **Compile All Knowns**. The UI reports each independent successful, partial, unsupported or failed operation. It then invokes the existing verified deep asset-browser pipeline, which can take several minutes. You can cancel if necessary; already-completed local findings remain in the running session. Successful output appears as a searchable catalogue. The Museum Asset Library can use that output without requiring another scan.

**Export:** choose `Complete forensic ZIP` for all machine-readable evidence and reproduction instructions, or `Visual review ZIP` for the lighter review package. A deep-scan failure is recorded, not disguised as a missing game or successful compile.

## Portal → Forest hypotheses (MK2 only)

Select which borrowed rules to test and click `Run bounded experiment`. This checks the source-linked stage control streams. It does NOT run an unknown Forest sprite decoder, claim an original palette or reconstruct a complete stage. The result will often be partial/unsupported, which is useful research evidence.

Export the full forensic ZIP when sharing results in a new conversation; it records exact source hashes, O130 instruction-linked operands, successful and blocked hypotheses, diagnostic execution steps and reproduction parameters. `Import forensic ZIP` opens a previous O194 hypothesis package for review **without trusting its claims**.

## Asset library navigation

You can navigate between Museum and Laboratory without destroying the asset browser's current filters, focused item or selection. Use **All assets (keep filters)** in its inspector to close the detailed asset view, or **Reset filters** to return to the complete list.

## Verification scripts (optional, developer use)

`npm run test:o194:fixture -- "C:\\path\\to\\original-MK2-files"`

`node scripts/verify-o194-mk1-fixture.cjs "C:\\path\\to\\original-MK1-files"`

These require original game files in the specified folder; original game binaries/resources are NOT bundled with the development release.

## Status

O194's original-fixture runtime-independent smoke tests passed. The full React/Vite build requires separate verification in a local environment with npm dependencies installed. See `CHECKPOINT_2026-10-14_O194_COMPILE_HYPOTHESIS_EVIDENCE.md`.
