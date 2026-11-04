from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json, os
ROOT=Path('/mnt/data')
PREV=ROOT/'MK_DOS_Archive_Source_Through_O120_Palette_Setup_Graph_2026-10-11.zip'
SOURCE=ROOT/'O121_work'
OUT=ROOT/'MK_DOS_Archive_Source_Through_O121_Palette_Control_Resource_2026-10-11.zip'
STAND=ROOT/'MK2_O121_Palette_Control_Resource_Tools_2026-10-11.zip'
MANI=ROOT/'MK_DOS_Archive_O121_Source_Verification_2026-10-11.json'
SKIP={'__pycache__','.pytest_cache','.DS_Store'}
EXCLUDED_ORIGINAL={'demo_inputs/portal.gra','demo_inputs/tomb.gra'}
def ok(n,what):
 if not n:raise RuntimeError(what)
def files():
 return sorted(p for p in SOURCE.rglob('*') if p.is_file() and str(p.relative_to(SOURCE)).replace('\\','/') not in EXCLUDED_ORIGINAL and not any(part in SKIP for part in p.relative_to(SOURCE).parts) and p.suffix!='.pyc')
def hashb(b):return hashlib.sha256(b).hexdigest()

def make(srcs,target):
 ok(not target.exists(),'will not overwrite '+str(target))
 with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=6) as z:
  for arc,data in srcs:
   z.writestr(arc,data)
 with ZipFile(target) as z:
  failed=z.testzip();ok(failed is None,'ZIP CRC failure '+str(failed))
  for arc,data in srcs:
   ok(hashb(z.read(arc))==hashb(data),'ZIP byte mismatch: '+arc)
 return target.stat().st_size,hashb(target.read_bytes())

with ZipFile(PREV) as z:
 inherited={p:z.read(p) for p in z.namelist() if not p.endswith('/')}
current={str(p.relative_to(SOURCE)).replace('\\','/'):p.read_bytes() for p in files()}
missing=sorted(set(inherited)-set(current))
modified=sorted(k for k in set(inherited)&set(current) if inherited[k]!=current[k])
new=sorted(set(current)-set(inherited))
print('INHERITED',len(inherited),'PRESERVED',len(inherited)-len(modified),'MODIFIED',modified,'NEW',len(new),'MISSING',missing)
ok(set(missing)==EXCLUDED_ORIGINAL,'Unexpected inherited files removed: '+str(missing))
expected_mod={
 'MK-DOS-Archive/src/components/MK2ObservedStageFloorPanel.tsx',
 'MK-DOS-Archive/tools/mk2_native_stage_palettes/README.md'}
ok(set(modified)==expected_mod,'Unexpected inherited modifications: '+str(modified))
# Explicit refusal to accidentally package canonical original commercial data.
for name in current:
 base=Path(name).name.upper()
 ok(base not in ('MK2.EXE','TOMB.GRA','PORTAL.GRA','IMAGES.GRA'),'Commercial asset in source: '+name)
primary=sorted(current.items())
size,sha=make(primary,OUT)
print('SOURCE',OUT,size,sha,len(primary))
project='MK2_O121_Research/'
subpaths=[
 'tools/mk2_native_stage_palettes/trace_o120_setup_graph.py',
 'tools/mk2_native_stage_palettes/verify_o120_independent.py',
 'tools/mk2_native_stage_palettes/trace_o121_control_bindings.py',
 'tools/mk2_native_stage_palettes/verify_o121_independent.py',
 'tools/mk2_native_stage_palettes/audit_o121_tile_layouts.py',
 'tools/mk2_native_stage_palettes/test_o121_control_bindings.py',
 'research_outputs/O120_STAGE_PALETTE_SETUP_GRAPH.json',
 'research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json',
 'research_outputs/O121_STAGE_SPRITE_RECTANGLE_COVERAGE.json',
 'CHECKPOINT_2026-10-11_O121_PALETTE_CONTROL_SPRITE_RESOURCE.md',
 'READ_ME_FIRST_O121.md',
 'scripts/run-mk2-o121-stage-palette-control-bridge.mjs',
 'src/games/mk2/research/stagePaletteControlO121.ts'
]
small=[(project+k,(SOURCE/'MK-DOS-Archive'/k).read_bytes()) for k in subpaths]
ss,sh=make(small,STAND)
print('STANDALONE',STAND,ss,sh,len(small))
manifest={
 'format':'mk_dos_archive_o121_verified_source_package_v1',
 'checkpoint':'O121_2026-10-11',
 'parentArchive':PREV.name,'parentArchiveSHA256':hashb(PREV.read_bytes()),
 'sourceArchive':OUT.name,'sourceArchiveSize':size,'sourceArchiveSHA256':sha,
 'sourceEntryCount':len(primary), 'sourceEntrySHA256':{k:hashb(v) for k,v in primary},
 'inheritedEntryCount':len(inherited),'inheritedByteIdentical':len(inherited)-len(modified)-len(missing),
 'modifiedInherited':modified,'addedEntries':new,
 'removedInherited':missing,'exclusionReason':'Two original game GRA files inherited in prior source archive are deliberately excluded; source tooling requires user-supplied originals',
 'standaloneArchive':STAND.name,'standaloneArchiveSize':ss,'standaloneArchiveSHA256':sh,
 'independentReport':'research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json',
 'independentReportSHA256':hashb((SOURCE/'MK-DOS-Archive'/'research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json').read_bytes()),
 'checkSummary':{'o121IndependentControlAssertions':2025,'o121ControlEntries':135,'o121DistinctSpriteDescriptors':49,'o121ExactRectangleTilingCount':6,
                 'o121PythonRegressionTests':32,'o120PythonRegressionTests':23,'o119PythonRegressionTests':12,
                 'o121NodeChecks':26,'o119NodeChecks':15,
                 'fullReactBuildVerified':False,'dosboxO121RuntimeSelectionVerified':False},
 'sourceArchiveIntegrity':'PASS_CRC_AND_PER_FILE_SHA256',
 'standaloneArchiveIntegrity':'PASS_CRC_AND_PER_FILE_SHA256'
}
ok(not MANI.exists(),'will not overwrite manifest')
MANI.write_text(json.dumps(manifest,indent=2)+'\n')
print('MANIFEST',MANI,MANI.stat().st_size)
