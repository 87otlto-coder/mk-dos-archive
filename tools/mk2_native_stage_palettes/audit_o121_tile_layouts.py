#!/usr/bin/env python3
"""O121 geometry qualification after independent EXE/resource control provenance.

Exact rectangle coverage describes descriptor placement only. It does NOT assert
full opaque pixels, actual game screen placement, draw order or runtime activation.
"""
from __future__ import annotations
import argparse,json
from pathlib import Path
from verify_o121_independent import verify

def shapes(report):
    outcome=[]
    for family in report['families']:
        for layer in family['setups']:
            w,h=layer['rawSizeWords'];occ=bytearray(w*h);outside=0;overlap=0
            for r in layer['rows']:
                x,y,sw,sh=r['signedX'],r['signedY'],r['spriteWidth'],r['spriteHeight']
                for yy in range(y,y+sh):
                    for xx in range(x,x+sw):
                        if xx<0 or xx>=w or yy<0 or yy>=h:
                            outside+=1;continue
                        pixel=yy*w+xx
                        if occ[pixel]:overlap+=1
                        else:occ[pixel]=1
            covered=occ.count(1)
            geometry={'family':family['familyLabel'],
                      'setupOffsetObject2':layer['setupObject2Offset'],
                      'declaredDimensions':[w,h],
                      'descriptorCount':layer['count'],
                      'rectanglesCovered':covered,
                      'declaredArea':w*h,'rectangleOverlapPixels':overlap,
                      'outOfBoundsRectanglePixels':outside,
                      'uncoveredRectanglePixels':w*h-covered,
                      'exactNonOverlappingInBoundsTiling':covered==w*h and overlap==0 and outside==0}
            outcome.append(geometry)
    return {'format':'mk2_o121_conditional_sprite_rectangle_coverage_v1',
            'sourceReportFormat':report['format'],
            'status':'VERIFIED_STATIC_DESCRIPTOR_RECTANGLES_NOT_OPAQUE_PIXELS',
            'layouts':outcome,
            'exactRectangleTilings':sum(x['exactNonOverlappingInBoundsTiling'] for x in outcome),
            'limitations':{'fullOpaquePixelCoverage':False,'observedRuntimeStageSelection':False,
                           'screenCoordinates':False,'visibleLayerCompositing':False}}

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--exe',type=Path,required=True)
    a.add_argument('--game-zip',type=Path,required=True)
    a.add_argument('--report',type=Path,required=True)
    a.add_argument('--out',type=Path,required=True);p=a.parse_args()
    if p.out.exists():raise SystemExit('O121 will not overwrite '+str(p.out))
    verify(p.exe.read_bytes(),p.game_zip.read_bytes(),p.report.read_bytes())
    g=shapes(json.loads(p.report.read_bytes()))
    if len(g['layouts'])!=10 or g['exactRectangleTilings']!=6:raise ValueError('unexpected geometry census')
    p.out.write_text(json.dumps(g,indent=2)+'\n')
    print(json.dumps({'layouts':len(g['layouts']),'exactRectangularMosaics':g['exactRectangleTilings'],
                      'status':g['status']}))
