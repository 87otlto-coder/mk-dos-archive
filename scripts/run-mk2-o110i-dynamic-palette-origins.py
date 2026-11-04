#!/usr/bin/env python3
"""O110I: narrowly classify the nine non-immediate MK2 palette allocator calls.

The decoded local x86 bytes reveal sources and return-value *uses*, not
proven runtime command activation or global palette ownership.
"""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# Each pair is a local exact instruction fragment plus location, not a heuristic
# disassembly from arbitrary overlapping bytes.
WITNESSES=[
 (0x640c7,'object_context_field_plus_0c',0x640b8,'8b1d6c5a07008b430c5b83f8007409',
  0x640cc,'66894730','return stored WORD at EDI+0x30'),
 (0x64600,'preserved_caller_eax_across_release_helper',0x645f6,'50508bc7e8f96d010058',
  0x64605,'750a','return followed by conditional branch; return not stored immediately'),
 (0x81dda,'indexed_descriptor_palette_pointer',0x81dd5,'03560e8b02',
  0x81ddf,'66894530','return stored WORD at EBP+0x30'),
 (0x85abf,'preserved_lookup_result_across_release_helper',0x85ab5,'50508bc7e83a59ffff58',
  0x85ac4,'750a','return followed by conditional branch; return not stored immediately'),
 (0x85c79,'single_indirect_palette_pointer',0x85c77,'8b00',
  0x85c7e,'66894730','return stored WORD at EDI+0x30'),
 (0x86b1f,'pointer_from_esi_plus_04',0x86b18,'8b460485c07411',
  0x86b24,'750a','return followed by conditional branch; return not stored immediately'),
 (0x98c65,'first_intro_palette_record_at_edi',0x98c60,'8bc70fb71f',
  0x98c6a,'8bd0','first returned handle retained in EDX'),
 (0x98c79,'subsequent_intro_palette_record_at_edi',0x98c74,'8bc70fb71f',
  0x98c7e,'8d7c5f02','advances palette-record cursor; no direct saved handle at this instruction'),
 (0x995a6,'token_08_cursor_pointer',0x9959a,'80fa08751e8bd88b0783c704',
  0x995ab,'528bd06689156c5a0700','returned handle converted into WORD store to mutable global 0x75A6C'),
]

def main():
 if len(sys.argv)!=4:raise SystemExit('usage: script <original-mk2-dir> <O110F-evidence> <outdir>')
 d,parent,out=map(Path,sys.argv[1:]);b=(d/'mk2.exe').read_bytes();pb=parent.read_bytes();p=json.loads(pb)
 assert hashlib.sha256(b).hexdigest()==SHA
 assert p['format']=='mk2_o110f_palette_allocator_callsite_census_v1'
 dynamic={x['callPhysical'] for x in p['callSites'] if not x['immediatelyPrecedingMovEaxImmediate']}
 assert len(dynamic)==9 and dynamic=={w[0] for w in WITNESSES}
 result=[]
 for call,label,pre,pre_hex,post,post_hex,meaning in WITNESSES:
  assert pre+len(bytes.fromhex(pre_hex))<=call
  assert b[pre:pre+len(bytes.fromhex(pre_hex))].hex()==pre_hex
  assert call+5==post
  assert b[call]==0xe8 and call+5+struct.unpack_from('<i',b,call+1)[0]==0x7b439
  assert b[post:post+len(bytes.fromhex(post_hex))].hex()==post_hex
  result.append({'call':call,'originClass':label,'preStart':pre,'preHex':pre_hex,
   'postStart':post,'postHex':post_hex,'boundedReturnUse':meaning})
 assert b[0x98c84:0x98c8c].hex()=='0fb604d5065b0700'
 # A second independent path to return-handle semantics: token=8 case.
 assert b[0x9959a:0x995b5].hex().startswith('80fa08751e8bd88b0783c704e88e1efeff528bd06689156c5a0700')
 report={
 'format':'mk2_o110i_dynamic_palette_request_local_origins_v1',
 'status':'PASS_BOUNDED_STATIC_ONLY',
 'originalExeSHA256':SHA,'parentO110FSHA256':hashlib.sha256(pb).hexdigest(),
 'allocator':0x7b439,'dynamicInputSites':result,'dynamicInputSiteCount':len(result),
 'outputFieldWordStoreSites':[0x640cc,0x81ddf,0x85c7e],
 'introFirstHandleSavedInEDXAt':0x98c6a,
 'introFirstHandleBankBaseLookup':0x98c84,
 'introOtherPaletteCall':0x98c79,
 'tokenEight':{'opcodeComparisonPhysical':0x9959a,'tokenLiteral':8,
    'sourcePointerLoadAt':0x995a1,'allocatorCallAt':0x995a6,
    'resultMovEdxAt':0x995ac,'globalWordStoreAt':0x995ae,
    'globalStoreAddress':0x75a6c,'storeWidthBits':16,
    'stagePaletteHandleOneBindingProven':False},
 'nonImmediateDoesNotMeanUnknownPaletteLength':True,
 'limitations':[
  'The nine source classifications are local EAX operand provenance only.',
  'The opcode-8 command path has not been proven to execute during any named stage.',
  'A mutable global storing a palette handle is not the stage blitter handle 1 without interprocedural proof.',
  'E8 byte census is not a runtime trace or a complete disassembler-built control-flow graph.',
  'The 48/64 static palettes and dynamic request sites cannot be assigned to stage colors here.']}
 out.mkdir(parents=True,exist_ok=True);path=out/'MK2_O110I_DYNAMIC_PALETTE_ORIGINS.json'
 path.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'result':'PASS','dynamicSites':len(result),'tokenEightHandleGlobal':hex(0x75a6c),
  'report':str(path),'stagePaletteOwnership':'UNKNOWN'},indent=2))
if __name__=='__main__':main()
