# Headless migration audit

Baseline: dedicated branch forked from GitHub main, which contains the P16 stable checkpoint. The older local browser checkout is not the source baseline.

| Class | Committed evidence | Decision |
|---|---|---|
| Qualified indexed images | P12 `src/core/assets/mk2IntroLzwP12.ts`, O110B/O110E independent hash manifest | Lift the binary decoder and source palette parser into native Node TypeScript |
| Qualified object graphics | P13 `src/core/assets/mk2MountainSourceP13.ts`, O96T/O96U independent verifier | Migrate the bounded native streams and preserve selected versus adjacent records |
| Collection and export | `src/core/assets/collection.ts`, `src/core/assets/export.ts` | Keep legacy catalog/ZIP handling in place and export plain index/mask files from the CLI |
| Application integration | DirectorySource, Asset model, browser previews and Vite smoke workflow | Leave the existing app intact |
| Diagnostics | P90 source initializer, camera and projection checks | Source-backed findings remain available in the research workbench |
| Runtime-dependent work | P91 capture contract and native observer research | No qualified Tomb runtime capture admitted by this engine |
| Other games/audio | P16/P11 documented MK1 background modules and MK3 image/audio collections, MK2 U8/music census | Deferred pending focused decoder and fixture qualification |

P12 source introduction: 576d2d28fea53ee5463bb5fd46b907d4f7b361b8. P13 source introduction: 9ea61f358a6c940cdb0462343a76131068183be5. Independent parity manifests remain under `scripts/fixtures/`.

Node 24 runs the project's existing TypeScript language directly. The new source uses Node built-ins only.
