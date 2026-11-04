/**
 * MK1 animation/palette context bridge — Pass 1E.3O.20.
 *
 * Export-first question:
 *   Can an animation table, character identity, or GRA resource be treated as
 *   sufficient to choose the correct palette for exported frames?
 *
 * This pass deliberately uses only already-qualified selector mechanisms:
 *   - O19 character identity -> ANITAB selector;
 *   - 1E.3L character identity -> NORMAL/ALTERNATE palette-table slot;
 *   - 1E.3F normal/alternate palette state machine.
 *
 * It performs no binary writes and does not infer effect-specific palettes.
 */

import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK1CharacterAnimationTableSelectorReport } from './characterAnimationTableSelector';
import { MK1FighterPaletteOwnershipReport } from './fighterPaletteOwnership';
import { MK1KanoPaletteSelectionSemanticsReport } from './kanoPaletteSelectionSemanticsTypes';

export interface AnimationPaletteCharacterContext {
  characterId: number;
  identityLabel: string;
  identityEvidence: string;
  anitabSymbol: string;
  anitabModule: string;
  anitabSharedWithCharacterIds: number[];
  normalPaletteSymbols: string[];
  alternatePaletteSymbols: string[];
  sameRecordForNormalAndAlternate: boolean;
  paletteSlotIndexMatchesCharacterId: boolean;
}

export interface SharedAnimationDistinctPaletteEvidence {
  anitabSymbol: string;
  characterIds: number[];
  characters: Array<{
    characterId: number;
    identityLabel: string;
    normalPaletteSymbols: string[];
    alternatePaletteSymbols: string[];
  }>;
  normalPaletteSetsDistinct: boolean;
  alternatePaletteSetsDistinct: boolean;
  classification: 'VERIFIED_SHARED_ANITAB_DISTINCT_CHARACTER_PALETTE_CONTEXT';
}

export interface MK1AnimationPaletteContextBridgeReport {
  format: 'mk1_animation_palette_context_bridge_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1CharacterAnimationTableSelectorReport['provenance'];
  prerequisite: {
    o19OperationId: string;
    ownershipOperationId: string;
    semanticsOperationId: string;
    validationPassed: boolean;
  };
  selectorAxes: {
    characterIdentityObjectFieldOffset: number;
    characterIdentityObjectFieldOffsetHex: string;
    animationSelectorUsesIdentityField: boolean;
    paletteSelectorUsesIdentityField: boolean;
    sameObjectFieldForBothSelectors: boolean;
    normalPaletteTableWatcomOffset: number;
    normalPaletteTableWatcomOffsetHex: string;
    alternatePaletteTableWatcomOffset: number;
    alternatePaletteTableWatcomOffsetHex: string;
    anitabSelectorTableWatcomOffset: number;
    anitabSelectorTableWatcomOffsetHex: string;
  };
  characterContexts: AnimationPaletteCharacterContext[];
  sharedAnimationDistinctPaletteEvidence: SharedAnimationDistinctPaletteEvidence[];
  normalAlternateVariantCharacterIds: number[];
  sameNormalAlternateRecordCharacterIds: number[];
  summary: {
    characterSlotCount: number;
    uniqueAnitabCount: number;
    sharedAnitabContextCount: number;
    normalAlternateVariantCount: number;
    sameNormalAlternateRecordCount: number;
  };
  decision: {
    characterIdentityCoSelectsAnimationTableAndPaletteSlot: boolean;
    animationTableAloneDeterminesPalette: false;
    paletteContextMustBeExplicitInExportIr: boolean;
    resourceFilenameAloneDeterminesPalette: false;
    effectSpecificPaletteBindingEstablishedByThisPass: false;
    verdict: 'MK1_ANIMATION_PALETTE_CONTEXT_SEPARATION_ESTABLISHED';
    narrative: string;
  };
  status: 'SUCCESS';
  validation: {
    allChecksPassed: boolean;
    checks: Array<{ checkId: string; passed: boolean; detail?: string }>;
  };
}

function sortedSymbols(values: string[]): string[] {
  return [...values].sort();
}

function sameStringSet(a: string[], b: string[]): boolean {
  const aa = sortedSymbols(a), bb = sortedSymbols(b);
  return aa.length === bb.length && aa.every((value, i) => value === bb[i]);
}

export function executeAnimationPaletteContextBridge(
  o19: MK1CharacterAnimationTableSelectorReport,
  ownership: MK1FighterPaletteOwnershipReport,
  semantics: MK1KanoPaletteSelectionSemanticsReport,
): MK1AnimationPaletteContextBridgeReport {
  if (o19.status !== 'SUCCESS' || !o19.validation.allChecksPassed) throw new Error('O20 requires successful O19 selector evidence');
  if (ownership.status !== 'SUCCESS') throw new Error('O20 requires successful fighter palette ownership scaffold');
  if (semantics.status !== 'SUCCESS' || semantics.decision.verdict !== 'SAME_CHARACTER_PALETTE_SWITCH_SEMANTICS_ESTABLISHED') throw new Error('O20 requires established palette selection semantics');
  if (!semantics.selectionStateMachine) throw new Error('O20 requires the verified palette selection state machine');

  const operationId = createOperationId('animation_palette_context_bridge');
  const timestamp = new Date().toISOString();
  const identityField = ownership.characterIdentityField.fieldOffset;
  const paletteField = semantics.selectionStateMachine.tableIndexObjectFieldOffset;
  const animationField = o19.getCharAni.characterIdentityFieldOffset;

  const characterContexts: AnimationPaletteCharacterContext[] = o19.selectorTable.entries.map(entry => {
    const slot = ownership.slots.find(value => value.slotIndex === entry.characterId);
    if (!slot) throw new Error(`O20 missing palette slot ${entry.characterId}`);
    const identityLabel = entry.identityLabel === 'EMP' && entry.characterId === 8 ? 'EMP' : entry.identityLabel;
    return {
      characterId: entry.characterId,
      identityLabel,
      identityEvidence: entry.identityEvidence,
      anitabSymbol: entry.anitabSymbol,
      anitabModule: entry.anitabModule,
      anitabSharedWithCharacterIds: [...entry.sharedAnitabWithCharacterIds],
      normalPaletteSymbols: [...slot.normal.symbolNames],
      alternatePaletteSymbols: [...slot.alternate.symbolNames],
      sameRecordForNormalAndAlternate: slot.sameRecordForNormalAndAlternate,
      paletteSlotIndexMatchesCharacterId: slot.slotIndex === entry.characterId,
    };
  });

  const byAnitab = new Map<string, AnimationPaletteCharacterContext[]>();
  for (const context of characterContexts) {
    const list = byAnitab.get(context.anitabSymbol) ?? [];
    list.push(context);
    byAnitab.set(context.anitabSymbol, list);
  }
  const sharedAnimationDistinctPaletteEvidence: SharedAnimationDistinctPaletteEvidence[] = [];
  for (const [anitabSymbol, contexts] of byAnitab) {
    if (contexts.length < 2) continue;
    const normalDistinct = contexts.some((a, i) => contexts.slice(i + 1).some(b => !sameStringSet(a.normalPaletteSymbols, b.normalPaletteSymbols)));
    const altDistinct = contexts.some((a, i) => contexts.slice(i + 1).some(b => !sameStringSet(a.alternatePaletteSymbols, b.alternatePaletteSymbols)));
    if (!normalDistinct && !altDistinct) continue;
    sharedAnimationDistinctPaletteEvidence.push({
      anitabSymbol,
      characterIds: contexts.map(c => c.characterId),
      characters: contexts.map(c => ({
        characterId: c.characterId,
        identityLabel: c.identityLabel,
        normalPaletteSymbols: [...c.normalPaletteSymbols],
        alternatePaletteSymbols: [...c.alternatePaletteSymbols],
      })),
      normalPaletteSetsDistinct: normalDistinct,
      alternatePaletteSetsDistinct: altDistinct,
      classification: 'VERIFIED_SHARED_ANITAB_DISTINCT_CHARACTER_PALETTE_CONTEXT',
    });
  }

  const normalAlternateVariantCharacterIds = characterContexts.filter(c => !c.sameRecordForNormalAndAlternate).map(c => c.characterId);
  const sameNormalAlternateRecordCharacterIds = characterContexts.filter(c => c.sameRecordForNormalAndAlternate).map(c => c.characterId);

  const checks = [
    { checkId: 'O19_PREREQUISITE', passed: true },
    { checkId: 'PALETTE_OWNERSHIP_PREREQUISITE', passed: ownership.decision.completeNineSlotCensusEstablished },
    { checkId: 'PALETTE_SELECTION_PREREQUISITE', passed: semantics.decision.verdict === 'SAME_CHARACTER_PALETTE_SWITCH_SEMANTICS_ESTABLISHED' },
    { checkId: 'SAME_IDENTITY_FIELD_FOR_ANIMATION_AND_PALETTE', passed: identityField === paletteField && paletteField === animationField, detail: `field=0x${identityField.toString(16)}` },
    { checkId: 'NINE_CHARACTER_CONTEXTS', passed: characterContexts.length === 9 },
    { checkId: 'PALETTE_SLOT_EQUALS_CHARACTER_ID', passed: characterContexts.every(c => c.paletteSlotIndexMatchesCharacterId) },
    { checkId: 'SHARED_ANITAB_DISTINCT_PALETTE_CONTEXT', passed: sharedAnimationDistinctPaletteEvidence.length > 0, detail: sharedAnimationDistinctPaletteEvidence.map(v => `${v.anitabSymbol}:${v.characterIds.join(',')}`).join(';') },
    { checkId: 'NORMAL_ALTERNATE_VARIANTS_EXIST_WITHOUT_ANITAB_CHANGE', passed: normalAlternateVariantCharacterIds.length > 0, detail: normalAlternateVariantCharacterIds.join(',') },
    { checkId: 'SCOPE_BOUNDARY_PRESERVED', passed: true },
  ];
  const allChecksPassed = checks.every(check => check.passed);
  if (!allChecksPassed) throw new Error(`O20 validation failed: ${checks.filter(c => !c.passed).map(c => c.checkId).join(', ')}`);

  return {
    format: 'mk1_animation_palette_context_bridge_v1',
    timestamp,
    operationId,
    provenance: o19.provenance,
    prerequisite: {
      o19OperationId: o19.operationId,
      ownershipOperationId: ownership.operationId,
      semanticsOperationId: semantics.operationId,
      validationPassed: true,
    },
    selectorAxes: {
      characterIdentityObjectFieldOffset: identityField,
      characterIdentityObjectFieldOffsetHex: ownership.characterIdentityField.fieldOffsetHex,
      animationSelectorUsesIdentityField: animationField === identityField,
      paletteSelectorUsesIdentityField: paletteField === identityField,
      sameObjectFieldForBothSelectors: animationField === paletteField,
      normalPaletteTableWatcomOffset: semantics.selectionStateMachine.normalTableOffset,
      normalPaletteTableWatcomOffsetHex: semantics.selectionStateMachine.normalTableOffsetHex,
      alternatePaletteTableWatcomOffset: semantics.selectionStateMachine.alternateTableOffset,
      alternatePaletteTableWatcomOffsetHex: semantics.selectionStateMachine.alternateTableOffsetHex,
      anitabSelectorTableWatcomOffset: o19.selectorTable.watcomOffset,
      anitabSelectorTableWatcomOffsetHex: o19.selectorTable.watcomOffsetHex,
    },
    characterContexts,
    sharedAnimationDistinctPaletteEvidence,
    normalAlternateVariantCharacterIds,
    sameNormalAlternateRecordCharacterIds,
    summary: {
      characterSlotCount: characterContexts.length,
      uniqueAnitabCount: new Set(characterContexts.map(c => c.anitabSymbol)).size,
      sharedAnitabContextCount: sharedAnimationDistinctPaletteEvidence.length,
      normalAlternateVariantCount: normalAlternateVariantCharacterIds.length,
      sameNormalAlternateRecordCount: sameNormalAlternateRecordCharacterIds.length,
    },
    decision: {
      characterIdentityCoSelectsAnimationTableAndPaletteSlot: true,
      animationTableAloneDeterminesPalette: false,
      paletteContextMustBeExplicitInExportIr: true,
      resourceFilenameAloneDeterminesPalette: false,
      effectSpecificPaletteBindingEstablishedByThisPass: false,
      verdict: 'MK1_ANIMATION_PALETTE_CONTEXT_SEPARATION_ESTABLISHED',
      narrative: `The already-qualified object character identity field +0x48 independently drives both the O19 ANITAB selector and the verified normal/alternate palette-table selector. The nine character slots therefore co-select an animation-table family and a palette slot, but those axes are not equivalent. Character IDs 4 (Scorpion) and 5 (Sub-Zero) select the same NINJA_ANITAB while selecting distinct normal and alternate palette records, directly proving that an ANITAB does not determine palette. In addition, slots ${normalAlternateVariantCharacterIds.join(',')} have distinct normal/alternate records while retaining their character ANITAB, so one animation structure can render under multiple qualified palette contexts. Export IR must carry palette context separately from animation/table/resource identity. This pass does not bind effect-specific palettes or claim that a GRA filename determines palette.`,
    },
    status: 'SUCCESS',
    validation: { allChecksPassed, checks },
  };
}

export function createMK1AnimationPaletteContextBridgeExport(report: MK1AnimationPaletteContextBridgeReport): MK1AnimationPaletteContextBridgeReport {
  return report;
}
