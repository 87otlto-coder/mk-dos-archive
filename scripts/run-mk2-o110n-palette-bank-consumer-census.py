#!/usr/bin/env python3
"""O110N: directly indexed palette-bank byte reads/writes and alternate renderer mode.

This is a code-image operand census, not a full disassembler or a runtime trace.
"""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BANK=0x75b06
SITES=[
 ('blitContextBankRead',0x64c96,'read','0fb614dd065b0700'),
 ('scriptColorBankAdd',0x6503c,'read','0214c5065b0700'),
 ('spriteModeFlagAddBank',0x6535c,'read','0204ed065b0700'),
 ('spriteDefaultBankLoad',0x65365,'read','8a04ed065b0700'),
 ('stagePackedRasterBankLoad',0x659ea,'read','8a04c5065b0700'),
 ('otherResourceBankRead',0x746bb,'read','0fb614dd065b0700'),
 ('allocatorActiveBankRead',0x7b464,'read','8a14dd065b0700'),
 ('allocatorNewBankWrite',0x7b4b1,'write','8814dd065b0700'),
 ('allocatorExistingBankCompare',0x7b4ce,'read','3814dd065b0700'),
 ('allocatorShiftBankWrite',0x7b4d7,'write','8814dd065b0700'),
 ('introPaletteBankRead',0x98c84,'read','0fb604d5065b0700')]

def main():
 if len(sys.argv)!=4:raise SystemExit('usage <original-mk2-dir> <O110H-json> <outdir>')
 source,prior,out=map(Path,sys.argv[1:]);b=(source/'mk2.exe').read_bytes();pb=prior.read_bytes()
 assert hashlib.sha256(b).hexdigest()==SHA
 assert json.loads(pb)['format']=='mk2_o110h_palette_handle_lifecycle_v1'
 found=[i for i in range(0x61c54,0xa0c54-3) if b[i:i+4]==struct.pack('<I',BANK)]
 assert found==[at+len(bytes.fromhex(hx))-4 for _,at,_,hx in SITES]
 for _,at,_,hx in SITES:assert b[at:at+len(hx)//2].hex()==hx
 # Source-local optional ADD vs MOV proves a distinct color-bank addressing mode.
 assert b[0x65357:0x6535c]==bytes.fromhex('f6c2087409')
 assert b[0x6535c:0x65363]==bytes.fromhex('0204ed065b0700')
 assert b[0x65363:0x6536c]==bytes.fromhex('eb078a04ed065b0700')
 assert b[0x659e7:0x659ea]==bytes.fromhex('0fb7e8')
 assert b[0x659f1:0x659f7]==bytes.fromhex('4825ff000000')
 report={'format':'mk2_o110n_palette_bank_direct_consumer_census_v1','status':'PASS_CODE_IMAGE_CENSUS',
   'originalExeSHA256':SHA,'parentO110HSHA256':hashlib.sha256(pb).hexdigest(),
   'bankStartArrayLinearBase':BANK,'exactDirectOperandPositions':found,
   'sites':[{'name':name,'opcodeAt':at,'kind':kind,'bytes':hx,
              'operandAt':at+len(bytes.fromhex(hx))-4} for name,at,kind,hx in SITES],
   'counts':{'readSites':9,'writeSites':2,'total':11},
   'alternateSpriteBlitter':{'modeFlagTestAt':0x65357,'modeMask':8,
       'flagSetBranchBankOperationAt':0x6535c,'flagSetOperation':'ADD_AL_BANK_START',
       'flagClearBankOperationAt':0x65365,'flagClearOperation':'MOV_AL_BANK_START',
       'commonBankZeroBaseAdjustmentAt':0x6536c,'additionalSourceChannelWhenFlagSet':'AL prior to ADD, runtime dependent',
       'actualModeActivationObserved':False},
   'packedStageBlitter':{'paletteHandleInputRegister':'EAX','literalOneSetInCaller':0x9e18b,
       'bankByteReadAt':0x659ea,'bankBaseDecrementAt':0x659f1,
       'differentFromFlaggedSpriteBlitter':True,'paletteRecordAtHandleOneKnown':False},
   'conclusions':{'bankByteFieldReadByMultipleConsumers':True,
       'bankBytesMayBeRewrittenByAllocator':True,
       'alternateSpriteBankOffsetMechanismSupported':True,
       'allPossibleIndirectAccessesCovered':False,'stageRGBOrPaletteOwnershipProven':False},
   'limitations':['This census enumerates exact immediate 32-bit operands in file-backed Object 1 only.',
       'Indirect/aliased writes are not excluded; source-mode flag does not prove it executes for any sprite.',
       'Both blitters use a bank byte, not evidence for actual runtime slot ownership or colored stage scenes.']}
 out.mkdir(parents=True,exist_ok=True);dst=out/'MK2_O110N_PALETTE_BANK_CONSUMERS.json';dst.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','pass':'O110N','readSites':9,'writeSites':2,'out':str(dst)}))
if __name__=='__main__':main()
