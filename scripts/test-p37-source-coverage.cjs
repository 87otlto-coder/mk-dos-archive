#!/usr/bin/env node
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {summarizeEncodedIntervals:union,buildMK2SourceCoverageP37:build}=require('../src/core/assets/mk2SourceCoverageP37.ts');
let checks=0;function eq(a,b){assert.deepStrictEqual(a,b);checks++;}
const spans=[{assetId:'b',start:5,endExclusive:10},{assetId:'a',start:0,endExclusive:7},{assetId:'c',start:0,endExclusive:7},{assetId:'d',start:12,endExclusive:14}];
const snapshot=JSON.stringify(spans),r=union(20,spans);
eq(r.union,[{start:0,endExclusive:10},{start:12,endExclusive:14}]);eq(r.gaps,[{start:10,endExclusive:12},{start:14,endExclusive:20}]);
eq(r.coveredBytes,12);eq(r.referencedBytes,21);eq(r.duplicateOrOverlappingReferenceBytes,9);eq(r.outsideScopeBytes,8);eq(JSON.stringify(spans),snapshot);
eq(union(0,[]).gaps,[]);eq(union(5,[]).gaps,[{start:0,endExclusive:5}]);eq(union(5,[{assetId:'a',start:0,endExclusive:2},{assetId:'b',start:2,endExclusive:5}]).outsideScopeBytes,0);
let refusals=0;
for(const [size,a,b]of [[10,-1,2],[10,1,11],[10,2,2],[10,3,2],[10,0,NaN],[10,0,Infinity],[10,0,1.5],[10,0,Number.MAX_SAFE_INTEGER+1],[-1,0,1],[1.5,0,1]]){
 assert.throws(()=>union(size,[{assetId:'bad',start:a,endExclusive:b}]));refusals++;
}
const file={name:'CAVE.GRA',path:'nested/CAVE.GRA',size:20,extension:'GRA'},asset={id:'mk2-cave-source:0:original-indices',source:{path:file.path,offset:0,length:5,sha256:'a'.repeat(64)}};
const cave=(files,assets)=>build(files,assets).resources.find(r=>r.name==='CAVE.GRA');
eq(cave([file],[asset]).coveredBytes,5);eq(cave([file],[]).status,'NO_QUALIFIED_INTERVALS_IN_SCOPE');
eq(cave([file,{...file,path:'other/CAVE.GRA'}],[asset]).status,'UNAVAILABLE');
eq(cave([file],[{...asset,source:{...asset.source,path:'other/CAVE.GRA'}}]).status,'UNAVAILABLE');
eq(cave([file],[{...asset,source:{...asset.source,length:21}}]).status,'UNAVAILABLE');
eq(cave([file],[{...asset,source:{...asset.source,sha256:undefined}}]).status,'UNAVAILABLE');
eq(cave([file],[asset,{...asset,id:'mk2-cave-source:1:original-indices',source:{...asset.source,sha256:'b'.repeat(64)}}]).status,'UNAVAILABLE');
eq(cave([file],[{...asset,id:'unqualified-whole-file'}]).coveredBytes,0);
eq(cave([],[]).status,'UNAVAILABLE');
eq(cave([file],[{...asset,source:{...asset.source,path:'CAVE.GRA'}}]).coveredBytes,5);
console.log(JSON.stringify({status:'PASS',checks,invalidIntervalRefusals:refusals,dummyMetadataOnly:true},null,2));

