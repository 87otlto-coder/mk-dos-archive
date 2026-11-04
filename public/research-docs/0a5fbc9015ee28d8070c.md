# O200 — Forest callback object fields and forensic export

This release extends the O199.1 corrected research source. It does not modify the original game or rewrite any original decoding engine.

## Run on Windows

1. Extract the O200 source ZIP. Open the inner `MK-DOS-Archive` folder.
2. Reuse your installed dependencies or run `npm ci` in a normal network-enabled Windows terminal.
3. Run `npm run test:syntax`, then `npm run build`, then `npm run dev`.
4. Load your original, **unmodified** MK2 directory. Open **Laboratory → Compile & hypotheses → O200 Forest callback object-field derivation** and choose **Trace source field writes**.
5. Inspect the three separate operand/field records and choose **Export O200 complete forensic ZIP**. The ZIP includes source hashes, byte windows, a schematic and independent-verification instructions.

You can also run `TEST_O200.cmd "C:\path\to\your\MK2"` to check source parsing and the standalone original-fixture/export verification. The test does not write to the game directory. This fixture must contain unmodified `MK2.EXE`.

## Interpretation limits

The reported pairs `(197,76)`, `(422,76)` and `(638,76)` are values **written to original object fields** if the second callback is successfully reached; they are **not proven screen-space coordinates**, a rendered Forest scene, confirmed object identities or proof of animation playback. The first callback's condition and 3-count loop are source instruction facts, not observed gameplay behavior.

The O199 runtime test generator is still the preferred next test. Keep the original control and experimental recordings separate. The F9 cheat patch and experimental NOP patch belong to independent copies, not the source installation.

The research code and evidence archive contain no proprietary MK2 source resources. The full Vite/browser build cannot be marked verified from this environment because npm's offline dependency cache is incomplete.
