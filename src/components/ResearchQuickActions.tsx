import { KanoPaletteEditor } from './KanoPaletteEditor';
import { MainRosterPaletteEditor } from './MainRosterPaletteEditor';
import { BossPaletteEditor } from './BossPaletteEditor';
import { OpponentAccessHarness } from './OpponentAccessHarness';
import { LadderGrammarHarness } from './LadderGrammarHarness';
import { ShangMorphSelectionPanel } from './ShangMorphSelectionPanel';
import { AnimationStreamGroundTruthPanel } from './AnimationStreamGroundTruthPanel';
import { MultiPartFrameLosslessIrPanel } from './MultiPartFrameLosslessIrPanel';
import { MultiPartControlledEditPanel } from './MultiPartControlledEditPanel';
import { RaydenLightningPlacementPanel } from './RaydenLightningPlacementPanel';
import { RaydenLightningCanvasEditor } from './RaydenLightningCanvasEditor';
import { MultiPartCompositionCanvasEditor } from './MultiPartCompositionCanvasEditor';
import { HeartRipAnimationCanvasEditor } from './HeartRipAnimationCanvasEditor';
import { HeartRipRelocationCensusPanel } from './HeartRipRelocationCensusPanel';
import { ReshapeMultiFullCapacitySemanticsPanel } from './ReshapeMultiFullCapacitySemanticsPanel';
import { HeartRipFourthPartTopologyPanel } from './HeartRipFourthPartTopologyPanel';
import { HeartRipFixedCapacityTopologyEditor } from './HeartRipFixedCapacityTopologyEditor';
import { HeartRipAtomicCompositionEditor } from './HeartRipAtomicCompositionEditor';
import { HeartRipFullFixedLayoutCompositionEditor } from './HeartRipFullFixedLayoutCompositionEditor';
import { ResearchResultsWorkspace } from './ResearchResultsWorkspace';
import { describeResearchProvenance } from './researchProvenanceDisplay';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { GameDetectionResult } from '../core/models/GameDetection';
import { createMK1WatcomDataImagePaletteGroundTruthExport, executeWatcomDataImagePaletteGroundTruth } from '../games/mk1/research/watcomDataImagePaletteGroundTruth';
import { createMK1KanoPaletteSelectionReferenceGraphExport, executeKanoPaletteSelectionReferenceGraph } from '../games/mk1/research/kanoPaletteSelectionReferenceGraph';
import { createMK1KanoPaletteSelectionSemanticsExport, executeKanoPaletteSelectionSemantics } from '../games/mk1/research/kanoPaletteSelectionSemantics';
import { createMK1PaletteSetupTransferSemanticsExport, executePaletteSetupTransferSemantics } from '../games/mk1/research/paletteSetupTransferSemantics';
import { createMK1PaletteRoundTripExport, executePaletteRoundTrip, PaletteRoundTripReport } from '../games/mk1/research/paletteRoundTrip';
import { createMK1FighterPaletteOwnershipExport, executeFighterPaletteOwnershipQualification, MK1FighterPaletteOwnershipReport } from '../games/mk1/research/fighterPaletteOwnership';
import { createMK1OpponentAccessHarnessExport, executeOpponentAccessHarnessQualification, MK1OpponentAccessHarnessReport } from '../games/mk1/research/opponentAccessHarness';
import { createMK1SinglePlayerLadderGrammarExport, executeSinglePlayerLadderGrammarQualification, MK1SinglePlayerLadderGrammarReport } from '../games/mk1/research/singlePlayerLadderGrammar';
import { createMK1ShangMorphSelectionExport, executeShangMorphSelectionQualification, MK1ShangMorphSelectionReport } from '../games/mk1/research/shangMorphSelection';
import { createMK1AnimationStreamGroundTruthExport, executeAnimationStreamGroundTruth, MK1AnimationStreamGroundTruthReport } from '../games/mk1/research/animationStreamGroundTruth';
import { createMK1MultiPartFrameLosslessIrExport, executeMultiPartFrameLosslessIr, MK1MultiPartFrameLosslessIrReport } from '../games/mk1/research/multiPartFrameLosslessIr';
import { createMK1MultiPartControlledEditExport, executeMultiPartControlledEdit, MK1MultiPartControlledEditResult } from '../games/mk1/research/multiPartControlledEdit';
import { createMK1RaydenLightningPlacementExport, executeRaydenLightningPlacementFixture, MK1RaydenLightningPlacementResult } from '../games/mk1/research/raydenLightningPlacementFixture';
import { createMK1RaydenLightningCanvasEditorExport, executeRaydenLightningCanvasEditorModel, MK1RaydenLightningCanvasEditorReport } from '../games/mk1/research/raydenLightningCanvasEditor';
import { createMK1MultiPartCompositionCanvasEditorExport, executeMultiPartCompositionCanvasEditorModel, MK1MultiPartCompositionCanvasEditorReport } from '../games/mk1/research/multiPartCompositionCanvasEditor';
import { createMK1HeartRipAnimationCanvasEditorExport, executeHeartRipAnimationCanvasEditorModel, MK1HeartRipAnimationCanvasEditorReport } from '../games/mk1/research/heartRipAnimationCanvasEditor';
import { createMK1HeartRipRelocationCensusExport, executeHeartRipRelocationCensus, MK1HeartRipRelocationCensusReport } from '../games/mk1/research/heartRipRelocationCensus';
import { createMK1ReshapeMultiFullCapacitySemanticsExport, executeReshapeMultiFullCapacitySemantics, MK1ReshapeMultiFullCapacitySemanticsReport } from '../games/mk1/research/reshapeMultiFullCapacitySemantics';
import { createMK1HeartRipFourthPartTopologyExport, executeHeartRipFourthPartTopologyWrite, MK1HeartRipFourthPartTopologyResult } from '../games/mk1/research/heartRipFourthPartTopologyWriter';
import { createMK1HeartRipFixedCapacityTopologyEditorExport, executeHeartRipFixedCapacityTopologyEditorModel, MK1HeartRipFixedCapacityTopologyEditorReport } from '../games/mk1/research/heartRipFixedCapacityTopologyEditor';
import { createMK1HeartRipAtomicCompositionEditorExport, executeHeartRipAtomicCompositionEditorModel, MK1HeartRipAtomicCompositionEditorReport } from '../games/mk1/research/heartRipAtomicCompositionEditor';
import { createMK1HeartRipFullFixedLayoutCompositionEditorExport, executeHeartRipFullFixedLayoutCompositionEditorModel, MK1HeartRipFullFixedLayoutCompositionEditorReport } from '../games/mk1/research/heartRipFullFixedLayoutCompositionEditor';
import { createMK1HeartRipGrowthRelocationPreflightExport, executeHeartRipGrowthRelocationPreflight } from '../games/mk1/research/heartRipGrowthRelocationPreflight';
import { createMK1KanoAnimationExportabilityCensusExport, executeKanoAnimationExportabilityCensus } from '../games/mk1/research/kanoAnimationExportabilityCensus';
import { createMK1FighterAnimationTableComparisonExport, executeFighterAnimationTableComparison } from '../games/mk1/research/fighterAnimationTableComparison';
import { createMK1AnimationResourceDecodeCensusExport, executeAnimationResourceDecodeCensus } from '../games/mk1/research/animationResourceDecodeCensus';
import { createMK1CharacterAnimationTableSelectorExport, executeCharacterAnimationTableSelector } from '../games/mk1/research/characterAnimationTableSelector';
import { createMK1AnimationPaletteContextBridgeExport, executeAnimationPaletteContextBridge } from '../games/mk1/research/animationPaletteContextBridge';
import { createMK1GetCharAniConsumerCensusExport, executeGetCharAniConsumerCensus } from '../games/mk1/research/getCharAniConsumerCensus';
import { createMK1CharacterAnimationExportManifestExport, executeCharacterAnimationExportManifest } from '../games/mk1/research/characterAnimationExportManifest';
import { createMK1VerifiedPaletteBoundExportFixturesExport, executeVerifiedPaletteBoundExportFixtures } from '../games/mk1/research/verifiedPaletteBoundExportFixtures';
import { createMK1CharacterPaletteContextVariantRendererExport, executeCharacterPaletteContextVariantRenderer } from '../games/mk1/research/characterPaletteContextVariantRenderer';
import { createMK1PaletteBindingExceptionCensusExport, executePaletteBindingExceptionCensus } from '../games/mk1/research/paletteBindingExceptionCensus';
import { createMK1AnimationStreamControlTimingCensusExport, executeAnimationStreamControlTimingCensus } from '../games/mk1/research/animationStreamControlTimingCensus';
import { createMK1StageBackgroundResourceGraphCensusExport, executeStageBackgroundResourceGraphCensus } from '../games/mk1/research/stageBackgroundResourceGraphCensus';
import { createMK1BackgroundPlacementCompositionQualificationExport, executeBackgroundPlacementCompositionQualification } from '../games/mk1/research/backgroundPlacementCompositionQualification';
import { createMK1BackgroundRendererProjectionQualificationExport, executeBackgroundRendererProjectionQualification } from '../games/mk1/research/backgroundRendererProjectionQualification';
import { createMK1BackgroundDynamicProcessAnimationCensusExport, executeBackgroundDynamicProcessAnimationCensus } from '../games/mk1/research/backgroundDynamicProcessAnimationCensus';
import { createMK1BackgroundTimeAwareSceneIrExport, executeBackgroundTimeAwareSceneIr } from '../games/mk1/research/backgroundTimeAwareSceneIr';
import { createMK1ArenaAnimatedSceneExportFixtureExport, executeArenaAnimatedSceneExportFixture } from '../games/mk1/research/arenaAnimatedSceneExportFixture';
import { createMK1PillarCloudMotionResetQualificationExport, executePillarCloudMotionResetQualification } from '../games/mk1/research/pillarCloudMotionResetQualification';
import { createMK1PillarDynamicSceneExportFixtureExport, executePillarDynamicSceneExportFixture } from '../games/mk1/research/pillarDynamicSceneExportFixture';
import { createMK1PitDynamicMotionShadowQualificationExport, executePitDynamicMotionShadowQualification } from '../games/mk1/research/pitDynamicMotionShadowQualification';
import { createMK1PitDynamicSceneExportFixtureExport, executePitDynamicSceneExportFixture } from '../games/mk1/research/pitDynamicSceneExportFixture';
import { createMK1CaveSpecialObjectPhaseQualificationExport, executeCaveSpecialObjectPhaseQualification } from '../games/mk1/research/caveSpecialObjectPhaseQualification';
import { createMK1CaveDynamicSceneExportFixtureExport, executeCaveDynamicSceneExportFixture } from '../games/mk1/research/caveDynamicSceneExportFixture';
import { createMK1StrippedBigEmperorProcessQualificationExport, executeStrippedBigEmperorProcessQualification } from '../games/mk1/research/strippedBigEmperorProcessQualification';
import { createMK1StrippedDynamicSceneExportFixtureExport, executeStrippedDynamicSceneExportFixture } from '../games/mk1/research/strippedDynamicSceneExportFixture';
import { createMK1BackgroundRendererHistoryClippingQualificationExport, executeBackgroundRendererHistoryClippingQualification } from '../games/mk1/research/backgroundRendererHistoryClippingQualification';
import { createMK1PitFreshInitialOrdinaryCompositorFixtureExport, executePitFreshInitialOrdinaryCompositorFixture } from '../games/mk1/research/pitFreshInitialOrdinaryCompositorFixture';
import { createMK1FreshInitialOrdinaryBakCompositorCensusExport, executeFreshInitialOrdinaryBakCompositorCensus } from '../games/mk1/research/freshInitialOrdinaryBakCompositorCensus';
import { createMK1MultiStageFreshInitialOrdinaryBakExport, executeMultiStageFreshInitialOrdinaryBakExport } from '../games/mk1/research/multiStageFreshInitialOrdinaryBakExport';
import { createMK1BackgroundDynamicLayerCompositorContractExport, executeBackgroundDynamicLayerCompositorContract } from '../games/mk1/research/backgroundDynamicLayerCompositorContract';
import { createMK1NormalizedDynamicBackgroundCompositorFixtures, executeNormalizedDynamicBackgroundCompositorFixtures } from '../games/mk1/research/normalizedDynamicBackgroundCompositorFixtures';
import { createMK1StageExportCapabilityCoverageManifest, executeStageExportCapabilityCoverageManifest } from '../games/mk1/research/stageExportCapabilityCoverageManifest';
import { createMK1StageExportPackageOrchestrator, executeStageExportPackageOrchestrator } from '../games/mk1/research/stageExportPackageOrchestrator';
import { createMK1BackgroundOrientationStaticExtraQualificationExport, executeBackgroundOrientationStaticExtraQualification } from '../games/mk1/research/backgroundOrientationStaticExtraQualification';
import { createMK1CorrectedStageExportPackage, executeCorrectedStageExportPackage } from '../games/mk1/research/correctedStageExportPackage';
import { createMK1DynamicSiblingVariantQualificationExport, executeDynamicSiblingVariantQualification } from '../games/mk1/research/dynamicSiblingVariantQualification';
import { createMK1DynamicSiblingCombinedPackage, executeDynamicSiblingCombinedPackage } from '../games/mk1/research/dynamicSiblingCombinedPackage';
import { createMK1NoOpStageCompletenessQualificationExport, executeNoOpStageCompletenessQualification } from '../games/mk1/research/noOpStageCompletenessQualification';
import { createMK1CompleteStageNormalizedBackgroundPackage, executeCompleteStageNormalizedBackgroundPackage } from '../games/mk1/research/completeStageNormalizedBackgroundPackage';
import { createMK1BrowserStageExportBundleExport, downloadMK1BrowserStageExportBundle, executeBrowserStageExportBundle, MK1BrowserStageExportBundleResult } from '../games/mk1/research/browserStageExportBundle';
import { createMK1BrowserStageExportBundleValidationExport, executeBrowserStageExportBundleValidation } from '../games/mk1/research/browserStageExportBundleValidation';
import { createMK1ResearchResultsWorkspaceExport, executeResearchResultsWorkspace, MK1ResearchResultsWorkspaceResult } from '../games/mk1/research/researchResultsWorkspace';
import { createMK1ResearchResultsWorkspaceValidationExport, executeResearchResultsWorkspaceValidation } from '../games/mk1/research/researchResultsWorkspaceValidation';
import { createMK1AnimationExportCapabilityCoverageManifestExport, executeAnimationExportCapabilityCoverageManifest } from '../games/mk1/research/animationExportCapabilityCoverageManifest';
import { createMK1BrowserAnimationExportBundleExport, downloadMK1BrowserAnimationExportBundle, executeBrowserAnimationExportBundle, MK1BrowserAnimationExportBundleResult } from '../games/mk1/research/browserAnimationExportBundle';
import { createMK1BrowserAnimationExportBundleValidationExport, executeBrowserAnimationExportBundleValidation } from '../games/mk1/research/browserAnimationExportBundleValidation';
import { createMK1AnimationAssetsWorkspaceExport, executeAnimationAssetsWorkspace, MK1AnimationAssetsWorkspaceResult } from '../games/mk1/research/animationAssetsWorkspace';
import { createMK1AudioMusicResourceGraphCensusExport, executeAudioMusicResourceGraphCensus } from '../games/mk1/research/audioMusicResourceGraphCensus';
import { createMK1BrowserAudioExportBundleExport, downloadMK1BrowserAudioExportBundle, executeBrowserAudioExportBundle, MK1BrowserAudioExportBundleResult } from '../games/mk1/research/browserAudioExportBundle';
import { createMK1BrowserAudioExportBundleValidationExport, executeBrowserAudioExportBundleValidation } from '../games/mk1/research/browserAudioExportBundleValidation';
import { createMK1AudioAssetsWorkspaceExport, executeAudioAssetsWorkspace, MK1AudioAssetsWorkspaceResult } from '../games/mk1/research/audioAssetsWorkspace';
import { createMK1CrossDomainExportCapabilityProvenanceIndexExport, executeCrossDomainExportCapabilityProvenanceIndex } from '../games/mk1/research/crossDomainExportCapabilityProvenanceIndex';
import { createMK1UnifiedAssetArchiveExport, downloadMK1UnifiedAssetArchive, executeUnifiedMk1AssetArchive, MK1UnifiedAssetArchiveResult } from '../games/mk1/research/unifiedMk1AssetArchive';
import { createMK1UnifiedAssetArchiveValidationExport, executeUnifiedMk1AssetArchiveValidation } from '../games/mk1/research/unifiedMk1AssetArchiveValidation';
import { downloadResearchArtifact, downloadResearchArtifactsZip, ResearchArtifact } from '../core/research/researchArtifactDownloads';
import { buildKanoTestBundle, createMK1ControlledPaletteEditExport, executeControlledPaletteEdit, ControlledPaletteEditResult } from '../games/mk1/research/paletteControlledEdit';
import { Download, FileArchive, Play, RefreshCw, ShieldCheck } from 'lucide-react';

interface Props { source: DirectorySource; detection: GameDetectionResult; }

function stamp(): string { return new Date().toISOString().replace(/[:.]/g, '-'); }

export function ResearchQuickActions({ source, detection }: Props) {
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const runId = useRef(0);
  const [editResult, setEditResult] = useState<ControlledPaletteEditResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [artifacts, setArtifacts] = useState<ResearchArtifact[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState<string>('Ready');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roundTrip, setRoundTrip] = useState<PaletteRoundTripReport | null>(null);
  const [ownership, setOwnership] = useState<MK1FighterPaletteOwnershipReport | null>(null);
  const [opponentAccess, setOpponentAccess] = useState<MK1OpponentAccessHarnessReport | null>(null);
  const [ladderGrammar, setLadderGrammar] = useState<MK1SinglePlayerLadderGrammarReport | null>(null);
  const [shangMorph, setShangMorph] = useState<MK1ShangMorphSelectionReport | null>(null);
  const [animationGroundTruth, setAnimationGroundTruth] = useState<MK1AnimationStreamGroundTruthReport | null>(null);
  const [multiPartIr, setMultiPartIr] = useState<MK1MultiPartFrameLosslessIrReport | null>(null);
  const [multiPartEdit, setMultiPartEdit] = useState<MK1MultiPartControlledEditResult | null>(null);
  const [raydenLightning, setRaydenLightning] = useState<MK1RaydenLightningPlacementResult | null>(null);
  const [raydenCanvasEditor, setRaydenCanvasEditor] = useState<MK1RaydenLightningCanvasEditorReport | null>(null);
  const [multiPartCanvasEditor, setMultiPartCanvasEditor] = useState<MK1MultiPartCompositionCanvasEditorReport | null>(null);
  const [heartRipAnimationEditor, setHeartRipAnimationEditor] = useState<MK1HeartRipAnimationCanvasEditorReport | null>(null);
  const [heartRipRelocationCensus, setHeartRipRelocationCensus] = useState<MK1HeartRipRelocationCensusReport | null>(null);
  const [reshapeFullCapacity, setReshapeFullCapacity] = useState<MK1ReshapeMultiFullCapacitySemanticsReport | null>(null);
  const [heartRipFourthPart, setHeartRipFourthPart] = useState<MK1HeartRipFourthPartTopologyResult | null>(null);
  const [heartRipFixedTopology, setHeartRipFixedTopology] = useState<MK1HeartRipFixedCapacityTopologyEditorReport | null>(null);
  const [heartRipAtomicComposition, setHeartRipAtomicComposition] = useState<MK1HeartRipAtomicCompositionEditorReport | null>(null);
  const [heartRipFullComposition, setHeartRipFullComposition] = useState<MK1HeartRipFullFixedLayoutCompositionEditorReport | null>(null);
  const [browserStageBundle, setBrowserStageBundle] = useState<MK1BrowserStageExportBundleResult | null>(null);
  const [browserAnimationBundle, setBrowserAnimationBundle] = useState<MK1BrowserAnimationExportBundleResult | null>(null);
  const [researchWorkspace, setResearchWorkspace] = useState<MK1ResearchResultsWorkspaceResult | null>(null);
  const [animationWorkspace, setAnimationWorkspace] = useState<MK1AnimationAssetsWorkspaceResult | null>(null);
  const [browserAudioBundle, setBrowserAudioBundle] = useState<MK1BrowserAudioExportBundleResult | null>(null);
  const [audioWorkspace, setAudioWorkspace] = useState<MK1AudioAssetsWorkspaceResult | null>(null);
  const [unifiedAssetArchive, setUnifiedAssetArchive] = useState<MK1UnifiedAssetArchiveResult | null>(null);

  useEffect(() => {
    runId.current++; setEditResult(null); setIsExporting(false);
    setArtifacts([]); setStage('Ready'); setProgress(0); setError(null); setIsRunning(false); setRoundTrip(null); setOwnership(null); setOpponentAccess(null); setLadderGrammar(null); setShangMorph(null); setAnimationGroundTruth(null); setMultiPartIr(null); setMultiPartEdit(null); setRaydenLightning(null); setRaydenCanvasEditor(null); setMultiPartCanvasEditor(null); setHeartRipAnimationEditor(null); setHeartRipRelocationCensus(null); setReshapeFullCapacity(null); setHeartRipFourthPart(null); setHeartRipFixedTopology(null); setHeartRipAtomicComposition(null); setHeartRipFullComposition(null); setBrowserStageBundle(null); setBrowserAnimationBundle(null); setBrowserAudioBundle(null); setResearchWorkspace(null); setAnimationWorkspace(null); setAudioWorkspace(null); setUnifiedAssetArchive(null);
  }, [source]);

  const latest = artifacts.length ? artifacts[artifacts.length - 1] : null;
  const provenance = useMemo(() => {
    const d: any = latest?.data;
    return d?.provenance ?? null;
  }, [latest]);

  const run = async () => {
    if (detection.game !== 'mk1' || source.isSynthetic) return;
    const thisRun = ++runId.current;
    const current = () => sourceRef.current === source && runId.current === thisRun;
    const ensureCurrent = () => { if (!current()) throw new Error('Source changed; obsolete run discarded'); };
    setEditResult(null);
    setIsRunning(true); setError(null); setProgress(0.02); setArtifacts([]); setRoundTrip(null); setOwnership(null); setOpponentAccess(null); setLadderGrammar(null); setShangMorph(null); setAnimationGroundTruth(null); setMultiPartIr(null); setMultiPartEdit(null); setRaydenLightning(null); setRaydenCanvasEditor(null); setMultiPartCanvasEditor(null); setHeartRipAnimationEditor(null); setHeartRipRelocationCensus(null); setReshapeFullCapacity(null); setHeartRipFourthPart(null); setHeartRipFixedTopology(null); setHeartRipAtomicComposition(null); setHeartRipFullComposition(null); setBrowserStageBundle(null); setBrowserAnimationBundle(null); setBrowserAudioBundle(null); setResearchWorkspace(null); setAnimationWorkspace(null); setAudioWorkspace(null);
    try {
      const next: ResearchArtifact[] = [];
      setStage('1/75 — Verifying palette ground truth (1E.3D.1)'); setProgress(0.08);
      const gt = await executeWatcomDataImagePaletteGroundTruth(source);
      ensureCurrent();
      const gtExport = createMK1WatcomDataImagePaletteGroundTruthExport(gt);
      if (!gtExport.validation.allChecksPassed) throw new Error('1E.3D.1 prerequisite validation failed; 1E.3E was not started.');
      next.push({ filename: `mk1_watcom_data_image_palette_ground_truth_${stamp()}.json`, pass: '1E.3D.1', status: 'VERIFIED', timestamp: gt.timestamp, data: gtExport });
      setArtifacts([...next]); setProgress(0.31);

      setStage('2/75 — Building Kano palette selection reference graph (1E.3E)');
      const graph = await executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt, onProgress: (s, p) => { ensureCurrent(); setStage(`2/73 — ${s}`); setProgress(0.31 + p * 0.25); } });
      ensureCurrent();
      const graphExport = createMK1KanoPaletteSelectionReferenceGraphExport(graph);
      if (!graphExport.validation.allChecksPassed) throw new Error('1E.3E completed but authoritative validation did not pass.');
      next.push({ filename: `mk1_kano_palette_selection_reference_graph_${stamp()}.json`, pass: '1E.3E', status: 'VERIFIED', timestamp: graph.timestamp, data: graphExport });
      setArtifacts([...next]); setProgress(0.57);

      setStage('3/75 — Qualifying palette selection semantics (1E.3F)');
      const semantics = await executeKanoPaletteSelectionSemantics(source, {
        referenceGraphReport: graph,
        onProgress: (s, p) => { ensureCurrent(); setStage(`3/73 — ${s}`); setProgress(0.57 + p * 0.22); },
      });
      ensureCurrent();
      const semanticsExport = createMK1KanoPaletteSelectionSemanticsExport(semantics);
      if (!semanticsExport.validation.allChecksPassed) throw new Error('1E.3F completed but authoritative validation did not pass.');
      next.push({ filename: `mk1_kano_palette_selection_semantics_${stamp()}.json`, pass: '1E.3F', status: 'VERIFIED', timestamp: semantics.timestamp, data: semanticsExport });
      setArtifacts([...next]); setProgress(0.80);

      setStage('4/75 — Qualifying palette setup / transfer semantics (1E.3G)');
      const transfer = await executePaletteSetupTransferSemantics(source, {
        selectionSemanticsReport: semantics,
        onProgress: (s, p) => { ensureCurrent(); setStage(`4/73 — ${s}`); setProgress(0.80 + p * 0.12); },
      });
      ensureCurrent();
      const transferExport = createMK1PaletteSetupTransferSemanticsExport(transfer);
      if (!transferExport.validation.allChecksPassed) throw new Error('1E.3G completed but authoritative validation did not pass.');
      next.push({ filename: `mk1_palette_setup_transfer_semantics_${stamp()}.json`, pass: '1E.3G', status: 'VERIFIED', timestamp: transfer.timestamp, data: transferExport });
      setArtifacts([...next]); setProgress(0.92);

      setStage('5/75 — Checking lossless palette round trip (1E.3H)');
      const rebuilt = await executePaletteRoundTrip(source, {
        groundTruthReport: gt, transferReport: transfer,
        onProgress: (s, p) => { ensureCurrent(); setStage(`5/73 — ${s}`); setProgress(0.92 + p * 0.04); },
      });
      ensureCurrent(); setRoundTrip(rebuilt);
      const roundTripExport = await createMK1PaletteRoundTripExport(rebuilt);
      ensureCurrent();
      next.push({ filename: `mk1_palette_round_trip_${stamp()}.json`, pass: '1E.3H', status: 'VALIDATION_PASSED', timestamp: rebuilt.timestamp, data: roundTripExport });
      setArtifacts([...next]); setProgress(0.955);

      setStage('6/75 — Preparing controlled Kano palette edit (1E.3I)');
      const edited = await executeControlledPaletteEdit(source, rebuilt);
      ensureCurrent();
      const editExport = await createMK1ControlledPaletteEditExport(edited);
      ensureCurrent(); setEditResult(edited);
      next.push({ filename: `mk1_palette_controlled_edit_${stamp()}.json`, pass: '1E.3I', status: edited.report.status, timestamp: edited.report.timestamp, data: editExport });
      setArtifacts([...next]); setProgress(0.975);

      setStage('7/75 — Establishing fighter palette ownership scaffold (1E.3L)');
      const ownershipReport = await executeFighterPaletteOwnershipQualification(source, {
        referenceGraphReport: graph,
        selectionSemanticsReport: semantics,
        roundTripReport: rebuilt,
      });
      ensureCurrent();
      const ownershipExport = await createMK1FighterPaletteOwnershipExport(ownershipReport);
      ensureCurrent(); setOwnership(ownershipReport);
      next.push({ filename: `mk1_fighter_palette_ownership_${stamp()}.json`, pass: '1E.3L', status: 'VERIFIED', timestamp: ownershipReport.timestamp, data: ownershipExport });
      setArtifacts([...next]); setProgress(0.985);

      setStage('8/75 — Qualifying first-opponent access harness (1E.3N.1)');
      const accessReport = await executeOpponentAccessHarnessQualification(source, {
        selectionSemanticsReport: semantics,
        roundTripReport: rebuilt,
      });
      ensureCurrent();
      const accessExport = await createMK1OpponentAccessHarnessExport(accessReport);
      ensureCurrent(); setOpponentAccess(accessReport);
      next.push({ filename: `mk1_opponent_access_harness_${stamp()}.json`, pass: '1E.3N.1', status: 'VERIFIED', timestamp: accessReport.timestamp, data: accessExport });
      setArtifacts([...next]); setProgress(0.992);

      setStage('9/75 — Qualifying single-player ladder grammar (1E.3N.2)');
      const grammarReport = await executeSinglePlayerLadderGrammarQualification(source, {
        opponentAccessReport: accessReport,
        roundTripReport: rebuilt,
      });
      ensureCurrent();
      const grammarExport = await createMK1SinglePlayerLadderGrammarExport(grammarReport);
      ensureCurrent(); setLadderGrammar(grammarReport);
      next.push({ filename: `mk1_single_player_ladder_grammar_${stamp()}.json`, pass: '1E.3N.2', status: 'VERIFIED', timestamp: grammarReport.timestamp, data: grammarExport });
      setArtifacts([...next]); setProgress(0.996);

      setStage('10/75 — Qualifying Shang Tsung morph asset / palette selection (1E.3N.4)');
      const morphReport = await executeShangMorphSelectionQualification(source, {
        ownershipReport,
        opponentAccessReport: accessReport,
      });
      ensureCurrent();
      const morphExport = await createMK1ShangMorphSelectionExport(morphReport);
      ensureCurrent(); setShangMorph(morphReport);
      next.push({ filename: `mk1_shang_morph_selection_${stamp()}.json`, pass: '1E.3N.4', status: 'VERIFIED', timestamp: morphReport.timestamp, data: morphExport });
      setArtifacts([...next]); setProgress(0.998);

      setStage('11/75 — Reconstructing animation stream + morph frame composition (1E.3O.1)');
      const animationReport = await executeAnimationStreamGroundTruth(source, { shangMorphReport: morphReport });
      ensureCurrent();
      const animationExport = await createMK1AnimationStreamGroundTruthExport(animationReport);
      ensureCurrent(); setAnimationGroundTruth(animationReport);
      next.push({ filename: `mk1_animation_stream_ground_truth_${stamp()}.json`, pass: '1E.3O.1', status: 'VERIFIED', timestamp: animationReport.timestamp, data: animationExport });
      setArtifacts([...next]); setProgress(0.999);

      setStage('12/75 — Qualifying multi-part frames + bounded lossless animation IR (1E.3O.2)');
      const multiReport = await executeMultiPartFrameLosslessIr(source, { animationReport });
      ensureCurrent();
      const multiExport = await createMK1MultiPartFrameLosslessIrExport(multiReport);
      ensureCurrent(); setMultiPartIr(multiReport);
      next.push({ filename: `mk1_multi_part_frame_lossless_ir_${stamp()}.json`, pass: '1E.3O.2', status: 'VERIFIED', timestamp: multiReport.timestamp, data: multiExport });
      setArtifacts([...next]); setProgress(0.9995);

      setStage('13/75 — Performing controlled multi-part XY write-back (1E.3O.3)');
      const multiEditResult = await executeMultiPartControlledEdit(source, multiReport);
      ensureCurrent();
      const multiEditExport = await createMK1MultiPartControlledEditExport(multiEditResult);
      ensureCurrent(); setMultiPartEdit(multiEditResult);
      next.push({ filename: `mk1_multi_part_controlled_xy_edit_${stamp()}.json`, pass: '1E.3O.3', status: multiEditResult.report.status, timestamp: multiEditResult.report.timestamp, data: multiEditExport });
      setArtifacts([...next]); setProgress(0.9998);

      setStage('14/75 — Qualifying Rayden lightning persistent visual placement fixture (1E.3O.4)');
      const raydenResult = await executeRaydenLightningPlacementFixture(source, multiReport);
      ensureCurrent();
      const raydenExport = await createMK1RaydenLightningPlacementExport(raydenResult);
      ensureCurrent(); setRaydenLightning(raydenResult);
      next.push({ filename: `mk1_rayden_lightning_placement_fixture_${stamp()}.json`, pass: '1E.3O.4', status: raydenResult.report.status, timestamp: raydenResult.report.timestamp, data: raydenExport });
      setArtifacts([...next]); setProgress(0.9999);

      setStage('15/75 — Building bounded interactive Rayden lightning canvas editor (1E.3O.5)');
      const raydenCanvas = await executeRaydenLightningCanvasEditorModel(source, raydenResult.report);
      ensureCurrent();
      const raydenCanvasExport = createMK1RaydenLightningCanvasEditorExport(raydenCanvas);
      ensureCurrent(); setRaydenCanvasEditor(raydenCanvas);
      next.push({ filename: `mk1_rayden_lightning_canvas_editor_model_${stamp()}.json`, pass: '1E.3O.5', status: raydenCanvas.status, timestamp: raydenCanvas.timestamp, data: raydenCanvasExport });
      setArtifacts([...next]); setProgress(0.99995);

      setStage('16/75 — Building fixed-topology Kano heart multi-part composition editor (1E.3O.7)');
      const multiCanvas = await executeMultiPartCompositionCanvasEditorModel(source, multiReport);
      ensureCurrent();
      const multiCanvasExport = createMK1MultiPartCompositionCanvasEditorExport(multiCanvas);
      ensureCurrent(); setMultiPartCanvasEditor(multiCanvas);
      next.push({ filename: `mk1_multi_part_composition_canvas_editor_model_${stamp()}.json`, pass: '1E.3O.7', status: multiCanvas.status, timestamp: multiCanvas.timestamp, data: multiCanvasExport });
      setArtifacts([...next]); setProgress(0.99998);

      setStage('17/75 — Expanding fixed-layout editing across the complete Kano heart-rip animation (1E.3O.8)');
      const heartEditor = await executeHeartRipAnimationCanvasEditorModel(source, multiReport, multiCanvas);
      ensureCurrent();
      const heartEditorExport = createMK1HeartRipAnimationCanvasEditorExport(heartEditor);
      ensureCurrent(); setHeartRipAnimationEditor(heartEditor);
      next.push({ filename: `mk1_heart_rip_animation_canvas_editor_model_${stamp()}.json`, pass: '1E.3O.8', status: heartEditor.status, timestamp: heartEditor.timestamp, data: heartEditorExport });
      setArtifacts([...next]); setProgress(0.99999);

      setStage('18/75 — Censusing heart-rip structural growth, inbound references and relocation storage (1E.3O.9)');
      const relocationCensus = await executeHeartRipRelocationCensus(source, heartEditor);
      ensureCurrent();
      const relocationExport = createMK1HeartRipRelocationCensusExport(relocationCensus);
      ensureCurrent(); setHeartRipRelocationCensus(relocationCensus);
      next.push({ filename: `mk1_heart_rip_relocation_census_${stamp()}.json`, pass: '1E.3O.9', status: relocationCensus.status, timestamp: relocationCensus.timestamp, data: relocationExport });
      setArtifacts([...next]);

      setStage('19/75 — Qualifying RESHAPE_MULTI full-capacity termination semantics (1E.3O.10)');
      const fullCapacity = await executeReshapeMultiFullCapacitySemantics(source, relocationCensus, heartEditor);
      ensureCurrent();
      const fullCapacityExport = createMK1ReshapeMultiFullCapacitySemanticsExport(fullCapacity);
      ensureCurrent(); setReshapeFullCapacity(fullCapacity);
      next.push({ filename: `mk1_reshape_multi_full_capacity_semantics_${stamp()}.json`, pass: '1E.3O.10', status: fullCapacity.status, timestamp: fullCapacity.timestamp, data: fullCapacityExport });
      setArtifacts([...next]); setProgress(0.985);

      setStage('20/75 — Compiling controlled heart-rip fourth-part topology write (1E.3O.11)');
      const fourthPart = await executeHeartRipFourthPartTopologyWrite(source, fullCapacity, heartEditor);
      ensureCurrent();
      const fourthPartExport = createMK1HeartRipFourthPartTopologyExport(fourthPart);
      ensureCurrent(); setHeartRipFourthPart(fourthPart);
      next.push({ filename: `mk1_heart_rip_fourth_part_topology_edit_${stamp()}.json`, pass: '1E.3O.11', status: fourthPart.report.status, timestamp: fourthPart.report.timestamp, data: fourthPartExport });
      setArtifacts([...next]); setProgress(0.99);

      setStage('21/75 — Establishing fixed-capacity heart_2 topology authoring (1E.3O.12)');
      const fixedTopology = await executeHeartRipFixedCapacityTopologyEditorModel(source, heartEditor, fullCapacity, fourthPart.report);
      ensureCurrent();
      const fixedTopologyExport = createMK1HeartRipFixedCapacityTopologyEditorExport(fixedTopology);
      ensureCurrent(); setHeartRipFixedTopology(fixedTopology);
      next.push({ filename: `mk1_heart_rip_fixed_capacity_topology_editor_model_${stamp()}.json`, pass: '1E.3O.12', status: fixedTopology.status, timestamp: fixedTopology.timestamp, data: fixedTopologyExport });
      setArtifacts([...next]); setProgress(0.995);

      setStage('22/75 — Composing atomic heart_2 topology + placement authoring (1E.3O.13)');
      const atomicComposition = await executeHeartRipAtomicCompositionEditorModel(source, heartEditor, fixedTopology);
      ensureCurrent();
      const atomicCompositionExport = createMK1HeartRipAtomicCompositionEditorExport(atomicComposition);
      ensureCurrent(); setHeartRipAtomicComposition(atomicComposition);
      next.push({ filename: `mk1_heart_rip_atomic_composition_editor_model_${stamp()}.json`, pass: '1E.3O.13', status: atomicComposition.status, timestamp: atomicComposition.timestamp, data: atomicCompositionExport });
      setArtifacts([...next]); setProgress(0.998);

      setStage('23/75 — Expanding atomic fixed-layout composition authoring across the full heart-rip animation (1E.3O.14)');
      const fullComposition = await executeHeartRipFullFixedLayoutCompositionEditorModel(source, heartEditor, atomicComposition);
      ensureCurrent();
      const fullCompositionExport = createMK1HeartRipFullFixedLayoutCompositionEditorExport(fullComposition);
      ensureCurrent(); setHeartRipFullComposition(fullComposition);
      next.push({ filename: `mk1_heart_rip_full_fixed_layout_composition_editor_model_${stamp()}.json`, pass: '1E.3O.14', status: fullComposition.status, timestamp: fullComposition.timestamp, data: fullCompositionExport });
      setArtifacts([...next]); setProgress(0.999);

      setStage('24/75 — Preflighting true heart-rip record growth, direct inbound rewrites and allocatable storage (1E.3O.15)');
      const growthPreflight = await executeHeartRipGrowthRelocationPreflight(source, relocationCensus, fullComposition);
      ensureCurrent();
      const growthPreflightExport = createMK1HeartRipGrowthRelocationPreflightExport(growthPreflight);
      next.push({ filename: `mk1_heart_rip_growth_relocation_preflight_${stamp()}.json`, pass: '1E.3O.15', status: growthPreflight.status, timestamp: growthPreflight.timestamp, data: growthPreflightExport });
      setArtifacts([...next]); setProgress(0.9995);

      setStage('25/75 — Censusing KANO_ANITAB animation structure and exportability without write-back (1E.3O.16)');
      const kanoExportability = await executeKanoAnimationExportabilityCensus(source, fullComposition);
      ensureCurrent();
      const kanoExportabilityExport = createMK1KanoAnimationExportabilityCensusExport(kanoExportability);
      next.push({ filename: `mk1_kano_animation_exportability_census_${stamp()}.json`, pass: '1E.3O.16', status: kanoExportability.status, timestamp: kanoExportability.timestamp, data: kanoExportabilityExport });
      setArtifacts([...next]); setProgress(0.9998);

      setStage('26/75 — Comparing every discovered MK1 _ANITAB table for repeated export structure (1E.3O.17)');
      const fighterAnimationComparison = await executeFighterAnimationTableComparison(source);
      ensureCurrent();
      const fighterAnimationComparisonExport = createMK1FighterAnimationTableComparisonExport(fighterAnimationComparison);
      next.push({ filename: `mk1_fighter_animation_table_comparison_${stamp()}.json`, pass: '1E.3O.17', status: fighterAnimationComparison.status, timestamp: fighterAnimationComparison.timestamp, data: fighterAnimationComparisonExport });
      setArtifacts([...next]); setProgress(0.9999);

      setStage('27/75 — Resolving the MK1 animation graph against authentic GRA payloads and decoding every reached sprite (1E.3O.18)');
      const animationResourceDecode = await executeAnimationResourceDecodeCensus(source, fighterAnimationComparison);
      ensureCurrent();
      const animationResourceDecodeExport = createMK1AnimationResourceDecodeCensusExport(animationResourceDecode);
      next.push({ filename: `mk1_animation_resource_decode_census_${stamp()}.json`, pass: '1E.3O.18', status: animationResourceDecode.status, timestamp: animationResourceDecode.timestamp, data: animationResourceDecodeExport });
      setArtifacts([...next]); setProgress(0.99995);

      setStage('28/75 — Binding runtime character identities to the discovered ANITAB tables through GET_CHAR_ANI (1E.3O.19)');
      const characterAnimationSelector = await executeCharacterAnimationTableSelector(source, fighterAnimationComparison, ownershipReport, accessReport);
      ensureCurrent();
      const characterAnimationSelectorExport = createMK1CharacterAnimationTableSelectorExport(characterAnimationSelector);
      next.push({ filename: `mk1_character_animation_table_selector_${stamp()}.json`, pass: '1E.3O.19', status: characterAnimationSelector.status, timestamp: characterAnimationSelector.timestamp, data: characterAnimationSelectorExport });
      setArtifacts([...next]); setProgress(0.99998);

      setStage('29/75 — Separating animation-table identity from palette context for export-safe reconstruction (1E.3O.20)');
      const animationPaletteContext = executeAnimationPaletteContextBridge(characterAnimationSelector, ownershipReport, semantics);
      ensureCurrent();
      const animationPaletteContextExport = createMK1AnimationPaletteContextBridgeExport(animationPaletteContext);
      next.push({ filename: `mk1_animation_palette_context_bridge_${stamp()}.json`, pass: '1E.3O.20', status: animationPaletteContext.status, timestamp: animationPaletteContext.timestamp, data: animationPaletteContextExport });
      setArtifacts([...next]); setProgress(0.99999);

      setStage('30/75 — Censusing direct GET_CHAR_ANI consumers and bounded immediate animation indices without assigning gameplay names (1E.3O.21)');
      const getCharAniConsumers = await executeGetCharAniConsumerCensus(source, fighterAnimationComparison, characterAnimationSelector);
      ensureCurrent();
      const getCharAniConsumersExport = createMK1GetCharAniConsumerCensusExport(getCharAniConsumers);
      next.push({ filename: `mk1_get_char_ani_consumer_census_${stamp()}.json`, pass: '1E.3O.21', status: getCharAniConsumers.status, timestamp: getCharAniConsumers.timestamp, data: getCharAniConsumersExport });
      setArtifacts([...next]); setProgress(0.999995);

      setStage('31/75 — Building the character-oriented MK1 animation export manifest while preserving palette and semantic uncertainty (1E.3O.22)');
      const animationExportManifest = executeCharacterAnimationExportManifest(fighterAnimationComparison, animationResourceDecode, characterAnimationSelector, animationPaletteContext, getCharAniConsumers);
      ensureCurrent();
      const animationExportManifestExport = createMK1CharacterAnimationExportManifestExport(animationExportManifest);
      next.push({ filename: `mk1_character_animation_export_manifest_${stamp()}.json`, pass: '1E.3O.22', status: animationExportManifest.status, timestamp: animationExportManifest.timestamp, data: animationExportManifestExport });
      setArtifacts([...next]); setProgress(0.999997);

      setStage('32/75 — Proving correct-color RGBA export on already-qualified Kano heart and Rayden lightning palette contexts (1E.3O.23)');
      const paletteBoundFixtures = await executeVerifiedPaletteBoundExportFixtures(source, multiReport, raydenResult.report);
      ensureCurrent();
      const paletteBoundFixturesExport = createMK1VerifiedPaletteBoundExportFixturesExport(paletteBoundFixtures);
      next.push({ filename: `mk1_verified_palette_bound_export_fixtures_${stamp()}.json`, pass: '1E.3O.23', status: paletteBoundFixtures.report.status, timestamp: paletteBoundFixtures.report.timestamp, data: paletteBoundFixturesExport });
      setArtifacts([...next]); setProgress(0.999999);

      setStage('33/75 — Rendering explicit normal/alternate character palette-context variants for structurally dominant fighter resources without auto-binding effects (1E.3O.24)');
      const characterPaletteVariants = await executeCharacterPaletteContextVariantRenderer(source, animationResourceDecode, animationPaletteContext, transfer);
      ensureCurrent();
      const characterPaletteVariantsExport = createMK1CharacterPaletteContextVariantRendererExport(characterPaletteVariants);
      next.push({ filename: `mk1_character_palette_context_variant_renderer_${stamp()}.json`, pass: '1E.3O.24', status: characterPaletteVariants.report.status, timestamp: characterPaletteVariants.report.timestamp, data: characterPaletteVariantsExport });
      setArtifacts([...next]); setProgress(0.9999995);

      setStage('34/75 — Censusing cross-resource and same-resource palette-binding exceptions without promoting compatibility into ownership (1E.3O.25)');
      const paletteBindingExceptions = await executePaletteBindingExceptionCensus(source, animationResourceDecode, animationExportManifest, paletteBoundFixtures.report, characterPaletteVariants.report);
      ensureCurrent();
      const paletteBindingExceptionsExport = createMK1PaletteBindingExceptionCensusExport(paletteBindingExceptions);
      next.push({ filename: `mk1_palette_binding_exception_census_${stamp()}.json`, pass: '1E.3O.25', status: paletteBindingExceptions.status, timestamp: paletteBindingExceptions.timestamp, data: paletteBindingExceptionsExport });
      setArtifacts([...next]); setProgress(0.9999997);

      setStage('35/75 — Re-verifying stream control opcodes and bounding MFRAMEW caller-supplied dwell arguments without inventing wall-clock timing (1E.3O.26)');
      const streamControlTiming = await executeAnimationStreamControlTimingCensus(source, fighterAnimationComparison);
      ensureCurrent();
      const streamControlTimingExport = createMK1AnimationStreamControlTimingCensusExport(streamControlTiming);
      next.push({ filename: `mk1_animation_stream_control_timing_census_${stamp()}.json`, pass: '1E.3O.26', status: streamControlTiming.status, timestamp: streamControlTiming.timestamp, data: streamControlTimingExport });
      setArtifacts([...next]); setProgress(0.99999985);

      setStage('36/75 — Reconstructing the canonical MK1 stage/background resource graph and validating authentic HDRS.GRA descriptor decode (1E.3O.27)');
      const stageBackgroundGraph = await executeStageBackgroundResourceGraphCensus(source);
      ensureCurrent();
      const stageBackgroundGraphExport = createMK1StageBackgroundResourceGraphCensusExport(stageBackgroundGraph);
      next.push({ filename: `mk1_stage_background_resource_graph_census_${stamp()}.json`, pass: '1E.3O.27', status: stageBackgroundGraph.status, timestamp: stageBackgroundGraph.timestamp, data: stageBackgroundGraphExport });
      setArtifacts([...next]); setProgress(0.99999992);

      setStage('37/75 — Qualifying BAKGND placement selectors and building a bounded PIT scene export IR with authentic palette-bound RGBA variants (1E.3O.28)');
      const backgroundPlacement = await executeBackgroundPlacementCompositionQualification(source, stageBackgroundGraph);
      ensureCurrent();
      const backgroundPlacementExport = createMK1BackgroundPlacementCompositionQualificationExport(backgroundPlacement);
      next.push({ filename: `mk1_background_placement_composition_qualification_${stamp()}.json`, pass: '1E.3O.28', status: backgroundPlacement.report.status, timestamp: backgroundPlacement.report.timestamp, data: backgroundPlacementExport });
      setArtifacts([...next]); setProgress(0.99999994);

      setStage('38/75 — Qualifying background plane traversal, linked-list sort keys, X/Y axes and camera projection without flattening unresolved dynamics (1E.3O.29)');
      const backgroundRendererProjection = await executeBackgroundRendererProjectionQualification(source, stageBackgroundGraph, backgroundPlacement.report);
      ensureCurrent();
      const backgroundRendererProjectionExport = createMK1BackgroundRendererProjectionQualificationExport(backgroundRendererProjection);
      next.push({ filename: `mk1_background_renderer_projection_qualification_${stamp()}.json`, pass: '1E.3O.29', status: backgroundRendererProjection.status, timestamp: backgroundRendererProjection.timestamp, data: backgroundRendererProjectionExport });
      setArtifacts([...next]); setProgress(0.99999997);

      setStage('39/75 — Censusing background process spawns, scheduler-tick cadence, descriptor-cycle animation and positional motion without inventing wall-clock timing (1E.3O.30)');
      const backgroundDynamics = await executeBackgroundDynamicProcessAnimationCensus(source, stageBackgroundGraph, backgroundRendererProjection);
      ensureCurrent();
      const backgroundDynamicsExport = createMK1BackgroundDynamicProcessAnimationCensusExport(backgroundDynamics);
      next.push({ filename: `mk1_background_dynamic_process_animation_census_${stamp()}.json`, pass: '1E.3O.30', status: backgroundDynamics.status, timestamp: backgroundDynamics.timestamp, data: backgroundDynamicsExport });
      setArtifacts([...next]); setProgress(0.99999998);

      setStage('40/75 — Joining stage resource, placement, plane/camera, palette-state and scheduler/process evidence into a time-aware scene IR (1E.3O.31)');
      const backgroundTimeAwareScene = await executeBackgroundTimeAwareSceneIr(source, stageBackgroundGraph, backgroundPlacement.report, backgroundRendererProjection, backgroundDynamics);
      ensureCurrent();
      const backgroundTimeAwareSceneExport = createMK1BackgroundTimeAwareSceneIrExport(backgroundTimeAwareScene);
      next.push({ filename: `mk1_background_time_aware_scene_ir_${stamp()}.json`, pass: '1E.3O.31', status: backgroundTimeAwareScene.status, timestamp: backgroundTimeAwareScene.timestamp, data: backgroundTimeAwareSceneExport });
      setArtifacts([...next]); setProgress(0.99999999);

      setStage('41/75 — Exporting the bounded ARENA six-state animated-scene fixture with runtime-preserved palette state and explicit equal-key composite blocking (1E.3O.32)');
      const arenaAnimatedScene = await executeArenaAnimatedSceneExportFixture(source, stageBackgroundGraph, backgroundDynamics, backgroundTimeAwareScene);
      ensureCurrent();
      const arenaAnimatedSceneExport = createMK1ArenaAnimatedSceneExportFixtureExport(arenaAnimatedScene);
      next.push({ filename: `mk1_arena_animated_scene_export_fixture_${stamp()}.json`, pass: '1E.3O.32', status: arenaAnimatedScene.report.status, timestamp: arenaAnimatedScene.report.timestamp, data: arenaAnimatedSceneExport });
      setArtifacts([...next]); setProgress(0.999999992);

      setStage('42/75 — Qualifying PILLAR process-created multipart cloud motion, no-scroll projection, signed-16.16 velocity propagation and exact wrap/reset semantics (1E.3O.33)');
      const pillarCloudMotion = await executePillarCloudMotionResetQualification(source, stageBackgroundGraph, backgroundDynamics, backgroundTimeAwareScene);
      ensureCurrent();
      const pillarCloudMotionExport = createMK1PillarCloudMotionResetQualificationExport(pillarCloudMotion);
      next.push({ filename: `mk1_pillar_cloud_motion_reset_qualification_${stamp()}.json`, pass: '1E.3O.33', status: pillarCloudMotion.status, timestamp: pillarCloudMotion.timestamp, data: pillarCloudMotionExport });
      setArtifacts([...next]); setProgress(0.999999996);

      setStage('43/75 — Packaging PILLAR placement-bound descriptor animation and process-created cloud motion as independent normalized time tracks with correct-colour assets (1E.3O.34)');
      const pillarDynamicScene = await executePillarDynamicSceneExportFixture(source, stageBackgroundGraph, backgroundDynamics, backgroundTimeAwareScene, pillarCloudMotion);
      ensureCurrent();
      const pillarDynamicSceneExport = createMK1PillarDynamicSceneExportFixtureExport(pillarDynamicScene);
      next.push({ filename: `mk1_pillar_dynamic_scene_export_fixture_${stamp()}.json`, pass: '1E.3O.34', status: pillarDynamicScene.report.status, timestamp: pillarDynamicScene.report.timestamp, data: pillarDynamicSceneExport });
      setArtifacts([...next]); setProgress(0.999999998);

      setStage('44/75 — Qualifying PIT shadow-bound state, ten persistent no-scroll moving groups and the conditional transient lifecycle without conflating render-bound state with camera motion (1E.3O.35)');
      const pitDynamicMotion = await executePitDynamicMotionShadowQualification(source, stageBackgroundGraph, backgroundPlacement.report, backgroundRendererProjection, backgroundDynamics, backgroundTimeAwareScene);
      ensureCurrent();
      const pitDynamicMotionExport = createMK1PitDynamicMotionShadowQualificationExport(pitDynamicMotion);
      next.push({ filename: `mk1_pit_dynamic_motion_shadow_qualification_${stamp()}.json`, pass: '1E.3O.35', status: pitDynamicMotion.status, timestamp: pitDynamicMotion.timestamp, data: pitDynamicMotionExport });
      setArtifacts([...next]); setProgress(0.999999999);

      setStage('45/75 — Packaging the PIT ordinary placement variants, persistent moving groups, conditional transient lifecycle and symbolic shadow-bound track as a bounded dynamic-scene export (1E.3O.36)');
      const pitDynamicScene = await executePitDynamicSceneExportFixture(source, stageBackgroundGraph, backgroundPlacement, backgroundRendererProjection, backgroundTimeAwareScene, pitDynamicMotion);
      ensureCurrent();
      const pitDynamicSceneExport = createMK1PitDynamicSceneExportFixtureExport(pitDynamicScene);
      next.push({ filename: `mk1_pit_dynamic_scene_export_fixture_${stamp()}.json`, pass: '1E.3O.36', status: pitDynamicScene.report.status, timestamp: pitDynamicScene.report.timestamp, data: pitDynamicSceneExport });
      setArtifacts([...next]); setProgress(0.9999999995);

      setStage('46/75 — Qualifying CAVE process-created special-list objects, direct eyez2 palette binding, RANDU initial phase and the 28-slot eight-tick descriptor cycle (1E.3O.37)');
      const caveSpecialObjects = await executeCaveSpecialObjectPhaseQualification(source, stageBackgroundGraph, backgroundRendererProjection, backgroundDynamics, backgroundTimeAwareScene);
      ensureCurrent();
      const caveSpecialObjectsExport = createMK1CaveSpecialObjectPhaseQualificationExport(caveSpecialObjects);
      next.push({ filename: `mk1_cave_special_object_phase_qualification_${stamp()}.json`, pass: '1E.3O.37', status: caveSpecialObjects.status, timestamp: caveSpecialObjects.timestamp, data: caveSpecialObjectsExport });
      setArtifacts([...next]); setProgress(0.9999999998);

      setStage('47/75 — Packaging CAVE special-object assets and the exact random-phase automaton without fabricating RNG state or a canonical flattened frame (1E.3O.38)');
      const caveDynamicScene = await executeCaveDynamicSceneExportFixture(source, backgroundTimeAwareScene, caveSpecialObjects);
      ensureCurrent();
      const caveDynamicSceneExport = createMK1CaveDynamicSceneExportFixtureExport(caveDynamicScene);
      next.push({ filename: `mk1_cave_dynamic_scene_export_fixture_${stamp()}.json`, pass: '1E.3O.38', status: caveDynamicScene.report.status, timestamp: caveDynamicScene.report.timestamp, data: caveDynamicSceneExport });
      setArtifacts([...next]); setProgress(0.9999999999);

      setStage('48/75 — Resolving STRIPPED external child 0x276B4 as BIGEMP_PROC and qualifying five-part EMP_P-backed, WORLDTLX-selected multipart state (1E.3O.39)');
      const strippedBigEmperor = await executeStrippedBigEmperorProcessQualification(source, stageBackgroundGraph, backgroundRendererProjection, backgroundDynamics, backgroundTimeAwareScene);
      ensureCurrent();
      const strippedBigEmperorExport = createMK1StrippedBigEmperorProcessQualificationExport(strippedBigEmperor);
      next.push({ filename: `mk1_stripped_big_emperor_process_qualification_${stamp()}.json`, pass: '1E.3O.39', status: strippedBigEmperor.status, timestamp: strippedBigEmperor.timestamp, data: strippedBigEmperorExport });
      setArtifacts([...next]); setProgress(0.99999999995);

      setStage('49/75 — Packaging 12 EMP_P source assets and seven composition-safe camera-selected BIGEMP multipart states without fabricating a flattened STRIPPED stage (1E.3O.40)');
      const strippedDynamicScene = await executeStrippedDynamicSceneExportFixture(source, backgroundTimeAwareScene, strippedBigEmperor);
      ensureCurrent();
      const strippedDynamicSceneExport = createMK1StrippedDynamicSceneExportFixtureExport(strippedDynamicScene);
      next.push({ filename: `mk1_stripped_dynamic_scene_export_fixture_${stamp()}.json`, pass: '1E.3O.40', status: strippedDynamicScene.report.status, timestamp: strippedDynamicScene.report.timestamp, data: strippedDynamicSceneExport });
      setArtifacts([...next]); setProgress(0.99999999997);

      setStage('50/75 — Qualifying stable special-list repair sorting, shadow-list clipping, eight-tick BAK active-set maintenance and exact cull/recreate history dependence (1E.3O.41)');
      const rendererHistoryClipping = await executeBackgroundRendererHistoryClippingQualification(source, backgroundPlacement.report, backgroundRendererProjection);
      ensureCurrent();
      const rendererHistoryClippingExport = createMK1BackgroundRendererHistoryClippingQualificationExport(rendererHistoryClipping);
      next.push({ filename: `mk1_background_renderer_history_clipping_qualification_${stamp()}.json`, pass: '1E.3O.41', status: rendererHistoryClipping.status, timestamp: rendererHistoryClipping.timestamp, data: rendererHistoryClippingExport });
      setArtifacts([...next]); setProgress(0.999999999985);

      setStage('51/75 — Composing the deterministic fresh-initial PIT ordinary BAK layer from the history-qualified first active set without importing process-created dynamics or claiming a gameplay screenshot (1E.3O.42)');
      const pitFreshInitialCompositor = await executePitFreshInitialOrdinaryCompositorFixture(source, backgroundPlacement, rendererHistoryClipping);
      ensureCurrent();
      const pitFreshInitialCompositorExport = createMK1PitFreshInitialOrdinaryCompositorFixtureExport(pitFreshInitialCompositor);
      next.push({ filename: `mk1_pit_fresh_initial_ordinary_compositor_fixture_${stamp()}.json`, pass: '1E.3O.42', status: pitFreshInitialCompositor.report.status, timestamp: pitFreshInitialCompositor.report.timestamp, data: pitFreshInitialCompositorExport });
      setArtifacts([...next]); setProgress(0.999999999992);

      setStage('52/75 — Generalizing the history-qualified fresh ordinary BAK active-set, per-plane tie order and 8→0 renderer traversal across all 24 top-level background modules (1E.3O.43)');
      const freshInitialOrdinaryCensus = await executeFreshInitialOrdinaryBakCompositorCensus(source, backgroundTimeAwareScene, rendererHistoryClipping);
      ensureCurrent();
      const freshInitialOrdinaryCensusExport = createMK1FreshInitialOrdinaryBakCompositorCensusExport(freshInitialOrdinaryCensus);
      next.push({ filename: `mk1_fresh_initial_ordinary_bak_compositor_census_${stamp()}.json`, pass: '1E.3O.43', status: freshInitialOrdinaryCensus.status, timestamp: freshInitialOrdinaryCensus.timestamp, data: freshInitialOrdinaryCensusExport });
      setArtifacts([...next]); setProgress(0.999999999996);

      setStage('53/75 — Exporting all 24 deterministic fresh-initial placement-derived ordinary BAK layers from authentic HDRS.GRA + exact palette records without importing dynamic/special-list state (1E.3O.44)');
      const multiStageFreshInitialExport = await executeMultiStageFreshInitialOrdinaryBakExport(source, freshInitialOrdinaryCensus);
      ensureCurrent();
      const multiStageFreshInitialExportReport = createMK1MultiStageFreshInitialOrdinaryBakExport(multiStageFreshInitialExport);
      next.push({ filename: `mk1_multi_stage_fresh_initial_ordinary_bak_export_${stamp()}.json`, pass: '1E.3O.44', status: multiStageFreshInitialExport.report.status, timestamp: multiStageFreshInitialExport.report.timestamp, data: multiStageFreshInitialExportReport });
      setArtifacts([...next]); setProgress(0.999999999998);

      setStage('54/75 — Joining qualified placement mutation, process-created BAK/special objects and symbolic shadow state to the exact renderer traversal under explicitly normalized compositor states (1E.3O.45)');
      const dynamicLayerCompositorContract = await executeBackgroundDynamicLayerCompositorContract(source, backgroundRendererProjection, backgroundTimeAwareScene, arenaAnimatedScene.report, pillarDynamicScene.report, pitDynamicScene.report, caveDynamicScene.report, strippedDynamicScene.report, rendererHistoryClipping, freshInitialOrdinaryCensus);
      ensureCurrent();
      const dynamicLayerCompositorContractExport = createMK1BackgroundDynamicLayerCompositorContractExport(dynamicLayerCompositorContract);
      next.push({ filename: `mk1_background_dynamic_layer_compositor_contract_${stamp()}.json`, pass: '1E.3O.45', status: dynamicLayerCompositorContract.status, timestamp: dynamicLayerCompositorContract.timestamp, data: dynamicLayerCompositorContractExport });
      setArtifacts([...next]); setProgress(0.999999999999);

      setStage('55/75 — Compositing five deterministic normalized ordinary+dynamic background fixtures without promoting RNG, shadow, process-phase or wall-clock state into canonical gameplay frames (1E.3O.46)');
      const normalizedDynamicCompositors = await executeNormalizedDynamicBackgroundCompositorFixtures(source, backgroundDynamics, arenaAnimatedScene, pillarDynamicScene, pitDynamicScene, caveDynamicScene, strippedDynamicScene, freshInitialOrdinaryCensus, multiStageFreshInitialExport, dynamicLayerCompositorContract);
      ensureCurrent();
      const normalizedDynamicCompositorsExport = createMK1NormalizedDynamicBackgroundCompositorFixtures(normalizedDynamicCompositors);
      next.push({ filename: `mk1_normalized_dynamic_background_compositor_fixtures_${stamp()}.json`, pass: '1E.3O.46', status: normalizedDynamicCompositors.report.status, timestamp: normalizedDynamicCompositors.report.timestamp, data: normalizedDynamicCompositorsExport });
      setArtifacts([...next]); setProgress(0.9999999999995);

      setStage('56/75 — Reconciling all 24 top-level background modules into explicit product export tiers without promoting sibling variants or init-created extras beyond direct evidence (1E.3O.47)');
      const stageExportCoverage = await executeStageExportCapabilityCoverageManifest(source, backgroundDynamics, backgroundTimeAwareScene, freshInitialOrdinaryCensus, multiStageFreshInitialExport.report, dynamicLayerCompositorContract, normalizedDynamicCompositors.report);
      ensureCurrent();
      const stageExportCoverageExport = createMK1StageExportCapabilityCoverageManifest(stageExportCoverage);
      next.push({ filename: `mk1_stage_export_capability_coverage_manifest_${stamp()}.json`, pass: '1E.3O.47', status: stageExportCoverage.status, timestamp: stageExportCoverage.timestamp, data: stageExportCoverageExport });
      setArtifacts([...next]); setProgress(0.9999999999998);

      setStage('57/75 — Packaging every MK1 stage with its strongest verified raster tier plus time-aware scene IR and explicit capability blockers, without manufacturing unresolved combined pixels (1E.3O.48)');
      const stageExportPackage = await executeStageExportPackageOrchestrator(source, backgroundTimeAwareScene, multiStageFreshInitialExport, normalizedDynamicCompositors, stageExportCoverage);
      ensureCurrent();
      const stageExportPackageExport = createMK1StageExportPackageOrchestrator(stageExportPackage);
      next.push({ filename: `mk1_stage_export_package_orchestrator_${stamp()}.json`, pass: '1E.3O.48', status: stageExportPackage.report.status, timestamp: stageExportPackage.report.timestamp, data: stageExportPackageExport });
      setArtifacts([...next]); setProgress(0.9999999999999);

      setStage('58/75 — Qualifying placement horizontal-orientation semantics and the shared CHOP/STATUE static init-created moon from authentic renderer/object paths (1E.3O.49)');
      const backgroundOrientationCorrection = await executeBackgroundOrientationStaticExtraQualification(source, backgroundTimeAwareScene, freshInitialOrdinaryCensus);
      ensureCurrent();
      const backgroundOrientationCorrectionExport = createMK1BackgroundOrientationStaticExtraQualificationExport(backgroundOrientationCorrection);
      next.push({ filename: `mk1_background_orientation_static_extra_qualification_${stamp()}.json`, pass: '1E.3O.49', status: backgroundOrientationCorrection.status, timestamp: backgroundOrientationCorrection.timestamp, data: backgroundOrientationCorrectionExport });
      setArtifacts([...next]); setProgress(0.99999999999995);

      setStage('59/75 — Rebuilding the product-facing stage package with renderer-qualified horizontal flips and the CHOP/STATUE static moon, while preserving unresolved-state blockers (1E.3O.50)');
      const correctedStageExportPackage = await executeCorrectedStageExportPackage(source, stageExportPackage, backgroundOrientationCorrection);
      ensureCurrent();
      const correctedStageExportPackageExport = createMK1CorrectedStageExportPackage(correctedStageExportPackage);
      next.push({ filename: `mk1_corrected_stage_export_package_${stamp()}.json`, pass: '1E.3O.50', status: correctedStageExportPackage.report.status, timestamp: correctedStageExportPackage.report.timestamp, data: correctedStageExportPackageExport });
      setArtifacts([...next]); setProgress(0.99999999999997);

      setStage('60/75 — Mechanically qualifying the five process-spawning sibling variants for direct normalized combined composition without callback-family inference alone (1E.3O.51)');
      const dynamicSiblingQualification = await executeDynamicSiblingVariantQualification(source, backgroundDynamics, backgroundTimeAwareScene);
      ensureCurrent();
      next.push({ filename: `mk1_dynamic_sibling_variant_qualification_${stamp()}.json`, pass: '1E.3O.51', status: dynamicSiblingQualification.status, timestamp: dynamicSiblingQualification.timestamp, data: createMK1DynamicSiblingVariantQualificationExport(dynamicSiblingQualification) });
      setArtifacts([...next]); setProgress(0.99999999999999);

      setStage('61/75 — Rendering the five qualified sibling combined fixtures and refreshing the corrected stage package to twelve direct combined previews (1E.3O.52)');
      const dynamicSiblingPackage = await executeDynamicSiblingCombinedPackage(source, dynamicSiblingQualification, arenaAnimatedScene, pitDynamicScene, caveDynamicScene, strippedDynamicScene, freshInitialOrdinaryCensus, multiStageFreshInitialExport, correctedStageExportPackage);
      ensureCurrent();
      next.push({ filename: `mk1_dynamic_sibling_combined_package_${stamp()}.json`, pass: '1E.3O.52', status: dynamicSiblingPackage.report.status, timestamp: dynamicSiblingPackage.report.timestamp, data: createMK1DynamicSiblingCombinedPackage(dynamicSiblingPackage) });
      setArtifacts([...next]); setProgress(0.999999999999995);

      setStage('62/75 — Proving the remaining twelve ordinary-only stage modules are complete under their literal no-op init callback (1E.3O.53)');
      const noOpStageCompleteness = await executeNoOpStageCompletenessQualification(source, backgroundDynamics, backgroundTimeAwareScene, dynamicLayerCompositorContract);
      ensureCurrent();
      next.push({ filename: `mk1_no_op_stage_completeness_qualification_${stamp()}.json`, pass: '1E.3O.53', status: noOpStageCompleteness.status, timestamp: noOpStageCompleteness.timestamp, data: createMK1NoOpStageCompletenessQualificationExport(noOpStageCompleteness) });
      setArtifacts([...next]); setProgress(0.999999999999998);

      setStage('63/75 — Promoting the twelve proven no-op modules and refreshing the product package to 24 normalized background previews (1E.3O.54)');
      const completeStagePackage = await executeCompleteStageNormalizedBackgroundPackage(source, dynamicSiblingPackage, noOpStageCompleteness);
      ensureCurrent();
      next.push({ filename: `mk1_complete_stage_normalized_background_package_${stamp()}.json`, pass: '1E.3O.54', status: completeStagePackage.report.status, timestamp: completeStagePackage.report.timestamp, data: createMK1CompleteStageNormalizedBackgroundPackage(completeStagePackage) });
      setArtifacts([...next]); setProgress(0.999999999999999);

      setStage('64/75 — Building browser-downloadable complete stage ZIP directly from the verified O54 payload/document graph (1E.3O.55)');
      const browserBundle = await executeBrowserStageExportBundle(completeStagePackage, dynamicSiblingPackage.report, noOpStageCompleteness);
      ensureCurrent(); setBrowserStageBundle(browserBundle);
      next.push({ filename: `mk1_browser_stage_export_bundle_${stamp()}.json`, pass: '1E.3O.55', status: browserBundle.report.status, timestamp: browserBundle.report.timestamp, data: createMK1BrowserStageExportBundleExport(browserBundle) });
      setArtifacts([...next]); setProgress(0.9999999999999995);

      setStage('65/75 — Independently parsing the browser ZIP and validating all pixels/documents against the canonical O54 package contract (1E.3O.56)');
      const browserBundleValidation = await executeBrowserStageExportBundleValidation(browserBundle, completeStagePackage, dynamicSiblingPackage.report, noOpStageCompleteness);
      ensureCurrent();
      next.push({ filename: `mk1_browser_stage_export_bundle_validation_${stamp()}.json`, pass: '1E.3O.56', status: browserBundleValidation.status, timestamp: browserBundleValidation.timestamp, data: createMK1BrowserStageExportBundleValidationExport(browserBundleValidation) });
      setArtifacts([...next]); setProgress(0.9999999999999997);

      setStage('66/75 — Building data-driven research results workspace and complete 24-stage visual gallery without replacing specialist editors (1E.3O.57)');
      const resultsWorkspace = await executeResearchResultsWorkspace(next, completeStagePackage);
      ensureCurrent(); setResearchWorkspace(resultsWorkspace);
      next.push({ filename: `mk1_research_results_workspace_${stamp()}.json`, pass: '1E.3O.57', status: resultsWorkspace.report.status, timestamp: resultsWorkspace.report.timestamp, data: createMK1ResearchResultsWorkspaceExport(resultsWorkspace) });
      setArtifacts([...next]); setProgress(0.9999999999999999);

      setStage('67/75 — Independently validating UI coverage, stage preview completeness and future-pass data-driven registration (1E.3O.58)');
      const resultsWorkspaceValidation = await executeResearchResultsWorkspaceValidation(resultsWorkspace, next);
      ensureCurrent();
      next.push({ filename: `mk1_research_results_workspace_validation_${stamp()}.json`, pass: '1E.3O.58', status: resultsWorkspaceValidation.status, timestamp: resultsWorkspaceValidation.timestamp, data: createMK1ResearchResultsWorkspaceValidationExport(resultsWorkspaceValidation) });
      setArtifacts([...next]);

      setStage('68/75 — Building evidence-tiered MK1 animation export capability/coverage manifest without guessing palette bindings or timing (1E.3O.59)');
      const animationExportCoverage = executeAnimationExportCapabilityCoverageManifest(
        animationResourceDecode,
        animationExportManifest,
        paletteBoundFixtures.report,
        characterPaletteVariants.report,
        paletteBindingExceptions,
        streamControlTiming,
      );
      ensureCurrent();
      next.push({ filename: `mk1_animation_export_capability_coverage_manifest_${stamp()}.json`, pass: '1E.3O.59', status: animationExportCoverage.status, timestamp: animationExportCoverage.timestamp, data: createMK1AnimationExportCapabilityCoverageManifestExport(animationExportCoverage) });
      setArtifacts([...next]);

      setStage('69/75 — Building browser-downloadable MK1 animation package with indexed unresolved descriptors and bound RGBA tiers (1E.3O.60)');
      const animationBundle = await executeBrowserAnimationExportBundle(
        source,
        animationExportCoverage,
        animationResourceDecode,
        animationExportManifest,
        paletteBoundFixtures.report,
        characterPaletteVariants.report,
        paletteBindingExceptions,
        streamControlTiming,
        transfer,
      );
      ensureCurrent(); setBrowserAnimationBundle(animationBundle);
      next.push({ filename: `mk1_browser_animation_export_bundle_${stamp()}.json`, pass: '1E.3O.60', status: animationBundle.report.status, timestamp: animationBundle.report.timestamp, data: createMK1BrowserAnimationExportBundleExport(animationBundle) });
      setArtifacts([...next]);

      setStage('70/75 — Independently validating browser animation ZIP pixels, indexed payloads and unresolved-palette exclusion inside the app (1E.3O.61)');
      const animationBundleValidation = await executeBrowserAnimationExportBundleValidation(
        animationBundle, animationResourceDecode, paletteBoundFixtures.report, characterPaletteVariants.report, paletteBindingExceptions, animationExportCoverage,
      );
      ensureCurrent();
      next.push({ filename: `mk1_browser_animation_export_bundle_validation_${stamp()}.json`, pass: '1E.3O.61', status: animationBundleValidation.status, timestamp: animationBundleValidation.timestamp, data: createMK1BrowserAnimationExportBundleValidationExport(animationBundleValidation) });
      setArtifacts([...next]);

      setStage('71/75 — Building visual Animation Assets workspace with context-qualified RGBA, verified effects and indexed-only unresolved previews (1E.3O.62)');
      const animationAssetsWorkspace = await executeAnimationAssetsWorkspace(animationBundle, animationBundleValidation, paletteBindingExceptions);
      ensureCurrent(); setAnimationWorkspace(animationAssetsWorkspace);
      next.push({ filename: `mk1_animation_assets_workspace_${stamp()}.json`, pass: '1E.3O.62', status: animationAssetsWorkspace.report.status, timestamp: animationAssetsWorkspace.report.timestamp, data: createMK1AnimationAssetsWorkspaceExport(animationAssetsWorkspace) });
      setArtifacts([...next]);

      setStage('72/75 — Censusing authentic MK1 WAV resources, fixed sound-code records, playback policy and bounded digital/MIDI relationships without inventing event names (1E.3O.63)');
      const audioMusicResourceGraph = await executeAudioMusicResourceGraphCensus(source);
      ensureCurrent();
      next.push({ filename: `mk1_audio_music_resource_graph_census_${stamp()}.json`, pass: '1E.3O.63', status: audioMusicResourceGraph.status, timestamp: audioMusicResourceGraph.timestamp, data: createMK1AudioMusicResourceGraphCensusExport(audioMusicResourceGraph) });
      setArtifacts([...next]);

      setStage('73/75 — Building, independently validating and presenting the byte-exact MK1 audio package while preserving SAMPLES.DAT/MIDI/name uncertainty (1E.3O.64)');
      const audioBundle = await executeBrowserAudioExportBundle(source, audioMusicResourceGraph);
      ensureCurrent(); setBrowserAudioBundle(audioBundle);
      next.push({ filename: `mk1_browser_audio_export_bundle_${stamp()}.json`, pass: '1E.3O.64', status: audioBundle.report.status, timestamp: audioBundle.report.timestamp, data: createMK1BrowserAudioExportBundleExport(audioBundle) });
      setArtifacts([...next]);
      const audioBundleValidation = await executeBrowserAudioExportBundleValidation(source, audioBundle, audioMusicResourceGraph);
      ensureCurrent();
      next.push({ filename: `mk1_browser_audio_export_bundle_validation_${stamp()}.json`, pass: '1E.3O.64', status: audioBundleValidation.status, timestamp: audioBundleValidation.timestamp, data: createMK1BrowserAudioExportBundleValidationExport(audioBundleValidation) });
      setArtifacts([...next]);
      const audioAssetsWorkspace = await executeAudioAssetsWorkspace(audioBundle, audioBundleValidation, audioMusicResourceGraph);
      ensureCurrent(); setAudioWorkspace(audioAssetsWorkspace);
      next.push({ filename: `mk1_audio_assets_workspace_${stamp()}.json`, pass: '1E.3O.64', status: audioAssetsWorkspace.report.status, timestamp: audioAssetsWorkspace.report.timestamp, data: createMK1AudioAssetsWorkspaceExport(audioAssetsWorkspace) });
      setArtifacts([...next]);

      setStage('74/75 — Integrating stage, animation and audio product contracts into one evidence-tiered capability/provenance index without semantic promotion (1E.3O.65)');
      const crossDomainIndex = await executeCrossDomainExportCapabilityProvenanceIndex(browserBundle, browserBundleValidation, animationBundle, animationBundleValidation, audioBundle, audioBundleValidation);
      ensureCurrent();
      next.push({ filename: `mk1_cross_domain_export_capability_provenance_index_${stamp()}.json`, pass: '1E.3O.65', status: crossDomainIndex.status, timestamp: crossDomainIndex.timestamp, data: createMK1CrossDomainExportCapabilityProvenanceIndexExport(crossDomainIndex) });
      setArtifacts([...next]);

      setStage('75/75 — Building and independently validating one unified browser MK1 asset archive that nests the exact current stage, animation and audio packages (1E.3O.66)');
      const unifiedArchive = await executeUnifiedMk1AssetArchive(crossDomainIndex, browserBundle, animationBundle, audioBundle);
      ensureCurrent(); setUnifiedAssetArchive(unifiedArchive);
      next.push({ filename: `mk1_unified_browser_asset_archive_${stamp()}.json`, pass: '1E.3O.66', status: unifiedArchive.report.status, timestamp: unifiedArchive.report.timestamp, data: createMK1UnifiedAssetArchiveExport(unifiedArchive) });
      setArtifacts([...next]);
      const unifiedArchiveValidation = await executeUnifiedMk1AssetArchiveValidation(unifiedArchive, crossDomainIndex, browserBundle, animationBundle, audioBundle);
      ensureCurrent();
      next.push({ filename: `mk1_unified_browser_asset_archive_validation_${stamp()}.json`, pass: '1E.3O.66', status: unifiedArchiveValidation.status, timestamp: unifiedArchiveValidation.timestamp, data: createMK1UnifiedAssetArchiveValidationExport(unifiedArchiveValidation) });
      setArtifacts(next); setStage('Up to date — O65 + O66 integration block verified; two-pass pause checkpoint reached'); setProgress(1);
    } catch (e: unknown) {
      if (!current()) return;
      setError(e instanceof Error ? e.message : String(e));
      setStage('Stopped — prerequisite or research validation failed');
    } finally { if (current()) setIsRunning(false); }
  };

  const downloadStagePackage = () => {
    if (!browserStageBundle || isRunning) return;
    try { downloadMK1BrowserStageExportBundle(browserStageBundle); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const downloadAnimationPackage = () => {
    if (!browserAnimationBundle || isRunning) return;
    try { downloadMK1BrowserAnimationExportBundle(browserAnimationBundle); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const downloadAudioPackage = () => {
    if (!browserAudioBundle || isRunning) return;
    try { downloadMK1BrowserAudioExportBundle(browserAudioBundle); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const downloadUnifiedPackage = () => {
    if (!unifiedAssetArchive || isRunning) return;
    try { downloadMK1UnifiedAssetArchive(unifiedAssetArchive); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const downloadTest = async () => {
    if (!editResult || isRunning || isExporting) return;
    setIsExporting(true); setError(null);
    try {
      const zip = await buildKanoTestBundle(editResult);
      if (sourceRef.current !== source) return;
      const url = URL.createObjectURL(new Blob([new Uint8Array(zip).buffer], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'mk1-kano-magenta-test-1E3I.zip';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { if (sourceRef.current === source) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (sourceRef.current === source) setIsExporting(false); }
  };

  return (
    <div className="mb-5 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={run} disabled={isRunning || isExporting || detection.game !== 'mk1' || source.isSynthetic} className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 ${isRunning ? 'bg-zinc-800 text-zinc-500' : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'}`}>
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}Run canonical MK1 research
        </button>
        <button onClick={() => latest && downloadResearchArtifact(latest)} disabled={!latest || isRunning} className="px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:text-zinc-600 text-cyan-300 border border-zinc-700"><Download className="w-4 h-4" />Export Latest</button>
        <button onClick={() => downloadResearchArtifactsZip(artifacts, 'mkdos_research_exports')} disabled={artifacts.length === 0 || isRunning} className="px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:text-zinc-600 text-emerald-300 border border-zinc-700"><FileArchive className="w-4 h-4" />Export All</button>
        <button onClick={downloadStagePackage} disabled={!browserStageBundle || isRunning} className="px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-cyan-900/60 hover:bg-cyan-800/70 disabled:text-zinc-600 text-cyan-200 border border-cyan-800"><FileArchive className="w-4 h-4" />Download Stage Package</button>
        <button onClick={downloadAnimationPackage} disabled={!browserAnimationBundle || isRunning} className="px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-violet-900/60 hover:bg-violet-800/70 disabled:text-zinc-600 text-violet-200 border border-violet-800"><FileArchive className="w-4 h-4" />Download Animation Package</button>
        <button onClick={downloadAudioPackage} disabled={!browserAudioBundle || isRunning} className="px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-fuchsia-900/60 hover:bg-fuchsia-800/70 disabled:text-zinc-600 text-fuchsia-200 border border-fuchsia-800"><FileArchive className="w-4 h-4" />Download Audio Package</button>
        <button onClick={downloadUnifiedPackage} disabled={!unifiedAssetArchive || isRunning} className="px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-emerald-900/60 hover:bg-emerald-800/70 disabled:text-zinc-600 text-emerald-200 border border-emerald-800"><FileArchive className="w-4 h-4" />Download Unified MK1 Archive</button>
        <div className="ml-auto min-w-[260px] text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5"><ShieldCheck className={`w-3.5 h-3.5 ${provenance ? 'text-emerald-400' : 'text-zinc-600'}`} /><span>{provenance ? describeResearchProvenance(provenance) || 'Source provenance unavailable' : `${source.directoryName} · fixture identity pending run`}</span></div>
          <div className="mt-1">{stage}</div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-zinc-400">This is the strict historical MK1 investigation pipeline. For a browseable, failure-isolated catalogue, use Laboratory → Compile &amp; hypotheses → Compile All Knowns.</p>
      {(isRunning || progress > 0) && <div className="mt-2 h-1.5 bg-zinc-800 rounded overflow-hidden"><div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
      {error && <div className="mt-2 text-xs font-mono text-red-300 bg-red-950/30 border border-red-900 rounded p-2">{error}</div>}
      {researchWorkspace && !isRunning && <ResearchResultsWorkspace artifacts={artifacts} workspace={researchWorkspace} animationWorkspace={animationWorkspace} audioWorkspace={audioWorkspace} isRunning={isRunning} />}
      {editResult && <div className="mt-3 p-3 rounded border border-amber-800 text-xs font-mono text-zinc-300">
        <div className="font-semibold text-amber-300">Controlled Kano edit · 1E.3I · Static checks passed; in-game test pending</div>
        <div className="mt-1">{editResult.report.evidence.editedWordCount} normal-palette colors → magenta · {editResult.report.evidence.changedByteCount} changed bytes · reversal restores the original hash</div>
        <div className="mt-1 text-zinc-400">Use the bundled MK1.EXE in a separate copy of your installation. Test Kano against a different fighter and capture the result.</div>
        <button onClick={downloadTest} disabled={isRunning || isExporting} className="mt-3 px-3 py-2 rounded bg-fuchsia-800 hover:bg-fuchsia-700 disabled:opacity-50 text-white">{isExporting ? 'Checking bundle…' : 'Download Kano Test Bundle'}</button>
      </div>}
      {roundTrip && !isRunning && <KanoPaletteEditor key={`kano-${roundTrip.operationId}`} source={source} baseline={roundTrip}
        onExport={artifact => setArtifacts(previous => [...previous.filter(item => item.pass !== artifact.pass), artifact])} />}
      {roundTrip && ownership && !isRunning && <MainRosterPaletteEditor key={`roster-${roundTrip.operationId}-${ownership.operationId}`} source={source} baseline={roundTrip} ownership={ownership}
        onExport={artifact => setArtifacts(previous => [...previous.filter(item => item.pass !== artifact.pass || item.filename.startsWith('mk1_fighter_palette_ownership_')), artifact])} />}
      {roundTrip && opponentAccess && !isRunning && <OpponentAccessHarness key={`opponent-access-${roundTrip.operationId}-${opponentAccess.operationId}`} source={source} baseline={roundTrip} qualification={opponentAccess}
        onExport={artifact => setArtifacts(previous => [...previous, artifact])} />}
      {ladderGrammar && ownership && !isRunning && <LadderGrammarHarness key={`ladder-grammar-${ladderGrammar.operationId}-${ownership.operationId}`} source={source} qualification={ladderGrammar} ownership={ownership}
        onExport={artifact => setArtifacts(previous => [...previous, artifact])} />}
      {shangMorph && !isRunning && <ShangMorphSelectionPanel key={`shang-morph-${shangMorph.operationId}`} report={shangMorph} />}
      {animationGroundTruth && !isRunning && <AnimationStreamGroundTruthPanel key={`animation-ground-truth-${animationGroundTruth.operationId}`} report={animationGroundTruth} />}
      {multiPartIr && !isRunning && <MultiPartFrameLosslessIrPanel key={`multi-part-ir-${multiPartIr.operationId}`} report={multiPartIr} />}
      {multiPartIr && multiPartEdit && !isRunning && <MultiPartControlledEditPanel key={`multi-part-edit-${multiPartEdit.report.operationId}`} baseline={multiPartIr} result={multiPartEdit} />}
      {multiPartCanvasEditor && !isRunning && <MultiPartCompositionCanvasEditor key={`multi-part-canvas-${multiPartCanvasEditor.operationId}`} source={source} model={multiPartCanvasEditor}
        onExport={artifact => setArtifacts(previous => [...previous, artifact])} />}
      {heartRipAnimationEditor && !isRunning && <HeartRipAnimationCanvasEditor key={`heart-rip-animation-${heartRipAnimationEditor.operationId}`} source={source} model={heartRipAnimationEditor}
        onExport={artifact => setArtifacts(previous => [...previous, artifact])} />}
      {heartRipRelocationCensus && !isRunning && <HeartRipRelocationCensusPanel key={`heart-rip-relocation-${heartRipRelocationCensus.operationId}`} report={heartRipRelocationCensus} />}
      {reshapeFullCapacity && !isRunning && <ReshapeMultiFullCapacitySemanticsPanel key={`reshape-full-capacity-${reshapeFullCapacity.operationId}`} report={reshapeFullCapacity} />}
      {heartRipFourthPart && !isRunning && <HeartRipFourthPartTopologyPanel key={`heart-rip-fourth-part-${heartRipFourthPart.report.operationId}`} source={source} result={heartRipFourthPart} />}
      {heartRipFixedTopology && !isRunning && <HeartRipFixedCapacityTopologyEditor key={`heart-rip-fixed-topology-${heartRipFixedTopology.operationId}`} source={source} model={heartRipFixedTopology} onExport={artifact => setArtifacts(previous => [...previous, artifact])} />}
      {heartRipAtomicComposition && !isRunning && <HeartRipAtomicCompositionEditor key={`heart-rip-atomic-composition-${heartRipAtomicComposition.operationId}`} source={source} model={heartRipAtomicComposition} onExport={artifact => setArtifacts(previous => [...previous, artifact])} />}
      {heartRipFullComposition && !isRunning && <HeartRipFullFixedLayoutCompositionEditor key={`heart-rip-full-composition-${heartRipFullComposition.operationId}`} source={source} model={heartRipFullComposition} onExport={artifact => setArtifacts(previous => [...previous, artifact])} />}
      {raydenLightning && !isRunning && <RaydenLightningPlacementPanel key={`rayden-lightning-${raydenLightning.report.operationId}`} result={raydenLightning} />}
      {raydenCanvasEditor && !isRunning && <RaydenLightningCanvasEditor key={`rayden-canvas-${raydenCanvasEditor.operationId}`} source={source} model={raydenCanvasEditor}
        onExport={artifact => setArtifacts(previous => [...previous, artifact])} />}
      {roundTrip && ownership && !isRunning && <BossPaletteEditor key={`boss-palettes-${roundTrip.operationId}-${ownership.operationId}`} source={source} baseline={roundTrip} ownership={ownership}
        onExport={artifact => setArtifacts(previous => [...previous.filter(item => item.pass !== artifact.pass), artifact])} />}
      {ownership && <div className="mt-3 p-3 rounded border border-emerald-900 text-xs font-mono text-zinc-300">
        <div className="font-semibold text-emerald-300">Fighter palette ownership scaffold · 1E.3L · {ownership.status === 'SUCCESS' ? 'Static qualification passed' : 'Partial'}</div>
        <div className="mt-1">{ownership.slots.length} NORMAL/ALTERNATE slots · {ownership.decision.rosterNameAlignmentCount} roster-name alignments · P*_CHAR → object +0x{ownership.characterIdentityField.fieldOffset.toString(16).toUpperCase()} → palette-table index {ownership.decision.paletteTableIndexIsCharacterIdentity ? 'established' : 'not established'}</div>
        <div className="mt-1 text-zinc-400">The selectable-roster mechanism is now runtime-repeated across multiple slots. Pass 1E.3N.1 adds the data-only opponent access harness; 1E.3N.2 qualifies the ladder grammar; 1E.3N.3 runtime-qualifies Shang Tsung's shared YANG_P / EMP_P base palette; 1E.3N.4 qualifies the morph asset and palette-selection path.</div>
      </div>}
      {roundTrip && <div className="mt-3 p-3 rounded border border-zinc-700 text-xs font-mono text-zinc-300">
        <div className="font-semibold text-emerald-300">Palette round trip · 1E.3H · {roundTrip.status === 'SUCCESS' ? 'Validation passed' : 'Validation failed'}</div>
        <div className="mt-1">{roundTrip.comparison.recordsMatching}/{roundTrip.comparison.recordsCompared} records matched · {roundTrip.module.byteLength.toLocaleString()} palette bytes · {roundTrip.comparison.wholeExecutable.mismatchCount} changed executable bytes</div>
        <div className="mt-1 text-zinc-400">The no-edit reconstruction was checked in memory. Export All includes its evidence and palette IR.</div>
      </div>}
    </div>
  );
}
