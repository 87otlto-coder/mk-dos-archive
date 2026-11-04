import React from 'react';
import { MK1ShangMorphSelectionReport } from '../games/mk1/research/shangMorphSelection';

interface Props { report: MK1ShangMorphSelectionReport; }

function paletteLabel(symbols: string[]): string {
  return symbols.length ? symbols.join(' / ') : 'unnamed verified record';
}

export function ShangMorphSelectionPanel({ report }: Props) {
  const ready = report.status === 'SUCCESS'
    && report.decision.verdict === 'SHANG_MORPH_ASSET_PALETTE_MODEL_ESTABLISHED';

  if (!ready) return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300" aria-label="Shang Tsung morph asset and palette selection">
    Shang morph qualification is partial. No morph-selection semantics should be promoted from this run.
  </section>;

  return <section className="mt-3 p-3 rounded border border-fuchsia-800 text-xs text-zinc-300" aria-label="Shang Tsung morph asset and palette selection">
    <h3 className="font-semibold text-fuchsia-300">Shang Tsung morph asset / palette selection · 1E.3N.4</h3>
    <p className="mt-2">The morph path is now qualified without patching combat or AI. Shang resolves a target-indexed <code>EMP_ANITAB</code> sequence while still character ID 8, then changes object <code>+0x48</code> to the target ID before executing the sequence. The transition uses target-specific morph assets; the completed form returns to the ordinary fighter palette selector.</p>

    <div className="mt-3 p-2 rounded bg-zinc-950/70 border border-zinc-800 font-mono text-[11px] overflow-x-auto">
      <div className="text-zinc-500">Qualified state flow</div>
      <div className="mt-1 whitespace-nowrap text-zinc-300">Shang ID 8 → choose target → EMP_ANITAB[target + 7] → store target at object +0x48 → transition palette / morph frames → PLAYER_NORMPAL(target) → unmorph → restore ID 8 → PLAYER_NORMPAL(Shang)</div>
    </div>

    <div className="mt-3 grid lg:grid-cols-3 gap-2">
      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800">
        <div className="font-semibold text-zinc-300">Normal random morph</div>
        <div className="mt-1 text-zinc-400">Candidate IDs {report.targetSelection.randomSansGoro.candidateCharacterIds.join(', ')}; unloaded fighters are rejected before entering <code>EMP_MORPH</code>.</div>
      </div>
      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800">
        <div className="font-semibold text-zinc-300">Goro support</div>
        <div className="mt-1 text-zinc-400">ID 7 is not part of the random 0–6 picker, but {report.targetSelection.directGoroMorph.callSites.length} direct code path{report.targetSelection.directGoroMorph.callSites.length === 1 ? '' : 's'} feed ID 7 into the same <code>EMP_MORPH</code> mechanism.</div>
      </div>
      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800">
        <div className="font-semibold text-zinc-300">Palette rule after morph</div>
        <div className="mt-1 text-zinc-400"><code>PLAYER_NORMPAL</code> indexes by current object identity. Its existing same-character alternate-palette rule and green-ninja override remain intact.</div>
      </div>
    </div>

    <div className="mt-3 overflow-x-auto border border-zinc-800 rounded">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-zinc-950 text-zinc-400"><tr>
          <th className="p-2">ID</th><th className="p-2">Morph target</th><th className="p-2">Transition palette</th><th className="p-2">Morph descriptors</th><th className="p-2">Completed-form palette route</th>
        </tr></thead>
        <tbody>{report.targets.map(target => <tr key={target.targetCharacterId} className="border-t border-zinc-800 align-top">
          <td className="p-2 font-mono">{target.targetCharacterId}</td>
          <td className="p-2 font-semibold text-zinc-200">{target.targetName}</td>
          <td className="p-2"><code>{target.transitionPalette.symbol}</code><div className="text-zinc-600">23 colors · MORPH1+0x0C linked</div></td>
          <td className="p-2 font-mono text-zinc-400">{target.morphDescriptors.map(item => item.symbol).join(' · ')}</td>
          <td className="p-2"><div><span className="text-zinc-500">normal:</span> {paletteLabel(target.fighterPaletteSlot.normalSymbols)}</div><div><span className="text-zinc-500">alternate:</span> {paletteLabel(target.fighterPaletteSlot.alternateSymbols)}</div></td>
        </tr>)}</tbody>
      </table>
    </div>

    <div className="mt-3 p-2 rounded border border-emerald-900 bg-emerald-950/20">
      <div className="font-semibold text-emerald-300">Unmorph restoration qualified</div>
      <div className="mt-1 text-zinc-400"><code>EMP_UNMORPH</code> captures the current target, restores object identity to ID 8, and directly calls <code>PLAYER_NORMPAL</code>. Slot 8 resolves to the same shared <code>{report.unmorph.slot8Aliases.join(' / ')}</code> record on both table sides. This statically explains the observed runtime behavior: a normal fighter appearance during the morph, then the edited magenta Shang palette on return.</div>
    </div>

    <div className="mt-2 text-zinc-500">No runtime patch is exposed by this pass. The eight transition palettes are separate semantic assets from the completed fighter palettes and are candidates for future compiler/editor exposure.</div>
  </section>;
}
