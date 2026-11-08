#!/usr/bin/env node
/** P78 original-source chain and false-evidence controls, synthetic data only. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,p)=>m._compile(
  ts.transpileModule(fs.readFileSync(p,'utf8'),{
    fileName:p,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText,p);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {decodeMK3P78ChainedGap,MK3_P78_NEW_RECORDS,
  MK3_P78_ALL_ORIGINAL_SOURCE_RECORDS,MK3_P78_GROUP_COUNTS,
  MK3_P78_ADDITIONAL_GROUP,MK3_P78_SOURCE_CHAIN_FORMAT,
  recoverMK3P78AdditionalChainedAssets}=
 require('../src/core/assets/mk3ChainedSourceImagesP78.ts');
const {indexedAssetZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const write16=(n)=>{const b=Buffer.alloc(2);b.writeInt16LE(n);return b};
function record(width=8,lastTail=Buffer.from([0x73])){
 const first=Buffer.concat([write16(2),Buffer.from([5,0]),write16(0)]);
 const second=Buffer.concat([write16(-1),write16(2),Buffer.from([9,10]),write16(0)]);
 const packed=Buffer.concat([first,second,lastTail]);
 const header=Buffer.alloc(24);
 header.writeUInt16LE(width,0);header.writeUInt16LE(3,2);header.writeUInt32LE(packed.length,20);
 const x=Buffer.alloc(12),pointer=Buffer.alloc(12);
 x.writeInt32LE(2,0);x.writeInt32LE(-1,4);x.writeInt32LE(4,8);
 pointer.writeUInt32LE(first.length,8);
 const rgb=Buffer.alloc(768);
 for(let i=0;i<768;i++)rgb[i]=i&255;
 return Buffer.concat([header,rgb,packed,x,pointer]);
}
(async()=>{
 assert.equal(MK3_P78_NEW_RECORDS,197);
 assert.equal(MK3_P78_ALL_ORIGINAL_SOURCE_RECORDS,216);
 assert.equal(MK3_P78_GROUP_COUNTS.length,19);
 assert.equal(MK3_P78_GROUP_COUNTS.reduce((a,b)=>a+b),216);
 assert.match(MK3_P78_ADDITIONAL_GROUP,/chained indexed \(P78\)/);
 let positive=0,rejected=0;
 const first=record(),next=record(9,Buffer.alloc(0));
 const both=new Uint8Array(Buffer.concat([first,next]));
 const chain=decodeMK3P78ChainedGap(both,0,both.length);
 assert.equal(chain.additional.length,1);
 assert.equal(chain.exactEnd,both.length);
 assert.equal(chain.first.afterTablesOffset,first.length);
 assert.equal(chain.additional[0].regionOffset,first.length);
 assert.equal(chain.additional[0].afterTablesOffset,both.length);
 assert.equal(chain.first.mask[2],1);
 assert.equal(chain.first.indices[2],5);
 assert.equal(chain.first.mask[3],1);
 assert.equal(chain.first.indices[3],0,'original literal zero must remain opaque');
 assert.equal(chain.first.mask[8+2],0,'absent source row is preview-transparent');
 assert.equal(chain.additional[0].indices[2*9+5],9,'original second-record row X placement');
 assert.equal(chain.first.unexplainedFinalByteHex,'73');
 assert.equal(chain.additional[0].unexplainedFinalByteHex,'');
 assert.equal(chain.additional[0].rgb8Candidate.length,768);
 positive++;
 const q=chain.additional[0];
 const source={path:'DATA.MK3',offset:q.regionOffset,
  length:q.afterTablesOffset-q.regionOffset,sha256:'a'.repeat(64)};
 const a={id:'DATA.MK3:p78:source-chain:01:001:'+q.regionOffset,
  name:'Source chained test',group:MK3_P78_ADDITIONAL_GROUP,
  kind:'image',format:'Original source-chained indexed RLE',
  confidence:'SYNTHETIC; not native palette ownership',
  source,width:q.width,height:q.height,rgba:q.rgba,
  filename:'test_index.png',
  metadata:{indices:q.indices,mask:q.mask,
   firstStream:q.firstStream,rowXTable:q.rowXTable,rowPointerTable:q.rowPointerTable,
   sourceAdjacentRgb8Candidate:q.rgb8Candidate,
   sourceRecordFormat:MK3_P78_SOURCE_CHAIN_FORMAT,
   nativePaletteOwnershipVerified:false,
   originalRendererPlacementVerified:false,
   originalStageOrAnimationMembershipVerified:false,
   palette:'UNKNOWN',visualization:'GRAYSCALE_INDEX_MAP'}};
 const parts=parseAnimationStoreZip(indexedAssetZip(a).bytes);
 assert.equal(parts.size,8,'original indexed ZIP: PNG, six source bytes and manifest');
 const fields={indices:q.indices,mask:q.mask,firstStream:q.firstStream,
    rowXTable:q.rowXTable,rowPointerTable:q.rowPointerTable,
    sourceAdjacentRgb8Candidate:q.rgb8Candidate};
 for(const [field,expected] of Object.entries(fields)){
  const keys=[...parts.keys()].filter(name=>name.endsWith('_'+field+'.bin'));
  assert.equal(keys.length,1,field+' source evidence sidecar');
  assert.deepEqual(parts.get(keys[0]).bytes,expected);
 }
 const metadata=JSON.parse(new TextDecoder().decode(parts.get('manifest.json').bytes));
 assert.equal(metadata.selectionOrder[0].metadata.nativePaletteOwnershipVerified,false);
 assert.equal(metadata.selectionOrder[0].metadata.palette,'UNKNOWN');
 assert.equal(metadata.selectionOrder[0].source.offset,first.length);
 positive++;
 function refuse(label,bytes,re=/source|region|record|row|bounds|stream|pointer|extent|dimension/){
  assert.throws(()=>decodeMK3P78ChainedGap(bytes,0,bytes.length),re,label);
  rejected++;
 }
 refuse('unparsed junk after first record',new Uint8Array(Buffer.concat([first,Buffer.from('junk')]))); 
 refuse('truncated second record',new Uint8Array(Buffer.concat([first,next.subarray(0,200)])));
 const badW=Buffer.from(both);badW.writeUInt16LE(0,first.length);
 refuse('invalid second width',new Uint8Array(badW));
 const badPacked=Buffer.from(both);badPacked.writeUInt32LE(0xffffffff,first.length+20);
 refuse('false second compressed size',new Uint8Array(badPacked));
 const badSentinel=Buffer.from(both);const p=first.length+792+
    next.readUInt32LE(20);badSentinel.writeInt32LE(-2,p+4);
 refuse('unsupported source row sentinel',new Uint8Array(badSentinel));
 const badPointer=Buffer.from(both);badPointer.writeUInt32LE(0,p+12+8);
 refuse('duplicate active source row pointer',new Uint8Array(badPointer));
 const badFirst=Buffer.from(both);badFirst.writeInt32LE(10,p);
 refuse('row X exceeds source width',new Uint8Array(badFirst));
 assert.throws(()=>decodeMK3P78ChainedGap(both,-1,both.length),/bounds/);rejected++;
 assert.throws(()=>decodeMK3P78ChainedGap(both,0,both.length+1),/bounds/);rejected++;
 const aborted=new AbortController();aborted.abort();
 assert.throws(()=>decodeMK3P78ChainedGap(both,0,both.length,aborted.signal));rejected++;
 await assert.rejects(recoverMK3P78AdditionalChainedAssets({
  listRecursive:async()=>[],readSlice:async()=>new Uint8Array(),
 },[]),/9,205-item/);rejected++;
 // This test guards actual UI source linkage but does not pretend to use real Chrome.
 const browser=fs.readFileSync(require.resolve('../src/components/AssetBrowser.tsx'),'utf8');
 assert.match(browser,/Show 19 recovered indexed graphics/);
 assert.match(browser,/Show 197 additional indexed graphics/);
 assert.match(browser,/recoverMK3P78AdditionalChainedAssets/);
 assert.match(browser,/p78AdditionalChainedIndexedSource/);
 assert.match(browser,/collection\.assets\.length === 9205/);
 assert.match(browser,/collection\.assets\.length === 9186/);
 assert.match(browser,/native animation order\/timing remain UNKNOWN/);
 positive++;
 console.log(JSON.stringify({pass:'P78_SOURCE',status:'PASS',
  syntheticPositiveSourceChainAndOriginalIndexedZipControls:positive,
  malformedChainedSourceAndFalseEvidenceRejected:rejected,
  defaultMk3BaselineAutoModified:false,
  acceptedP76FirstImagesReplaced:false,
  newOriginalChainedSourceRecords:197,
  nativePaletteOrRuntimeTimingClaimed:false,
  originalCommercialGameDataUsed:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
