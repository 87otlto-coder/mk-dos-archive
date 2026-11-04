import React, { useEffect, useRef, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { PaletteRoundTripReport } from '../games/mk1/research/paletteRoundTrip';
import { MK1FighterPaletteOwnershipReport } from '../games/mk1/research/fighterPaletteOwnership';
import {
  buildPaletteEntryTestBundle,
  createMK1PaletteEntryEditExport,
  executePaletteEntryEdit,
  getPaletteEntryEditorPass,
} from '../games/mk1/research/paletteEntryEdit';
import { formatPaletteWord, parsePaletteWord, paletteWordToHex, hexColorToPaletteWord } from '../games/mk1/research/paletteEntryColors';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';

interface Props {
  source: DirectorySource;
  baseline: PaletteRoundTripReport;
  ownership: MK1FighterPaletteOwnershipReport;
  onExport: (artifact: ResearchArtifact) => void;
}

const SYMBOL = 'GRIMM_P' as const;

function getOriginalWords(baseline: PaletteRoundTripReport): number[] {
  const target = baseline.groundTruthRecords.find(record => record.symbolNames.includes(SYMBOL));
  return target ? [...baseline.ir.records[target.recordIndex].rawColorWords] : [];
}

export function CagePaletteEditor({ source, baseline, ownership, onExport }: Props) {
  const originals = getOriginalWords(baseline);
  const [draft, setDraft] = useState<string[]>(() => originals.map(formatPaletteWord));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const slot = ownership.slots[0] ?? null;
  const qualified = ownership.status === 'SUCCESS'
    && ownership.decision.paletteTableIndexIsCharacterIdentity
    && slot?.rosterName === 'CAGE'
    && slot.normal.symbolNames.includes(SYMBOL)
    && slot.alternate.symbolNames.includes('GRIMM3_P');
  const parsed = draft.map(parsePaletteWord);
  const valid = qualified && originals.length === 23 && parsed.length === 23 && parsed.every(word => word !== null);
  const changes = parsed.filter((word, index) => word !== null && word !== originals[index]).length;
  const pass = getPaletteEntryEditorPass(SYMBOL);

  function update(index: number, text: string) {
    setDraft(current => current.map((value, i) => i === index ? text : value));
    setSuccess(null); setError(null);
  }
  function resetAll() {
    setDraft(originals.map(formatPaletteWord));
    setError(null); setSuccess(null);
  }
  function fillMagentaTest() {
    setDraft(originals.map(() => formatPaletteWord(0x7c1f)));
    setError(null); setSuccess(null);
  }
  async function download() {
    if (busy || !valid || !changes) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const result = await executePaletteEntryEdit(source, baseline, parsed as number[], SYMBOL);
      const artifact = await createMK1PaletteEntryEditExport(result);
      const zip = await buildPaletteEntryTestBundle(result);
      if (!alive.current) return;
      const timestamp = result.report.timestamp.replace(/[:.]/g, '-');
      const url = URL.createObjectURL(new Blob([new Uint8Array(zip).buffer], { type: 'application/zip' }));
      const a = document.createElement('a'); a.href = url; a.download = `mk1-cage-normal-colors-${timestamp}.zip`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      onExport({ filename: `mk1_palette_entry_edit_grimm_p_${timestamp}.json`, pass, status: result.report.status,
        timestamp: result.report.timestamp, data: artifact });
      setSuccess(`${result.report.edits.length} GRIMM_P colors exported · ${result.report.evidence.changedByteCount} changed bytes · reversal verified. Test Johnny Cage against a different fighter.`);
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (alive.current) setBusy(false); }
  }

  if (!qualified || originals.length !== 23) {
    return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300" aria-label="Cage palette editor">
      Cage palette editor blocked: Pass 1E.3L must establish slot 0 as the CAGE-aligned GRIMM_P / GRIMM3_P pair and the P*_CHAR → object +0x48 palette-index chain.
    </section>;
  }

  return <section className="mt-3 p-3 rounded border border-emerald-800 text-xs text-zinc-300" aria-label="Cage palette editor">
    <h3 className="font-semibold text-emerald-300">First non-Kano ownership test · GRIMM_P / CAGE · 1E.3L</h3>
    <p className="mt-2">Pass 1E.3L mechanically aligns palette slot 0 with <code>CAGE</code>, and proves that the player character value is stored into the same object field later used to index NORMAL_PALETTES / ALTERNATE_PALETTES.</p>
    <p className="mt-1 text-zinc-400">This editor changes only the normal slot-0 record <code>GRIMM_P</code>. Test Johnny Cage against a different fighter. <code>GRIMM3_P</code> and every unrelated executable byte remain unchanged.</p>
    <p className="mt-1 text-zinc-500">A visible Cage-only change will be the first runtime confirmation that the recovered palette ownership mechanism generalizes beyond Kano.</p>
    <fieldset disabled={busy} className="mt-3 disabled:opacity-60">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left"><thead><tr className="text-zinc-400"><th className="p-2">Entry</th><th>Original</th><th>Edited</th><th>Hex word</th><th>Reset</th></tr></thead>
          <tbody>{draft.map((text, index) => {
            const word = parsed[index]; const changed = word !== null && word !== originals[index];
            return <tr key={index} className={changed ? 'bg-emerald-950/40' : ''}>
              <td className="p-2">{index + 1}{changed ? ' *' : ''}</td>
              <td><span className="inline-block w-7 h-7 rounded border border-zinc-500 align-middle mr-2" style={{ background: paletteWordToHex(originals[index]) }} /><code>{formatPaletteWord(originals[index])}</code></td>
              <td><input type="color" aria-label={`GRIMM_P entry ${index + 1} color`} value={paletteWordToHex(word ?? originals[index])} onChange={e => update(index, formatPaletteWord(hexColorToPaletteWord(e.target.value)))} className="w-10 h-8 bg-transparent" /></td>
              <td><input aria-label={`GRIMM_P entry ${index + 1} hex word`} aria-invalid={word === null} value={text} onChange={e => update(index, e.target.value)} spellCheck={false} maxLength={6} className={`w-24 p-1 rounded bg-zinc-950 border ${word === null ? 'border-red-500' : 'border-zinc-600'} font-mono`} />{word === null && <span className="ml-2 text-red-300">0000–7FFF required</span>}</td>
              <td><button type="button" onClick={() => update(index, formatPaletteWord(originals[index]))} disabled={text === formatPaletteWord(originals[index])} className="p-2 text-emerald-300 disabled:text-zinc-600">Reset</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <button type="button" onClick={resetAll} className="mt-3 mr-3 px-3 py-2 rounded bg-zinc-800">Reset GRIMM_P</button>
      <button type="button" onClick={fillMagentaTest} className="mt-3 mr-3 px-3 py-2 rounded bg-fuchsia-900">Fill magenta test</button>
      <button type="button" onClick={download} disabled={!valid || changes === 0 || busy} className="mt-3 px-3 py-2 rounded bg-emerald-800 disabled:opacity-40">
        {busy ? 'Verifying export…' : `Download Cage test bundle (${changes} colors)`}
      </button>
    </fieldset>
    <div role="status" className="mt-2 text-emerald-300">{success}</div>
    {error && <div role="alert" className="mt-2 text-red-300">{error}</div>}
  </section>;
}
