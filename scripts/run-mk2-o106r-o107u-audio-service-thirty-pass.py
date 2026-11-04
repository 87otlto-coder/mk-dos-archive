#!/usr/bin/env python3
"""O106R–O107U. Authentic-source bounded audio interrupt, native entry and marker audits.
Structural evidence only; music events, timing and INT 80h service implementation held.
"""
import json,hashlib,pathlib,sys
EX=pathlib.Path(sys.argv[1]); ROOT=pathlib.Path(sys.argv[2]); OUT=pathlib.Path(sys.argv[3]); OUT.mkdir(parents=True,exist_ok=True)
sha=lambda v:hashlib.sha256(v).hexdigest(); exe=EX.read_bytes()
assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ids=['O106'+c for c in 'RSTUVWXYZ']+['O107'+c for c in 'ABCDEFGHIJKLMNOPQRSTU'];assert len(ids)==30
interrupts=[(0x814c5,9,None),(0x814cd,7,None),(0x814d1,3,None),(0x814d5,3,None),(0x81517,4,1),(0x815ba,19,0), (0x8671f,18,0),(0x86725,18,1),(0x8672b,18,2),(0x86731,18,3),(0x8674e,7,None)]
native=['scc.bin','lap.bin','grv.bin','sbl.bin','awe.bin']
exceptions=[('pit2',ext) for ext in ('mid','lap','gvs','sbl','awe')]+[('animb','lap')]
loader=[('mid',1,0x8153c,0x81541),('lap',2,0x8154a,0x8154f),('gvs',4,0x81558,0x8155d),('sbl',8,0x81566,0x8156b),('awe',16,0x81574,0x81579)]
rm=(ROOT/'rm.drv').read_bytes()
assert len(rm)==2522
common={'scope':'MK2_NATIVE_SOUND_SERVICE_BYTE_EVIDENCE','exeSha256':sha(exe),'noMusicEventGrammar':True,'noTempoInterpretation':True,'int80HandlerNotIdentified':True,'noHardwareDriverBindingFromFilenameAlone':True,'newGraphicsPromotions':0}
ledger={**common,'format':'mk2_o106r_o107u_audio_service_pass_ledger_v1','sourceCount':30,'reports':[]}
for i,pid in enumerate(ids):
 record={**common,'format':'mk2_o106r_o107u_audio_service_pass_v1','pass':pid,'ordinal':i+1}
 if i<11:
  off,ah,al=interrupts[i];assert exe[off:off+2]==b'\xcd\x80'
  if al is None:assert exe[off-2:off]==bytes([0xb4,ah])
  else:assert exe[off-4:off-2]==bytes([0xb4,ah]) and exe[off-2:off]==bytes([0xb0,al])
  record.update(kind='PROTECTED_AUDIO_INT80_CALL',interruptOffset=off,ah=ah,al=al,contextStart=off-18,contextHex=exe[off-18:off+8].hex(),qualifier='INSTRUCTION_SITE_NOT_HANDLER_SEMANTICS')
 elif i<16:
  name=native[i-11];b=(ROOT/name).read_bytes();assert b[0]==0xe8 and b[3]==0xcb and b[4]==0xe8 and b[7]==0xcf
  a=3+int.from_bytes(b[1:3],'little',signed=True);z=7+int.from_bytes(b[5:7],'little',signed=True);assert a==z and a<len(b)
  record.update(kind='NATIVE_DRIVER_DUAL_ENTRY',driver=name,length=len(b),driverSha256=sha(b),first8Hex=b[:8].hex(),farReturnOpcodeAt=3,interruptReturnOpcodeAt=7,sharedCallTarget=a,sharedTargetFirst24Hex=b[a:a+24].hex(),meaning='TWO_ENTRY_STUBS_ONE_LOCAL_TARGET_NO_MUSIC_DRIVER_RUNTIME_BINDING')
 elif i<22:
  stem,ext=exceptions[i-16];v=(ROOT/'sound'/f'{stem}.{ext}').read_bytes();L=int.from_bytes(v[1:3],'little');indices=[int.from_bytes(v[k:k+2],'little') for k in range(L+7,len(v),2)];raw=[at for at in range(3,L) if v[at] in (0x91,0x98)];interior=[at for at in raw if at+1 not in indices and at!=L-1];assert len(interior)==1
  at=interior[0]
  record.update(kind='UNINDEXED_INTERIOR_MARKER',filename=f'{stem}.{ext}',fileLength=len(v),storedLength=L,sha256=sha(v),indexedOffsetsCount=len(indices),interiorByteOffset=at,opcode=v[at],nextByte=v[at+1],contextHex=v[max(0,at-8):at+16].hex(),terminalMarker=v[L-1],qualifier='EXCEPTION_NOT_AUTOMATIC_MUSIC_COMMAND')
 elif i<27:
  ext,sel,mov,cmp=loader[i-22];assert exe[mov]==0xb8 and exe[cmp:cmp+6]==bytes.fromhex('833d38010300') and exe[cmp+6]==sel;assert exe[cmp+7]==0x74
  disp=exe[cmp+8];nextOff=cmp+9;target=nextOff+(disp if disp<128 else disp-256);assert target==0x81583
  record.update(kind='EXECUTABLE_MUSIC_FILENAME_BRANCH',extension=ext,hardwareSelector=sel,movOpcodeAt=mov,movLiteralBytesHex=exe[mov+1:mov+5].hex(),compareAt=cmp,globalAddress=0x30138,conditionalJumpTarget=target,qualifier='MUSIC_SUFFIX_BRANCH_NOT_DRIVER_BINARY_SELECTION')
 else:
  which=i-27
  if which==0:
   assert rm[0x962]==0x06 and rm[0x975:0x97b]==bytes.fromhex('b411ff1e1400')
   record.update(kind='REALMODE_PCM_SAMPLE_API_CALL',driver='rm.drv',rmSha256=sha(rm),beginOffset=0x962,opcodesHex=rm[0x962:0x97d].hex(),requestAh=17,farPointerOffset=0x14,qualifier='PCM_SAMPLE_START_NOT_MUSIC_EVENT_CONSUMER')
  elif which==1:
   assert rm[0x9b4:0x9c0]==bytes.fromhex('6650b413cd8083fbff6658c3')
   record.update(kind='REALMODE_INT80_CHANNEL_QUERY',driver='rm.drv',rmSha256=sha(rm),beginOffset=0x9b4,opcodesHex=rm[0x9b4:0x9c0].hex(),requestAh=19,queryFailureSentinel=65535,qualifier='INTERRUPT_QUERY_NOT_MUSIC_EVENT_GRAMMAR')
  else:
   assert rm[0x9c0:0x9c4]==bytes.fromhex('8a0e3200')
   record.update(kind='REALMODE_PCM_VOLUME_HELPER',driver='rm.drv',rmSha256=sha(rm),beginOffset=0x9c0,opcodesHex=rm[0x9c0:0x9da].hex(),volumeFieldOffset=0x32,qualifier='PCM_VOLUME_SCALING_NO_TIMING_CLAIM')
 path=OUT/f'mk2_{pid.lower()}_{record["kind"].lower()}_2026-10-09.json';path.write_text(json.dumps(record,indent=2)+'\n');ledger['reports'].append({'pass':pid,'kind':record['kind'],'filename':path.name,'sha256':sha(path.read_bytes())})
(OUT/'mk2_o107u_audio_service_thirty_pass_ledger_2026-10-09.json').write_text(json.dumps(ledger,indent=2)+'\n')
print(json.dumps({'result':'PRODUCED','passCount':len(ids),'kinds':{k:sum(j['kind']==k for j in ledger['reports']) for k in sorted(set(j['kind'] for j in ledger['reports']))}}))
