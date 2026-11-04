import React, { useEffect, useRef, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { PaletteRoundTripReport } from '../games/mk1/research/paletteRoundTrip';
import {
  buildKanoEntryTestBundle,
  createMK1PaletteEntryEditExport,
  executePaletteEntryEdit,
  getKanoPaletteEditorPass,
  KanoPaletteSymbol,
} from '../games/mk1/research/paletteEntryEdit';
import { formatPaletteWord, parsePaletteWord, paletteWordToHex, hexColorToPaletteWord } from '../games/mk1/research/paletteEntryColors';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';

interface Props { source: DirectorySource; baseline: PaletteRoundTripReport; onExport: (artifact: ResearchArtifact) => void; }

type Drafts = Record<KanoPaletteSymbol, string[]>;

function getOriginalWords(baseline: PaletteRoundTripReport, symbol: KanoPaletteSymbol): number[] {
  const target = baseline.groundTruthRecords.find(record => record.symbolNames.includes(symbol));
  return target ? [...baseline.ir.records[target.recordIndex].rawColorWords] : [];
}

export function KanoPaletteEditor({ source, baseline, onExport }: Props) {
  const normalOriginals = getOriginalWords(baseline, 'KANO_P');
  const alternateOriginals = getOriginalWords(baseline, 'KANO3_P');
  const originalsBySymbol: Record<KanoPaletteSymbol, number[]> = { KANO_P: normalOriginals, KANO3_P: alternateOriginals };
  const [symbol, setSymbol] = useState<KanoPaletteSymbol>('KANO_P');
  const [drafts, setDrafts] = useState<Drafts>(() => ({
    KANO_P: normalOriginals.map(formatPaletteWord),
    KANO3_P: alternateOriginals.map(formatPaletteWord),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const originals = originalsBySymbol[symbol];
  const draft = drafts[symbol];
  const parsed = draft.map(parsePaletteWord);
  const valid = originals.length === 23 && parsed.length === 23 && parsed.every(word => word !== null);
  const changes = parsed.filter((word, index) => word !== null && word !== originals[index]).length;
  const pass = getKanoPaletteEditorPass(symbol);
  const isAlternate = symbol === 'KANO3_P';

  function chooseTarget(next: KanoPaletteSymbol) {
    if (busy) return;
    setSymbol(next); setSuccess(null); setError(null);
  }
  function update(index: number, text: string) {
    setDrafts(current => ({ ...current, [symbol]: current[symbol].map((value, i) => i === index ? text : value) }));
    setSuccess(null); setError(null);
  }
  function resetAll() {
    setDrafts(current => ({ ...current, [symbol]: originals.map(formatPaletteWord) }));
    setError(null); setSuccess(null);
  }
  async function download() {
    if (busy || !valid || !changes) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const result = await executePaletteEntryEdit(source, baseline, parsed as number[], symbol);
      const artifact = await createMK1PaletteEntryEditExport(result);
      const zip = await buildKanoEntryTestBundle(result);
      if (!alive.current) return;
      const timestamp = result.report.timestamp.replace(/[:.]/g, '-');
      const stem = isAlternate ? 'mk1-kano-alternate-colors' : 'mk1-kano-colors';
      const url = URL.createObjectURL(new Blob([new Uint8Array(zip).buffer], { type: 'application/zip' }));
      const a = document.createElement('a'); a.href = url; a.download = `${stem}-${timestamp}.zip`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      onExport({ filename: `mk1_palette_entry_edit_${symbol.toLowerCase()}_${timestamp}.json`, pass, status: result.report.status,
        timestamp: result.report.timestamp, data: artifact });
      const test = isAlternate ? 'Test Kano versus Kano.' : 'Test Kano against a different fighter.';
      setSuccess(`${result.report.edits.length} ${symbol} colors exported · ${result.report.evidence.changedByteCount} changed bytes · reversal verified. ${test}`);
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (alive.current) setBusy(false); }
  }

  if (normalOriginals.length !== 23 || alternateOriginals.length !== 23) {
    return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300" aria-label="Kano palette editor">
      Kano palette editor blocked: the qualified 23-color KANO_P and KANO3_P records are both required.
    </section>;
  }

  return <section className="mt-3 p-3 rounded border border-cyan-800 text-xs text-zinc-300" aria-label="Kano palette editor">
    <h3 className="font-semibold text-cyan-300">Kano color editor · 1E.3J / 1E.3K</h3>
    <div className="mt-3 flex gap-2" role="tablist" aria-label="Kano palette target">
      <button type="button" role="tab" aria-selected={!isAlternate} disabled={busy} onClick={() => chooseTarget('KANO_P')}
        className={`px-3 py-2 rounded border ${!isAlternate ? 'border-cyan-500 bg-cyan-950 text-cyan-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
        Normal · KANO_P · 1E.3J
      </button>
      <button type="button" role="tab" aria-selected={isAlternate} disabled={busy} onClick={() => chooseTarget('KANO3_P')}
        className={`px-3 py-2 rounded border ${isAlternate ? 'border-fuchsia-500 bg-fuchsia-950 text-fuchsia-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
        Alternate · KANO3_P · 1E.3K
      </button>
    </div>
    <p className="mt-3">Edit any of the 23 colors in <code>{symbol}</code>. Choose a color or enter a hexadecimal word (0000–7FFF). Color choices snap to the game’s supported palette.</p>
    {isAlternate
      ? <p className="mt-1 text-zinc-400">KANO3_P is Kano’s verified slot in ALTERNATE_PALETTES. The verified selector switches to that table on the same-character equality edge, so test this export with Kano versus Kano. Which player-side object receives the alternate palette is not asserted here.</p>
      : <p className="mt-1 text-zinc-400">KANO_P is Kano’s verified slot in NORMAL_PALETTES. Test normal-palette edits with Kano against a different fighter.</p>}
    <p className="mt-1 text-zinc-500">Swatches preview color only. The unselected Kano palette record and all unrelated executable bytes remain unchanged.</p>
    <fieldset disabled={busy} className="mt-3 disabled:opacity-60">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left"><thead><tr className="text-zinc-400"><th className="p-2">Entry</th><th>Original</th><th>Edited</th><th>Hex word</th><th>Reset</th></tr></thead>
          <tbody>{draft.map((text, index) => {
            const word = parsed[index]; const changed = word !== null && word !== originals[index];
            return <tr key={`${symbol}-${index}`} className={changed ? (isAlternate ? 'bg-fuchsia-950/40' : 'bg-cyan-950/50') : ''}>
              <td className="p-2">{index + 1}{changed ? ' *' : ''}</td>
              <td><span className="inline-block w-7 h-7 rounded border border-zinc-500 align-middle mr-2" style={{ background: paletteWordToHex(originals[index]) }} /><code>{formatPaletteWord(originals[index])}</code></td>
              <td><input type="color" aria-label={`${symbol} entry ${index + 1} color`} value={paletteWordToHex(word ?? originals[index])} onChange={e => update(index, formatPaletteWord(hexColorToPaletteWord(e.target.value)))} className="w-10 h-8 bg-transparent" /></td>
              <td><input aria-label={`${symbol} entry ${index + 1} hex word`} aria-invalid={word === null} value={text} onChange={e => update(index, e.target.value)} spellCheck={false} maxLength={6} className={`w-24 p-1 rounded bg-zinc-950 border ${word === null ? 'border-red-500' : 'border-zinc-600'} font-mono`} />{word === null && <span className="ml-2 text-red-300">0000–7FFF required</span>}</td>
              <td><button type="button" onClick={() => update(index, formatPaletteWord(originals[index]))} disabled={text === formatPaletteWord(originals[index])} className="p-2 text-cyan-300 disabled:text-zinc-600">Reset</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <button type="button" onClick={resetAll} className="mt-3 mr-3 px-3 py-2 rounded bg-zinc-800">Reset {symbol}</button>
      <button type="button" onClick={download} disabled={!valid || changes === 0 || busy} className={`mt-3 px-3 py-2 rounded disabled:opacity-40 ${isAlternate ? 'bg-fuchsia-800' : 'bg-cyan-800'}`}>
        {busy ? 'Verifying export…' : `Download ${symbol} test bundle (${changes} colors)`}
      </button>
    </fieldset>
    <div role="status" className="mt-2 text-emerald-300">{success}</div>
    {error && <div role="alert" className="mt-2 text-red-300">{error}</div>}
  </section>;
}
