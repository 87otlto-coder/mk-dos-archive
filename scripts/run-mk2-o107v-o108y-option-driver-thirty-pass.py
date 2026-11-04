#!/usr/bin/env python3
"""O107V–O108Y. 30 bounded sound-options initialization checks on authentic MK2 fixture."""
import sys,json,pathlib,hashlib,struct
P=pathlib.Path; exe=P(sys.argv[1]).read_bytes(); fixture=P(sys.argv[2]); out=P(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
sha=lambda x:hashlib.sha256(x).hexdigest()
assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ids=['O107'+x for x in 'VWXYZ']+['O108'+x for x in 'ABCDEFGHIJKLMNOPQRSTUVWXY'];assert len(ids)==30
snap=[(0x9a98f,0x9aa0e,0x30130,0x302ff),(0x9a999,0x9aa18,0x30134,0x30303),(0x9a9a3,0x9aa22,0x3012c,0x30307),(0x9a9ad,0x9aa82,0x30138,0x3030b),(0x9a9b7,0x9aa2c,0x3013c,0x30317)]
init=[(1,0x62eb1,0x62eb6,0x62ebb,0x62f19,0x62f1e,0x39000000),(2,0x62f2b,0x62f31,0x62f36,0x62f94,0x62f99,0x3a000000),(4,0x62fa6,0x62fac,0x62fb1,0x6300f,0x63014,0x3b000000),(8,0x63021,0x63027,0x6302c,0x63084,0x63089,0x3c000000),(16,0x63096,0x6309c,0x630a1,0x63101,0x63106,0x3d000000)]
suffix=[(1,'.MID',0x8153c,0x81541),(2,'.LAP',0x8154a,0x8154f),(4,'.GVS',0x81558,0x8155d),(8,'.SBL',0x81566,0x8156b),(16,'.AWE',0x81574,0x81579)]
drivers=['scc.bin','lap.bin','grv.bin','sbl.bin','awe.bin']
menu=[('SHADOW_READ',0x9aa82,'a10b030300'),('SHADOW_COMPARE',0x9aa87,'390538010300'),('UNCONDITIONAL_APPLY_JUMP',0x9aa8d,'eb15'),('LIVE_SELECTOR_STORE',0x9aaa4,'a338010300'),('INIT_AND_SUCCESS_GUARD',0x9aaa9,'e83683fcff84c075dd')]
loader=[('MUSIC_FILENAME_CALL',0x814d8,'e84b000000'),('DOS_MUSIC_OPEN',0x814e4,'b43dcd21'),('DOS_MUSIC_READ',0x81505,'b43fcd21'),('DOS_MUSIC_CLOSE',0x8150d,'b43ecd21'),('SOUND_SERVICE_REQUEST',0x81513,'b404b001cd80')]
ledger={'format':'mk2_o108y_options_audio_30pass_ledger_v1','sourceExeSha256':sha(exe),'userObservation':'driver selected in options; Roland worked; Sound Blaster failed in DOSBox; unverified runtime cause','reports':[],'noDynamicGameplayClaim':True,'noEstablishedInt80Handler':True,'noEmulatorDiagnosis':True}
for i,ident in enumerate(ids):
  rec={'format':'mk2_o108y_options_audio_pass_v1','pass':ident,'ordinal':i+1,'sourceExeSha256':sha(exe),'noDynamicGameplayClaim':True,'noEstablishedInt80Handler':True,'noEmulatorDiagnosis':True}
  if i<5:
    get,put,live,shadow=snap[i];assert exe[get]==0xa1 and int.from_bytes(exe[get+1:get+5],'little')==live and exe[get+5]==0xa3 and int.from_bytes(exe[get+6:get+10],'little')==shadow
    assert exe[put]==0xa1 and int.from_bytes(exe[put+1:put+5],'little')==shadow
    if i!=3: assert exe[put+5]==0xa3 and int.from_bytes(exe[put+6:put+10],'little')==live
    else:assert exe[put+5:put+11]==bytes.fromhex('390538010300')
    rec.update(kind='OPTIONS_SNAPSHOT_REAPPLY',live=live,shadow=shadow,snapshotOffset=get,reapplyReadOffset=put,snapshotHex=exe[get:get+10].hex(),reapplyHex=exe[put:put+(11 if i==3 else 10)].hex(),soundSelectorSpecialCase=(i==3))
  elif i<10:
    bit,flag,alloc,allocCall,service,serviceCall,request=init[i-5]
    assert exe[flag:flag+3] in (bytes([0xf6,0xc1,bit]),bytes([0xf6,0x04,0x24])) if bit==1 else exe[flag:flag+4]==bytes([0xf6,0x04,0x24,bit])
    assert exe[alloc]==0xb8 and int.from_bytes(exe[alloc+1:alloc+5],'little')==request
    assert exe[service]==0xb8 and int.from_bytes(exe[service+1:service+5],'little')==bit
    assert exe[serviceCall]==0xe8 and serviceCall+5+int.from_bytes(exe[serviceCall+1:serviceCall+5],'little',signed=True)==0x62c94
    assert exe[allocCall]==0xe8 and allocCall+5+int.from_bytes(exe[allocCall+1:allocCall+5],'little',signed=True)==0x62c74
    rec.update(kind='HARDWARE_FLAG_INITIALIZER',bit=bit,flagTestAt=flag,allocationImmediateAt=alloc,allocationRequest=request,allocationCallAt=allocCall,initializationSelectorAt=service,setupCallAt=serviceCall,flagTestHex=exe[flag:flag+(3 if bit==1 else 4)].hex(),allocationHex=exe[alloc:alloc+5].hex(),selectorHex=exe[service:service+5].hex(),allocatorTarget=0x62c74,setupTarget=0x62c94)
  elif i<15:
    bit,ext,imm,cmp=suffix[i-10];assert exe[imm]==0xb8 and exe[imm+1:imm+5]==ext.encode('ascii')
    assert exe[cmp:cmp+7]==bytes.fromhex('833d38010300')+bytes([bit]);assert exe[cmp+7]==0x74
    displacement=int.from_bytes(exe[cmp+8:cmp+9],'little',signed=True);assert cmp+9+displacement==0x81583
    rec.update(kind='MUSIC_EXTENSION_SELECTION',bit=bit,extension=ext,immediateAt=imm,comparisonAt=cmp,comparisonHex=exe[cmp:cmp+9].hex(),immediateHex=exe[imm:imm+5].hex(),destination=0x81583,selectorGlobal=0x30138)
  elif i<20:
    driver=drivers[i-15];v=(fixture/driver).read_bytes(); assert v[0]==v[4]==0xe8 and v[3]==0xcb and v[7]==0xcf
    a=3+int.from_bytes(v[1:3],'little',signed=True);b=7+int.from_bytes(v[5:7],'little',signed=True);assert a==b and 8<=a<len(v)
    rec.update(kind='NATIVE_DRIVER_TWO_ENTRY_STUBS',driver=driver,driverBytes=len(v),driverSha256=sha(v),first8Hex=v[:8].hex(),sharedTarget=a,sharedTarget16Hex=v[a:a+16].hex(),fileBindingNotProven=True)
  elif i<25:
    name,at,form=menu[i-20];assert exe[at:at+len(bytes.fromhex(form))]==bytes.fromhex(form)
    rec.update(kind='OPTIONS_APPLY_STEP',step=name,offset=at,opcodeHex=form,globalSelector=0x30138,shadowSelector=0x3030b)
  else:
    name,at,form=loader[i-25];assert exe[at:at+len(bytes.fromhex(form))]==bytes.fromhex(form)
    rec.update(kind='AUDIO_MUSIC_LOADER_STEP',step=name,offset=at,opcodeHex=form,requestNotServiceInterpretation=True)
  filename=f'mk2_{ident.lower()}_{rec["kind"].lower()}_2026-10-09.json';path=out/filename;path.write_text(json.dumps(rec,indent=2)+'\n')
  ledger['reports'].append({'pass':ident,'filename':filename,'sha256':sha(path.read_bytes()),'kind':rec['kind']})
(out/'mk2_o108y_options_audio_30pass_ledger_2026-10-09.json').write_text(json.dumps(ledger,indent=2)+'\n')
print(json.dumps({'status':'PRODUCED','passes':len(ids),'kinds':{k:sum(x['kind']==k for x in ledger['reports']) for k in sorted(set(x['kind'] for x in ledger['reports']))}}))
