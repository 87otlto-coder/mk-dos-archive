#!/usr/bin/env python3
"""O95T independent machine-byte verifier. No dependence on the JS producer.
Distinct implementation: decode source register from opcode/modrm and validate
actual preceding origin/load instructions; fail closed on any unsupported route.
"""
import sys,json,hashlib,struct,pathlib
if len(sys.argv)!=5:
    raise SystemExit('Usage: python scripts/verify-mk2-o95t-identity-copy-provenance.py <MK2.EXE> <O95F.json> <O95T.json> <source-root>')
exe_p,old_p,new_p,root=map(pathlib.Path,sys.argv[1:]); data=exe_p.read_bytes(); old_buf=old_p.read_bytes(); old=json.loads(old_buf); new=json.loads(new_p.read_bytes()); n=0

def good(k,v):
    global n
    n+=1
    if not v:raise AssertionError('O95T independent: '+k)

def sha(v):return hashlib.sha256(v).hexdigest()

def sl(pos,length):return data[pos:pos+length]

def le(pos):return struct.unpack_from('<I',data,pos)[0]

# Independently derive source-byte shapes from prior authenticated writer positions.
# Exact pointer-base location checks are independent of O95T's reported origin address.
base_locations={
  0x67a11:(0x67a08,bytes.fromhex('8b1d7c5a0700')),
  0x7b1aa:(0x7b19c,bytes.fromhex('8915785a0700')),
  0x7bca5:(0x7bc9b,bytes.fromhex('8b1d805a0700')),
  0x8399b:(0x83992,bytes.fromhex('a17c5a0700')),
  0x845ba:(0x845b1,bytes.fromhex('a1805a0700')),
  0x85c73:(0x85c56,bytes.fromhex('ba02000000')),
  0x95237:(0x9522e,bytes.fromhex('a17c5a0700')),
  0x95d57:(0x95d4e,bytes.fromhex('a17c5a0700')),
  0x960a2:(0x9607f,bytes.fromhex('8b3d805a0700')),
  0x96228:(0x96221,bytes.fromhex('8b4628')),
  0x971a8:(0x9719f,bytes.fromhex('a17c5a0700')),
  0x97f2b:(0x97f22,bytes.fromhex('a17c5a0700')),
}
known_source={
  0x67a11:(0x67a0e,'edi','ebx'),0x7b1aa:(0x7b1a4,'global','edi'),
  0x7bca5:(0x7bca2,'ebx','edi'),0x8399b:(0x83998,'eax','edi'),
  0x845ba:(0x845b7,'eax','edi'),0x85c73:(0x85c6d,'global','edi'),
  0x95237:(0x95234,'eax','edi'),0x95d57:(0x95d54,'eax','edi'),
  0x960a2:(0x9609f,'edi','ebx'),0x96228:(0x96225,'eax','edi'),
  0x971a8:(0x971a5,'eax','edi'),0x97f2b:(0x97f28,'edi','eax')
}
reg=['eax','ecx','edx','ebx','esp','ebp','esi','edi']
good('fixture hash',sha(data)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
good('upstream O95F hash',new['source']['o95fSha256']==sha(old_buf))
good('report fixture hash',new['source']['exeSha256']==sha(data))
good('machine schema',new['format']=='mk2_animation_identity_copy_provenance_o95t_v1' and new['status']=='SUCCESS')
good('upstream identity scope',old['identityWriteCensus']['qualifiedCodeWriteSites']==24 and old['identityWriteCensus']['constantImmediateWrites']==12)
raw={s['physical'] for s in old['identityWriteCensus']['sites'] if s['kind']=='COPY_OR_DYNAMIC'}
good('12 earlier sites unchanged',len(raw)==12 and raw==set(known_source))
reported=new['sites'];good('12 unique report sites',len(reported)==12 and {s['identityWriterPhysical'] for s in reported}==raw)
object_count=global_count=0
for row in reported:
 p=row['identityWriterPhysical'];start,src_reg,dst_reg=known_source[p]
 base,expected_base=base_locations[p]
 good('physical hex '+hex(p),row['identityWriterHex']==f'0x{p:X}')
 good('prior O95F identity-write site '+hex(p),p in raw)
 good('base-load opcode '+hex(p),sl(base,len(expected_base))==expected_base)
 good('base origin address '+hex(p),row['pointerBaseInstructionPhysical']==base)
 good('base hex '+hex(p),row['pointerBaseInstructionHex']==expected_base.hex())
 writer=sl(p,3)
 good('destination instruction is 0x89 +46 '+hex(p),writer[0]==0x89 and writer[2]==0x46 and (writer[1]&0xc0)==0x40)
 sink=reg[(writer[1]&7)]
 rsource=reg[(writer[1]>>3)&7]
 good('source register to writer '+hex(p),rsource=='edx' if p in (0x7b1aa,0x85c73,0x7bca5,0x8399b,0x845ba,0x95237,0x95d57,0x960a2,0x96228,0x971a8,0x97f2b) else rsource=='ecx')
 good('target register '+hex(p),sink==dst_reg)
 good('reported writer bytes '+hex(p),row['writerInstructionHex']==writer.hex())
 good('exact source instruction start '+hex(p),row['sourceInstructionPhysical']==start)
 src=sl(start,p-start)
 good('reported source bytes '+hex(p),row['sourceInstructionHex']==src.hex())
 if src[0]==0x8b and len(src)==3 and src[2]==0x46:
    good('source memory is object +46 '+hex(p),(src[1]&0xc0)==0x40 and reg[src[1]&7]==src_reg)
    good('load/write use same temp register '+hex(p),((src[1]>>3)&7)==((writer[1]>>3)&7))
    good('object source category '+hex(p),row['sourceKind']=='OBJECT_FIELD_COPY')
    object_count+=1
 elif src==bytes.fromhex('8b15785a0700'):
    good('shared cursor source category '+hex(p),row['sourceKind']=='GLOBAL_SCALAR_TO_IDENTITY')
    good('global cursor address '+hex(p),le(start+2)==0x75a78)
    global_count+=1
 else: raise AssertionError('unsupported source instruction '+hex(p)+' '+src.hex())
 good('not numeric-qualified '+hex(p),row['numericIdentityQualified'] is False)
 good('not animation-qualified '+hex(p),row['animationStreamQualified'] is False)
 context_start=min(base,start)
 good('context starts '+hex(p),row['contextStart']==context_start)
 good('context ends '+hex(p),row['contextEndExclusive']==p+3)
 good('context SHA '+hex(p),row['contextSha256']==sha(data[context_start:p+3]))

good('object count 10',object_count==10 and new['counts']['objectFieldCopies']==10)
good('global count 2',global_count==2 and new['counts']['sharedCursorGlobalToIdentity']==2)
good('no new animation witness',new['boundary']['existingFixedIdentityWitnesses']==7 and new['boundary']['doesNotIncreaseFixedIdentityWitnesses'] is True)
good('conservative terminal and strong counts',new['boundary']['existingTerminalQualifiedCalls']==210 and new['boundary']['existingStrongConsumerQualifiedCalls']==239)
good('conservative held count',new['boundary']['existingHeldCalls']==14)
good('open MK2',new['boundary']['mk2ResearchClosed'] is False)
good('no cross-class grammar',new['boundary']['doesNotResolveStreamGrammarTimingOrPalette'] is True)
good('no numeric slot promotion',new['boundary']['objectFieldCopyDoesNotProveNumericSlot'] is True)
good('global scalar not animation pointer',new['boundary']['globalCursorUsedAsScalarCannotBeAssumedAnimationPointer'] is True)
print(json.dumps({'verdict':'PASS','checks':n,'failures':0,'objectCopies':object_count,'cursorGlobalSources':global_count,'numericIdentityWitnessesAdded':0},indent=2))
