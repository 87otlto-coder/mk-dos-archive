# MK DOS Archive repository instructions

## GitHub Actions storage and repository governance

Git is authoritative for source, build recipes, lockfiles, synthetic tests and shareable research records. Use review branches and pull requests. Preserve source history and repository visibility.

Keep the inputs, tool versions, commands, observations and provenance needed to reproduce a finding. Before expiring a sole copy of evidence, identify the files and their owner and pause for approval. Verify any durable, authorized copy by checksum. Keep proprietary ROMs, game files, derived assets, private fixtures and secrets out of commits, CI logs, caches and uploads. Record hashes and local reproduction instructions where appropriate.

Run each expensive check once per required event and platform. Reuse existing jobs, avoid repeated uploads and restrict upload paths to the intended deliverable. Give disposable generated builds a three-day expiry as a backup. After a new upload and its producing run both succeed, retain the newest three successful disposable builds across all repository branches. Upload first even at capacity, then serialize cleanup and delete the oldest eligible builds by exact artifact name and ID. A changed hash, commit, branch or milestone alone does not justify retention.

Before cleanup, inventory artifact IDs, names, sizes, digests and producing runs. Inspect the contents and confirm how to recover source and evidence. Delete only identified disposable artifacts. Record decisions and reasons, then re-list the inventory and reconcile deleted IDs, bytes and protected artifacts. Keep the ledger outside the expiring build.

Protect the P77 verification kit and the P78 and P80 source units. Exclude all three from browser-build cleanup. Only the exact mk-dos-p11-browser-build artifact is disposable under this rule. Keep browser uploads opt-in and skip a duplicate active build of the same commit. The default-branch cleanup workflow verifies the upload step and producing run, then prunes by creation time (higher ID wins a tie). Only the cleanup job receives Actions write permission. Preserve original-input hashes, decoder checks, reproduction scripts and independently observed results. Keep original DOS files and extracted media local.

## Mandatory incident handover / Windows-only CI

Read [docs/ACTIONS_INCIDENT_2026-11-11.md](docs/ACTIONS_INCIDENT_2026-11-11.md) before editing, dispatching, or cleaning GitHub Actions. The Nov 11 retention incident was caused by 226 automatically uploaded browser builds (~4,720 MiB) and inadequate retention controls; the verified remedy is opt-in uploads, three-day expiry and automatic post-success rolling retention of the newest **three** browser builds, protecting P77/P78/P80. All future hosted Actions must be **Windows-only** and use Windows-compatible commands, with no Ubuntu/Linux/macOS jobs unless the owner explicitly approves. **Known remediation needed:** existing `p11-build-smoke.yml` and `browser-retention.yml` on main and the four interim/develop workflow variants still use `ubuntu-latest`, Bash and Linux tooling. Migrate each safely to `windows-latest`, preserve source checks and browser retention behavior, and prove it with actual hosted Windows jobs. Do not declare Windows-only enforcement complete, or merge an untested conversion, just because the policy is documented.
