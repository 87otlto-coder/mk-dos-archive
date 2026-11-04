#!/usr/bin/env python3
"""Independent O97O verifier; reparses authentic LE fixups and re-evaluates 162 outputs."""
import sys,json,hashlib,struct
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]);b=(fixture/'mk2.exe').read_bytes();r=json.loads((root/'mk2_mountain_scene_nine_source_values_and_conditional_profiles_o97o_2026-10-09.json').read_text());h=lambda a:hashlib.sha256(a).hexdigest();u=lambda n:struct.unpack_from('<I',b,n)[0];checks=0
def ck(value,why):
 global checks
 checks+=1
 if not value:raise RuntimeError('O97O independent rejected: '+why)
ck(h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','authentic fixture');ck(r['format']=='mk2_o97o_mountain_scene_nine_serialized_input_matrix_v1' and r['status']=='PASS','report');
for name,reportfield in [('mk2_mountain_runtime_setup_install_o97g_2026-10-09.json','parentO97gSha256'),('mk2_mountain_nine_value_transform_bank_o97n_2026-10-09.json','parentO97nSha256')]:ck(h((root/name).read_bytes())==r[reportfield],'parent '+name)
# Reconstruct every native LE relocation rather than trusting the O97G parent.
le=0x26654+u(0x26654+0x3c);index=le+u(le+0x68);rec=le+u(le+0x6c);base=0x26654+u(le+0x80);ck(le==0x28f0c and base==0x61c54,'LE mapping')
site=None;count=0
for page in range(u(le+0x14)):
 p=rec+u(index+4*page);end=rec+u(index+4*(page+1))
 while p<end:
  kind=b[p]&15;flags=b[p+1];offset=struct.unpack_from('<h',b,p+2)[0];p+=4
  if flags&64:obj=struct.unpack_from('<H',b,p)[0];p+=2
  else:obj=b[p];p+=1
  target=None
  if kind!=2:
   if flags&16:target=u(p);p+=4
   else:target=struct.unpack_from('<H',b,p)[0];p+=2
  if flags&4:p+=4 if flags&32 else 2
  phys=base+4096*page+offset
  if phys==0xa0c54+0x1c2fa:site=(kind,flags,obj,target)
  count+=1
 ck(p==end,'page bounds '+str(page))
ck(count==27004,'LE fixup count');ck(site==(7,16,2,0x172dc),'source pointer relocation type and target')
config=0x1c2e6;fp=0xa0c54+0x1c2fa;src=u(fp);ck(src==0x172dc,'source offset');ck(r['configurationObject2Offset']==config and r['sourcePointerFieldObject2Offset']==0x1c2fa and r['sourcePointerFieldPhysical']==fp,'configuration offsets');ck(r['sourcePointerObject2Offset']==src and r['sourceStartPhysical']==0xa0c54+src,'source mapping');
ck(b[0x81f4a:0x81f55].hex()=='8b1883c004891d225d0700','installer bytes');ck(r['setupInstallerWitness']['hex']==b[0x81f4a:0x81f55].hex() and r['setupInstallerWitness']['destinationGlobal']==0x75d22,'installer report');
inputs=[u(0xa0c54+src+4*i) for i in range(9)];ck(inputs==[0,0,0,0xc000,0xc000,0x12000,0x12000,0x18000,0],'nine source words');ck(r['sourceWords']==inputs and r['sourceWordCount']==9,'source report');
# Independent signed 32-bit arithmetic; including sign-preserving SAR rules.
def signed(x):return x if x<0x80000000 else x-0x100000000
def transform(i,v):
 x=signed(v); a=x>>1; q=x>>2
 result=(a,x,x+q,x+a,x*2,x*3,x*3+a,x*4,x*5,-a,-x,-(x+q),-(x+a),-(x*2),-(x*3),-(x*3+a),-(x*4),-(x*5))[i]
 return result&0xffffffff
names=['sar1','copy','add_sar2','add_sar1','mul2','mul3','mul3_add_sar1','mul4','mul5','neg_sar1','neg','neg_add_sar2','neg_add_sar1','neg_mul2','neg_mul3','neg_mul3_add_sar1','neg_mul4','neg_mul5'];starts=[0x82487,0x824a7,0x824c0,0x824e5,0x82509,0x82529,0x8254a,0x82573,0x82594,0x825b5,0x825d7,0x825f7,0x8261e,0x82644,0x82666,0x82689,0x826b4,0x826d7]
ck(len(r['candidateOutputs'])==18,'profile count');ck(len(set(starts))==18,'distinct entries')
for i,item in enumerate(r['candidateOutputs']):
 ck(item['profileIndex']==i and item['entryPhysical']==starts[i] and item['operation']==names[i],'profile identity '+str(i))
 vals=[transform(i,v) for v in inputs]
 for j,v in enumerate(vals):ck(item['conditionalOutputDwords'][j]==v,'profile '+str(i)+' value '+str(j))
ck(transform(0,0xfffffffd)==0xfffffffe,'negative SAR floor test')
H={'mountainConfigHasNineSerializedSourceDwords':'SUPPORTED','configSetterCanInstallPointerAt_0x75d22':'SUPPORTED_CONDITIONALLY','nineteenSeparateProfiles':'REJECTED','specificArithmeticProfileSelectedDuringBattlePlan':'UNPROVEN','allEighteenOutputsExecute':'UNPROVEN','storedWordsArePixelsPerFrame':'UNPROVEN','sourceArrayIsSingleStageScrollRate':'UNPROVEN'}
for k,v in H.items():ck(r['hypotheses'][k]==v,'boundary '+k)
print(json.dumps({'pass':'O97O','status':'PASS','independent_checks':checks,'failures':0,'LE_fixups':count,'conditionally_evaluated_dwords':162}))
