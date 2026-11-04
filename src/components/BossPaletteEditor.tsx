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
  SpecialPaletteSymbol,
} from '../games/mk1/research/paletteEntryEdit';
import {
  formatPaletteWord,
  hexColorToPaletteWord,
  paletteWordToHex,
  parsePaletteWord,
} from '../games/mk1/research/paletteEntryColors';

interface Props {
  source: DirectorySource;
  baseline: PaletteRoundTripReport;
  ownership: MK1FighterPaletteOwnershipReport;
  onExport: (artifact: ResearchArtifact) => void;
}

const TARGETS: Array<{ symbol: SpecialPaletteSymbol; slotIndex: 7 | 8; label: string; detail: string }> = [
  {
    symbol: 'GONGORO_P',
    slotIndex: 7,
    label: 'Goro · slot 7 · GONGORO_P',
    detail: 'Runtime-qualified: token 6 / character ID 7 is Goro, and GONGORO_P controls his fighter palette.',
  },
  {
    symbol: 'YANG_P',
    slotIndex: 8,
    label: 'Shang Tsung · slot 8 · YANG_P / EMP_P',
    detail: 'Runtime-qualified: token 7 / character ID 8 is Shang Tsung, and the shared YANG_P / EMP_P alias record controls his base fighter palette.',
  },
];

function recordFor(baseline: PaletteRoundTripReport, symbol: SpecialPaletteSymbol) {
  return baseline.groundTruthRecords.find(record => record.symbolNames.includes(symbol));
}

function wordsFor(baseline: PaletteRoundTripReport, symbol: SpecialPaletteSymbol): number[] {
  const target = recordFor(baseline, symbol);
  if (!target) return [];
  const record = baseline.ir.records[target.recordIndex];
  return record ? [...record.rawColorWords] : [];
}

function slotDescription(slot: MK1FighterPaletteOwnershipReport['slots'][number] | undefined): string {
  if (!slot) return 'unavailable';
  const normal = slot.normal.symbolNames.join(' / ') || `record ${slot.normal.recordIndex}`;
  const alternate = slot.alternate.symbolNames.join(' / ') || `record ${slot.alternate.recordIndex}`;
  return `${normal} ↔ ${alternate}${slot.sameRecordForNormalAndAlternate ? ' · same record' : ''}`;
}

function filenameStem(symbol: SpecialPaletteSymbol): string {
  return symbol === 'GONGORO_P' ? 'goro-gongoro' : 'shang-yang-emp';
}

export function BossPaletteEditor({ source, baseline, ownership, onExport }: Props) {
  const [symbol, setSymbol] = useState<SpecialPaletteSymbol>('YANG_P');
  const targetMeta = TARGETS.find(target => target.symbol === symbol) ?? TARGETS[1];
  const config = getPaletteEntryTargetConfig(symbol);
  const originals = useMemo(() => wordsFor(baseline, symbol), [baseline, symbol]);
  const [draftBySymbol, setDraftBySymbol] = useState<Record<SpecialPaletteSymbol, string[]>>(() => ({
    GONGORO_P: wordsFor(baseline, 'GONGORO_P').map(formatPaletteWord),
    YANG_P: wordsFor(baseline, 'YANG_P').map(formatPaletteWord),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    setDraftBySymbol({
      GONGORO_P: wordsFor(baseline, 'GONGORO_P').map(formatPaletteWord),
      YANG_P: wordsFor(baseline, 'YANG_P').map(formatPaletteWord),
    });
    setSymbol('YANG_P');
    setError(null);
    setSuccess(null);
  }, [baseline.operationId]);

  const draft = draftBySymbol[symbol] ?? [];
  const slot = ownership.slots[targetMeta.slotIndex];
  const targetRecord = recordFor(baseline, symbol);
  const aliases = targetRecord?.symbolNames ?? [];
  const qualified = ownership.status === 'SUCCESS'
    && ownership.decision.paletteTableIndexIsCharacterIdentity
    && slot?.slotIndex === targetMeta.slotIndex
    && slot.sameRecordForNormalAndAlternate
    && slot.normal.recordIndex === slot.alternate.recordIndex
    && slot.normal.declaredLength === 23
    && slot.alternate.declaredLength === 23
    && slot.normal.symbolNames.includes(symbol)
    && slot.alternate.symbolNames.includes(symbol)
    && targetRecord?.declaredLength === 23
    && (symbol !== 'YANG_P' || (aliases.includes('YANG_P') && aliases.includes('EMP_P')));

  const parsed = draft.map(parsePaletteWord);
  const valid = qualified && originals.length === 23 && parsed.length === 23 && parsed.every(word => word !== null);
  const changes = parsed.filter((word, index) => word !== null && word !== originals[index]).length;
  const pass = getPaletteEntryEditorPass(symbol);

  function update(index: number, text: string) {
    setDraftBySymbol(current => ({ ...current, [symbol]: current[symbol].map((value, i) => i === index ? text : value) }));
    setSuccess(null); setError(null);
  }

  function resetAll() {
    setDraftBySymbol(current => ({ ...current, [symbol]: originals.map(formatPaletteWord) }));
    setError(null); setSuccess(null);
  }

  function fillMagentaTest() {
    setDraftBySymbol(current => ({ ...current, [symbol]: originals.map(() => formatPaletteWord(0x7c1f)) }));
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
      const url = URL.createObjectURL(new Blob([new Uint8Array(zip).buffer], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mk1-${filenameStem(symbol)}-colors-${timestamp}.zip`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      onExport({
        filename: `mk1_palette_entry_edit_${filenameStem(symbol).replaceAll('-', '_')}_${timestamp}.json`,
        pass,
        status: result.report.status,
        timestamp: result.report.timestamp,
        data: artifact,
      });
      setSuccess(`${result.report.edits.length} ${aliases.join(' / ') || symbol} colors exported · ${result.report.evidence.changedByteCount} changed bytes · reversal verified.`);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally { if (alive.current) setBusy(false); }
  }

  return <section className="mt-3 p-3 rounded border border-amber-800 text-xs text-zinc-300" aria-label="Boss palette editor">
    <h3 className="font-semibold text-amber-300">Boss palette editor · 1E.3N / 1E.3N.3</h3>
    <p className="mt-2">The two non-selectable character-index slots can now be edited directly. Both boss base palettes are runtime-qualified: slot 7 is Goro / <code>GONGORO_P</code>, and slot 8 is Shang Tsung / shared <code>YANG_P / EMP_P</code>. Pass 1E.3N.4 separately qualifies Shang's morph transition and completed-form palette selection semantics.</p>

    <label className="block mt-3 text-zinc-400" htmlFor="boss-palette-target">Special character</label>
    <select id="boss-palette-target" disabled={busy} value={symbol} onChange={e => { setSymbol(e.target.value as SpecialPaletteSymbol); setError(null); setSuccess(null); }} className="mt-1 p-2 rounded bg-zinc-950 border border-zinc-700 text-zinc-200">
      {TARGETS.map(target => <option key={target.symbol} value={target.symbol}>{target.label}</option>)}
    </select>

    <div className="mt-2 p-2 rounded bg-zinc-950/70 border border-zinc-800 text-zinc-400">
      <div>{targetMeta.detail}</div>
      <div className="mt-1">Table slot: <code>{slotDescription(slot)}</code></div>
      <div className="mt-1">Ground-truth aliases: <code>{aliases.join(' / ') || 'unavailable'}</code></div>
      {targetRecord && <div className="mt-1">Record {targetRecord.recordIndex} · physical <code>0x{targetRecord.physicalStart.toString(16).toUpperCase()}–0x{targetRecord.physicalEnd.toString(16).toUpperCase()}</code> · 23 colors</div>}
    </div>

    {!qualified || originals.length !== 23 ? <div className="mt-3 p-2 rounded border border-red-900 text-red-300">Editor blocked: the selected slot/record no longer matches the verified ownership and 23-color ground-truth invariants.</div> : <>
      <p className="mt-2 text-amber-200">Runtime-qualified base palette: {config.testLabel}. The opponent-access composites remain available for repeatable regression checks.</p>
      <fieldset disabled={busy} className="mt-3 disabled:opacity-60">
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left"><thead><tr className="text-zinc-400"><th className="p-2">Entry</th><th>Original</th><th>Edited</th><th>Hex word</th><th>Reset</th></tr></thead>
            <tbody>{draft.map((text, index) => {
              const word = parsed[index];
              const changed = word !== null && word !== originals[index];
              return <tr key={index} className={changed ? 'bg-amber-950/40' : ''}>
                <td className="p-2">{index + 1}{changed ? ' *' : ''}</td>
                <td><span className="inline-block w-7 h-7 rounded border border-zinc-500 align-middle mr-2" style={{ background: paletteWordToHex(originals[index]) }} /><code>{formatPaletteWord(originals[index])}</code></td>
                <td><input type="color" aria-label={`${symbol} entry ${index + 1} color`} value={paletteWordToHex(word ?? originals[index])} onChange={e => update(index, formatPaletteWord(hexColorToPaletteWord(e.target.value)))} className="w-10 h-8 bg-transparent" /></td>
                <td><input aria-label={`${symbol} entry ${index + 1} hex word`} aria-invalid={word === null} value={text} onChange={e => update(index, e.target.value)} spellCheck={false} maxLength={6} className={`w-24 p-1 rounded bg-zinc-950 border ${word === null ? 'border-red-500' : 'border-zinc-600'} font-mono`} />{word === null && <span className="ml-2 text-red-300">0000–7FFF required</span>}</td>
                <td><button type="button" onClick={() => update(index, formatPaletteWord(originals[index]))} disabled={text === formatPaletteWord(originals[index])} className="p-2 text-amber-300 disabled:text-zinc-600">Reset</button></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <button type="button" onClick={resetAll} className="mt-3 mr-3 px-3 py-2 rounded bg-zinc-800">Reset {aliases.join(' / ') || symbol}</button>
        <button type="button" onClick={fillMagentaTest} className="mt-3 mr-3 px-3 py-2 rounded bg-fuchsia-900">Fill magenta test</button>
        <button type="button" onClick={download} disabled={!valid || changes === 0 || busy} className="mt-3 px-3 py-2 rounded bg-amber-700 disabled:opacity-40">
          {busy ? 'Verifying export…' : `Download ${config.rosterName ?? symbol} palette bundle (${changes} colors)`}
        </button>
      </fieldset>
    </>}
    <div role="status" className="mt-2 text-emerald-300">{success}</div>
    {error && <div role="alert" className="mt-2 text-red-300">{error}</div>}
  </section>;
}
