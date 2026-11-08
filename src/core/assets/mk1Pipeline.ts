// Export-only orchestration of the existing validated MK1 evidence chain.
import { DirectorySource } from '../filesystem/DirectorySource';
import { executeWatcomDataImagePaletteGroundTruth } from '../../games/mk1/research/watcomDataImagePaletteGroundTruth';
import { executeKanoPaletteSelectionReferenceGraph } from '../../games/mk1/research/kanoPaletteSelectionReferenceGraph';
import { executeKanoPaletteSelectionSemantics } from '../../games/mk1/research/kanoPaletteSelectionSemantics';
import { executePaletteSetupTransferSemantics } from '../../games/mk1/research/paletteSetupTransferSemantics';
import { executePaletteRoundTrip } from '../../games/mk1/research/paletteRoundTrip';
import { executeFighterPaletteOwnershipQualification } from '../../games/mk1/research/fighterPaletteOwnership';
import { executeOpponentAccessHarnessQualification } from '../../games/mk1/research/opponentAccessHarness';
import { executeShangMorphSelectionQualification } from '../../games/mk1/research/shangMorphSelection';
import { executeAnimationStreamGroundTruth } from '../../games/mk1/research/animationStreamGroundTruth';
import { executeMultiPartFrameLosslessIr } from '../../games/mk1/research/multiPartFrameLosslessIr';
import { executeRaydenLightningPlacementFixture } from '../../games/mk1/research/raydenLightningPlacementFixture';
import { executeFighterAnimationTableComparison } from '../../games/mk1/research/fighterAnimationTableComparison';
import { executeAnimationResourceDecodeCensus } from '../../games/mk1/research/animationResourceDecodeCensus';
import { executeCharacterAnimationTableSelector } from '../../games/mk1/research/characterAnimationTableSelector';
import { executeAnimationPaletteContextBridge } from '../../games/mk1/research/animationPaletteContextBridge';
import { executeGetCharAniConsumerCensus } from '../../games/mk1/research/getCharAniConsumerCensus';
import { executeCharacterAnimationExportManifest } from '../../games/mk1/research/characterAnimationExportManifest';
import { executeVerifiedPaletteBoundExportFixtures } from '../../games/mk1/research/verifiedPaletteBoundExportFixtures';
import { executeCharacterPaletteContextVariantRenderer } from '../../games/mk1/research/characterPaletteContextVariantRenderer';
import { executePaletteBindingExceptionCensus } from '../../games/mk1/research/paletteBindingExceptionCensus';
import { executeAnimationStreamControlTimingCensus } from '../../games/mk1/research/animationStreamControlTimingCensus';
import { executeStageBackgroundResourceGraphCensus } from '../../games/mk1/research/stageBackgroundResourceGraphCensus';
import { executeBackgroundPlacementCompositionQualification } from '../../games/mk1/research/backgroundPlacementCompositionQualification';
import { executeBackgroundRendererProjectionQualification } from '../../games/mk1/research/backgroundRendererProjectionQualification';
import { executeBackgroundDynamicProcessAnimationCensus } from '../../games/mk1/research/backgroundDynamicProcessAnimationCensus';
import { executeBackgroundTimeAwareSceneIr } from '../../games/mk1/research/backgroundTimeAwareSceneIr';
import { executeArenaAnimatedSceneExportFixture } from '../../games/mk1/research/arenaAnimatedSceneExportFixture';
import { executePillarCloudMotionResetQualification } from '../../games/mk1/research/pillarCloudMotionResetQualification';
import { executePillarDynamicSceneExportFixture } from '../../games/mk1/research/pillarDynamicSceneExportFixture';
import { executePitDynamicMotionShadowQualification } from '../../games/mk1/research/pitDynamicMotionShadowQualification';
import { executePitDynamicSceneExportFixture } from '../../games/mk1/research/pitDynamicSceneExportFixture';
import { executeCaveSpecialObjectPhaseQualification } from '../../games/mk1/research/caveSpecialObjectPhaseQualification';
import { executeCaveDynamicSceneExportFixture } from '../../games/mk1/research/caveDynamicSceneExportFixture';
import { executeStrippedBigEmperorProcessQualification } from '../../games/mk1/research/strippedBigEmperorProcessQualification';
import { executeStrippedDynamicSceneExportFixture } from '../../games/mk1/research/strippedDynamicSceneExportFixture';
import { executeBackgroundRendererHistoryClippingQualification } from '../../games/mk1/research/backgroundRendererHistoryClippingQualification';
import { executeFreshInitialOrdinaryBakCompositorCensus } from '../../games/mk1/research/freshInitialOrdinaryBakCompositorCensus';
import { executeMultiStageFreshInitialOrdinaryBakExport } from '../../games/mk1/research/multiStageFreshInitialOrdinaryBakExport';
import { executeBackgroundDynamicLayerCompositorContract } from '../../games/mk1/research/backgroundDynamicLayerCompositorContract';
import { executeNormalizedDynamicBackgroundCompositorFixtures } from '../../games/mk1/research/normalizedDynamicBackgroundCompositorFixtures';
import { executeStageExportCapabilityCoverageManifest } from '../../games/mk1/research/stageExportCapabilityCoverageManifest';
import { executeStageExportPackageOrchestrator } from '../../games/mk1/research/stageExportPackageOrchestrator';
import { executeBackgroundOrientationStaticExtraQualification } from '../../games/mk1/research/backgroundOrientationStaticExtraQualification';
import { executeCorrectedStageExportPackage } from '../../games/mk1/research/correctedStageExportPackage';
import { executeDynamicSiblingVariantQualification } from '../../games/mk1/research/dynamicSiblingVariantQualification';
import { executeDynamicSiblingCombinedPackage } from '../../games/mk1/research/dynamicSiblingCombinedPackage';
import { executeNoOpStageCompletenessQualification } from '../../games/mk1/research/noOpStageCompletenessQualification';
import { executeCompleteStageNormalizedBackgroundPackage } from '../../games/mk1/research/completeStageNormalizedBackgroundPackage';
import { executeBrowserStageExportBundle } from '../../games/mk1/research/browserStageExportBundle';
import { executeBrowserStageExportBundleValidation } from '../../games/mk1/research/browserStageExportBundleValidation';
import { executeAnimationExportCapabilityCoverageManifest } from '../../games/mk1/research/animationExportCapabilityCoverageManifest';
import { executeBrowserAnimationExportBundle } from '../../games/mk1/research/browserAnimationExportBundle';
import { executeBrowserAnimationExportBundleValidation } from '../../games/mk1/research/browserAnimationExportBundleValidation';
import { executeAnimationAssetsWorkspace } from '../../games/mk1/research/animationAssetsWorkspace';
import { executeAudioMusicResourceGraphCensus } from '../../games/mk1/research/audioMusicResourceGraphCensus';
import { executeBrowserAudioExportBundle } from '../../games/mk1/research/browserAudioExportBundle';
import { executeBrowserAudioExportBundleValidation } from '../../games/mk1/research/browserAudioExportBundleValidation';
export async function runMK1Pipeline(source: DirectorySource, progress: (message:string)=>void = ()=>{}, signal?: AbortSignal) {
  signal?.throwIfAborted(); progress('gt');
  const gt = await executeWatcomDataImagePaletteGroundTruth(source);
  signal?.throwIfAborted(); progress('graph');
  const graph = await executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt });
  signal?.throwIfAborted(); progress('semantics');
  const semantics = await executeKanoPaletteSelectionSemantics(source, {
    referenceGraphReport: graph
});
  signal?.throwIfAborted(); progress('transfer');
  const transfer = await executePaletteSetupTransferSemantics(source, {
    selectionSemanticsReport: semantics
});
  signal?.throwIfAborted(); progress('rebuilt');
  const rebuilt = await executePaletteRoundTrip(source, {
    groundTruthReport: gt, transferReport: transfer
});
  signal?.throwIfAborted(); progress('ownershipReport');
  const ownershipReport = await executeFighterPaletteOwnershipQualification(source, {
    referenceGraphReport: graph,
    selectionSemanticsReport: semantics,
    roundTripReport: rebuilt
});
  signal?.throwIfAborted(); progress('accessReport');
  const accessReport = await executeOpponentAccessHarnessQualification(source, {
    selectionSemanticsReport: semantics,
    roundTripReport: rebuilt
});
  signal?.throwIfAborted(); progress('morphReport');
  const morphReport = await executeShangMorphSelectionQualification(source, {
    ownershipReport,
    opponentAccessReport: accessReport
});
  signal?.throwIfAborted(); progress('animationReport');
  const animationReport = await executeAnimationStreamGroundTruth(source, { shangMorphReport: morphReport });
  signal?.throwIfAborted(); progress('multiReport');
  const multiReport = await executeMultiPartFrameLosslessIr(source, { animationReport });
  signal?.throwIfAborted(); progress('raydenResult');
  const raydenResult = await executeRaydenLightningPlacementFixture(source, multiReport);
  signal?.throwIfAborted(); progress('fighterAnimationComparison');
  const fighterAnimationComparison = await executeFighterAnimationTableComparison(source);
  signal?.throwIfAborted(); progress('animationResourceDecode');
  const animationResourceDecode = await executeAnimationResourceDecodeCensus(source, fighterAnimationComparison);
  signal?.throwIfAborted(); progress('characterAnimationSelector');
  const characterAnimationSelector = await executeCharacterAnimationTableSelector(source, fighterAnimationComparison, ownershipReport, accessReport);
  signal?.throwIfAborted(); progress('animationPaletteContext');
  const animationPaletteContext = executeAnimationPaletteContextBridge(characterAnimationSelector, ownershipReport, semantics);
  signal?.throwIfAborted(); progress('getCharAniConsumers');
  const getCharAniConsumers = await executeGetCharAniConsumerCensus(source, fighterAnimationComparison, characterAnimationSelector);
  signal?.throwIfAborted(); progress('animationExportManifest');
  const animationExportManifest = executeCharacterAnimationExportManifest(fighterAnimationComparison, animationResourceDecode, characterAnimationSelector, animationPaletteContext, getCharAniConsumers);
  signal?.throwIfAborted(); progress('paletteBoundFixtures');
  const paletteBoundFixtures = await executeVerifiedPaletteBoundExportFixtures(source, multiReport, raydenResult.report);
  signal?.throwIfAborted(); progress('characterPaletteVariants');
  const characterPaletteVariants = await executeCharacterPaletteContextVariantRenderer(source, animationResourceDecode, animationPaletteContext, transfer);
  signal?.throwIfAborted(); progress('paletteBindingExceptions');
  const paletteBindingExceptions = await executePaletteBindingExceptionCensus(source, animationResourceDecode, animationExportManifest, paletteBoundFixtures.report, characterPaletteVariants.report);
  signal?.throwIfAborted(); progress('streamControlTiming');
  const streamControlTiming = await executeAnimationStreamControlTimingCensus(source, fighterAnimationComparison);
  signal?.throwIfAborted(); progress('stageBackgroundGraph');
  const stageBackgroundGraph = await executeStageBackgroundResourceGraphCensus(source);
  signal?.throwIfAborted(); progress('backgroundPlacement');
  const backgroundPlacement = await executeBackgroundPlacementCompositionQualification(source, stageBackgroundGraph);
  signal?.throwIfAborted(); progress('backgroundRendererProjection');
  const backgroundRendererProjection = await executeBackgroundRendererProjectionQualification(source, stageBackgroundGraph, backgroundPlacement.report);
  signal?.throwIfAborted(); progress('backgroundDynamics');
  const backgroundDynamics = await executeBackgroundDynamicProcessAnimationCensus(source, stageBackgroundGraph, backgroundRendererProjection);
  signal?.throwIfAborted(); progress('backgroundTimeAwareScene');
  const backgroundTimeAwareScene = await executeBackgroundTimeAwareSceneIr(source, stageBackgroundGraph, backgroundPlacement.report, backgroundRendererProjection, backgroundDynamics);
  signal?.throwIfAborted(); progress('arenaAnimatedScene');
  const arenaAnimatedScene = await executeArenaAnimatedSceneExportFixture(source, stageBackgroundGraph, backgroundDynamics, backgroundTimeAwareScene);
  signal?.throwIfAborted(); progress('pillarCloudMotion');
  const pillarCloudMotion = await executePillarCloudMotionResetQualification(source, stageBackgroundGraph, backgroundDynamics, backgroundTimeAwareScene);
  signal?.throwIfAborted(); progress('pillarDynamicScene');
  const pillarDynamicScene = await executePillarDynamicSceneExportFixture(source, stageBackgroundGraph, backgroundDynamics, backgroundTimeAwareScene, pillarCloudMotion);
  signal?.throwIfAborted(); progress('pitDynamicMotion');
  const pitDynamicMotion = await executePitDynamicMotionShadowQualification(source, stageBackgroundGraph, backgroundPlacement.report, backgroundRendererProjection, backgroundDynamics, backgroundTimeAwareScene);
  signal?.throwIfAborted(); progress('pitDynamicScene');
  const pitDynamicScene = await executePitDynamicSceneExportFixture(source, stageBackgroundGraph, backgroundPlacement, backgroundRendererProjection, backgroundTimeAwareScene, pitDynamicMotion);
  signal?.throwIfAborted(); progress('caveSpecialObjects');
  const caveSpecialObjects = await executeCaveSpecialObjectPhaseQualification(source, stageBackgroundGraph, backgroundRendererProjection, backgroundDynamics, backgroundTimeAwareScene);
  signal?.throwIfAborted(); progress('caveDynamicScene');
  const caveDynamicScene = await executeCaveDynamicSceneExportFixture(source, backgroundTimeAwareScene, caveSpecialObjects);
  signal?.throwIfAborted(); progress('strippedBigEmperor');
  const strippedBigEmperor = await executeStrippedBigEmperorProcessQualification(source, stageBackgroundGraph, backgroundRendererProjection, backgroundDynamics, backgroundTimeAwareScene);
  signal?.throwIfAborted(); progress('strippedDynamicScene');
  const strippedDynamicScene = await executeStrippedDynamicSceneExportFixture(source, backgroundTimeAwareScene, strippedBigEmperor);
  signal?.throwIfAborted(); progress('rendererHistoryClipping');
  const rendererHistoryClipping = await executeBackgroundRendererHistoryClippingQualification(source, backgroundPlacement.report, backgroundRendererProjection);
  signal?.throwIfAborted(); progress('freshInitialOrdinaryCensus');
  const freshInitialOrdinaryCensus = await executeFreshInitialOrdinaryBakCompositorCensus(source, backgroundTimeAwareScene, rendererHistoryClipping);
  signal?.throwIfAborted(); progress('multiStageFreshInitialExport');
  const multiStageFreshInitialExport = await executeMultiStageFreshInitialOrdinaryBakExport(source, freshInitialOrdinaryCensus);
  signal?.throwIfAborted(); progress('dynamicLayerCompositorContract');
  const dynamicLayerCompositorContract = await executeBackgroundDynamicLayerCompositorContract(source, backgroundRendererProjection, backgroundTimeAwareScene, arenaAnimatedScene.report, pillarDynamicScene.report, pitDynamicScene.report, caveDynamicScene.report, strippedDynamicScene.report, rendererHistoryClipping, freshInitialOrdinaryCensus);
  signal?.throwIfAborted(); progress('normalizedDynamicCompositors');
  const normalizedDynamicCompositors = await executeNormalizedDynamicBackgroundCompositorFixtures(source, backgroundDynamics, arenaAnimatedScene, pillarDynamicScene, pitDynamicScene, caveDynamicScene, strippedDynamicScene, freshInitialOrdinaryCensus, multiStageFreshInitialExport, dynamicLayerCompositorContract);
  signal?.throwIfAborted(); progress('stageExportCoverage');
  const stageExportCoverage = await executeStageExportCapabilityCoverageManifest(source, backgroundDynamics, backgroundTimeAwareScene, freshInitialOrdinaryCensus, multiStageFreshInitialExport.report, dynamicLayerCompositorContract, normalizedDynamicCompositors.report);
  signal?.throwIfAborted(); progress('stageExportPackage');
  const stageExportPackage = await executeStageExportPackageOrchestrator(source, backgroundTimeAwareScene, multiStageFreshInitialExport, normalizedDynamicCompositors, stageExportCoverage);
  signal?.throwIfAborted(); progress('backgroundOrientationCorrection');
  const backgroundOrientationCorrection = await executeBackgroundOrientationStaticExtraQualification(source, backgroundTimeAwareScene, freshInitialOrdinaryCensus);
  signal?.throwIfAborted(); progress('correctedStageExportPackage');
  const correctedStageExportPackage = await executeCorrectedStageExportPackage(source, stageExportPackage, backgroundOrientationCorrection);
  signal?.throwIfAborted(); progress('dynamicSiblingQualification');
  const dynamicSiblingQualification = await executeDynamicSiblingVariantQualification(source, backgroundDynamics, backgroundTimeAwareScene);
  signal?.throwIfAborted(); progress('dynamicSiblingPackage');
  const dynamicSiblingPackage = await executeDynamicSiblingCombinedPackage(source, dynamicSiblingQualification, arenaAnimatedScene, pitDynamicScene, caveDynamicScene, strippedDynamicScene, freshInitialOrdinaryCensus, multiStageFreshInitialExport, correctedStageExportPackage);
  signal?.throwIfAborted(); progress('noOpStageCompleteness');
  const noOpStageCompleteness = await executeNoOpStageCompletenessQualification(source, backgroundDynamics, backgroundTimeAwareScene, dynamicLayerCompositorContract);
  signal?.throwIfAborted(); progress('completeStagePackage');
  const completeStagePackage = await executeCompleteStageNormalizedBackgroundPackage(source, dynamicSiblingPackage, noOpStageCompleteness);
  signal?.throwIfAborted(); progress('browserBundle');
  const browserBundle = await executeBrowserStageExportBundle(completeStagePackage, dynamicSiblingPackage.report, noOpStageCompleteness);
  signal?.throwIfAborted(); progress('browserBundleValidation');
  const browserBundleValidation = await executeBrowserStageExportBundleValidation(browserBundle, completeStagePackage, dynamicSiblingPackage.report, noOpStageCompleteness);
  signal?.throwIfAborted(); progress('animationExportCoverage');
  const animationExportCoverage = executeAnimationExportCapabilityCoverageManifest(animationResourceDecode, animationExportManifest, paletteBoundFixtures.report, characterPaletteVariants.report, paletteBindingExceptions, streamControlTiming);
  signal?.throwIfAborted(); progress('animationBundle');
  const animationBundle = await executeBrowserAnimationExportBundle(source, animationExportCoverage, animationResourceDecode, animationExportManifest, paletteBoundFixtures.report, characterPaletteVariants.report, paletteBindingExceptions, streamControlTiming, transfer);
  signal?.throwIfAborted(); progress('animationBundleValidation');
  const animationBundleValidation = await executeBrowserAnimationExportBundleValidation(animationBundle, animationResourceDecode, paletteBoundFixtures.report, characterPaletteVariants.report, paletteBindingExceptions, animationExportCoverage);
  signal?.throwIfAborted(); progress('animationAssetsWorkspace');
  const animationAssetsWorkspace = await executeAnimationAssetsWorkspace(animationBundle, animationBundleValidation, paletteBindingExceptions);
  signal?.throwIfAborted(); progress('audioMusicResourceGraph');
  const audioMusicResourceGraph = await executeAudioMusicResourceGraphCensus(source);
  signal?.throwIfAborted(); progress('audioBundle');
  const audioBundle = await executeBrowserAudioExportBundle(source, audioMusicResourceGraph);
  signal?.throwIfAborted(); progress('audioBundleValidation');
  const audioBundleValidation = await executeBrowserAudioExportBundleValidation(source, audioBundle, audioMusicResourceGraph);
  return { stageBackgroundGraph, browserBundle, browserBundleValidation, animationBundle, animationBundleValidation, animationAssetsWorkspace, audioBundle, audioBundleValidation, fighterAnimationComparison, animationResourceDecode, streamControlTiming, animationExportManifest };
}
