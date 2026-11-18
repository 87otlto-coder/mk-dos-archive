# MK2 source-program consolidation

Tested source f26e2c36938dfb824e89d95a36a6427a536909dc, based on c56e7495aa4789653e8e81e4bf606980ea6fe03b. Start with the [research verification register](SPELUNK-VERIFICATION.md) and [runtime evidence](P90-P91-VALIDATION.md).

## Headless capabilities and coverage

| Game / original resource | Unique streams or existing representations | Source relationship coverage |
|---|---:|---|
| MK1 | 0 | Deferred |
| MK2 PROBE / ACCLAIM | 31 | Existing original intro source order |
| MK2 MOUNTAIN | 15 | Existing six conditional source lists |
| MK2 ARMORY | 12 | One 12-entry list |
| MK2 FOREST | 7 | One 20-entry list with repeats and reversal |
| MK2 SOUL | 17 | Three-entry rewind phase and 14-entry finite phase |
| MK2 FIRESKEL | 12 | Two conditional six-entry lists |
| MK2 BANG | 101 | Eleven selected lists, 95 entries, 93 distinct list descriptors; plus three signed-coordinate groups and 12 palette anchors |
| MK2 SUCK | 83 | Twelve slots alias nine nested groups; three suffix lists plus a separate descriptor lookup |
| MK2 BLOOD | 178 | Eighteen lists, 155 entries, 153 listed descriptors; two interior rewinds, four alternate entry points, 22 palette anchors, constructor and placement references |
| MK3 | 0 | Deferred |

410 new source-qualified indexed streams, or 456 combined with the 46 existing headless representations. These are source counts, with one descriptor per unique authenticated offset per migrated resource. Distinct visual artwork and runtime frames were not counted. Repeated list entries, selector aliases and palette anchors add no graphics. SOUL, BANG, SUCK and BLOOD cover their bounded original resources completely. ARMORY, FOREST and FIRESKEL are selected cohorts. No comparison or addition to the legacy application census is implied.

Schema 1 source-program JSON records Object2 sites, descriptor targets, asset IDs, marker and rewind targets, palette references and selector choices. The interpreter, constructors and conditional paths are source evidence. Runtime activation, allocation, timing, placement and DAC ownership remain UNKNOWN. Five Blood structural-only lists and two Bang secondary groups retain unknown consumers. Direct descriptor+12 palette references are carried in Bang and Blood asset metadata only for authenticated anchor descriptors.

## Commands

Use a checkout of this continuation branch. The current session read private fixtures from F: and verified staged copies of committed source, since the sandbox refused Git operations on the canonical checkout.

```powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext-headless'
git fetch origin feat/headless-mk2-source-programs
git switch --track origin/feat/headless-mk2-source-programs
$mkRoot = 'F:\Dev\MKEXT\FIXTURES\mk2\mk2'
node .\headless\cli.mts list $mkRoot forest.gra
node .\headless\cli.mts relationships $mkRoot blood.gra
node .\headless\cli.mts extract $mkRoot suck.gra 0 'F:\Dev\MKEXT\FIXTURES\VALIDATION\headless-suck-000'
$env:MK2_DOS_FIXTURE = $mkRoot
node --test .\headless\test.mts .\headless\source-sprites.test.mts .\headless\source-program.test.mts
```

## Regression and migration

- Windows Node 24.20.0 original-free suite: 5 passed, 13 fixture-dependent skips. Canonical MK2 fixture: 18 passed, 0 failed, 0 skipped. Existing P12/P13 planes, masks, diagnostics and CLI regressions passed. Separate processes reproduced byte-identical Blood preview packages and relationships. CLI refused overwrite and invalid ordinal.
- Seven resource fingerprints and authenticated descriptor/stream bounds are in `spelunk-index.json`. Each plane reference is SHA-256 over the concatenated binary SHA-256 digests of independent Python producer planes ordered by original resource byte offset and descriptor. Each exported asset also contains the encoded stream and input SHA-256 provenance.
- `build-spelunk-index.py <reports-folder> <owner-zip> <output-index>` regenerates the index and seven program ledgers. Place the historical Spelunk 004/005 source directories under `<reports-folder>/scripts/research/`. Run the exact 003–009 producers with `--game-zip` and fresh `--out result-N.json` destinations. The eight supplemental Bang descriptors are decoded by Spelunk 005 and checked against its paired-record spans and hashes.
- The native DWORD row-command decoder ports the bounds, padding, skip/mask and repeat semantics used by the committed Spelunk 003/004/006 reproducers. Spelunks 005/007 supply the Bang/Blood stream census and 008/009 supply qualified palette-source anchors and constructor evidence.
- Historical Spelunk and P18 files were retained on their original branches. The P18 exact 43+14 guard was verified by committed source inspection on the research lineage. P18 is absent from the stable headless baseline and its end-to-end runtime/browser regression was not executed. This implementation does not import it or modify its contract.
- P90 initializer/camera and P91 original-free and original-mapping results are documented in [runtime evidence](P90-P91-VALIDATION.md). No MK2 runtime packet was captured or viewport reconstructed. No P91 executable was built in this run.

Highest-value remaining work: recover the pinned P91 portable build and qualify one original Tomb packet. For static extraction, port the authenticated stage setup and layer references from Spelunks 001–002 and P90 before attempting complete stage rendering.
