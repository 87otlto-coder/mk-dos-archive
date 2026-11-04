#!/usr/bin/env python3
"""Independent source-image bank array and conditional renderer checks for O110N."""
import hashlib,json,struct,sys
from pathlib import Path
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED=[(0x64c96,'read','0fb614dd065b0700'),(0x6503c,'read','0214c5065b0700'),
 (0x6535c,'read','0204ed065b0700'),(0x65365,'read','8a04ed065b0700'),
 (0x659ea,'read','8a04c5065b0700'),(0x746bb,'read','0fb614dd065b0700'),
 (0x7b464,'read','8a14dd065b0700'),(0x7b4b1,'write','8814dd065b0700'),
 (0x7b4ce,'read','3814dd065b0700'),(0x7b4d7,'write','8814dd065b0700'),
 (0x98c84,'read','0fb604d5065b0700')]

def verify(exe,parent,r):
 n=0
 def c(x,name):
  nonlocal n
  assert x,name;n+=1
 c(hashlib.sha256(exe).hexdigest()==HASH,'exe digest')
 c(r['format']=='mk2_o110n_palette_bank_direct_consumer_census_v1','format')
 c(r['status']=='PASS_CODE_IMAGE_CENSUS','status')
 c(r['originalExeSHA256']==HASH,'report hash')
 c(r['parentO110HSHA256']==hashlib.sha256(parent).hexdigest(),'parent link')
 c(json.loads(parent)['format']=='mk2_o110h_palette_handle_lifecycle_v1','parent format')
 c(r['bankStartArrayLinearBase']==0x75b06,'bank field')
 expectedpos=[at+len(raw)//2-4 for at,_,raw in EXPECTED]
 positions=[j for j in range(0x61c54,0xa0c54-3) if exe[j:j+4]==bytes.fromhex('065b0700')]
 c(positions==expectedpos and positions==r['exactDirectOperandPositions'],'11 source refs')
 c(len(r['sites'])==11,'site count')
 for site,(at,kind,raw) in zip(r['sites'],EXPECTED):
  c(site['opcodeAt']==at and site['operandAt']==at+len(raw)//2-4,'location')
  c(site['kind']==kind and site['bytes']==raw,'typing')
  c(exe[at:at+len(raw)//2].hex()==raw,'authentic instruction')
 c(r['counts']=={'readSites':9,'writeSites':2,'total':11},'site class')
 c(exe[0x65357:0x6535c].hex()=='f6c2087409','select flag')
 c(exe[0x6535c:0x65363].hex()=='0204ed065b0700','alternate add')
 c(exe[0x65363:0x6536c].hex()=='eb078a04ed065b0700','other load')
 c(exe[0x659e7:0x659ea].hex()=='0fb7e8','bank register prior')
 c(exe[0x659f1:0x659f7].hex()=='4825ff000000','bank decrement/mask')
 a=r['alternateSpriteBlitter']
 c(a['modeFlagTestAt']==0x65357 and a['modeMask']==8,'mode bit')
 c(a['flagSetBranchBankOperationAt']==0x6535c and a['flagSetOperation']=='ADD_AL_BANK_START','ADD')
 c(a['flagClearBankOperationAt']==0x65365 and a['flagClearOperation']=='MOV_AL_BANK_START','MOV')
 c(a['commonBankZeroBaseAdjustmentAt']==0x6536c,'normalize')
 c(a['actualModeActivationObserved'] is False,'unproven execution')
 p=r['packedStageBlitter']
 c(p['literalOneSetInCaller']==0x9e18b and p['bankByteReadAt']==0x659ea,'stage consumer')
 c(p['bankBaseDecrementAt']==0x659f1 and p['paletteRecordAtHandleOneKnown'] is False,'unknown ownership')
 for key,correct in {'bankByteFieldReadByMultipleConsumers':True,'bankBytesMayBeRewrittenByAllocator':True,
  'alternateSpriteBankOffsetMechanismSupported':True,'allPossibleIndirectAccessesCovered':False,
  'stageRGBOrPaletteOwnershipProven':False}.items():c(r['conclusions'][key] is correct,'conclusion '+key)
 c(len(r['limitations'])==3,'scope')
 return n
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('usage <mk2-dir> <O110H-json> <O110N-json>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();p=Path(sys.argv[2]).read_bytes();r=json.loads(Path(sys.argv[3]).read_text())
 print(json.dumps({'status':'PASS','pass':'O110N','checks':verify(b,p,r),'failures':0}))
