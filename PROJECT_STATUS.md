# MK DOS Extractor — project status

**Last status reconciliation:** 2026-11-07
**Project:** ChatGPT Project “MK Dos Extractor”  
**GitHub:** https://github.com/87otlto-coder/mk-dos-archive

## P45 current MK2 acceptance - 2026-11-07

**P41-P45 implemented and locally verified on develop.** P41 is the consolidated source checkpoint; P42 audited TOWER, P43 integrated its seven existing effect streams, P44 independently verified all 43 effect exports and native coverage, and P45 adds the repeatable acceptance runner. No new artwork or asset-count inflation.

- **P45 PASS: 23 cumulative MK2 suites plus PORTAL/TOWER gates**, 5,369 representations / 4,357 cumulative checks; independent **315 source references / 7,064,335 decoder checks / 171,036 export checks**. Eight false reports and six altered exports rejected; clean reverified.
- **315 qualified references / 1,064,632 union bytes**; P37/P38/P40 report hashes preserved. TOWER has 14 references accounting for all 113,612 native resource bytes. Native byte accounting remains separate from complete scenes/runtime behavior.
- P45 runner **six preflight refusals / seven source-audit negative controls PASS**. P41 full three-game result remains MK1 2,656 / MK2 5,369 / MK3 9,186 with twelve independent image families and 54 falsified-export controls.
- [P45 handoff](docs/EXTRACTOR_P45_CURRENT_MK2_ACCEPTANCE.md), [results](docs/validation/P45_MK2_ACCEPTANCE_2026-11-07.json). Complete source/CI associations follow committed verification. Next **P46 consolidation assessment**, not begun. Main unchanged.

## P44 independent effects/export verification - 2026-11-07

**315 original references / 43 existing effects PASS**: 7,064,335 original-file decoder checks and 171,036 PNG/native-plane export checks. **Eight false reports / six altered exports rejected**, clean reverified. Preview RGB roundtrip is not native palette ownership. No runtime changes. [P44 proof](docs/EXTRACTOR_P44_EFFECT_EXPORT_PARITY.md), [results](docs/validation/P44_EFFECT_EXPORT_PARITY_2026-11-07.json). Next P45 current MK2 acceptance runner. Main unchanged.

## P43 TOWER report integration - 2026-11-07

Focused original-fixture gate PASS: **315 qualified references / 1,064,632 source union bytes**, TOWER **14 references / 113,612 bytes / zero gaps or overlap**. Seven existing effects joined; **5,369 representations unchanged**. Ten invalid effect sets rejected; P37/P38/P40 report hashes and fourteen other resources preserved. Local syntax/TypeScript/build pass. [P43 handoff](docs/EXTRACTOR_P43_TOWER_COVERAGE.md), [evidence](docs/validation/P43_TOWER_COVERAGE_2026-11-07.json). Next P44 independent effects/report validation, then P45 full current MK2 acceptance. Main unchanged.

## P42 TOWER original-source audit - 2026-11-07

**Seven existing effect streams / 34,716 decoder checks PASS**, covering **[40776,56268), 15,492 encoded bytes / 17,325 pixels**. Writer/list/descriptor/native plane proof preserved; no runtime changes or new images. [P42 audit](docs/EXTRACTOR_P42_TOWER_SOURCE_AUDIT.md), [evidence](docs/validation/P42_TOWER_SOURCE_AUDIT_2026-11-07.json). Next P43 report integration; P41 remains consolidated checkpoint. Main unchanged.

## P41 consolidated source checkpoint - 2026-11-07

**P41 consolidates P37-P40 on develop; main remains P16.** Fresh **25 three-game suites plus P40 fixture gate PASS**: MK1 **2,656**, MK2 **5,369 / 4,357 checks**, MK3 **9,186**. Twelve independent image families **251 representations / 939,903 pixels / 10,712,883 checks**, **54 false exports rejected**. Prior coverage/claim controls pass; no runtime changes.

MK1/MK3 decoded visuals match P21/P26/P31/P36; browser/native behavior remains separately qualified. Local syntax/build/TypeScript and eight preflight/seven source-audit negative controls pass. [P41 checkpoint](docs/EXTRACTOR_P41_SOURCE_CHECKPOINT.md), [evidence](docs/validation/P41_CHECKPOINT_2026-11-07.json). Source audit/CI result will be associated after the committed checks finish. Next P42-P45 bounded TOWER/report/export acceptance work. Main unchanged.

## P40 PORTAL integration - original-fixture acceptance verified, 2026-11-07

**P40 acceptance PASS on complete committed source dfe700aa698e6b0d4399f1da1813a66f96b29b58.** PORTAL has **34 qualified references / 92,756 covered bytes / zero gaps or overlap**; twenty existing effects added to accounting scope, **no new assets**. MK2 remains **5,369 unique representations**.

- Fresh **23 cumulative MK2 suites PASS**, retained **4,357 cumulative checks**, plus the separate P40 original-fixture gate PASS. P37/P38 metadata packages are byte-identical; fourteen other resource records and source assets are preserved.
- **Ten altered-effect sets rejected**, clean retry PASS. Independent P39 source recheck **20 frames / 43,213 checks PASS**; source-only preflight and ten false-report controls PASS.
- Complete source audit **2,227 blobs / 385 src files PASS**, zero missing/mismatched/unsafe paths. Local TypeScript/build PASS. [CI 42359285316](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42359285316) SUCCESS; only documentation changed between that CI revision and the tested source.
- This continuation adds acceptance evidence only. Latest MK1/MK3 fixture evidence remains P36; browser/native-runtime uncertainties remain open.
- [P40 handoff](docs/EXTRACTOR_P40_PORTAL_SOURCE_COVERAGE_INTEGRATION.md), [acceptance evidence](docs/validation/P40_ORIGINAL_FIXTURE_ACCEPTANCE_2026-11-07.json). Next **P41 consolidation assessment**, not started. TOWER reconciliation deferred. Main unchanged.

## P39 bounded PORTAL source audit - 2026-11-07

Small evidence pass requested to conserve usage; runtime source and report integration unchanged. **Twenty existing PORTAL effect streams** independently partition **[35912,56916), 21,004 encoded bytes / 21,515 pixels**, with **43,213 original-file decoder checks PASS**. No new artwork or representations.

Full regression and existing export readback were not rerun: latest full MK2 evidence remains P38 (5,369 / 23 suites); MK1/MK3 remain P36. Browser/native-runtime uncertainties remain open. [P39 audit](docs/EXTRACTOR_P39_PORTAL_SOURCE_AUDIT.md), [evidence](docs/validation/P39_PORTAL_SOURCE_AUDIT_2026-11-07.json). Next **P40 PORTAL report integration and controls**; TOWER reconciliation deferred if needed. P41 remains consolidation assessment; main unchanged.

## P38 TOMB existing-effect coverage reconciliation - interim develop pass, 2026-11-07

**MK2 remains 5,369 unique representations.** New metadata-only **MK2_P38_NATIVE_SOURCE_INTERVAL_COVERAGE.json** adds sixteen already-exported TOMB effects to the accounting scope, without new artwork or asset inflation.

- Sixteen independent original streams exactly fill **[54328,63776), 9,448 encoded bytes / 18,000 pixels**. TOMB **16 component streams + 16 effects + one native floor** partition all **106,784 original resource bytes**, without scene/runtime claims.
- Current report: **288 qualified references / 1,028,136 union bytes** across fifteen resources. P37 report package byte-identical; all fourteen other resource records unchanged.
- Full **23 MK2 suites PASS**, **4,357 retained cumulative checks** plus coverage gates. Independent **288 references / 6,986,406 original-file decoder checks / 54,192 existing-export checks PASS**.
- **Ten invalid effect sets / eight falsified reports rejected**, clean rechecks PASS; source assets preserved. Local **380-file syntax**, TypeScript and production build PASS.
- Latest MK1/MK3 fixture evidence remains P36; original-data browser and unqualified native behavior remain separate. P36 remains consolidated checkpoint.
- Complete committed-source audit: **2,219 blobs / 384 src files**, zero missing/mismatched/unsafe paths; candidate **bf60c5a0a892b52bb33b78de95d7086d62911c0d**. [CI 42356624433](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42356624433) **SUCCESS**, including source-only controls and Chrome boot.
- [P38 handoff](docs/EXTRACTOR_P38_MK2_TOMB_EFFECT_COVERAGE.md), [evidence](docs/validation/P38_TOMB_EFFECT_COVERAGE_2026-11-07.json). Next **P39 PORTAL gap/existing-effect provenance reconciliation**. Main unchanged; P41 next consolidation assessment.

## P37 source-interval coverage report - interim develop pass, 2026-11-07

**MK2 remains 5,369 unique representations.** Coverage & evidence now exports metadata-only **MK2_P37_NATIVE_SOURCE_INTERVAL_COVERAGE.json**: 15 resources, 272 explicitly qualified stream/floor references, union/gaps/overlaps and separate registered representation counts. No new image or completeness percentage is claimed.

- Full current **22 MK2 suites PASS**, retained cumulative **4,357 checks** plus the new coverage gate. Existing representations/packages preserved; no renderer/native decoder changes.
- Independent reconstruction from twelve original-file decoders and seven EXE floor pointers: **272 exact references / 6,950,259 original-file decoder checks**; independent byte-set union oracle PASS. **Six false reports rejected**, clean report reverified.
- Source-only **20 checks / ten invalid interval refusals PASS**. Local **379-file syntax**, TypeScript and production build PASS.
- CAVE's 120-byte prefix stays UNKNOWN: a plausible twelve-byte scan interpretation failed independent decoding and overlaps an eight-byte descriptor. TOMB/PORTAL/TOWER report gaps may already have exported effects; no missing-artwork claim.
- Latest full MK1/MK3 fixture evidence remains P36; original-data browser actions pending. P36 remains consolidated source checkpoint.
- Complete committed source audit: **2,213 blobs / 383 src files**, zero missing/mismatched/unsafe paths; candidate **28eedd6d6f23bc78cb005ddb9c515d84983e889b**. [CI 42355754778](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42355754778) **SUCCESS**, including new source-only P37 controls and Chrome boot.
- [P37 handoff](docs/EXTRACTOR_P37_MK2_SOURCE_INTERVAL_COVERAGE.md), [evidence](docs/validation/P37_SOURCE_INTERVAL_COVERAGE_2026-11-07.json). Next **P38 TOMB gap/existing-effect provenance reconciliation**. Main unchanged; P41 next consolidation assessment.

## P36 fifth-pass consolidated source checkpoint - develop, 2026-11-07

**P36 is the current consolidated source checkpoint on develop; main remains P16.** P32-P35 add 65 standalone representations; the full workbench is preserved. No runtime source changes in P36.

- **Fresh 23-suite three-game regression PASS**, no skipped games: MK1 **2,656**, MK2 **5,369 / 4,357 cumulative checks**, MK3 **9,186** representations. MK1/MK3 decoded visual hashes match P21, P26 and P31.
- **Twelve independent families PASS: 251 representations / 939,903 pixels / 10,712,883 checks**; **54 altered exports rejected**, all clean exports reverified.
- Local **378-file syntax**, TypeScript and production build PASS; **eight runner preflight refusals / seven source-audit negative controls PASS**. P31/P26 runners remain frozen; new P36 runner pins the current census.
- MK1 ZIP-byte variance remains observed with metadata volatility INFERRED; decoded visuals are unchanged. Original-data browser interactions and unqualified native behavior remain separate.
- Complete source checkpoint **754c9abfa62fb7d2e9ed32078ccc11669a17064e**: **2,207 blobs / 382 src files** match; no runtime src changes from P35. [CI 42352615423](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42352615423) **SUCCESS**, including P36 source-only controls and Chrome boot.
- [P36 checkpoint](docs/EXTRACTOR_P36_SOURCE_CHECKPOINT_2026-11-07.md), [machine-readable evidence](docs/validation/P36_CHECKPOINT_REGRESSION_2026-11-07.json). Next **P39 PORTAL gap/existing-effect provenance reconciliation**. No main promotion.

## P35 additional ARENA originals and complete native source-byte partition - interim develop pass, 2026-11-07

**Fresh MK2 census: 5,369 unique representations**, adding **sixteen additional ARENA originals** in [36172,90488). **Zero newly discovered artwork claims.** Fourth interim after P31; main remains P16.

- Before join: **eighteen earlier ARENA records / zero matching standalone originals**. All eighteen retain geometry, source extents, indexed/mask and RGBA hashes.
- **31 indexed streams + native 896x40 floor** account for all **126,328 original resource bytes**. Native byte accounting does not establish setup links, roles, palette/timing/alpha or full scene composition.
- **413 focused / 598,602 independent export checks PASS**, eight rejected source fixtures and six rejected altered exports/claims. Full MK2: **5,369 / 4,357 cumulative checks PASS; 21 suites PASS**.
- Local **378-file syntax**, TypeScript and production build PASS. Original-data browser actions remain **VALIDATION PENDING**; P31 remains latest full three-game evidence. No previous research renderer/native row decoder changes.
- P35 committed-source verification: **2,203 blobs / 382 source files**, complete parity; [CI 42351941554](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42351941554) **PASS** on source candidate d96abd9f13cbb765b1f054d0bd22f647682d56e1.
- [P35 handoff](docs/EXTRACTOR_P35_MK2_ARENA_ADDITIONAL_ORIGINALS.md), [evidence](docs/validation/P35_ARENA_ADDITIONAL_REGRESSION_2026-11-07.json). Next **P36 fifth-pass consolidation assessment** with fresh three-game, twelve independent families/false-export controls and full source audit. No main promotion.

## P34 additional ARMORY originals and complete native source-byte partition - interim develop pass, 2026-11-07

**Fresh MK2 census: 5,353 unique representations**, adding **twelve additional 10x64 ARMORY originals** in [116608,126336). **Zero newly discovered artwork claims.** Third interim after P31; main remains P16.

- Before join: **21 earlier ARMORY records / zero matching standalone originals**. All 21 retain source geometry, extents, index/mask and RGBA hashes.
- **30 indexed streams + native 896x56 floor** now account for all **176,512 original resource bytes**. This is native byte partition, not proof of setup links, activation, native palette/timing or full stage composition.
- **317 focused / 46,288 independent export checks PASS**, eight rejected source fixtures and six rejected altered exports/claims. Full MK2: **5,353 / 3,947 cumulative checks PASS; 20 suites PASS**.
- Local **377-file syntax**, TypeScript and production build PASS. Original-data browser actions remain **VALIDATION PENDING**; P31 remains latest full three-game evidence. No existing research renderer/native row decoder changes.
- Verified source commit `f4eb713ba934f7729b8bab0be64a69514f066e62`: all **2,194 committed blobs / 381 src files** match; no missing/mismatched/unsafe paths. [CI run 42350703020](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42350703020) **SUCCESS**, including source-only Chrome boot.
- [P34 handoff](docs/EXTRACTOR_P34_MK2_ARMORY_ADDITIONAL_ORIGINALS.md), [evidence](docs/validation/P34_ARMORY_ADDITIONAL_REGRESSION_2026-11-07.json). Next **P35 ARENA [36172,90488) source audit**. No main promotion; P36 remains fifth-pass consolidation assessment.

## P33 standalone PIT setup components and preserved bridge/FALL provenance - interim develop pass, 2026-11-07

**Fresh MK2 census: 5,341 unique representations**, adding **28 standalone PIT originals** already used in six P9 canvases. **Zero newly discovered artwork claims.** Second interim after P31; main remains P16.

- Before join: **22 earlier PIT + 68 separate FALL records / zero matching standalone components**. All ninety retain original geometry, provenance, indexed/mask and RGBA hashes. Lower-wall FALL.GRA remains a separate resource.
- New components reproduce all **six P9 canvases / 1,328,768 cells / 126 controls** exactly. The 28 new streams plus fourteen existing bridge sprites partition all **69,384 PIT.GRA bytes**, without asserting runtime alpha, palette/timing or full stage composition.
- **802 focused / 3,320,868 independent export checks PASS**, eight rejected source fixtures and **six rejected altered exports/claims**. Full MK2: **5,341 / 3,577 cumulative checks PASS; 19 suites PASS**.
- Strengthened the new Python verifier after a false-animation claim exposed a missing assertion; production metadata already stated false. Command paint masks are explicitly not runtime-alpha claims. Local **376-file syntax**, TypeScript and production build PASS.
- Verified source commit `caad71faf317fa1d6fd200c2c6fb70129c2729e6`: all **2,185 committed blobs / 380 src files** match; no missing/mismatched/unsafe paths. [CI run 42349503704](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42349503704) **SUCCESS**, including source-only Chrome boot.
- [P33 handoff](docs/EXTRACTOR_P33_MK2_PIT_STANDALONE_COMPONENTS.md), [evidence](docs/validation/P33_PIT_COMPONENT_REGRESSION_2026-11-07.json). Browser actions remain **VALIDATION PENDING**; P31 remains the latest full three-game checkpoint. Next **P34 ARMORY [116608,126336) source audit**. No main promotion; next fifth-pass consolidation assessment P36.

## P32 additional FOREST originals and native source-byte partition - interim develop pass, 2026-11-07

**Fresh MK2 census: 5,313 unique representations**, adding **nine additional FOREST originals** in [164752,198116). **Zero newly discovered artwork claims.** First interim after P31; main remains P16.

- Before join: **63 earlier FOREST records / zero matching standalone originals**. All 63 retain geometry, source extents, indexed/opacity and RGBA hashes. Original P7 controls do not reference these nine descriptors; roles/timing/activation remain **UNKNOWN**.
- **58 indexed streams + original 896x32 floor** now partition all **226,788 source bytes** without gaps/overlaps. This establishes native byte accounting, not full-stage composition, runtime usage or palette ownership.
- **227 focused / 198,951 independent export checks PASS**, eight rejected source fixtures and five rejected false exports/claims. Full MK2: **5,313 / 2,558 cumulative checks PASS; 18 suites PASS**.
- Local **375-file syntax**, TypeScript and production build PASS. Original-data browser actions remain **VALIDATION PENDING**; P31 remains the latest full three-game checkpoint. No previous research/renderer rewrite.
- Verified source commit `c50dcd37c0e639c48cbe2387335d6cf6c5269d9b`: all **2,176 committed blobs / 379 src files** match; no missing/mismatched/unsafe paths. [CI run 42348440265](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42348440265) **SUCCESS**, including source-only Chrome boot.
- [P32 handoff](docs/EXTRACTOR_P32_MK2_FOREST_ADDITIONAL_ORIGINALS.md), [evidence](docs/validation/P32_FOREST_ADDITIONAL_REGRESSION_2026-11-07.json). Next **P33 PIT descriptor/component coverage join** against existing lower/upper/bridge assets. No main promotion; next fifth-pass consolidation assessment P36.

## P31 fifth-pass consolidated source checkpoint - develop, 2026-11-07

**P31 is the current consolidated source checkpoint on develop; main remains accepted P16.** P27-P30's **84 standalone representations** and the full workbench are preserved. No runtime file under src changes in P31. [P31 checkpoint](docs/EXTRACTOR_P31_SOURCE_CHECKPOINT_2026-11-07.md).

- **Fresh complete three-game regression: 19 standard suites PASS, no skipped games.** MK1 **2,656**, MK2 **5,304 / 1,940 cumulative checks**, MK3 **9,186** representations. All MK1 stage exports and MK3 representative exports pass; MK1/MK3 visual-plane hashes match P21 and P26.
- **Eight independent MK2 families PASS: 186 representations / 691,028 indexed pixels / 6,548,174 independent checks**. **31 false exports/claims rejected**, every clean export reverified. Known-component provenance, prior mosaics/effects/floors and deterministic image archives remain retained.
- **Complete P30 source audit PASS:** all **2,162 blobs / 378 src files** match local materialized source (80 raw / 2,082 normal checkout newline matches); zero missing/mismatched/unsafe paths. New P31 runner/source-audit tooling and source-only refusal controls support recovery and repeatable checkpoints.
- Local 374-file syntax, TypeScript and production build PASS; **eight runner preflight refusals / seven source-audit negative controls PASS**. P26's frozen runner/evidence remain unchanged.
- MK1 whole ZIP hashes vary; metadata volatility remains **INFERRED**, with decoded visuals verified unchanged. Browser interactions remain **VALIDATION PENDING**; live RGB/timing/world composition and TOWER transforms remain separately qualified.
- Complete checkpoint source `2ec4914d897aab0056700142e4d81afc4716cb4a` verified: **2,167 committed blobs / 378 src files**, zero mismatches/unsafe paths; all src hashes unchanged from P30. [CI run 42345260854](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42345260854) **SUCCESS**, including new P31 refusal controls and source-only Chrome boot.
- [P31 results/source audit](docs/validation/P31_CHECKPOINT_REGRESSION_2026-11-07.json). Next **P32 FOREST [164752,198116) source coverage audit** against existing O69/O110A evidence. No main promotion or completed-product claim.

## P30 standalone FOREST originals with P7 layer provenance - interim develop pass, 2026-11-07

**Fresh MK2 census: 5,304 unique representations**, adding **49 standalone FOREST originals** from known O110A descriptors. **Zero newly discovered source images claimed.** Fourth interim after P26; main remains P16.

- Before join: **14 prior FOREST records / zero exact standalone matches**. All fourteen retain geometry, provenance, indexed/opacity and RGBA hashes. **43 components** join existing P7 layers; **six (ordinals 0-5)** have no link to those setups.
- Exact table prefix **[0,164752)** / **164,382 indexed pixels**. New components reproduce all **five canvases / 446,912 cells / 60 original placements** exactly. Native floor **[198116,226788)** is retained; **33,364 intervening bytes** receive no new qualification.
- **1,094 focused / 1,881,013 independent export checks PASS**, eight rejected source fixtures and five rejected false exports/claims. Full MK2: **5,304 / 1,940 cumulative checks PASS; 17 suites PASS**.
- Local **374-file syntax**, TypeScript and production build PASS. Original-data browser actions remain **VALIDATION PENDING**; live palette/timing/world composition **UNKNOWN**. P26 remains MK1/MK3 latest full fixture checkpoint.
- Source commit `222f4b006fc83a5b9d49ebdd65dc986cdaa978ff` verified: all 15 changed blobs match; tree audit 2,162 blobs / 378 src, no removed/media/cache paths. [CI run 42307063237](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42307063237) **SUCCESS**, including source-only Chrome boot.
- [P30 handoff](docs/EXTRACTOR_P30_MK2_FOREST_STANDALONE_COMPONENTS.md), [evidence](docs/validation/P30_FOREST_COMPONENT_REGRESSION_2026-11-07.json). Next **P31 fifth-pass consolidation assessment**, with fresh three-game, all eight family independent verifiers/negative controls and full source audit. No main promotion.

## P29 standalone TOWER mixed-descriptor components - interim develop pass, 2026-11-07

**Fresh MK2 census: 5,255 unique representations**, adding **six standalone TOWER originals** from four eight-byte and two twelve-byte descriptors. **Zero newly discovered source images claimed.** Third interim after P26; main remains P16.

- Before join: **11 earlier TOWER records / zero exact standalone matches** for these six components. All 11 retain geometry, provenance, indexed/opacity and RGBA hashes; all seven effect frames independently match original bytes.
- New exact prefix **[0,40776)** / **43,653 indexed pixels**. Existing effects **[40776,56268)** and native floor **[56268,113612)** are preserved.
- **22 original setup controls** retained as raw flags/coordinates/pairs. Setup transform semantics and activation remain **UNKNOWN**; no new TOWER mosaic or runtime scene is asserted.
- **161 focused / 296,737 independent export checks PASS**, eight rejected source fixtures and **five rejected false exports/claims**. Full MK2: **5,255 / 1,436 cumulative checks PASS; 16 suites PASS**.
- Local **373-file syntax**, TypeScript and production build PASS. Original-data browser actions remain **VALIDATION PENDING**; native palette/timing/world composition **UNKNOWN**. P26 remains MK1/MK3 latest full fixture checkpoint.
- Source commit `8068feb5e079d73529e9da9082c52fa4d8268d39` verified: all 15 changed blobs match; tree audit 2,153 blobs / 377 src, no removed/media/cache paths. [CI run 42305438278](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42305438278) **SUCCESS**, including source-only Chrome boot.
- [P29 handoff](docs/EXTRACTOR_P29_MK2_TOWER_STANDALONE_COMPONENTS.md), [evidence](docs/validation/P29_TOWER_COMPONENT_REGRESSION_2026-11-07.json). Next **P30 FOREST component coverage audit** against existing P7 layers; assess fifth-pass consolidation at P31. No main promotion.

## P28 standalone PORTAL setup components - interim develop pass, 2026-11-06

**Fresh MK2 census: 5,249 unique representations**, adding **13 complete standalone PORTAL components already used inside two existing mosaics**. **Zero newly discovered source images claimed.** Second interim after P26; main remains P16.

- Before join: **29 prior PORTAL records / zero exact standalone matches**. All 29 retained, alongside all earlier TOMB records. The thirteen components reproduce **211,456 indexed/opacity canvas cells / 28 original controls** exactly.
- Source table **0x1655c**, slot **25**, exact prefix **[0,35912)**, **60,566 indexed pixels**. Existing effect/floor bytes are retained.
- **327 focused checks / 786,561 independent original-control/PNG/sidecar checks PASS**, eight rejected source fixtures and four rejected false exports. Current cumulative: **5,249 / 1,277 checks PASS**; **15 MK2 suites PASS**. Copied count expectation corrected before complete passing run.
- Local **372-file syntax**, TypeScript and production build PASS. Original-data browser actions remain **VALIDATION PENDING**; live palette/timing/world composition **UNKNOWN**. MK1/MK3 latest fresh full fixture checkpoint remains P26.
- Source commit `ce57900e112c6760467bcab08ea91c3e6beb8f90` verified: all 15 changed blobs match; tree audit 2,144 blobs / 376 src, no removed/game-media paths. [CI run 42301511758](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42301511758) **SUCCESS**, including source-only Chrome boot.
- [P28 handoff](docs/EXTRACTOR_P28_MK2_PORTAL_STANDALONE_COMPONENTS.md), [evidence](docs/validation/P28_PORTAL_COMPONENT_REGRESSION_2026-11-06.json). Next **P29 TOWER descriptor/component coverage audit** against existing effects/setup representations. Consolidation assessment at P31; no main promotion.

## P27 standalone TOMB setup components — interim develop pass, 2026-11-06

**Fresh MK2 census: 5,236 unique representations**, adding **16 complete standalone TOMB source components** already used inside six existing mosaics. **Zero newly discovered source images claimed.** P27 is the first interim pass after P26; main remains P16.

- Coverage join: **28 prior TOMB representations**, **zero exact standalone matches**, all sixteen components referenced by **six original source setups / 87 controls**. New complete components reproduce **523,584 indexed/opacity canvas cells** exactly, including source portions absent from clipped composites.
- Native source prefix **[0,54328)**: **16 images / 64,971 pixels**. Existing effects **[54328,63776)** and native floor **[63776,106784)** are preserved. Setup-local coordinates are not runtime/world placement; native palette/timing/full scenes remain **UNKNOWN**.
- **466 focused checks**, **1,437,357 independent original-control/PNG/sidecar checks**, eight source-negative cases and four false export/claim controls PASS. Lost setup provenance is rejected. Current full gate: **5,236 / 1,079 checks PASS**; all 28 prior TOMB records retain source extents and index/opacity hashes.
- **14 current MK2 suites PASS**, retaining earlier four families, seven older focused suites (**818,695 checks**) and archive/floor identities. Local 371-file syntax, TypeScript and production build PASS. Prior research/renderers and UI are unchanged; current runner defaults to `--through p27`.
- Browser actions remain **VALIDATION PENDING**. MK1/MK3 were not rerun in P27; P26 is their latest full source-fixture checkpoint. [P27 handoff](docs/EXTRACTOR_P27_MK2_TOMB_STANDALONE_COMPONENTS.md), [evidence](docs/validation/P27_TOMB_COMPONENT_REGRESSION_2026-11-06.json).
- Verified source commit: `6ec69900f46d6d6e33d288ecf667bd483bcaf7df`; all 15 changed blob hashes match. Tree audit: 2,135 blobs / 375 src; no game media/archive paths. [GitHub CI run 42297458244](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42297458244) **SUCCESS**, including source-only Chrome boot; original-data browser validation remains pending.
- Next: **P28 PORTAL descriptor/component coverage join**, preserving existing mosaic/effect provenance before standalone exposure. Keep develop recoverable; no main promotion or full-source release.

## P26 fifth-pass source consolidation — develop checkpoint, 2026-11-06

**P26 is a preserved historical source checkpoint on develop; main remains P16.** P22–P25's **102 original indexed image representations** and all earlier research/runtime functionality are preserved. No runtime file under src changes in P26. [P26 checkpoint](docs/EXTRACTOR_P26_SOURCE_CHECKPOINT_2026-11-06.md).

- **Fresh complete three-game regression: 15 standard suites PASS**, no skipped games. MK1 **2,656**, MK2 **5,220 unique representations / 865 cumulative checks**, MK3 **9,186** assets. MK1/MK3 decoded visual-plane hashes exactly match P21; MK1's 49 stage PNG exports and MK3 representative exports pass.
- **All four new MK2 families independently reverified:** **102 images / 357,456 indexed pixels / 2,146,506 checks PASS**, plus **13 false exports/claims rejected** and clean rechecks. CAVE/ARMORY/BATTLE/ARENA package hashes and previous original floor/evidence hashes are retained.
- **Complete P25 source audit PASS:** all **2,122 committed files / 374 src files** match GitHub blobs, raw or normal checkout newline conversion; no missing/mismatched files or reviewed tracked game-media paths. New P26 runner requires all three games, keeps artwork private, writes RUNNING/PASS/FAIL progress and enforces P21 visual parity.
- MK1 whole research ZIP hashes differ from P21. Unchanged builders contain per-run metadata; volatile metadata is the **INFERRED** mismatch cause, not an independently performed historical ZIP byte diff. Actual decoded visuals match; deterministic MK2 source ZIP hashes remain explicitly enforced.
- Local 370-file syntax, TypeScript, production build, new verifier syntax and negative runner/visual-baseline controls PASS. Browser interaction remains **VALIDATION PENDING**; native RGB ownership, timing, world placement and full stage composition remain **UNKNOWN**. Source-offline Chrome is a separate gate.
- [P26 results/source audit](docs/validation/P26_CHECKPOINT_REGRESSION_2026-11-06.json). Next: **P27 TOMB descriptor-level coverage join against exposed effects/setup layers**, then independently verified missing originals. No main promotion or completed-product claim.
- Committed P26 source **`0129c0d`** passed [CI 42292927503](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42292927503): strict install, source/verifier syntax, media guard, Vite, TypeScript, source-offline Chrome and build upload. Complete tree: **2,126 files**, all **374 src files unchanged** from P25, no removals or tracked game media/cache paths. Main is unchanged.

## P25 original ARENA.GRA image integration — interim develop pass, 2026-11-06

**Fresh MK2 collection: 5,220 unique representations**, adding **15 original ARENA.GRA indexed images** to P24's 5,205. All three previous ARENA floor representations and uncropped raw floor bytes are preserved. P25 is the fourth interim pass after P21; P26 is the next consolidation candidate. Main remains P16.

- Original descriptor-backed **[0,36172)** prefix: **15 distinct images / 65,736 pixels**. The remaining **90,156 bytes** are outside this image-family qualification, including the existing floor **[90488,126328)**. No new palette, animation or scene interpretation.
- **284 focused adapter/export checks**, **394,675 independent original-file PNG/sidecar checks**, eight source-negative cases and three valid-CRC false export/claim controls PASS. Full current collection: **5,220 / 865 cumulative checks PASS**.
- **13 current MK2 suites PASS**, preserving CAVE/ARMORY/BATTLE bytes and evidence ZIP hashes, seven earlier focused suites (**818,695 checks**) and original archive identities. The row decoder, prior adapters and research code remain unchanged.
- Local 370-file TypeScript syntax, typecheck and production build PASS. Runner defaults to `--through p25`. MK1/MK3 were explicitly not freshly rerun; P21 results remain historical. Browser interaction is **VALIDATION PENDING**; native palette/timing/placement/full scenes remain **UNKNOWN**.
- [P25 handoff](docs/EXTRACTOR_P25_MK2_ARENA_ORIGINAL_IMAGES.md), [results](docs/validation/P25_ARENA_REGRESSION_2026-11-06.json). P22–P25 add **102 original indexed image representations**. Next: **P26 fifth-pass consolidation, complete current multi-game regression and source audit**. No main promotion or full-source release in P25.
- Committed P25 source **`6003d16`** passed [CI 42290617764](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42290617764): strict install, syntax/media guard, Vite, TypeScript, source-offline Chrome and build upload. All fourteen changed/added file blobs verified; no removals or tracked game media. Main is unchanged.

## P24 BATTLE images and duplicate descriptor provenance — interim develop pass, 2026-11-06

**Fresh MK2 collection: 5,205 unique representations**, adding **20 original BATTLE.GRA images from 40 descriptor witnesses**. Both byte-identical original records per image are retained in metadata, not counted as separate artwork. P24 is the third interim pass after P21; main remains P16.

- Original **[0,59436)** image prefix: **20 distinct intervals / 85,188 pixels**. The original **35,840-byte floor [59436,95276)** and all three previous BATTLE floor representations are preserved. No new palette, timing or stage-composition claim.
- **432 focused adapter/export checks**, **511,492 independent original-file PNG/sidecar/provenance checks**, eight source-negative cases and four valid-CRC false export/claim controls PASS. Removing a duplicate witness is rejected. Full current collection: **5,205 / 826 cumulative checks PASS**.
- **12 current MK2 suites PASS**, including CAVE/ARMORY parity and unchanged source ZIP hashes, seven older focused suites (**818,695 checks**) and original package identities. The native row decoder and prior adapters/research implementation remain unchanged.
- Local 369-file TypeScript syntax, typecheck and production build PASS. Runner defaults to `--through p24`. MK1/MK3 were explicitly not rerun; P21 results remain historical. Browser interaction remains **VALIDATION PENDING**; native palette/timing/placement/full scenes remain **UNKNOWN**.
- [P24 handoff](docs/EXTRACTOR_P24_MK2_BATTLE_DEDUPLICATED_IMAGES.md), [results](docs/validation/P24_BATTLE_REGRESSION_2026-11-06.json). Next: **P25 original ARENA descriptor coverage and qualified missing-image integration**. P26 is the next consolidation candidate; no main promotion or full-source release now.
- Committed P24 source **`a8ec7d2`** passed [CI 42288449917](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42288449917): strict install, syntax/media guard, Vite, TypeScript, source-offline Chrome and build upload. All fourteen changed/added file blobs verified; no removals or tracked game media. Main is unchanged.

## P23 original ARMORY.GRA image integration — interim develop pass, 2026-11-06

**Fresh MK2 collection: 5,185 unique representations**, adding **18 original ARMORY.GRA indexed images** to P22's 5,167. All three previous ARMORY floor records and raw floor bytes are preserved. P23 is the second interim pass after P21; main remains P16.

- Original eight-byte descriptor family: **18 images / 156,767 pixels**, exact **116,608-byte prefix [0,116608)**. The 59,904 remaining bytes lie outside this image-family claim; existing floors begin at 126336. No new palette, animation or stage-composition interpretation.
- **335 focused adapter/export checks**, **940,912 independent original-file PNG/sidecar checks**, eight negative input cases and three valid-CRC false export/claim controls PASS. Full collection: **5,185 / 734 cumulative checks PASS**.
- Native row decoding is shared only after independent CAVE/ARMORY repetition. CAVE's **862 checks** and original evidence ZIP hash remain unchanged. **11 current MK2 suites PASS**, retaining seven earlier focused suites (**818,695 checks**) and package identities.
- Local 368-file TypeScript syntax, typecheck and production build PASS. Current checkpoint runner defaults to `--through p23`. MK1/MK3 were explicitly not freshly rerun; P21 results remain historical. Browser interaction is **VALIDATION PENDING**; native palette, timing, placement and complete scenes remain **UNKNOWN**.
- [P23 handoff](docs/EXTRACTOR_P23_MK2_ARMORY_ORIGINAL_IMAGES.md), [results](docs/validation/P23_ARMORY_REGRESSION_2026-11-06.json). Next: **P24 BATTLE descriptor deduplication and qualified missing-image integration**. Keep develop work recoverable; no main promotion or full-source release.
- Committed P23 source **`a12dc75`** passed [CI 42287079604](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42287079604): strict install, syntax/media guard, Vite, TypeScript, source-offline Chrome and build upload. All sixteen changed/added file blobs verified, no removals or tracked game media. Main is unchanged.

## P22 original CAVE.GRA image integration — interim develop pass, 2026-11-06

**Fresh MK2 collection: 5,167 unique representations**, adding **49 original CAVE.GRA indexed images** to P21's 5,118. The source-backed family was absent from the registry. P21 remains the consolidated develop checkpoint; main remains P16.

- Native eight-byte descriptor geometry and original index/opacity data: **49 images / 49,765 pixels**, exact **57,192-byte suffix [120,57312)**. The first 120 bytes remain outside image qualification. Diagnostic grayscale is not an original palette; table order is not animation order.
- **862 focused adapter/export checks**, **299,427 independent original-file PNG/sidecar checks**, eight source-negative cases and three re-CRC'd false export/claim controls PASS. Full current collection: **5,167 / 689 cumulative checks PASS**. All seven earlier focused suites (**818,695 checks**) and original package identities are retained.
- Current checkpoint runner defaults to P22 and accepts `--through p22`; **10 MK2 suites PASS**. Optional MK1/MK3 were explicitly not rerun this pass; their P21 evidence remains valid historical evidence. TypeScript, 366-file syntax and production build PASS locally.
- New images use existing Asset Library preview/PNG/selected-ZIP workflows; Coverage & evidence includes the 49-image source bundle. Actual original-data browser interaction remains **VALIDATION PENDING**. Runtime palette, stage ownership, placement, native timing and full scenes remain **UNKNOWN**.
- [P22 handoff](docs/EXTRACTOR_P22_MK2_CAVE_ORIGINAL_IMAGES.md), [results](docs/validation/P22_CAVE_REGRESSION_2026-11-06.json). Next: **P23 original ARMORY descriptor coverage audit and qualified missing-image integration**. No main promotion or full-source release.
- Committed P22 source **`2272c00`** passed [CI 42285496421](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42285496421), including strict install, build, TypeScript, syntax/media guard and source-offline Chrome startup. All 14 changed/added file blobs verified; no removals or tracked game media.

## P21 fifth-pass source consolidation — develop checkpoint, 2026-11-06

**P21 is a preserved historical source checkpoint on develop; main remains P16.** P17–P20 are preserved together. No decoder/research implementation, asset count, or runtime interpretation changed. Full checkpoint: [P21 handoff](docs/EXTRACTOR_P21_SOURCE_CHECKPOINT_2026-11-06.md).

- New repeatable checkpoint runner: **11 suites PASS**, including MK2 input identity, full **5,118 unique assets / 536 cumulative checks**, all seven focused P12–P19 suites (**818,695 checks**), and MK1/MK3 compatibility. Invalid input fails closed and writes FAIL.
- **MK1 fresh regression:** **2,656 assets** (2,363 sprites, 244 audio, 49 stage PNGs), **2,615 checks PASS**. All 49 stage PNG exports read back against collection pixels; 24 normalized module previews retained.
- **MK3 fresh regression:** **9,186 assets** (6,654 sprites, 1,046 raw, 1,024 audio, 416 images, 46 music), **7,110 checks PASS**. Ten representative exports across all five kinds preserve payloads/order/sidecars. No new stage ownership inferred.
- P20 parent complete source tree: **2,085 blobs / 369 src files**, no reviewed commercial-game/media/archive extensions. P21 retains the full workbench and adds test/CI/docs only.
- P21 committed candidate **`2d7410b`**: **2,089 tracked files**, all 369 src files unchanged, no removals or reviewed game-media paths. [CI 42283644918](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42283644918) **PASS**: strict install, syntax/media guard, Vite, TypeScript, Chrome source-offline startup and build upload. Main is unchanged.
- Browser interaction with original P12–P19 data remains **VALIDATION PENDING**; source-offline CI is separate. Fresh MK2 ZIP hash/re-extraction remains unverified; existing extracted fixture identity is qualified as recorded in P20. Runtime palette, native timing and complete stage composition remain **UNKNOWN**.
- [Machine-readable P21 results](docs/validation/P21_CHECKPOINT_REGRESSION_2026-11-06.json). Next: **P22 MK2 coverage reconciliation and one evidence-backed missing-family integration**. No main promotion in this continuation.

## P20 full current-source MK2 cumulative regression — interim `develop` pass, 2026-11-06

**Freshly VERIFIED: 5,118 asset representations / 5,118 unique IDs** from the existing original MK2 extracted fixture on the complete P16–P19 source at `17af1a5`. The earlier P17–P19 cumulative validation gap is closed; P16 remains on `main` and P21 is not started.

- New reproducible P20 cumulative gate: **536 checks PASS**, including retained P15 export/archive checks, P17 mosaics and all eight P19 source-order queues / 57 original frames, with exact exported index/opacity parity. Existing P18 default full-source gate: **40 checks PASS / 5,118**.
- Seven focused P12–P19 suites freshly passed **818,695 checks**. Historical P8–P10 and P13–P15 evidence ZIP hashes are unchanged. No extractor implementation failure or decoder change was needed; research functionality is preserved.
- Original extracted input: **614-file census / 13 critical resource hashes / 642 identity checks PASS**. Fresh attached ZIP download failed with DNS, so its archive-level hash/re-extraction was **not rerun in this continuation**. See the explicit input confidence boundary in the handoff.
- Local 365-file source syntax, TypeScript and production build PASS. Browser clicking with original game data remains **VALIDATION PENDING**; native palette ownership, timing and final stage composition remain **UNKNOWN**. No new MK1/MK3 fixture regression is claimed.
- Committed P20 candidate `504cb05` passed [GitHub CI 42281991079](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42281991079): strict locked install, syntax/media guard, production build, TypeScript, source-offline Chrome startup and build upload. Verifier and evidence are recoverably committed on `develop`.
- [P20 handoff](docs/EXTRACTOR_P20_MK2_FULL_CUMULATIVE_REGRESSION.md) and [machine-readable results](docs/validation/P20_MK2_REGRESSION_2026-11-06.json). Keep changes on `develop`; no promotion or P21 consolidation.

## P19 MK2 direct source-order animation preview — interim `develop` pass, 2026-11-06

**P16 remains the stable main checkpoint.** P19 is the third MK2-first interim improvement, extending P18's eight original source-order animation groups into a one-click user presentation workflow. It adds no new extracted asset records and makes no new native timing or palette claims.

- **Practical usability:** Each P18 contact sheet now offers **Load verified source order into animation queue** in Asset Library Inspect. The existing Preview chain, APNG, sprite-sheet and selected ZIP tools work directly with the **57 existing original frames across eight verified source groups**; original frame order, original loop/end markers and source provenance are preserved.
- **Explicit timing boundary:** Preview/APNG interval is **user-selected**, not native MK2 milliseconds/FPS. The generic APNG presentation loops *even original zero-terminated* source lists; this is clearly marked as convenience, not original playback scheduling. Native runtime palette-bank selection, actor placement and trigger/timing remain **UNKNOWN**.
- **Original-fixture focused checks PASS:** **280 P19 checks** on all eight authentic O136/O177 and O220/O221 source groups, queue integrity, selected ZIP sidecars, APNG 137 ms user interval and negative source-list controls. Independently reran P18 original binary parity **379,422 checks PASS**.
- **Compatibility rerun PASS:** preserved P11+P17+P18 source with P19's no-census-change UI/helper: **5,063 original MK2 asset representations / 32 checks**, P8–P10 evidence ZIP hashes unchanged. **The full current P16+P17+P18+P19 total is expected to remain 5,118, NOT freshly verified**; the local compatibility source lacks P12–P15 adapters and is not a substitute for a full current-source regression.
- **GitHub CI VERIFIED:** [P19 source build 42277356338](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42277356338) **PASS** on committed code `4844a84` (strict npm install, source syntax, media guard, Vite production, TypeScript, headless Chrome source-offline boot, static build artifact). User MK2 in-browser clicking the new queue action still **VALIDATION PENDING**.
- **Handoff:** [P19 source-order presentation queue](docs/EXTRACTOR_P19_MK2_SOURCE_ORDER_TO_PRESENTATION_QUEUE.md). Keep P16 unchanged on main, original DOS game binaries/artwork outside GitHub, and research workbench untouched.

P20 should prioritize closure of the full current-source original-fixture cumulative scan and further MK2 extraction completeness. P21 is the next fifth-pass consolidation candidate only if verified.

## P18 MK2 original source-ordered animation ZIPs — interim `develop` pass, 2026-11-06

**P16 remains the stable `main` checkpoint.** P18 is the second MK2-first interim pass after P16. It applies verified O136/O177 (43 stage effect frames in six lists) and O220/O221 (14 Pit II bridge sprites in two seven-frame lists) to a practical export workflow.

- **Eight original-list contact-sheet previews plus eight directly downloadable source-ordered frame ZIPs** now group **57 existing original indexed frames**. Each frame ZIP includes independent original PNGs, indexed planes, transparency masks, a versioned source list/control manifest and explicitly unknown timing. Contact-sheet cell spacing is diagnostic, **NOT** source world placement.
- **VERIFIED original-fixture tests:** P18 focused adapter/export parity **379,422 checks PASS**, including 63,112 exact source-frame pixel-cell comparisons, independent eight-contact-sheet PNG readback, original frame ZIP byte/index/mask parity and negative source order/loop/timing controls.
- **VALIDATED compatibility only:** original MK2 original-fixture scan on frozen P11 + P17 + P18 **5,063 assets / 32 checks PASS**, P8–P10 source ZIP hashes unchanged. The latest P16+P17+P18 cumulative is **EXPECTED 5,118** but **VALIDATION PENDING**. Reproduce through `scripts/verify-mk2-p18-cumulative.cjs` in the complete current source; the `--p11-p17-baseline` option is deliberately not this full gate.
- **No speculative animation:** original source loop/zero-end markers and frame order are retained. Live DAC palette ownership, native millisecond timing, frame activation, layer composition, cameras and screen placement are unknown. Original indexed frames remain unchanged.
- **CI VERIFIED:** [P18 GitHub Actions 42273807258](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42273807258) passed for committed extractor source `6c4cd8e`: strict npm install, syntax, Git-safe-media guard, Vite, TypeScript, headless Chrome source-offline onboarding and build artifact upload. This is **not** a full original-game Chrome interaction test.
- **Handoff:** [P18 source-ordered animation export integration](docs/EXTRACTOR_P18_MK2_SOURCE_ORDERED_SEQUENCE_EXPORTS.md). GitHub build/TypeScript/Chrome verification and user in-app action checks are separate from original binary parity.

Continue MK2-first in P19. Do not promote P18 to `main`, issue a full source archive, or alter original copyrighted assets during an interim pass.

## P17 MK2 original IMAGES.GRA indexed setup-local mosaics — interim `develop` pass, 2026-11-06

**P16 remains the stable `main` source checkpoint.** P17 is a narrow, additive MK2 extractor improvement applying the independently original-file-verified O121/O122 research; it does not modify the research workbench.

- **Two newly exposed 320 × 200 original source-local indexed composites** from `IMAGES.GRA` Object-2 setups `0x2E7E4` and `0x2E720`, each using ten 64 × 100 original tiles. Their twenty original indexed streams form one exact, gapless `IMAGES.GRA [351472,460192)` chain.
- **VALIDATED:** independently reran the original O122 Python producer, which found all ten original setup mosaics and supplied SHA-256 goldens for both newly integrated index/opacity planes. New P17 TypeScript focused parity, selected ZIP mask exports and eight mutation/missing/synthetic controls: **77 checks PASS**.
- **VALIDATED on frozen P11 source plus P17:** canonical original-fixture full scan **5,055 unique assets / 28 compatibility checks PASS**, with unchanged P8–P10 original evidence ZIP hashes. This confirms source additive behaviour but is **not** the complete current P16+P17 regression.
- **EXPECTED, VALIDATION PENDING:** current P16 was previously 5,108 original MK2 asset representations; P17 should yield **5,110**, but the full P16+P17 cumulative scanner has **not been rerun** in this pass. `scripts/verify-mk2-p17-cumulative.cjs` provides the current full-source gate and an explicit `--p11-baseline` diagnostic mode.
- **No runtime palette inference:** source family labels `tomb79`/`portal79` refer to unverified alternative 79-colour setups, **not authenticated arena identity or native DAC selection**. Previews show diagnostic index-value grayscale; source `indices`, opacity and all-zero native palette-known masks are preserved. No final stage composition, activation, draw order or timing is claimed.
- **Source handoff:** [P17 original unassigned indexed mosaic integration](docs/EXTRACTOR_P17_MK2_UNASSIGNED_IMAGES_SETUP_MOSAICS.md). Source/browser build verification is separate from original-file parity.

Continue MK2-first in P18; preserve P16 `main`, commercial game files remain outside GitHub, and return to a consolidation gate after further verified interim passes.

## Current P16 consolidated source checkpoint — 2026-11-06

**P16 is the stable Git-safe source checkpoint on main**, superseding P11 after four additive MK2 extractor passes (P12–P15). The existing research workbench, original indices/masks, fixture provenance and earlier Git history remain preserved. Read the [P16 full source checkpoint and test record](docs/EXTRACTOR_P16_CUMULATIVE_CHECKPOINT_2026-11-06.md).

- **MK2 source extraction:** **5,108 unique original-fixture asset representations**, P15 83 cumulative checks passed in the prior pass, versus P11 5,053 / 40. P12 added 31 intro images; P13 added 15 Mountain graphics; P14 added seven neutral source-floor projections; P15 added two screenshot-witnessed Tomb/Portal floor previews.
- **P16 independent tests:** canonical DOS original ZIP plus **13 critical resource hashes and full 614-file census: 643 input-identity checks PASS**; source-preserving P11 baseline original-fixture rerun **5,053 / 40 PASS**, with identical P8–P10 evidence ZIP hashes.
- **Code/CI:** no P16 decoder changes; consolidated source candidate **70fb677** passed locked npm installation, syntax, Git-safe tracked-media audit, Vite build, TypeScript and headless Chrome startup in [P16 CI run 42261497116](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42261497116). CI now builds source on both main and develop.
- **Test confidence boundary:** the full 5,108 / 83 P15 scanner was **not freshly rerun in P16**; its prior original-fixture results and successful source-build evidence remain valid since P16 changes only audit/CI/docs. Real-game P12–P15 Asset Library browser interaction is not yet separately verified.
- **Incomplete extraction:** no claim that the 55 additions are complete stage scenes; runtime palette ownership, live camera mapping, final stage composition and native animation timing remain unknown or conditional. The original MK1/MK3 coverage limitations remain unchanged.

No commercial game files, indexed artwork, original audio or screenshot captures are committed to GitHub. Next focus remains **MK2 extraction completeness** in P17.

## P15 MK2 screenshot-witnessed packed floors — interim `develop` pass, 2026-11-05

**MK2 remains the development priority.** The P11 source checkpoint is preserved on `main`; P12–P15 are interim, recoverable changes on `develop`.

- **Canonical original MK2: 5,108 unique assets** (P11 5,053 + P12 intro 31 + P13 Mountain 15 + P14 native floor projections 7 + **P15 two screenshot-witnessed RGB floor previews**).
- **VERIFIED:** Original TOMB.GRA 320×48 floor at conditional source-left 291 and PORTAL.GRA 320×40 floor at conditional source-left 292, original index planes and bounded O115 screenshot colour mappings. O117 Tomb unmodified screenshot **12,222/12,222** disjoint holdout matches; O115B/O116 Portal original screenshot **4,420/4,420** qualified matches. These are **floor-only**, not full scenes.
- **Original fixture testing PASS:** independently pinned O115 witness JSON report hashes, original resource hashes and Python reference produce **28,160 exact source pixels**; P15 adapter/ZIP **28,244 focused checks**, **83 cumulative checks** with 5,108 unique assets; original P8/P9/P10 evidence ZIP SHA256 identities are unchanged. Private PNG ZIP readback verified every one of the 28,160 source/witnessed-RGB pixels and CRCs.
- **Important distinction:** observed screenshot RGB is *not* verified live DAC-bank ownership; the source-index and opacity masks are retained, while the **native palette-known masks remain zero**. No runtime camera, layer placement, animation timing or complete stage is inferred.
- **Git-safe P15 source and tests:** [P15 original MK2 witnessed-floor handoff](docs/EXTRACTOR_P15_MK2_SCREENSHOT_WITNESSED_PACKED_FLOORS.md). Browser build/TypeScript/Chrome CI and user in-app interactions are separate from original-file parity.
- **Development cadence:** P15 is the fourth interim pass; **P16 is the fifth-pass consolidation candidate**, not an automatic completed-product release. Preserve the research workbench and do not commit copyrighted game resources or screenshot-media captures.

## P14 MK2 native packed-floor viewport projections — interim `develop` pass, 2026-11-05

**P11 is still the stable `main` source checkpoint.** P12–P14 are recoverable interim source changes on `develop`; preserve all original research code and prior decoder paths.

- **Original MK2 assets: 5,106 unique** (P11 5,053 + P12 intro 31 + P13 Mountain 15 + **P14 seven native packed-stage floor viewport projections**). Every earlier registered source family remained discoverable.
- **Original-file O110C projection VERIFIED:** the seven native 896-column packed resource suffixes (`TOMB`, `BATTLE`, `TOWER`, `FOREST`, `ARMORY`, `PORTAL`, `ARENA.GRA`) each yield one original-source-backed **320 × source-row-count** viewport using exact neutral input x=288 and hypothetical palette-bank base 1. This is **NOT** a full 320×200 scene nor a verified live gameplay camera/palette.
- **Independent test evidence PASS:** original O110C producer and independent native DWORD/row verifier; **409,790 new focused pixel/metadata/ZIP/negative checks**, **102,400 PNG pixels independently redecoded** against exported indices and masks, **66 P14 cumulative checks**. The P8/P9/P10 forensic archive SHA-256 hashes stayed byte-identical to their source references.
- **Palette scope UNKNOWN:** grayscale is diagnostic numeric index values. Runtime RGB selection, palette ownership, camera placement, parallax and stage composition remain unqualified; source index/opacity/colour-known masks and provenance are retained in exports.
- The focused, reproducible handoff is [P14 MK2 packed-floor native viewport integration](docs/EXTRACTOR_P14_MK2_PACKED_FLOOR_NATIVE_VIEWPORTS.md). **Browser UI and CI are separate gates from source fixture verification.**

**Next:** P15 MK2-first, prioritize source-verified palette/placement joins or another reusable extractor improvement; avoid speculative scene assembly. Do not create a full source archive at every interim pass.

## P13 MK2 MOUNTAIN.GRA original indexed graphics — interim `develop` pass, 2026-11-05

**P11 remains the stable `main` checkpoint.** P12 and P13 are focused, recoverable interim changes on `develop`.

- **Original MK2 asset census: 5,099 unique assets** (P11 5,053 + P12 31 + P13 **15 original indexed MOUNTAIN.GRA graphics**). P13 source commit: [`9ea61f3`](https://github.com/87otlto-coder/mk-dos-archive/commit/9ea61f358a6c940cdb0462343a76131068183be5).
- **Source relationship VERIFIED:** 14 original 35×41 graphics are reached through source pointer table records, plus **one adjacent original 35×41 graphic not selected by that table**. All 15 native streams tile exactly the 23,024-byte original MOUNTAIN.GRA suffix. The 168,724-byte prefix remains outside this qualification.
- **Source-list interpretation VERIFIED / bounded:** six original conditional selection orders, five distinct, source token 14 aliases record 13. The selected runtime variant, object activation, coordinates, animation timing and stage identity are **UNKNOWN**.
- **Palette boundary:** original indices span 1–96; a direct unmodified 63-colour palette cannot represent them. The new previews are **diagnostic grayscale only**, never reconstructed runtime RGB. Source indices, paint masks and all-zero palette-known masks are available in the selected ZIP and a separate 15-image forensic package.
- **Original-file tests PASS:** 2,198 independent Python checks; 358 TypeScript adapter/export/negative-fixture parity checks; **57 P13 cumulative checks** at 5,099 assets. P8/P9/P10 source evidence ZIP hashes are unchanged. Focused P13 source ZIP SHA-256: `e7eabb5d6444d249b7b08a1197c7cc7767a8e70df668f661d5d0eff762d67c86`.
- **Production build and Chrome startup are a separate gate.** Source-binary parity and headless fixture tests do not prove P13 interactive browsing. See [P13 integration handoff](docs/EXTRACTOR_P13_MK2_MOUNTAIN_ORIGINAL_INDEXED_GRAPHICS.md).

Next pass should prioritize **reusable MK2 palette/placement attribution backed by original evidence**, or integrate another already independently qualified original graphical family if palette/placement cannot be proven without speculation. Do not spend time on gameplay mechanics unrelated to extraction.

## P12 MK2 intro LZW integration — interim `develop` pass, 2026-11-05

**P11 remains the stable checkpoint on `main`.** New P12 source was committed to `develop` at [`576d2d2`](https://github.com/87otlto-coder/mk-dos-archive/commit/576d2d28fea53ee5463bb5fd46b907d4f7b361b8). The previous P11 workbench and P7–P10 registrations are retained.

- **Original MK2 assets:** **5,084 unique** (P11 5,053 + **31 newly exposed original intro LZW frames**: 30 `PROBE.GRA`, one `ACCLAIM.GRA`). These are 320×200 indexed images, **not gameplay stage backgrounds**.
- **Independent original-binary evidence:** O110B and O110E independently qualified LZW source pixels and source DAC6 palette equations. New P12 targeted verifier passed **524 checks**, including exact independent index/conditional-colour/mask hashes, selected ZIP index/known-mask preservation and altered/missing/ambiguous negative fixtures.
- **P12 cumulative scanner:** **47 checks passed** against the canonical original MK2 fixture, all P7–P10 stage asset counts preserved, and historical P8/P9/P10 generated package SHA-256 values unchanged.
- **Interpretation boundary:** a diagnostic source-DAC6 colour preview does **not** establish runtime palette bank, actual index-zero colour, event timing, sprite placement or full stage composition. The exporter preserves original pixel indices plus explicit palette-known masks.
- The focused research and test record is [EXTRACTOR_P12_MK2_PROBE_ACCLAIM_LZW_INTEGRATION.md](docs/EXTRACTOR_P12_MK2_PROBE_ACCLAIM_LZW_INTEGRATION.md). **Production build/browser verification of P12 is separate from the completed original-fixture tests.**
- This is an **interim pass**, not a full source-package release and not a reason to move away from MK2.

## Historical P11 stable source checkpoint — 2026-11-05

**Historical November 5 state:** P11 was promoted to `main` after GitHub CI, full MK2 cumulative regression and local user acceptance of all three game's asset previews and exports. Development continues on `develop` after this checkpoint; preserve the earlier P6 commit in Git history. See [P11 promotion / acceptance record](docs/P11_PROMOTION_2026-11-05.md).

- **Production / source:** GitHub Actions latest candidate `350b44a` passed locked `npm ci`, syntax, Vite build, TypeScript and Chrome startup.
- **MK2:** Original-fixture **5,053 unique assets / 40 checks**; independent P8–P10 pixel/package parity retained.
- **MK1:** Canonical fixture 24 normalized and 24 ordinary module backgrounds plus one moon PNG; a source-pass Chrome ZIP of 24 320×200 normalized modules was independently validated. `*HDRS.GRA` stage tiles are source candidates, **not full scene reconstructions**.
- **MK3:** Original-fixture 9,186 assets, including 416 images; none are yet established as stages.
- **User acceptance:** MK1/MK2/MK3 previews, Pit II Gallery navigation, requested Asset Library interaction and exports were confirmed in Windows. Exports are **USER-VERIFIED**, not every game/format permutation independently checksum-verified.
- **Known limitations:** Stage associations, full compositions and runtime palette/timing qualifications remain separate from P11 correctness. Additional optional browser/regression checks are in [Issue #5](https://github.com/87otlto-coder/mk-dos-archive/issues/5).

P11 source promotion is **not** a complete extractor product release; no original game binaries or extracted artwork are in GitHub.

## Historical P11 source-import record — 2026-11-04

The statements below describe the earlier November 4 release gate; the November 5 source checkpoint above supersedes their pending-build status.

## P11 local consolidation verified — GitHub source import confirmed (2026-11-04)

- Local full-source P11 ZIP: `MK_DOS_Extractor_P11_Cumulative_Full_Source_2026-11-04.zip`, SHA-256 `7889917a4e8678c5e625f92a90b9ecb42ea80286a37358392a99d2578b7f00f4`. Not in GitHub.
- P11 cumulative original-MK2 fixture scan: **5,053 assets**, 40 cross-pass source/package checks plus 225 P10 integration checks and 61 independent O220/O221 checks. Independent P8 O210 and P9 O205 suites and cross-stage O195 regression also passed.
- Strictly filtered Git-safe source imports prepared: **P6 2,011 ZIP entries** (includes audit manifest), **P11 2,033 entries** (includes audit manifest and 4 interim patches). All application `src` and source scripts retained; original binary/extracted game media and raw evidence omitted with hashes documented. The P11 *filtered* source was re-tested successfully against the canonical local MK2 fixture.
- Import kit filename `MK_DOS_GitHub_Import_Kit_P6_to_P11_2026-11-04.zip`, SHA-256 `1dda3165ab6d71a110360690a59763492c23e3d080cd86d6b28ae8919bdfcd95`, available in the project conversation (not committed to GitHub).
- **GitHub import completed and directly verified:** `main` source commit `eb9691510ce57dd1a7670fcf404de0c0dbd6941b`; `develop` P11 source commit `65023df71d20eb049a571d6a0d1672d670cddf92`. GitHub file trees include 358 and 362 `src` files respectively, with 2,070 and 2,094 total tree entries (directories included). Expected P7–P10 and P11 scripts are present on `develop`. No tracked files matching reviewed commercial game/archive/media extensions were found in either GitHub tree. Fresh checkout builds, fixture reruns and UI verification remain pending.
- Browser build and interactive UI remain **validation pending**; no gameplay-stage assembly/palette/timing overclaims.

## P11 source regression update — 2026-11-04

**GitHub code identity and local source testing passed:** all **1,068** P6 source/test/tool files and **1,080** P11 source/test/tool files match their audited Git-safe ZIP snapshots via Git blob identity summaries. From clean ZIP extraction against the original local MK2 fixture, P6 passed **5,016 assets / 121 tests** and P11 passed **5,053 assets / 40 tests**. P10 integration **225**, P8 O210 independent **68**, P9 O205 independent **205**, and P10 O220/O221 independent **61** checks also passed, and all three regenerated P8–P10 ZIP hashes match reference.

**Release gate still open:** the ZIP import omitted root `package-lock.json`, so reproducible `npm ci` and the browser build are not qualified; dependencies are not cached and online installation stalled in this environment. Full browser UI inspection/export and MK1/MK3 regressions remain unverified. An old P8 standalone test hardcodes its interim 5,033 census; the proper P11 cumulative suite and independent P8 parity pass. See [the full validation record](docs/P11_GITHUB_SOURCE_REGRESSION_2026-11-04.md), [Issue #3](https://github.com/87otlto-coder/mk-dos-archive/issues/3) and [P11 release Issue #2](https://github.com/87otlto-coder/mk-dos-archive/issues/2).

## P11 production build and browser boot qualified — 2026-11-04

P11 `develop` now **passes GitHub Actions strict `npm ci`, Vite production build, full TypeScript check, source syntax check, and headless Chrome source-offline onboarding**. Verified run: [41920807431](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/41920807431). The compiled static artifact passed ZIP integrity checking; the original game binaries were not added to GitHub.

A reproducible **new npm 11-generated lockfile** is committed on `develop` (it differs from the archived original P11 lockfile, which remains in local custody). The older O198 Forest typing issue was corrected without any change to its deterministic forensic ZIP. Low-risk Asset Library navigation and independent-scroll changes were committed and built, with the original-MK2 **5,053 assets / 40 cumulative checks** preserved.

**Open at the November 4 checkpoint:** browser interactions with actual original game files, particularly Stage Gallery resource filters, asset previews and export, plus MK1/MK3 regression. Local browser navigation was blocked by this tool environment's Chromium administrator policy, which is not an application test failure. See [P11 build / browser QA record](docs/P11_BUILD_BROWSER_QA_2026-11-04.md) and [Issue #4](https://github.com/87otlto-coder/mk-dos-archive/issues/4). **P11 remains on `develop`; `main` stays P6.**

## Governing objective

The first major milestone is a sophisticated extractor for original DOS **MK1, MK2 and MK3**, capable of showing and exporting original resources with correct index pixels, palettes where evidenced, sprite/background animation groups, stage construction information, sound, speech and music. Investigate executable behavior only when it serves that extractor. Gameplay, control, combat and damage logic are not current work.

**Maintain the existing research workbench.** Do not simplify or separate source destructively. Consider an extractor-only copy/branch once coverage is mature enough.

## Verified source and development checkpoint

| Item | Status |
|---|---|
| Original frozen application source | O270 (2026-10-31) |
| Last *full source* checkpoint | **P41 consolidated on develop; P16 accepted on main** (2026-11-07; prior checkpoints preserved) |
| P6 ZIP SHA-256 | `49cf14b72475189bcb8be53fe6ad1d11e4b145205b9e4012c4c2320235a7735e` |
| MK2 original EXE SHA-256 | `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` |
| P6 canonical MK2 headless scanner | **5,016 unique assets** |
| Most recent interim pass | **P45**, after P41 |
| Latest full MK2 original-fixture cumulative result | **P45: 5,369 representations / 4,357 retained cumulative checks plus coverage gates**, full prior suites and independent component/source parity |
| Next planned pass | **P46 fifth-pass consolidation assessment** |
| Browser / full React + Vite verification | **Build, onboarding, and user-tested core 3-game previews/exports passed; stage coverage incomplete** |
| Full Git-safe source tracked on GitHub | **Yes — current main P16; P6 and P11 retained in history** |

The original P6 ZIP and unfiltered P11 archive remain in the project conversation. GitHub contains the **audited, Git-safe application and research source**, not commercial game installations or all raw forensic evidence. P11 was promoted on November 5; P16 source checkpoint preserves the P11 baseline and adds source-only pass evidence.

## P7–P10 cumulative work (headless and fixture verified)

| Pass | Asset improvement | MK2 census |
|---|---|---:|
| P6 | Consolidated P1–P5 | 5,016 |
| P7 | Five Living Forest source-local layers, index and provisional-color previews (+10) | 5,026 |
| P8 | Seven Pit II lower-wall/crack original graphics (+7) | 5,033 |
| P9 | Six Pit II upper-stage source-local background layers (+6) | 5,039 |
| P10 | Fourteen Pit II bridge-actor frames in two authenticated seven-frame source loops (+14) | **5,053** |

Keep confidence boundaries: source-local layers are **not** completed full stages; palette candidates are not runtime-confirmed DAC selection; source frame order and loop-backs do not imply known milliseconds or world placement.

**P10 tested:** 225 integration checks, 61 independent parity checks, original O221 mutation controls; exported 14 original frame records. Previous headless MK2 asset groups remained available. P7–P10 changes are consolidated in the local P11 full archive and the **GitHub P11 source checkpoint**, with all four interim patch files preserved. Core Windows browser preview/export validation has since passed; detailed remaining QA is in Issue #5.

## Near-term next steps

1. Assess P46 from verified P45 on develop; preserve P41/P36/P31/P26 and earlier checkpoints.
2. Consolidate P42-P45 with fresh three-game collection/export, twelve independent image families, current 315-reference accounting and all 43 effect export/claim controls; audit the complete committed source.
3. Keep original-data browser actions and native palette/timing/alpha/activation/world composition separately qualified. CAVE's 120-byte prefix remains unknown; out-of-scope bytes do not prove missing artwork.
4. Preserve the research workbench and source provenance. Main promotion remains separately authorized.

## Scope discipline

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION.**

A verified source relationship is not automatically verified runtime timing, ownership or final scene composition. A research pass should contribute to extraction completeness, accuracy or usability; otherwise record the unknown and move on.

## Release conventions

- P6 = source checkpoint, **headless verified**.
- P7–P10 = headless-verified changes incorporated in the **P11 consolidated source on `main`**.
- P11 = consolidated, GitHub CI qualified, source-fixture regressed and core-user-browser-verified **source checkpoint on `main`** (2026-11-05); not a claim of full stage reconstruction.
- P12–P15 = original-fixture-tested additive MK2 extraction passes, consolidated in **P16 Git-safe source checkpoint on main (2026-11-06)**. P16 itself has no decoder changes; its fresh fixture checks cover input identity and P11 baseline. New-asset browser interaction remains validation pending.
- P22–P25 are consolidated in **P26 on develop**, with fresh three-game/independent MK2 regression and complete source audit. Main remains P16; browser/native-runtime qualifications are separate.
- P27-P30 are consolidated in **P31 on develop**, with fresh three-game/eight-family verification and complete source audit. Main remains P16; source consolidation is not runtime/browser acceptance.
- Never describe code that is not actually committed to GitHub as “uploaded” or “tracked in GitHub.”

Update this file whenever the authoritative baseline or release status changes.
