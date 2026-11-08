#!/usr/bin/env python3
"""P76 fail-closed original MK1/MK2/MK3 and real-Chrome consolidation.

Usage: python scripts/verify-p76-checkpoint.py --mk1 ORIGINAL_DIR
       --mk2 ORIGINAL_DIR --mk3 ORIGINAL_DIR --work NEW_PRIVATE_PATH

This runs the unchanged P71 ten-group three-game checkpoint, plus P72
original-fighter/CMAP and Chrome comparison, P76 source refusals, P76 MK3
independent original-index/row/ZIP acceptance and real Chrome downloaded
asset ZIP pixel parity. No game binaries or extracted media go into Git.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
P71=runpy.run_path(str(ROOT/'scripts/verify-p71-checkpoint.py'))
STEPS=(
    'p71_accepted_three_game_baseline',
    'p72_original_mk3_source_comparison',
    'p72_original_chrome_comparison',
    'p76_source_refusal_controls',
    'p76_original_mk3_indexed_assets',
    'p76_original_chrome_indexed_download',
)

def require(condition,why):
    if not condition:
        raise ValueError('P76: '+why)

def exact(item,expected,label):
    require(isinstance(item,dict),label+' must be a JSON object')
    for k,v in expected.items():
        require(k in item and type(item[k]) is type(v) and item[k]==v,
                label+' '+k+' mismatch '+repr(item.get(k)))

def execute(label,argv,work,timeout=3600):
    require(label in STEPS,'unknown P76 acceptance step')
    print('P76:',label,flush=True)
    result=subprocess.run([str(v) for v in argv],cwd=ROOT,stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,timeout=timeout,check=False,
        env={**os.environ,'PYTHON':sys.executable,'PYTHONDONTWRITEBYTECODE':'1'})
    (work/(label+'.stdout.txt')).write_bytes(result.stdout)
    (work/(label+'.stderr.txt')).write_bytes(result.stderr)
    require(result.returncode==0,label+' failed; see private stdout/stderr')
    return result.stdout

def json_stdout(stdout,label):
    try:
        v=json.loads(stdout.decode('utf-8'))
    except (UnicodeError,json.JSONDecodeError) as exc:
        raise ValueError('P76: '+label+' non-JSON or contaminated stdout') from exc
    return v

def checkpoint(args):
    games,work,identities,opening=P71['preflight'](
        {g:getattr(args,g) for g in ('mk1','mk2','mk3')},args.work)
    work.mkdir(parents=True,exist_ok=False)
    report={
      'pass':'P76','status':'RUNNING',
      'startUtc':datetime.now(timezone.utc).isoformat(),
      'originalSourceAudit':opening,
      'originalExecutableIdentitySha256':identities,
      'baselineCensus':{'mk1':2656,'mk2':5369,'mk3':9186},
      'optInRecoveredMK3IndexedCountExpected':19,
      'optInVisibleMK3CountExpected':9205,
      'optInThreeGameCountExpected':17230,
      'nativePaletteOrStageRuntimeOwnershipAsserted':False,
      'mainPromoted':False,'commercialDataCommitted':False,
      'steps':{},
    }
    def save():
        tmp=work/'report.tmp'
        tmp.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        tmp.replace(work/'report.json')
    def recorded(label,stdout,value):
        require(label not in report['steps'],'duplicate acceptance step')
        report['steps'][label]={
          'status':'PASS','stdoutSha256':hashlib.sha256(stdout).hexdigest(),
          'checked':value
        }
        save()
    save()
    try:
        p71work=work/'p71-original'
        p71args=[sys.executable,'scripts/verify-p71-checkpoint.py',
            '--mk1',games['mk1'],'--mk2',games['mk2'],
            '--mk3',games['mk3'],'--work',p71work]
        stdout=execute(STEPS[0],p71args,work)
        accepted=json.loads((p71work/'summary.json').read_text(encoding='utf-8'))
        exact(accepted,{
          'pass':'P71','status':'PASS','sourceCommit':opening['commit'],
          'sourceTree':opening['treeSha'],'stepsPassed':10,
          'totalOriginalAssetRepresentations':17211,
          'census':{'mk1':2656,'mk2':5369,'mk3':9186},
          'originalP66BaselineReproduced':True,
          'actualP67ThroughP70OriginalChromeWorkflowsPassed':True,
        },'P71 inherited original regression')
        recorded(STEPS[0],stdout,{'inheritedP71OriginalGroups':10,
               'originalAcceptedBaseline':17211})
        p72work=work/'p72-original'
        stdout=execute(STEPS[1],['node','scripts/verify-mk3-p72-cmap.cjs',
                   games['mk3'],p72work],work)
        source72=json_stdout(stdout,STEPS[1])
        exact(source72,{'pass':'P72','status':'PASS','mk3Assets':9186,
          'originalIffImagesWithEmbeddedCmaps':416,
          'uniqueOriginalIffCmapByteTables':125,
          'originalFtrComparisonSource':'BLADE.FTR',
          'originalIffComparisonFormOffset':0,
          'originalIffPaletteBytesAndComparisonPngVerified':True,
          'originalFighterIndexAndOpacityBytesPreserved':True,
          'nativeFighterPaletteOwnershipClaimed':False,
          'browserDownloadVerified':False},'P72 original fixture')
        recorded(STEPS[1],stdout,{'originalFtrIffSourceComparison':True})
        stdout=execute(STEPS[2],['node','scripts/verify-p72-browser-cmap.cjs',
                   games['mk3']],work)
        browser72=json_stdout(stdout,STEPS[2])
        exact(browser72,{'pass':'P72_BROWSER','status':'PASS',
          'originalGame':'mk3','mk3Assets':9186,
          'sourceIffCmapChoices':125,
          'explicitUserPaletteComparisonOnly':True,
          'originalCmapBytesOriginalMaskAndPngVerified':True,
          'nativeFighterPaletteOwnershipClaimed':False,
          'sourceImagePaletteWasNotPromotedToNative':True},
          'P72 original Chrome palette comparison')
        recorded(STEPS[2],stdout,{'originalChromeP72SourceComparison':True})
        stdout=execute(STEPS[3],['node','scripts/test-p76-mk3-row-assets.cjs'],work)
        source76=json_stdout(stdout,STEPS[3])
        exact(source76,{'pass':'P76_SOURCE','status':'PASS',
          'originalCommercialGameDataUsed':False,
          'nativePaletteOwnershipClaimed':False,
          'baselineCatalogueAutoModified':False},'P76 synthetic original-source refusals')
        require(source76.get('rejectedMalformedSourceAndFalseProvenanceCases',0)>=16,
                'P76 source test did not exercise all expected false claims')
        recorded(STEPS[3],stdout,{'sourceRefusalsPassed':True})
        stdout=execute(STEPS[4],['node','scripts/verify-mk3-p76-original.cjs',
                     games['mk3']],work)
        original76=json_stdout(stdout,STEPS[4])
        exact(original76,{'pass':'P76_ORIGINAL','status':'PASS',
          'originalBaselineAssets':9186,'recoveredOptInIndexedImages':19,
          'newVisibleAssetCount':9205,'indexedPositionsPerPlane':2050843,
          'paintedPixels':996697,
          'independentOriginalP75Oracle':True,
          'originalIndexedMaskRowAndStreamHashesMatched':True,
          'indexedZIPSourceEvidenceParity':True,
          'paletteAndOriginalRendererOwnershipClaimed':False,
          'chromeBrowserWorkflowVerified':False},'P76 original indexed source/ZIP')
        recorded(STEPS[4],stdout,{'originalMK3IndexedSourceParity':True})
        stdout=execute(STEPS[5],['node','scripts/verify-p76-browser-row-assets.cjs',
                     games['mk3']],work)
        browser76=json_stdout(stdout,STEPS[5])
        exact(browser76,{'pass':'P76_BROWSER','status':'PASS','game':'mk3',
          'originalBaselineAssets':9186,'explicitRecoveredSourceRowImages':19,
          'optInLibraryAssets':9205,'originalStreamRowTablesAndSourceRgb8Exact':True,
          'sourceGrayscalePreviewPixelParity':True,
          'nativePaletteAndRuntimePlacementClaims':False},
          'P76 original Chrome indexed ZIP')
        recorded(STEPS[5],stdout,{'originalMK3ChromeIndexedDownloadParity':True})
        closing=P71['P66']['audit_source']()
        require(closing==opening,'original full source/commit tree changed during checkpoint')
        require(tuple(report['steps'])==STEPS,'missing/reordered P76 acceptance groups')
        report['closingSourceAudit']=closing
        report['status']='PASS'
    except BaseException as exc:
        report['status']='FAIL'
        report['failure']={'type':type(exc).__name__,'message':str(exc),
            'lastCompletedGroup':list(report['steps'])[-1] if report['steps'] else None}
        raise
    finally:
        report['finishUtc']=datetime.now(timezone.utc).isoformat()
        save()
    summary={'pass':'P76','status':'PASS',
      'sourceCommit':opening['commit'],'sourceTree':opening['treeSha'],
      'requiredGroupsPassed':len(report['steps']),
      'originalThreeGameBaseline':17211,
      'newOptInSourceRowImages':19,'optInThreeGameRepresentations':17230,
      'originalDosFixtureAndChromeP72P76Verified':True,
      'sourceAuditUnchanged':True,
      'nativePaletteOrRendererPlacementAsserted':False,
      'mainPromoted':False,'privateReport':str(work/'report.json')}
    (work/'summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(summary,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__,allow_abbrev=False)
    for key in ('mk1','mk2','mk3','work'):parser.add_argument('--'+key,required=True)
    checkpoint(parser.parse_args())
