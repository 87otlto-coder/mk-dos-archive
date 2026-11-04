# MK DOS Archive — source continuation checkpoint through O93

**Date:** 2026-10-07 (SAST)  
**Base:** `MK-DOS-Archive-2026-10-07-O92-source.zip`  
**Status:** O67 fixture-envelope validation corrected; authentic 613-file and 614-file MK2 installations are both accepted under explicit, bounded rules.

This checkpoint is a narrow correction to the MK2 O67 foundation validator. It does not weaken the executable/resource checks and it does not change the O92 U8 conclusions.

## O93 — MK2 O67 authentic fixture envelope correction

A user runtime test exposed this O67 failure on an otherwise recognized MK2 installation:

`O67 validation failed: fixture_file_count, fixture_total_bytes`

The earlier project inventory independently records an authentic MK2 installation with:

- 613 regular files;
- 19,914,286 total bytes.

The newer canonical fixture contains:

- 614 regular files;
- 19,921,006 total bytes.

The complete difference is one root file:

- `ULTRAMID.INI`;
- 6,720 bytes;
- SHA-256 `00a280d61e5017744351f0167c80e2d247584028ddacc3f6ed941ec8e405be5d`.

The canonical `MK2.EXE` and `GMI.BIN` identities remain unchanged. `ULTRAMID.INI` is therefore treated as an optional installation-envelope file, not as a prerequisite for O67's executable/resource topology.

### Accepted envelopes

O67 now accepts exactly two coarse installation envelopes:

1. `WITH_ULTRAMID_INI`
   - 614 files;
   - 19,921,006 bytes;
   - if `ULTRAMID.INI` is present, it must be exactly 6,720 bytes and match the SHA-256 above.
2. `WITHOUT_ULTRAMID_INI`
   - 613 files;
   - 19,914,286 bytes;
   - `ULTRAMID.INI` absent.

All existing O67 structural checks remain active, including canonical `MK2.EXE` hash, LE topology, resource filename pool, GRA/BIN/U8/SOUND counts, resource presence, and JC0 pool position. This is not a general "613 or 614 files are fine" relaxation.

### Direct validation performed

Using the user-supplied canonical `mk2.zip`:

- 614-file fixture with canonical `ULTRAMID.INI`: **PASS**;
- same fixture with only `ULTRAMID.INI` removed: **PASS** as `WITHOUT_ULTRAMID_INI`;
- same 614-file fixture with `MIDWAY.GRA` removed instead (also 6,720 bytes): **FAIL**, including the envelope/resource checks.

This distinguishes the known optional MIDI configuration file from an arbitrary missing file of the same size.

### Independent audit alignment

`scripts/audit-mk2-o67-o68.py` has been updated to recognize the same two bounded envelopes and verify the canonical `ULTRAMID.INI` hash when present. This prevents the independent audit from retaining the superseded hard-coded 614-file assumption.

## Build/runtime status

The source correction is included in this checkpoint. The bundled `dist/` remains the pre-O91 October 7 compiled build because a fresh Vite dependency set is not available in this execution environment. Therefore launching the bundled prebuilt runtime does **not** prove that O93 is present in generated JavaScript. A normal development environment should run:

```text
npm install
npm run lint
npm run build
```

before testing O93 through the browser UI.

Do not hand-edit `dist` to simulate the change.

## O92 status unchanged

The MK2 U8 work remains fail-closed:

- signed 8-bit PCM at the GMI runtime mixer: established;
- runtime sample descriptor start/end/loop roles: established;
- exact on-disk PCM byte range: unresolved;
- disk-to-runtime `+0x04` transformation: unresolved;
- WAV adapter: not yet authorized.

The next forensic task remains tracing the MK2 disk-to-runtime U8 descriptor bridge using the authentic fixture.
