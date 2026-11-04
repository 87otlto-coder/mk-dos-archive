#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const [installRootArg, o57OutArg, o58OutArg] = process.argv.slice(2);
if (!installRootArg) {
  console.error('Usage: node scripts/run-research-results-workspace-validation.mjs <MK1-dir> [o57.json] [o58.json]');
  process.exit(2);
}
const installRoot = path.resolve(installRootArg);
const o57Out = path.resolve(o57OutArg ?? 'mk1_research_results_workspace_direct.json');
const o58Out = path.resolve(o58OutArg ?? 'mk1_research_results_workspace_validation_direct.json');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mk1-o58-ui-'));
const emit = path.join(tmp, 'emit');
const types = path.join(tmp, 'types');
fs.mkdirSync(emit, { recursive: true });
fs.mkdirSync(types, { recursive: true });
const shim = path.join(tmp, 'node-shim.d.ts');
fs.writeFileSync(shim, "declare const process: { env?: Record<string,string|undefined>; platform: string };\n");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const entries = [
  'stageBackgroundResourceGraphCensus.ts',
  'backgroundPlacementCompositionQualification.ts',
  'backgroundRendererProjectionQualification.ts',
  'backgroundDynamicProcessAnimationCensus.ts',
  'backgroundTimeAwareSceneIr.ts',
  'arenaAnimatedSceneExportFixture.ts',
  'pillarCloudMotionResetQualification.ts',
  'pillarDynamicSceneExportFixture.ts',
  'pitDynamicMotionShadowQualification.ts',
  'pitDynamicSceneExportFixture.ts',
  'caveSpecialObjectPhaseQualification.ts',
  'caveDynamicSceneExportFixture.ts',
  'strippedBigEmperorProcessQualification.ts',
  'strippedDynamicSceneExportFixture.ts',
  'backgroundRendererHistoryClippingQualification.ts',
  'freshInitialOrdinaryBakCompositorCensus.ts',
  'multiStageFreshInitialOrdinaryBakExport.ts',
  'backgroundDynamicLayerCompositorContract.ts',
  'normalizedDynamicBackgroundCompositorFixtures.ts',
  'stageExportCapabilityCoverageManifest.ts',
  'stageExportPackageOrchestrator.ts',
  'backgroundOrientationStaticExtraQualification.ts',
  'correctedStageExportPackage.ts',
  'dynamicSiblingVariantQualification.ts',
  'dynamicSiblingCombinedPackage.ts',
  'noOpStageCompletenessQualification.ts',
  'completeStageNormalizedBackgroundPackage.ts',
  'researchResultsWorkspace.ts',
  'researchResultsWorkspaceValidation.ts',
].map((name) => `src/games/mk1/research/${name}`);
execFileSync('tsc', [
  '--target', 'ES2022', '--module', 'commonjs', '--moduleResolution', 'node', '--esModuleInterop',
  '--skipLibCheck', '--lib', 'ES2022,DOM', '--typeRoots', types, '--outDir', emit, shim, ...entries,
], { cwd: root, stdio: 'inherit' });
const load = (name) => require(path.join(emit, `games/mk1/research/${name}.js`));
const g = load('stageBackgroundResourceGraphCensus');
const p = load('backgroundPlacementCompositionQualification');
const r = load('backgroundRendererProjectionQualification');
const d = load('backgroundDynamicProcessAnimationCensus');
const t = load('backgroundTimeAwareSceneIr');
const a = load('arenaAnimatedSceneExportFixture');
const pc = load('pillarCloudMotionResetQualification');
const pd = load('pillarDynamicSceneExportFixture');
const pm = load('pitDynamicMotionShadowQualification');
const ps = load('pitDynamicSceneExportFixture');
const cs = load('caveSpecialObjectPhaseQualification');
const cd = load('caveDynamicSceneExportFixture');
const sb = load('strippedBigEmperorProcessQualification');
const sd = load('strippedDynamicSceneExportFixture');
const h = load('backgroundRendererHistoryClippingQualification');
const fc = load('freshInitialOrdinaryBakCompositorCensus');
const oe = load('multiStageFreshInitialOrdinaryBakExport');
const ct = load('backgroundDynamicLayerCompositorContract');
const nd = load('normalizedDynamicBackgroundCompositorFixtures');
const cm = load('stageExportCapabilityCoverageManifest');
const api = load('stageExportPackageOrchestrator');
const q = load('backgroundOrientationStaticExtraQualification');
const cp = load('correctedStageExportPackage');
const sq = load('dynamicSiblingVariantQualification');
const sp = load('dynamicSiblingCombinedPackage');
const nq = load('noOpStageCompletenessQualification');
const zp = load('completeStageNormalizedBackgroundPackage');
const ws = load('researchResultsWorkspace');
const wv = load('researchResultsWorkspaceValidation');

function walk(dir, rel = '', out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rr = rel ? `${rel}/${ent.name}` : ent.name;
    const pp = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(pp, rr, out);
    else if (ent.isFile()) out.push({ path: rr, name: ent.name, extension: ent.name.includes('.') ? ent.name.split('.').pop().toUpperCase() : '', size: fs.statSync(pp).size });
  }
  return out;
}
const files = walk(installRoot);
const cache = new Map();
const source = {
  directoryName: installRoot,
  isSynthetic: false,
  async listRecursive() { return files; },
  async readSlice(pth, o, l) {
    if (!cache.has(pth)) cache.set(pth, fs.readFileSync(path.join(installRoot, pth)));
    const b = cache.get(pth);
    return new Uint8Array(b.subarray(o, o + l));
  },
};

const o27 = await g.executeStageBackgroundResourceGraphCensus(source);
const o28 = await p.executeBackgroundPlacementCompositionQualification(source, o27);
const o29 = await r.executeBackgroundRendererProjectionQualification(source, o27, o28.report);
const o30 = await d.executeBackgroundDynamicProcessAnimationCensus(source, o27, o29);
const o31 = await t.executeBackgroundTimeAwareSceneIr(source, o27, o28.report, o29, o30);
const o32 = await a.executeArenaAnimatedSceneExportFixture(source, o27, o30, o31);
const o33 = await pc.executePillarCloudMotionResetQualification(source, o27, o30, o31);
const o34 = await pd.executePillarDynamicSceneExportFixture(source, o27, o30, o31, o33);
const o35 = await pm.executePitDynamicMotionShadowQualification(source, o27, o28.report, o29, o30, o31);
const o36 = await ps.executePitDynamicSceneExportFixture(source, o27, o28, o29, o31, o35);
const o37 = await cs.executeCaveSpecialObjectPhaseQualification(source, o27, o29, o30, o31);
const o38 = await cd.executeCaveDynamicSceneExportFixture(source, o31, o37);
const o39 = await sb.executeStrippedBigEmperorProcessQualification(source, o27, o29, o30, o31);
const o40 = await sd.executeStrippedDynamicSceneExportFixture(source, o31, o39);
const o41 = await h.executeBackgroundRendererHistoryClippingQualification(source, o28.report, o29);
const o43 = await fc.executeFreshInitialOrdinaryBakCompositorCensus(source, o31, o41);
const o44 = await oe.executeMultiStageFreshInitialOrdinaryBakExport(source, o43);
const o45 = await ct.executeBackgroundDynamicLayerCompositorContract(source, o29, o31, o32.report, o34.report, o36.report, o38.report, o40.report, o41, o43);
const o46 = await nd.executeNormalizedDynamicBackgroundCompositorFixtures(source, o30, o32, o34, o36, o38, o40, o43, o44, o45);
const o47 = await cm.executeStageExportCapabilityCoverageManifest(source, o30, o31, o43, o44.report, o45, o46.report);
const o48 = await api.executeStageExportPackageOrchestrator(source, o31, o44, o46, o47);
const o49 = await q.executeBackgroundOrientationStaticExtraQualification(source, o31, o43);
const o50 = await cp.executeCorrectedStageExportPackage(source, o48, o49);
const o51 = await sq.executeDynamicSiblingVariantQualification(source, o30, o31);
const o52 = await sp.executeDynamicSiblingCombinedPackage(source, o51, o32, o36, o38, o40, o43, o44, o50);
const o53 = await nq.executeNoOpStageCompletenessQualification(source, o30, o31, o45);
const o54 = await zp.executeCompleteStageNormalizedBackgroundPackage(source, o52, o53);

const quickActionsSource = fs.readFileSync(path.join(root, 'src/components/ResearchQuickActions.tsx'), 'utf8');
const declaredPasses = [...quickActionsSource.matchAll(/pass:\s*'([^']+)'/g)].map((match) => match[1]);
if (declaredPasses.length !== 69) throw new Error(`Expected 69 declared pipeline pass labels after O59/O60 integration, got ${declaredPasses.length}`);
const historicalPasses = declaredPasses.slice(0, 65);
const historicalArtifacts = historicalPasses.map((pass, index) => ({
  filename: `source_declared_${String(index + 1).padStart(2, '0')}_${pass.replace(/[^a-zA-Z0-9]+/g, '_')}.json`,
  pass,
  status: 'SOURCE_DECLARED',
  timestamp: '1970-01-01T00:00:00.000Z',
  data: { format: 'mk1_o57_source_declared_pipeline_fixture_v1', validation: { allChecksPassed: true } },
}));
const o57 = await ws.executeResearchResultsWorkspace(historicalArtifacts, o54);
const o57Artifact = {
  filename: 'mk1_research_results_workspace_direct.json',
  pass: '1E.3O.57',
  status: o57.report.status,
  timestamp: o57.report.timestamp,
  data: ws.createMK1ResearchResultsWorkspaceExport(o57),
};
const o58 = await wv.executeResearchResultsWorkspaceValidation(o57, [...historicalArtifacts, o57Artifact]);
fs.writeFileSync(o57Out, JSON.stringify(o57.report, null, 2));
fs.writeFileSync(o58Out, JSON.stringify(o58, null, 2));
console.log(JSON.stringify({
  o57: { status: o57.report.status, verdict: o57.report.decision.verdict, historicalArtifacts: o57.report.prerequisite.historicalArtifactCount, stages: o57.report.stageGallery.stageCount },
  o58: { status: o58.status, verdict: o58.decision.verdict, summary: o58.summary },
  o57Out,
  o58Out,
}, null, 2));
