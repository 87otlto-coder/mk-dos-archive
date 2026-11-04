# P11 GitHub source validation — 2026-11-04

## Scope and provenance

Authoritative repository: https://github.com/87otlto-coder/mk-dos-archive. This test compared GitHub's committed tree records with locally retained, audited Git-safe source snapshots. Original game files remained local only.

**Source-bearing import commits (unaltered):**
- P6 on `main`: `eb9691510ce57dd1a7670fcf404de0c0dbd6941b`.
- P11 on `develop`: `65023df71d20eb049a571d6a0d1672d670cddf92`.

Subsequent branch commits contain project documentation; source-bearing code was unchanged as of this check.

## Code identity check

The committed recursive trees are complete (GitHub `truncated:false`). Git blob IDs for matching source paths were compared against Git blob IDs independently calculated from the archived Git-safe ZIP bytes. Four namespace aggregates were checked independently per branch.

| Namespace | P6 `main` | P11 `develop` |
|---|---:|---:|
| `src/` | 358 | 362 |
| `scripts/` | 518 | 526 |
| `tools/` | 191 | 191 |
| `tests/` | 1 | 1 |
| **Total** | **1,068** | **1,080** |

Every namespace's count and ordered Git blob identity aggregate matched. **2,148 source/test/tool file instances across both branches** were compared. This excludes project documentation deliberately updated after import. The full raw forensic/archive ZIPs were not uploaded to GitHub.

## Headless original MK2 regression from freshly extracted Git-safe source

| Test | Result |
|---|---|
| P6 `scripts/verify-mk2-p6-standalone.cjs` | **PASS — 121 checks, 5,016 unique assets** |
| P11 `scripts/verify-mk2-p11-cumulative.cjs` | **PASS — 40 checks, 5,053 unique assets** |
| P10 full integration test on consolidated source | **PASS — 225 checks, 5,053 assets** |
| Original O210 Python independent P8 export check | **PASS — 68 checks** |
| Original O205 Python independent P9 export check | **PASS — 205 checks** |
| Original O220/O221 Python independent P10 export check | **PASS — 61 checks** |
| P8 source ZIP SHA-256 | `7832bae102ab952024f8fa2b48f86379d5a519f2302491757027b4568654bdd5` |
| P9 source ZIP SHA-256 | `25abe08f1471a46c9e205bed3693559499afd7b0893bd277c5c51130769f652d` |
| P10 source ZIP SHA-256 | `6aedb63e4b974468c64a2a80afc4270be0815d716fa265cee21278b612ddf79c` |

The three original export packages above were regenerated afresh from the source snapshot, and their hashes matched the archived reference bytes.

## Known blockers and boundaries

1. The Git-safe import inadvertently excluded the root `package-lock.json`. Its original **95,605-byte** copy is preserved in the unfiltered P11 source archive and should be restored after review. Without it, `npm ci` fails immediately. When temporarily restored for testing, `npm ci --offline` fails because dependencies are not cached; online installation stalled in this sandbox. **No production Vite build is claimed.**
2. An older interim P8 integration script hardcodes an obsolete 5,033-asset cumulative total and fails if run unchanged against P11's valid 5,053 total. P11's own cumulative script and the independent P8 Python parity both pass. This is a test-harness versioning problem, not evidence of missing pixels.
3. **Browser UI, Asset Library navigation, Stage Gallery preview, and browser exports are unverified.** MK1/MK3 regressions were not run in this checkpoint validation.
4. Source-local layers and original frame ordering do not establish complete stage assembly, runtime palette ownership or milliseconds-per-frame.

**P11 remains on `develop`; do not promote to `main` until dependency/build/browser release gates are actually verified.** Track the dependency and browser work in [Issue #3](https://github.com/87otlto-coder/mk-dos-archive/issues/3) and overall P11 release in [Issue #2](https://github.com/87otlto-coder/mk-dos-archive/issues/2).

No original game binaries or extracted copyrighted outputs were committed during these checks.
