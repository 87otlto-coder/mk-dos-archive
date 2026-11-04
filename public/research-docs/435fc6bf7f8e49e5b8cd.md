# MK DOS Archive — O195 Cross-Stage Floor Comparison

This builds on **O194** without replacing its catalogue or hypothesis tools.

## In the UI

1. Load an MK2 installation in MK DOS Archive.
2. Go to **Laboratory → Compile & hypotheses**.
3. Scroll to **O195 · Cross-stage packed-floor hypothesis**.
4. Set **Hypothetical vertical scroll** and **Hypothetical camera word**. Start with 0 and 288.
5. Click **Run cross-stage comparison**.
6. View the schematic and the exact source-control table. Expand the original-token evidence if needed.
7. Click **Export full forensic ZIP**. This output is the preferred input for the next research conversation.

### Reading results

The bars show *calculated row coverage*, not original stage graphics. Red segments indicate row requests past the nominal 200-row display end for the selected hypothetical scroll. Camera-word changes affect the predicted per-row source correction and do not necessarily change visible vertical row count.

A matching pointer operand does **not** mean same bitmap, palette, parallax or animation timing. Neither original commercial resource files nor an invented Forest image are exported.

## Reproduce outside the UI (developer only)

In the project root, with Node 22+ and Python 3:

```
node scripts/verify-o195-fixture.cjs "C:\\path\\to\\original\\MK2"
python scripts/verify-o195-export.py "C:\\path\\to\\original\\MK2\\MK2.EXE" "C:\\path\\to\\MKDOS_O195_Cross_Stage_Floor_Forensic_Evidence.zip"
```

For a full application build on Windows:

```
npm ci
npm run build
npm run dev
```

The source tests above passed against the provided original fixture. The full Vite/browser build has **not** been confirmed in this environment because npm installation failed.
