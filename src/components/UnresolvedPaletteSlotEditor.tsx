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

const SYMBOL = 'GONGORO_P' as const;
const SLOT_INDEX = 7;

function wordsFor(baseline: PaletteRoundTripReport): number[] {
  const target = baseline.groundTruthRecords.find(record => record.symbolNames.includes(SYMBOL));
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

export function UnresolvedPaletteSlotEditor({ source, baseline, ownership, onExport }: Props) {
  const config = getPaletteEntryTargetConfig(SYMBOL);
  const originals = useMemo(() => wordsFor(baseline), [baseline]);
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
  }, [baseline.operationId]);

  const slot7 = ownership.slots[SLOT_INDEX];
  const slot8 = ownership.slots[8];
  const qualified = ownership.status === 'SUCCESS'
    && ownership.decision.paletteTableIndexIsCharacterIdentity
    && slot7?.slotIndex === SLOT_INDEX
    && slot7.rosterName === null
    && slot7.sameRecordForNormalAndAlternate
    && slot7.normal.recordIndex === slot7.alternate.recordIndex
    && slot7.normal.symbolNames.includes(SYMBOL)
    && slot7.alternate.symbolNames.includes(SYMBOL)
    && slot7.normal.declaredLength === 23
    && slot7.alternate.declaredLength === 23;

  const parsed = draft.map(parsePaletteWord);
  const valid = qualified && originals.length === 23 && parsed.length === 23 && parsed.every(word => word !== null);
  const changes = parsed.filter((word, index) => word !== null && word !== originals[index]).length;
  const pass = getPaletteEntryEditorPass(SYMBOL);

  function update(index: number, text: string) {
    setDraft(current => current.map((value, i) => i === index ? text : value));
    setSuccess(null);
    setError(null);
  }

  function resetAll() {
    setDraft(originals.map(formatPaletteWord));
    setError(null);
    setSuccess(null);
  }

  function fillMagentaTest() {
    setDraft(originals.map(() => formatPaletteWord(0x7c1f)));
    setError(null);
    setSuccess(null);
  }

  async function download() {
    if (busy || !valid || !changes) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await executePaletteEntryEdit(source, baseline, parsed as number[], SYMBOL);
      const artifact = await createMK1PaletteEntryEditExport(result);
      const zip = await buildPaletteEntryTestBundle(result);
      if (!alive.current) return;
      const timestamp = result.report.timestamp.replace(/[:.]/g, '-');
      const url = URL.createObjectURL(new Blob([new Uint8Array(zip).buffer], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mk1-unresolved-slot-7-gongoro-colors-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onExport({
        filename: `mk1_palette_entry_edit_gongoro_p_${timestamp}.json`,
        pass,
        status: result.report.status,
        timestamp: result.report.timestamp,
        data: artifact,
      });
      setSuccess(`${result.report.edits.length} ${SYMBOL} colors exported · ${result.report.evidence.changedByteCount} changed bytes · reversal verified. Runtime consumer is still deliberately unnamed.`);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  if (!qualified || originals.length !== 23) {
    return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300" aria-label="Unresolved palette slot editor">
      Slot-7 editor blocked: Pass 1E.3L must reproduce unresolved character slot 7 as one shared 23-color <code>GONGORO_P</code> record in both verified palette tables.
    </section>;
  }

  return <section className="mt-3 p-3 rounded border border-amber-800 text-xs text-zinc-300" aria-label="Unresolved palette slot editor">
    <h3 className="font-semibold text-amber-300">Unresolved character slot 7 test · 1E.3N</h3>
    <p className="mt-2">The recovered character-index mechanism reaches nine palette-table slots, but the independent roster-name run names only slots 0–6. Slot 7 is therefore kept unnamed even though its recovered Watcom symbol is <code>GONGORO_P</code>.</p>
    <p className="mt-1 text-zinc-400">Both <code>NORMAL_PALETTES[7]</code> and <code>ALTERNATE_PALETTES[7]</code> resolve to this exact same palette record. Editing it cannot tell us normal versus alternate selection; this experiment asks only <strong>who actually consumes slot 7 at runtime</strong>.</p>
    <div className="mt-2 p-2 rounded bg-zinc-950/70 border border-zinc-800 text-zinc-400">
      <div>Slot 7: <code>{slotDescription(slot7)}</code></div>
      <div className="mt-1">Slot 8 remains held back: <code>{slotDescription(slot8)}</code></div>
    </div>
    <p className="mt-2 text-amber-200">Runtime test: {config.testLabel}. A flat-magenta fill is recommended. Do not identify the consumer from the symbol name alone; report what the game actually shows.</p>

    <fieldset disabled={busy} className="mt-3 disabled:opacity-60">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left"><thead><tr className="text-zinc-400"><th className="p-2">Entry</th><th>Original</th><th>Edited</th><th>Hex word</th><th>Reset</th></tr></thead>
          <tbody>{draft.map((text, index) => {
            const word = parsed[index];
            const changed = word !== null && word !== originals[index];
            return <tr key={index} className={changed ? 'bg-amber-950/40' : ''}>
              <td className="p-2">{index + 1}{changed ? ' *' : ''}</td>
              <td><span className="inline-block w-7 h-7 rounded border border-zinc-500 align-middle mr-2" style={{ background: paletteWordToHex(originals[index]) }} /><code>{formatPaletteWord(originals[index])}</code></td>
              <td><input type="color" aria-label={`${SYMBOL} entry ${index + 1} color`} value={paletteWordToHex(word ?? originals[index])} onChange={e => update(index, formatPaletteWord(hexColorToPaletteWord(e.target.value)))} className="w-10 h-8 bg-transparent" /></td>
              <td><input aria-label={`${SYMBOL} entry ${index + 1} hex word`} aria-invalid={word === null} value={text} onChange={e => update(index, e.target.value)} spellCheck={false} maxLength={6} className={`w-24 p-1 rounded bg-zinc-950 border ${word === null ? 'border-red-500' : 'border-zinc-600'} font-mono`} />{word === null && <span className="ml-2 text-red-300">0000–7FFF required</span>}</td>
              <td><button type="button" onClick={() => update(index, formatPaletteWord(originals[index]))} disabled={text === formatPaletteWord(originals[index])} className="p-2 text-amber-300 disabled:text-zinc-600">Reset</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <button type="button" onClick={resetAll} className="mt-3 mr-3 px-3 py-2 rounded bg-zinc-800">Reset {SYMBOL}</button>
      <button type="button" onClick={fillMagentaTest} className="mt-3 mr-3 px-3 py-2 rounded bg-fuchsia-900">Fill magenta test</button>
      <button type="button" onClick={download} disabled={!valid || changes === 0 || busy} className="mt-3 px-3 py-2 rounded bg-amber-700 disabled:opacity-40">
        {busy ? 'Verifying export…' : `Download unresolved slot-7 bundle (${changes} colors)`}
      </button>
    </fieldset>
    <div role="status" className="mt-2 text-emerald-300">{success}</div>
    {error && <div role="alert" className="mt-2 text-red-300">{error}</div>}
  </section>;
}
