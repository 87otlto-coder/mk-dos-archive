# Cycle 3 · MK2 stage extraction and verification

Continuation of `1c5ad1c6c2420471432b5badbf3cb1235af95a14`. The canonical checkout reported that branch and commit via its Git ref files. Git status on F: was denied by the sandbox, so local working-tree cleanliness was not established. Development used isolated staged source and a dedicated GitHub continuation branch.

## Capabilities

| Capability | Scope | Evidence |
|---|---|---|
| Indexed extraction | Existing 456 MK2 source representations | Prior fixture regression remains the baseline. This branch leaves the sprite decoders, source program reader, and prior tests intact. |
| Stage structure | Tomb, Portal, Tower × modes 1, 2, other | VERIFIED STATIC. Nine manifests matched P90 root spans, ordered bindings, origins, state channels, centers and draw commands. |
| Stage source components | Tomb and Portal source-local P82 layers and packed floors | VERIFIED STATIC for hash-pinned P82 planes and original GRA identities. Tower is a stage-structure holdout. |
| Conditional viewport contributions | Tomb and Portal mode 2, initializer and +32 vectors | Eighteen index and mask pairs matched independent P90 hashes. VGA palette, live transforms, object activation and compositing remain UNKNOWN. |
| Authentic viewport | P91 Tomb mode 2 | VALIDATION PENDING. [Runtime recovery checkpoint](P91-CYCLE3-RECOVERY.md). |

The stage command reads the authenticated original EXE's root table, setup and draw programs. It preserves disabled sentinels and untouched slots separately. Setup addresses, signed origins, dimensions, control and sprite table pointers, list heads, and state channels come from the original records and verified source rules. Four O120-qualified palette families expose source record links only. It does not infer DAC allocation. The parser is locked to the fixture fingerprint and checked against references previously qualified by P90's independent initializer replay.

The component exporter uses Python with Pillow and calls the Node stage inspector. It reads the existing private P82 package, authenticates the original stage GRA, joins only selected setup addresses, and reports missing selected setups. The static component archive SHA-256 is `d66a8099721391a6606297b50057213a8ad459ffc773fe652ce112583bb777d9`. Each export preserves raw local indices and an explicit 0/255 opacity plane. Projected opaque index zero remains distinguishable from uncovered pixels. The diagnostic PNG maps index intensity to gray and gives uncovered pixels zero alpha. Individual contributions remain separate.

## Test record

- Spelunks 001–009: 164 passed across nine runs using the maintained replay script and private original fixtures. The 002 advance opcode is at 0x81F9E. Its root mutation hits the channel-zero base guard. The corrected 004, 005, and 007 assertions recognize the strict earlier relocation or pointer guard. Historic source remains untouched.
- Original-fixture stage tests: 2 passed. The P90 comparison test covers nine manifests and Portal's explicit mode-2 skip and palette-pointer relationship.
- Stage-component tests: 2 passed. The fixture-dependent test checks 18 independently pinned pairs, or 1,152,000 index positions plus 1,152,000 opacity positions. The original-free control distinguishes an opaque zero from an uncovered pixel.
- This session's local Windows runtime became unavailable before a fresh aggregate fixture regression and export readback could run. The previous cycle's 18/18 original-fixture result has not been counted as a new run. A Windows-only original-free job was added with no artifact upload. Consult its result separately.

## Windows usage

Use a checkout of `feat/headless-mk2-stages` in the canonical SOURCE tree. If it was originally cloned with a single branch, fetch this branch explicitly. The switch command below is for the first checkout of the branch.

```powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext-headless'
git fetch origin feat/headless-mk2-stages
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed' }
git switch -c feat/headless-mk2-stages FETCH_HEAD
if ($LASTEXITCODE -ne 0) { throw 'Branch switch failed' }

$mkRoot = 'F:\Dev\MKEXT\FIXTURES\mk2\mk2'
$p82 = 'F:\Dev\MKEXT\FIXTURES\VALIDATION\P82-LAYERS-665462781a7544f3909d48c3edf553a1.zip'
node .\headless\cli.mts stage $mkRoot portal 2
python .\headless\stage-components.py $mkRoot $p82 tomb 2
python .\headless\stage-components.py $mkRoot $p82 tomb 2 --component floor --projection initial --output 'F:\Dev\MKEXT\FIXTURES\VALIDATION\cycle3-tomb-floor-initial'

$env:MK2_DOS_FIXTURE = $mkRoot
$env:MK2_P82_ARCHIVE = $p82
node --test .\headless\test.mts .\headless\source-sprites.test.mts .\headless\source-program.test.mts .\headless\stage-setup.test.mts
python .\headless\test-stage-components.py -v
```

For historical replay, pass a separate checkout of `research/spelunk-010-mk2-source-export-contract` under SOURCE, followed by the canonical MK2.EXE path and `F:\Dev\MKEXT\FIXTURES\mk2.zip`, to `python .\headless\replay-spelunks.py`. The script copies only the historical research suites to a temporary directory, applies fail-closed targeted edits, and stops on a test failure.
