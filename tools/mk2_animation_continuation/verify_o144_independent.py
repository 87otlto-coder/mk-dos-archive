#!/usr/bin/env python3
"""Independent static real-executable O144 audit, no dependency on producer."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED=((0x8020e,0x80222,0x84348,0x84326),(0x80227,0x8023b,0x84344,0x84322),
          (0x80240,0x80254,0x84340,0x8431e),(0x80259,0x8026d,0x8433c,0x8431a),
          (0x80272,0x80286,0x84338,0x84316),(0x8028b,0x8029f,0x84334,0x84312))
CODE={0x8050c:'0fbf15ea420800',0x80513:'8915705a0700',0x8051a:'8b38',0x8051c:'f7c7ffffffff',
      0x80524:'0fbf471a',0x80528:'2b056c5a0700',0x8052e:'6689471a',0x80532:'0fbf471e',
      0x80536:'2b05705a0700',0x8053c:'6689471e',0x80540:'e83140feff',0x80547:'ebd1',0x64576:'834f3401'}
class Bad(AssertionError):pass
def verify(b,r):
 n=0
 def ck(x,s):
  nonlocal n
  if not x:raise Bad('O144 '+s)
  n+=1
 ck(len(b)==861133 and hashlib.sha256(b).hexdigest()==SHA,'canonical executable')
 ck(r['schema']=='mk2_o144_stage_object_list_position_normalization_v1' and r['canonicalEXESHA256']==SHA,'report identity')
 ck(r['normalizerPhysical']==0x8050b,'source decoder function')
 for at,hexv in CODE.items():ck(b[at:at+len(bytes.fromhex(hexv))]==bytes.fromhex(hexv),'original source instruction')
 ck(len(r['originalInstructions'])==17,'reported source instructions')
 for row in r['originalInstructions']:
  at=row['physical'];raw=bytes.fromhex(row['bytes']);ck(b[at:at+len(raw)]==raw and at in (*CODE,0x8050b,0x80522,0x80545,0x80549),'reported witness code')
 ck(len(r['sourceListNormalizationSites'])==6,'list/site population')
 for row,(start,call,head,offset) in zip(r['sourceListNormalizationSites'],EXPECTED):
  ck(row=={'listHeadAddress':head,'horizontalSourceSignedWordAddress':offset,'callPhysical':call,'listHeadImmediatePhysical':start},'list root and stage offset')
  ck(b[start]==0xb8 and struct.unpack_from('<I',b,start+1)[0]==head,'list immediate')
  ck(b[start+5]==0x52 and b[start+6:start+9]==b'\x0f\xbf\x15' and struct.unpack_from('<I',b,start+9)[0]==offset,'stage offset source')
  ck(b[call]==0xe8 and call+5+struct.unpack_from('<i',b,call+1)[0]==0x8050b,'original code call')
 ck(0x80545+struct.unpack_from('<i',b,0x80541)[0]==0x64576,'flag setter branch')
 ck(r['sourceOperations']==['iterate list using render object +0x00 next pointer',
   'read signed high word at object +0x1A; subtract list-specific signed stage source word; write back',
   'read signed high word at object +0x1E; subtract signed source word at 0x842EA; write back',
   'call object flag setter 0x64576, setting bit 0 at object +0x34'],'precise source action')
 ck(r['limits']=={'sourceStageOffsetTraversalVerified':True,'offsetActualRuntimeValuesKnown':False,
   'provenWorldOrScreenPosition':False,'transformationHappensInActualFightVerified':False,
   'drawRasterTraversalVerified':False,'sourceSequenceFPSVerified':False},'confidence scope')
 return {'status':'PASS_O144_INDEPENDENT_STATIC','assertions':n,'listPositionAdjustmentPaths':6,'actualRuntimeOffsetsVerified':False}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--report',required=True);opt=a.parse_args()
 print(json.dumps(verify(Path(opt.exe).read_bytes(),json.loads(Path(opt.report).read_text())),indent=2))
