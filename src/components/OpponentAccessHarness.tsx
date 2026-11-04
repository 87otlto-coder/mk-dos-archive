import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';
import { PaletteRoundTripReport } from '../games/mk1/research/paletteRoundTrip';
import {
  buildGoroSlot7CompositeBundle,
  buildShangSlot8CompositeBundle,
  buildOpponentAccessTestBundle,
  createMK1OpponentAccessEditExport,
  executeOpponentAccessEdit,
  FirstOpponentToken,
  MK1OpponentAccessHarnessReport,
} from '../games/mk1/research/opponentAccessHarness';

interface Props {
  source: DirectorySource;
  baseline: PaletteRoundTripReport;
  qualification: MK1OpponentAccessHarnessReport;
  onExport: (artifact: ResearchArtifact) => void;
}

const TARGETS: Array<{ token: FirstOpponentToken; label: string; detail: string }> = [
  { token: 6, label: 'Special token 6 · Goro-associated ID 7', detail: 'Stable across all seven playable-character mapping rows.' },
  { token: 7, label: 'Special token 7 · Shang Tsung · ID 8', detail: 'Stable across all seven playable-character mapping rows; runtime identity has now been confirmed as Shang Tsung.' },
  { token: 8, label: 'Mirror control · current playable character', detail: 'Maps back to the selected playable character in every row.' },
  { token: 0, label: 'Ordinary token 0', detail: 'Player-relative ordinary opponent; useful as a control.' },
  { token: 1, label: 'Ordinary token 1', detail: 'Player-relative ordinary opponent; useful as a control.' },
  { token: 2, label: 'Ordinary token 2', detail: 'Player-relative ordinary opponent; useful as a control.' },
  { token: 3, label: 'Ordinary token 3', detail: 'Player-relative ordinary opponent; useful as a control.' },
  { token: 4, label: 'Ordinary token 4', detail: 'Player-relative ordinary opponent; useful as a control.' },
  { token: 5, label: 'Ordinary token 5', detail: 'Player-relative ordinary opponent; useful as a control.' },
];

function downloadZip(bytes: Uint8Array, filename: string) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type: 'application/zip' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function OpponentAccessHarness({ source, baseline, qualification, onExport }: Props) {
  const [token, setToken] = useState<FirstOpponentToken>(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { setError(null); setSuccess(null); setToken(6); }, [qualification.operationId]);

  const target = useMemo(() => TARGETS.find(item => item.token === token) ?? TARGETS[0], [token]);
  const mapping = qualification.offsetToOchar.tokenMappings[token];
  const ready = qualification.status === 'SUCCESS' && qualification.decision.verdict === 'OPPONENT_ACCESS_HARNESS_ESTABLISHED';
  const secret = qualification.secretGreenNinjaRoute;

  async function exportAccessOnly() {
    if (busy || !ready) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const result = await executeOpponentAccessEdit(source, qualification, token);
      const artifact = await createMK1OpponentAccessEditExport(result);
      const zip = await buildOpponentAccessTestBundle(result);
      if (!alive.current) return;
      const stamp = result.report.timestamp.replace(/[:.]/g, '-');
      downloadZip(zip, `mk1-opponent-access-token-${token}-${stamp}.zip`);
      onExport({ filename: `mk1_opponent_access_edit_token_${token}_${stamp}.json`, pass: '1E.3N.1', status: result.report.status, timestamp: result.report.timestamp, data: artifact });
      setSuccess(`Access-only bundle exported · token ${token} · ${result.report.evidence.changedByteCount} changed ladder bytes · reversal verified.`);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally { if (alive.current) setBusy(false); }
  }

  async function exportGoroComposite() {
    if (busy || !ready) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const result = await buildGoroSlot7CompositeBundle(source, baseline, qualification);
      if (!alive.current) return;
      const stamp = result.report.timestamp.replace(/[:.]/g, '-');
      downloadZip(result.zip, `mk1-slot7-goro-access-plus-gongoro-magenta-${stamp}.zip`);
      onExport({ filename: `mk1_opponent_access_composite_goro_${stamp}.json`, pass: '1E.3N.1', status: result.report.status, timestamp: result.report.timestamp, data: result.report });
      setSuccess(`Composite exported · Goro-associated token 6 first · GONGORO_P magenta · ${result.report.evidence.changedByteCount} total changed bytes · reversal verified.`);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally { if (alive.current) setBusy(false); }
  }

  async function exportShangComposite() {
    if (busy || !ready) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const result = await buildShangSlot8CompositeBundle(source, baseline, qualification);
      if (!alive.current) return;
      const stamp = result.report.timestamp.replace(/[:.]/g, '-');
      downloadZip(result.zip, `mk1-slot8-shang-access-plus-yang-emp-magenta-${stamp}.zip`);
      onExport({ filename: `mk1_opponent_access_composite_shang_${stamp}.json`, pass: '1E.3N.3', status: result.report.status, timestamp: result.report.timestamp, data: result.report });
      setSuccess(`Composite exported · Shang Tsung token 7 first · YANG_P / EMP_P alias record magenta · ${result.report.evidence.changedByteCount} total changed bytes · reversal verified.`);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally { if (alive.current) setBusy(false); }
  }

  if (!ready) return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300" aria-label="Opponent access harness">
    Opponent access harness blocked: the 1E.3N.1 ladder/token qualification did not close successfully.
  </section>;

  return <section className="mt-3 p-3 rounded border border-cyan-800 text-xs text-zinc-300" aria-label="Opponent access harness">
    <h3 className="font-semibold text-cyan-300">Opponent access harness · 1E.3N.1</h3>
    <p className="mt-2">This is a convenience layer over the game's original one-player ladder machinery. It changes only the <strong>first byte of each of the four recovered ladder maps</strong>; combat, AI and stage-selection code remain untouched.</p>
    <div className="mt-2 grid md:grid-cols-2 gap-2">
      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800">
        <div className="text-zinc-400">Qualified ladder-map first-byte offsets</div>
        <code>{qualification.decision.firstEncounterPatchOffsetsHex.join(', ')}</code>
      </div>
      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800">
        <div className="text-zinc-400">Stable special mappings</div>
        <div><code>token 6 → ID 7 → C_GORO_WINS</code></div>
        <div><code>token 7 → ID 8 → C_EMP_WINS → Shang Tsung (runtime-confirmed)</code></div>
        <div><code>token 8 → current fighter</code></div>
      </div>
    </div>

    <label className="block mt-3 text-zinc-400" htmlFor="opponent-access-target">First encounter</label>
    <select id="opponent-access-target" disabled={busy} value={token} onChange={event => { setToken(Number(event.target.value) as FirstOpponentToken); setError(null); setSuccess(null); }} className="mt-1 w-full md:w-auto p-2 rounded bg-zinc-950 border border-zinc-700 text-zinc-200">
      {TARGETS.map(item => <option key={item.token} value={item.token}>{item.label}</option>)}
    </select>
    <div className="mt-2 text-zinc-400">{target.detail}</div>
    <div className="mt-1 font-mono text-zinc-500">Resolved IDs by playable-character row: {mapping.characterIdsByPlayableCharacter.join(', ')}</div>

    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={exportAccessOnly} disabled={busy} className="px-3 py-2 rounded bg-cyan-800 hover:bg-cyan-700 disabled:opacity-40 text-white">
        {busy ? 'Verifying export…' : `Download access-only token ${token} bundle`}
      </button>
      {token === 6 && <button type="button" onClick={exportGoroComposite} disabled={busy} className="px-3 py-2 rounded bg-fuchsia-800 hover:bg-fuchsia-700 disabled:opacity-40 text-white">
        {busy ? 'Verifying export…' : 'Download Goro access + GONGORO_P magenta bundle'}
      </button>}
      {token === 7 && <button type="button" onClick={exportShangComposite} disabled={busy} className="px-3 py-2 rounded bg-fuchsia-800 hover:bg-fuchsia-700 disabled:opacity-40 text-white">
        {busy ? 'Verifying export…' : 'Download Shang Tsung access + YANG_P / EMP_P magenta bundle'}
      </button>}
    </div>

    <div className="mt-3 p-2 rounded border border-violet-900 bg-violet-950/20">
      <div className="font-semibold text-violet-300">Secret green-ninja route discovered, access patch deferred</div>
      {secret ? <p className="mt-1 text-zinc-400">The executable contains a separate <code>{secret.flagSymbol}</code> + character-ID <code>{secret.selectedCharacterId}</code> + <code>{secret.paletteSymbol}</code> path. <code>PLAYER_NORMPAL</code> consumes the flag and green-ninja palette. That is strong evidence for a composite secret-fighter mechanism, but the surrounding encounter/stage state is not yet reduced to a minimal safe patch, so 1E.3N.1 deliberately does not expose it.</p>
        : <p className="mt-1 text-zinc-400">No independently qualified green-ninja state path was available in this run.</p>}
    </div>

    <div role="status" className="mt-2 text-emerald-300">{success}</div>
    {error && <div role="alert" className="mt-2 text-red-300">{error}</div>}
  </section>;
}
