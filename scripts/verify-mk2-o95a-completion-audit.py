#!/usr/bin/env python3
import sys,json,hashlib,struct
from pathlib import Path
if len(sys.argv)<3:
    raise SystemExit('Usage: python scripts/verify-mk2-o95a-completion-audit.py <mk2-dir> <audit-json>')
root=Path(sys.argv[1]); audit=json.loads(Path(sys.argv[2]).read_text())
checks=[]
def ck(name,cond,detail=''):
    checks.append((name,bool(cond),detail))
    if not cond: raise AssertionError(f'{name}: {detail}')
files=[p for p in root.rglob('*') if p.is_file()]
ext={}
for p in files:
    e=p.suffix[1:].upper() if p.suffix else '<NONE>'; ext[e]=ext.get(e,0)+1
ck('fixture_file_count',len(files)==audit['fixture']['fileCount'],str(len(files)))
ck('fixture_total_bytes',sum(p.stat().st_size for p in files)==audit['fixture']['totalBytes'])
exe=root/'mk2.exe'; ck('canonical_exe',hashlib.sha256(exe.read_bytes()).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
for k,v in audit['fixture']['extensions'].items(): ck('ext_'+k,ext.get(k,0)==v,f'{ext.get(k,0)} vs {v}')
g=audit['graphics']; ck('gra_partition_total',g['exactFull']+g['partialOrAmbiguous']+g['zeroCandidatePooled']+g['outOfPool']==124)
ck('gra_blocker_list_total',len(g['partialOrAmbiguousResources'])+len(g['zeroCandidatePooledResources'])+len(g['outOfPoolResources'])==30)
ck('gra_partial_exact_list',g['partialOrAmbiguousResources']==['PLAYSTA.GRA','FONTS.GRA','LOGO.GRA','PLAYSEL.GRA','PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','PIT.GRA','STONE.GRA','MOUNTAIN.GRA','TITLE.GRA','VFRAME.GRA'])
ck('gra_zero_exact_list',g['zeroCandidatePooledResources']==['STORY.GRA','IMAGES.GRA','DEDPOOL.GRA','CAVE.GRA','BATTLE.GRA','KONTIN.GRA','BIO.GRA','PROBE.GRA','ACCLAIM.GRA','T1HDRS.GRA','T2HDRS.GRA','ENDH.GRA','ENDV.GRA','COPY.GRA'])
p=audit['palettes']; q=[x['slot'] for x in p['slots'] if x['status']=='QUALIFIED_BOUNDED_RGBA']; u=[x['slot'] for x in p['slots'] if x['status']!='QUALIFIED_BOUNDED_RGBA']
ck('palette_qualified_slots',q==[0,1,2,3,4,5,8,9,16],str(q)); ck('palette_unresolved_slots',u==[6,7,10,11,12,13,14,15],str(u))
expected_tracks={'MID':212,'AWE':218,'GVS':217,'LAP':216,'SBL':233}
for row in audit['music']['sets']:
    extension=row['extension']; songfiles=sorted((root/'sound').glob('*.'+extension.lower()))
    track_total=0
    for f in songfiles:
        b=f.read_bytes(); ck(f'{extension}_{f.stem}_min',len(b)>=8); ck(f'{extension}_{f.stem}_song_count',b[0]==1)
        table=struct.unpack_from('<H',b,1)[0]; ck(f'{extension}_{f.stem}_table',table+2<=len(b))
        song=struct.unpack_from('<H',b,table)[0]; ck(f'{extension}_{f.stem}_song',song+3<=len(b))
        ppqn,bpm,count=b[song:song+3]; ck(f'{extension}_{f.stem}_header',ppqn==96 and bpm>0 and 0<count<=16)
        ck(f'{extension}_{f.stem}_tracks_bounds',song+3+count*2<=len(b)); starts=[struct.unpack_from('<H',b,song+3+i*2)[0] for i in range(count)]
        ck(f'{extension}_{f.stem}_starts',all(s<table for s in starts)); track_total+=count
    ck('music_files_'+extension,len(songfiles)==33,str(len(songfiles))); ck('music_tracks_'+extension,track_total==expected_tracks[extension],str(track_total))
ck('animation_modules_absent',audit['animations']['implementedMk2AnimationResearchModules']==[])
ck('stage_modules_absent',audit['stages']['implementedMk2StageResearchModules']==[])
ck('not_closed',audit['decision']['mk2ResearchClosed'] is False)
summary={'status':'PASS','checks':len(checks),'failed':0,'fixtureFiles':len(files),'fixtureBytes':sum(p.stat().st_size for p in files),'musicTracks':expected_tracks,'paletteQualified':q,'paletteUnresolved':u,'graphicsNonExactWholeResourceCount':30}
print(json.dumps(summary,indent=2))
