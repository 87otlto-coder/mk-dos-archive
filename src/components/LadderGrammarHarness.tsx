import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';
import { MK1FighterPaletteOwnershipReport } from '../games/mk1/research/fighterPaletteOwnership';
import {
  buildLadderGrammarAccessBundle,
  createMK1LadderGrammarAccessEditExport,
  EnduranceToken,
  executeLadderGrammarAccessEdit,
  GrammarAccessToken,
  MK1SinglePlayerLadderGrammarReport,
} from '../games/mk1/research/singlePlayerLadderGrammar';

interface Props {
  source: DirectorySource;
  qualification: MK1SinglePlayerLadderGrammarReport;
  ownership: MK1FighterPaletteOwnershipReport;
  onExport: (artifact: ResearchArtifact) => void;
}

const TOKENS: Array<{ token: GrammarAccessToken; label: string }> = [
  { token: 15, label: '15 / 0x0F · TEST YOUR MIGHT' },
  { token: 16, label: '16 / 0x10 · Endurance pair 1' },
  { token: 17, label: '17 / 0x11 · Endurance pair 2' },
  { token: 18, label: '18 / 0x12 · Endurance pair 3' },
  { token: 19, label: '19 / 0x13 · Endurance pair 4' },
  { token: 20, label: '20 / 0x14 · Endurance pair 5' },
  { token: 21, label: '21 / 0x15 · Endurance pair 6' },
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

function prettyName(value: string | null, id: number): string {
  if (!value) return `fighter ID ${id}`;
  return value.replace(/_/g, ' ');
}

export function LadderGrammarHarness({ source, qualification, ownership, onExport }: Props) {
  const [token, setToken] = useState<GrammarAccessToken>(18);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { setToken(18); setSelected(0); setError(null); setSuccess(null); }, [qualification.operationId]);

  const fighterNames = useMemo(() => Array.from({ length: 7 }, (_, id) => prettyName(ownership.slots[id]?.rosterName ?? null, id)), [ownership]);
  const predicted = useMemo(() => token >= 16
    ? qualification.endurance.pairings.find(pair => pair.token === token && pair.selectedPlayableCharacterId === selected) ?? null
    : null, [qualification, token, selected]);
  const pattern = token >= 16
    ? qualification.endurance.stablePairPositionPatterns.find(row => row.token === token as EnduranceToken)?.pattern ?? null
    : null;
  const ready = qualification.status === 'SUCCESS' && qualification.decision.verdict === 'SINGLE_PLAYER_LADDER_GRAMMAR_ESTABLISHED';

  async function exportBundle() {
    if (busy || !ready) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const result = await executeLadderGrammarAccessEdit(source, qualification, token);
      const artifact = await createMK1LadderGrammarAccessEditExport(result);
      const zip = await buildLadderGrammarAccessBundle(result);
      if (!alive.current) return;
      const stamp = result.report.timestamp.replace(/[:.]/g, '-');
      downloadZip(zip, `mk1-ladder-token-${token}-${stamp}.zip`);
      onExport({ filename: `mk1_ladder_grammar_access_token_${token}_${stamp}.json`, pass: '1E.3N.2', status: result.report.status, timestamp: result.report.timestamp, data: artifact });
      setSuccess(`Grammar access bundle exported · token ${token} · ${result.report.evidence.changedByteCount} changed ladder bytes · reversal verified.`);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally { if (alive.current) setBusy(false); }
  }

  if (!ready) return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300" aria-label="Single-player ladder grammar">
    Single-player ladder grammar blocked: 1E.3N.2 did not close successfully.
  </section>;

  return <section className="mt-3 p-3 rounded border border-indigo-800 text-xs text-zinc-300" aria-label="Single-player ladder grammar">
    <h3 className="font-semibold text-indigo-300">Single-player ladder grammar · 1E.3N.2</h3>
    <p className="mt-2">The recovered maps are now parsed as a byte-coded progression stream rather than a flat opponent list. <code>0x0F</code> enters Test Your Might, <code>0x10..0x15</code> select player-relative endurance pairs, and signed <code>0xFF</code> terminates the ladder.</p>

    <div className="mt-2 p-2 rounded bg-zinc-950/70 border border-zinc-800 overflow-x-auto">
      <div className="text-zinc-400">Invariant four-map grammar</div>
      <code className="whitespace-nowrap">3 normal → TYM → 3 normal → TYM → mirror → endurance → endurance → TYM → endurance → Goro → Shang Tsung → END</code>
    </div>

    <div className="mt-2 grid lg:grid-cols-2 gap-2">
      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800">
        <div className="font-semibold text-zinc-300">Original ladder maps</div>
        {qualification.maps.map(map => <div key={map.mapIndex} className="mt-1 font-mono text-[11px] text-zinc-400">Map {map.mapIndex}: {map.bytes.map(value => value === 255 ? '-1' : value).join(' · ')}</div>)}
      </div>
      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800">
        <div className="font-semibold text-zinc-300">Endurance pairing grammar</div>
        <div className="mt-1 font-mono text-[11px] text-zinc-400">16: A+B · 17: C+D · 18: E+F · 19: A+D · 20: B+E · 21: C+F</div>
        <div className="mt-1 text-zinc-500">A..F are the six ordinary opponents in the selected fighter's player-relative row.</div>
      </div>
    </div>

    <div className="mt-3 grid md:grid-cols-2 gap-3">
      <div>
        <label className="block text-zinc-400" htmlFor="ladder-grammar-token">Force first ladder token</label>
        <select id="ladder-grammar-token" disabled={busy} value={token} onChange={event => { setToken(Number(event.target.value) as GrammarAccessToken); setError(null); setSuccess(null); }} className="mt-1 w-full p-2 rounded bg-zinc-950 border border-zinc-700 text-zinc-200">
          {TOKENS.map(item => <option key={item.token} value={item.token}>{item.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-zinc-400" htmlFor="ladder-preview-fighter">Preview for selected fighter</label>
        <select id="ladder-preview-fighter" disabled={busy || token === 15} value={selected} onChange={event => setSelected(Number(event.target.value))} className="mt-1 w-full p-2 rounded bg-zinc-950 border border-zinc-700 text-zinc-200 disabled:opacity-40">
          {fighterNames.map((name, id) => <option key={id} value={id}>{id} · {name}</option>)}
        </select>
      </div>
    </div>

    {token === 15 ? <div className="mt-3 p-2 rounded border border-amber-900 bg-amber-950/20">
      <div className="font-semibold text-amber-300">Predicted event: TEST YOUR MIGHT</div>
      <div className="mt-1 text-zinc-400">The qualified 0x0F branch increments <code>MAP_POSITION</code> and reaches a display record containing the literal <code>TEST YOUR MIGHT</code>. This export is useful for confirming the transition behavior at ladder position 0.</div>
    </div> : predicted && <div className="mt-3 p-2 rounded border border-fuchsia-900 bg-fuchsia-950/20">
      <div className="font-semibold text-fuchsia-300">Predicted first endurance pair for {fighterNames[selected]}</div>
      <div className="mt-1 text-lg"><strong>{fighterNames[predicted.firstCharacterId]}</strong> → <strong>{fighterNames[predicted.secondCharacterId]}</strong></div>
      <div className="mt-1 font-mono text-zinc-500">token {token} · pair index {predicted.pairIndex} · relative pattern {pattern ? `${String.fromCharCode(65 + pattern[0])}+${String.fromCharCode(65 + pattern[1])}` : 'unknown'} · IDs {predicted.firstCharacterId}+{predicted.secondCharacterId}</div>
    </div>}

    <button type="button" onClick={exportBundle} disabled={busy} className="mt-3 px-3 py-2 rounded bg-indigo-800 hover:bg-indigo-700 disabled:opacity-40 text-white">
      {busy ? 'Verifying export…' : `Download token ${token} first-event bundle`}
    </button>

    <div className="mt-3 text-zinc-500">Tokens 9–14 are absent from all four recovered maps and remain unassigned. The secret green-ninja route remains a separate conditional state path rather than a ladder token.</div>
    <div role="status" className="mt-2 text-emerald-300">{success}</div>
    {error && <div role="alert" className="mt-2 text-red-300">{error}</div>}
  </section>;
}
