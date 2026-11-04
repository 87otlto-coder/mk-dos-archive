import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';
import { MK1FighterPaletteOwnershipReport } from '../games/mk1/research/fighterPaletteOwnership';
import { PaletteRoundTripReport } from '../games/mk1/research/paletteRoundTrip';
import {
  buildPaletteEntryTestBundle,
  createMK1PaletteEntryEditExport,
  executePaletteEntryEdit,
  getPaletteEntryEditorPass,
  getPaletteEntryTargetConfig,
  PaletteEntryTargetSymbol,
} from '../games/mk1/research/paletteEntryEdit';
import { formatPaletteWord, hexColorToPaletteWord, paletteWordToHex, parsePaletteWord } from '../games/mk1/research/paletteEntryColors';

interface Props {
  source: DirectorySource;
  baseline: PaletteRoundTripReport;
  ownership: MK1FighterPaletteOwnershipReport;
  onExport: (artifact: ResearchArtifact) => void;
}

const FIGHTERS: Array<{
  slot: number;
  rosterName: string;
  label: string;
  normal: PaletteEntryTargetSymbol;
  alternate: PaletteEntryTargetSymbol;
  runtimeNote: string;
}> = [
  { slot: 0, rosterName: 'CAGE', label: 'Johnny Cage', normal: 'GRIMM_P', alternate: 'GRIMM3_P', runtimeNote: 'normal verified in 1E.3L; alternate pending' },
  { slot: 1, rosterName: 'KANO', label: 'Kano', normal: 'KANO_P', alternate: 'KANO3_P', runtimeNote: 'normal and alternate runtime verified' },
  { slot: 2, rosterName: 'RAYDEN', label: 'Rayden', normal: 'RAIDEN_P', alternate: 'RAIDEN3_P', runtimeNote: 'normal and alternate runtime verified' },
  { slot: 3, rosterName: 'LIU KANG', label: 'Liu Kang', normal: 'LUKANG_P', alternate: 'LUKANG3_P', runtimeNote: 'runtime ownership pending' },
  { slot: 4, rosterName: 'SCORPION', label: 'Scorpion', normal: 'YNINJA_P', alternate: 'YNINJA3_P', runtimeNote: 'normal runtime corroborated; alternate pending' },
  { slot: 5, rosterName: 'SUB-ZERO', label: 'Sub-Zero', normal: 'BNINJA_P', alternate: 'BNINJA3_P', runtimeNote: 'runtime ownership pending' },
  { slot: 6, rosterName: 'SONYA', label: 'Sonya', normal: 'LIZ_P', alternate: 'LIZRED_P', runtimeNote: 'runtime ownership pending' },
];

function wordsFor(baseline: PaletteRoundTripReport, symbol: PaletteEntryTargetSymbol): number[] {
  const target = baseline.groundTruthRecords.find(record => record.symbolNames.includes(symbol));
  if (!target) return [];
  const record = baseline.ir.records[target.recordIndex];
  return record ? [...record.rawColorWords] : [];
}

export function MainRosterPaletteEditor({ source, baseline, ownership, onExport }: Props) {
  // Start on the first not-yet-runtime-tested main-roster slot rather than re-running Cage/Kano.
  const [fighterIndex, setFighterIndex] = useState(2);
  const [variant, setVariant] = useState<'normal' | 'alternate'>('normal');
  const fighter = FIGHTERS[fighterIndex] ?? FIGHTERS[0];
  const symbol = variant === 'normal' ? fighter.normal : fighter.alternate;
  const config = getPaletteEntryTargetConfig(symbol);
  const originals = useMemo(() => wordsFor(baseline, symbol), [baseline, symbol]);
  const [draft, setDraft] = useState<string[]>(() => originals.map(formatPaletteWord));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    setDraft(originals.map(formatPaletteWord));
    setError(null);
    setSuccess(null);
  }, [symbol, baseline.operationId]); // originals are derived from these two values.

  const slot = ownership.slots[fighter.slot] ?? null;
  const qualified = ownership.status === 'SUCCESS'
    && ownership.decision.paletteTableIndexIsCharacterIdentity
    && slot?.rosterName === fighter.rosterName
    && slot.normal.symbolNames.includes(fighter.normal)
    && slot.alternate.symbolNames.includes(fighter.alternate);
  const parsed = draft.map(parsePaletteWord);
  const valid = qualified && originals.length === 23 && parsed.length === 23 && parsed.every(word => word !== null);
  const changes = parsed.filter((word, index) => word !== null && word !== originals[index]).length;
  const pass = getPaletteEntryEditorPass(symbol);

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
      const result = await executePaletteEntryEdit(source, baseline, parsed as number[], symbol);
      const artifact = await createMK1PaletteEntryEditExport(result);
      const zip = await buildPaletteEntryTestBundle(result);
      if (!alive.current) return;
      const timestamp = result.report.timestamp.replace(/[:.]/g, '-');
      const safeName = (config.rosterName ?? symbol).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const url = URL.createObjectURL(new Blob([new Uint8Array(zip).buffer], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mk1-${safeName}-${variant}-colors-${timestamp}.zip`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      onExport({
        filename: `mk1_palette_entry_edit_${symbol.toLowerCase()}_${timestamp}.json`,
        pass,
        status: result.report.status,
        timestamp: result.report.timestamp,
        data: artifact,
      });
      setSuccess(`${result.report.edits.length} ${symbol} colors exported · ${result.report.evidence.changedByteCount} changed bytes · reversal verified. Test ${config.testLabel}.`);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  if (!qualified || originals.length !== 23) {
    return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300" aria-label="Main roster palette editor">
      Main-roster editor blocked: Pass 1E.3L must reproduce the seven-name slot alignment and the P*_CHAR → object +0x48 palette-table index chain for the selected slot.
    </section>;
  }

  return <section className="mt-3 p-3 rounded border border-cyan-800 text-xs text-zinc-300" aria-label="Main roster palette editor">
    <h3 className="font-semibold text-cyan-300">Main roster palette editor · 1E.3M</h3>
    <p className="mt-2">The selectable-roster mechanism is now runtime-repeated across Cage, Kano and Rayden, including independently verified alternate selection on Kano and Rayden. This panel keeps the first seven mechanically aligned roster slots available while every export remains single-target and rebuilt from the untouched 1E.3H baseline.</p>
    <p className="mt-1 text-zinc-400">Slots 7–8 remain excluded because the recovered seven-name run does not identify them. Selecting a palette here does not upgrade an untested fighter to runtime-verified; the returned JSON remains <code>RUNTIME_PENDING</code>.</p>

    <div className="mt-3 flex flex-wrap gap-2 items-end">
      <label className="text-zinc-400">Fighter<br />
        <select value={fighterIndex} onChange={e => setFighterIndex(Number(e.target.value))} disabled={busy} className="mt-1 p-2 rounded bg-zinc-950 border border-zinc-600 text-zinc-200">
          {FIGHTERS.map((item, index) => <option key={item.slot} value={index}>{item.label} · slot {item.slot}</option>)}
        </select>
      </label>
      <label className="text-zinc-400">Palette path<br />
        <select value={variant} onChange={e => setVariant(e.target.value as 'normal' | 'alternate')} disabled={busy} className="mt-1 p-2 rounded bg-zinc-950 border border-zinc-600 text-zinc-200">
          <option value="normal">Normal</option>
          <option value="alternate">Alternate / same-character path</option>
        </select>
      </label>
      <div className="pb-2 text-zinc-500"><code>{symbol}</code> · counterpart <code>{config.counterpartSymbol}</code> · {fighter.runtimeNote}</div>
    </div>

    <p className="mt-2 text-cyan-200">Test instruction: {config.testLabel}.</p>

    <fieldset disabled={busy} className="mt-3 disabled:opacity-60">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left"><thead><tr className="text-zinc-400"><th className="p-2">Entry</th><th>Original</th><th>Edited</th><th>Hex word</th><th>Reset</th></tr></thead>
          <tbody>{draft.map((text, index) => {
            const word = parsed[index]; const changed = word !== null && word !== originals[index];
            return <tr key={index} className={changed ? 'bg-cyan-950/40' : ''}>
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
      <button type="button" onClick={fillMagentaTest} className="mt-3 mr-3 px-3 py-2 rounded bg-fuchsia-900">Fill magenta test</button>
      <button type="button" onClick={download} disabled={!valid || changes === 0 || busy} className="mt-3 px-3 py-2 rounded bg-cyan-800 disabled:opacity-40">
        {busy ? 'Verifying export…' : `Download ${fighter.label} ${variant} bundle (${changes} colors)`}
      </button>
    </fieldset>
    <div role="status" className="mt-2 text-emerald-300">{success}</div>
    {error && <div role="alert" className="mt-2 text-red-300">{error}</div>}
  </section>;
}
