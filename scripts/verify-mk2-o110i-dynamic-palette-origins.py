#!/usr/bin/env python3
"""Independent source-byte validation for O110I's nine dynamic EAX origins."""
import hashlib,json,struct,sys
from pathlib import Path
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# These are machine-code opcode witnesses independently transcribed from
# disassembly and never imported from the research producer.
BEFORE={
 0x640c7:(0x640b8,'8b1d6c5a07008b430c5b83f8007409'),
 0x64600:(0x645f6,'50508bc7e8f96d010058'),
 0x81dda:(0x81dd5,'03560e8b02'),
 0x85abf:(0x85ab5,'50508bc7e83a59ffff58'),
 0x85c79:(0x85c77,'8b00'),
 0x86b1f:(0x86b18,'8b460485c07411'),
 0x98c65:(0x98c60,'8bc70fb71f'),
 0x98c79:(0x98c74,'8bc70fb71f'),
 0x995a6:(0x9959a,'80fa08751e8bd88b0783c704'),
}
AFTER={
 0x640c7:'66894730',0x64600:'750a',0x81dda:'66894530',
 0x85abf:'750a',0x85c79:'66894730',0x86b1f:'750a',
 0x98c65:'8bd0',0x98c79:'8d7c5f02',0x995a6:'528bd06689156c5a0700'
}
EXPECTED_CLASSES={
 0x640c7:'object_context_field_plus_0c',0x64600:'preserved_caller_eax_across_release_helper',
 0x81dda:'indexed_descriptor_palette_pointer',0x85abf:'preserved_lookup_result_across_release_helper',
 0x85c79:'single_indirect_palette_pointer',0x86b1f:'pointer_from_esi_plus_04',
 0x98c65:'first_intro_palette_record_at_edi',0x98c79:'subsequent_intro_palette_record_at_edi',
 0x995a6:'token_08_cursor_pointer'
}


def verify(exe,parent_bytes,report):
 checks=0
 def require(cond,why):
  nonlocal checks
  assert cond,why
  checks+=1
 require(hashlib.sha256(exe).hexdigest()==EXE_SHA,'exe fingerprint')
 parent=json.loads(parent_bytes)
 require(parent['format']=='mk2_o110f_palette_allocator_callsite_census_v1','parent format')
 require(report['format']=='mk2_o110i_dynamic_palette_request_local_origins_v1','format')
 require(report['status']=='PASS_BOUNDED_STATIC_ONLY','status')
 require(report['parentO110FSHA256']==hashlib.sha256(parent_bytes).hexdigest(),'parent evidence hash')
 require(report['originalExeSHA256']==EXE_SHA and report['allocator']==0x7b439,'identity')
 dynamic={site['callPhysical'] for site in parent['callSites'] if site['immediatelyPrecedingMovEaxImmediate'] is False}
 require(dynamic==set(BEFORE) and len(dynamic)==9,'parent dynamic population')
 actual=[o for o in range(0x61c54,0xa0c54-4) if exe[o]==0xe8 and
     o+5+struct.unpack_from('<i',exe,o+1)[0]==0x7b439]
 require(len(actual)==23 and set(actual)=={s['callPhysical'] for s in parent['callSites']},'independent source call census')
 instances=report['dynamicInputSites']
 require(report['dynamicInputSiteCount']==9 and len(instances)==9,'report population')
 require({s['call'] for s in instances}==dynamic,'report sites exact')
 for site in instances:
  call=site['call'];start,prefix=BEFORE[call];suffix=AFTER[call]
  require(site['originClass']==EXPECTED_CLASSES[call],'origin category')
  require(site['preStart']==start and site['preHex']==prefix,'preceding witness metadata')
  require(exe[start:start+len(bytes.fromhex(prefix))]==bytes.fromhex(prefix),'source preceding witness')
  require(start+len(bytes.fromhex(prefix))<=call,'instruction boundary')
  require(exe[call+5:call+5+len(bytes.fromhex(suffix))]==bytes.fromhex(suffix),'source following witness')
  require(site['postStart']==call+5 and site['postHex']==suffix,'following witness metadata')
  require(call+5+struct.unpack_from('<i',exe,call+1)[0]==0x7b439,'target')
 require(report['outputFieldWordStoreSites']==[0x640cc,0x81ddf,0x85c7e],'3 field-word stores')
 require(report['introFirstHandleSavedInEDXAt']==0x98c6a and report['introOtherPaletteCall']==0x98c79,'intro registers')
 require(report['introFirstHandleBankBaseLookup']==0x98c84,'intro base lookup')
 require(exe[0x98c84:0x98c8c]==bytes.fromhex('0fb604d5065b0700'),'intro native handle-indexed bank lookup')
 token=report['tokenEight']
 require(token=={'opcodeComparisonPhysical':0x9959a,'tokenLiteral':8,
   'sourcePointerLoadAt':0x995a1,'allocatorCallAt':0x995a6,
   'resultMovEdxAt':0x995ac,'globalWordStoreAt':0x995ae,
   'globalStoreAddress':0x75a6c,'storeWidthBits':16,
   'stagePaletteHandleOneBindingProven':False},'token 8 state/limitations')
 require(exe[0x995ab:0x995b5].hex()=='528bd06689156c5a0700','token 8 return capture')
 require(report['nonImmediateDoesNotMeanUnknownPaletteLength'] is True,'unknown length qualification')
 require(len(report['limitations'])==5 and 'not the stage blitter handle 1' in report['limitations'][2],'uncertainty')
 return checks

if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('usage: script <original-mk2-dir> <O110F-evidence> <O110I-evidence>')
 g=(Path(sys.argv[1])/'mk2.exe').read_bytes();p=Path(sys.argv[2]).read_bytes();r=json.loads(Path(sys.argv[3]).read_text());n=verify(g,p,r)
 print(json.dumps({'status':'PASS','checks':n,'failures':0,'dynamicSites':9,'stageHandle1Unproven':True}))
