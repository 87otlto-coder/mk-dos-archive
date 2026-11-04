#!/usr/bin/env python3
"""Independent O131 binary and control-stream verifier (no O131/O130 producer imports)."""
from __future__ import annotations
import hashlib,json,struct,sys,zipfile
from pathlib import Path
from verify_o120_independent import parse_fixups
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
O1,O2=0x61c54,0xa0c54
ROWS={1:('TOMB.GRA',28,63776,48),2:('BATTLE.GRA',34,59436,40),3:('TOWER.GRA',30,56268,64),4:('FOREST.GRA',27,198116,32),5:('ARMORY.GRA',26,126336,56),7:('PORTAL.GRA',25,56916,40),8:('ARENA.GRA',31,90488,40)}
SHA=lambda b:hashlib.sha256(b).hexdigest()
U=lambda b,p:struct.unpack_from('<I',b,p)[0]
S=lambda b,p:struct.unpack_from('<i',b,p)[0]

def verify(exe,raw,archive=None):
 count=0
 def ck(b,msg):
  nonlocal count
  if not b:raise AssertionError('O131 independent: '+msg)
  count+=1
 j=json.loads(raw)
 ck(len(exe)==861133 and SHA(exe)==HASH,'canonical original EXE hash')
 fx,total=parse_fixups(exe)
 ck(total==27004 and len(fx)==26994,'independent relocation parse')
 ck(set(j)=={'schema','status','canonicalExeSHA256','originalRelocationCount','renderer','stages','limitations'},'report keys')
 ck(j['schema']=='mk2_o131_guarded_stage_floor_geometry_static_v1' and j['status']=='PASS_SOURCE_AUTHENTICATED_RENDERER_ROW_GEOMETRY','report schema')
 ck(j['canonicalExeSHA256']==HASH and j['originalRelocationCount']==len(fx),'source identity metadata')
 ins=[(0x9356e,'8b3183c1048b368b3983c1048b1983c104890d985a0700'),
      (0x9e118,'f705d4620500010000007473'),(0x9e138,'8bcb81e6ffff00008bc62d200100007412f7d8c1e01099bb70000000f7fb'),
      (0x9e15b,'a1685a0700c1f8102bf8'),(0x9e165,'a17f74070003348554ef0200'),
      (0x9e171,'8bc781ffc8000000731c03c13dc80000007207b9c80000002bcf'),
      (0x659c6,'67e3738bdec1eb188d2cdd00000000c1e3048b9c2b34f4020081e6ffffff0003f3'),
      (0x65a0f,'b950000000ad03c2abe2faa177740700030573740700a377740700c1f81081c5800300008bf52bf04b75d5')]
 for a,h in ins:ck(exe[a:a+len(h)//2].hex()==h,'machine instruction '+hex(a))
 for site,target in [(0x93581,0x75a98),(0x9e11a,0x562d4),(0x9e126,0x77473),
     (0x9e130,0x77477),(0x9e157,0x77473),(0x9e15c,0x75a68),(0x9e166,0x7747f),
     (0x9e16d,0x2ef54),(0x659db,0x2f434),(0x659ed,0x75b06),
     (0x65a01,0x357e4),(0x65a07,0x7662a),(0x65a1b,0x77477),
     (0x65a21,0x77473),(0x65a26,0x77477)]:
  ck(fx[(1,site-O1)]==(7,16,2,target),'independently relocated operand '+hex(site))
  ck(U(exe,site)==target,'raw LE operand '+hex(site))
 expected={'controlInterpreterPhysical':0x9356e,'gatePhysical':0x9e118,
 'verticalAdjustmentGlobalObject2':0x75a68,'drawStartYCalculationPhysical':0x9e15b,
 'requestedRowCountPhysical':0x9e138,'clipGuardPhysical':0x9e173,'displayHeight':200,
 'packedStageTableObject2':0x2ef54,'stageIndexGlobalObject2':0x7747f,
 'packedRowConsumerPhysical':0x659c6,'rowSourceStride':896,'rowWidthBytes':320,
 'cameraWordMask':65535,'cameraReferenceWord':288,'cameraNormalizationDivisor':112,
 'rowStepAccumulation16_16Physical':0x65a1a,'stagePaletteHandleKnown':False,
 'firstPointerIsOriginalObject2FileBacked':False,
 'semantics':'rawDestinationY minus signed high16(global 0x75A68); rows from third command DWORD clipped at 200; source offset from runtime pointer + packed table; 896-byte rows; camera-derived signed fixed-point per-row correction'}
 ck(j['renderer']==expected,'renderer semantic/evidence metadata')
 ck(len(j['stages'])==7,'seven stages')
 for entry, (ix,(name,rid,suffix,rows)) in zip(j['stages'],ROWS.items()):
  root_site=O2+0x15bec+ix*4
  root=U(exe,root_site)
  ck(fx[(2,0x15bec+ix*4)]==(7,16,2,root),'stage root relocation')
  ck(U(exe,O2+root)>>24==rid,'root resource ID')
  stream=U(exe,O2+root+24)
  ck(fx[(2,root+24)]==(7,16,2,stream),'stream root field relocation')
  pos=stream;draws=[]
  for _ in range(80):
   token=S(exe,O2+pos)
   if token==0:break
   if token==-1:
    ptr,y,n=struct.unpack_from('<III',exe,O2+pos+4)
    ck(fx[(2,pos+4)]==(7,16,2,ptr),'stream first pointer relocation')
    draws.append((pos,ptr,y,n));pos+=16
   elif token>0:pos+=8
   elif token==-2:pos+=4
   else:raise AssertionError('unexpected stream grammar token')
  else:raise AssertionError('unterminated stream')
  ck(len(draws)==1,'one packed stage draw')
  loc,ptr,y,n=draws[0]
  ck(ptr>len(exe)-O2,'first pointer beyond file-backed object2')
  ck(ptr in (0x84312,0x8432a),'exact mutable pointer candidates')
  packed=U(exe,O2+0x2ef54+ix*4)
  ck((packed>>24,packed&0xffffff)==(rid,suffix),'source DWORD low24 equals suffix offset')
  ck(U(exe,O2+0x2f434+rid*24)==0,'file-backed map base original zero')
  ck(0<y<200 and 0<n<200 and y+n>200,'source command extends past display boundary')
  visible=min(n,200-y)
  correct={'stageIndex':ix,'resourceName':name,'resourceID':rid,
    'controlStreamObject2':stream,'commandObject2':loc,'sourceRuntimePointerObject2':ptr,
    'sourcePointerFileBacked':False,'packedSourceDWORD':packed,'packedSuffixStart':suffix,
    'sourceRowsInOriginalResource':rows,'rawDestinationY':y,'requestedRows':n,
    'zeroScrollIllustration':{'startY':y,'visibleRows':visible,'endExclusiveY':y+visible,
                             'requestedEndExclusiveY':y+n,'sourceCameraWordAssumed':288},
    'liveDestinationYKnown':False,'liveSourceCameraWordKnown':False}
  ck(entry==correct,'full stage row model '+str(ix))
  ck(visible<=rows,'zero-scroll example in original source row count')
  if archive is not None:
   data=archive.read('mk2/'+name.lower())
   ck(len(data)-suffix==rows*896,'original resource packed suffix exact extent')
 ck(len(j['limitations'])==6,'six uncertainty restrictions')
 ck(all(isinstance(s,str) and len(s)>20 for s in j['limitations']),'specific limitations')
 ck('NOT gameplay measurements' in j['limitations'][0] and 'unmeasured' in j['limitations'][-1], 'runtime qualifications preserved')
 return {'status':'PASS_O131_INDEPENDENT','assertions':count,'linkedStages':len(ROWS),
         'relocationRecords':total,'reportSHA256':SHA(raw)}

if __name__=='__main__':
 if len(sys.argv) not in (3,4):raise SystemExit('usage: verifier MK2.EXE O131.json [mk2.zip]')
 archive=zipfile.ZipFile(sys.argv[3]) if len(sys.argv)==4 else None
 print(json.dumps(verify(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes(),archive),indent=2))
