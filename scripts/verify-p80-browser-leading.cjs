#!/usr/bin/env node
/** P80 real Chrome MK3 leading base image and 216 raw continuation records.
 * node scripts/verify-p80-browser-leading.cjs <original MK3 directory>
 * Requires built app, Google Chrome, playwright-core via NODE_PATH, Python
 * and Pillow. Original game and downloaded archives stay on the local host.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
async function main(){
 assert.equal(process.argv.length,3,'original DOS MK3 directory required');
 const originals=fs.realpathSync(process.argv[2]);
 assert(fs.statSync(originals).isDirectory());
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
 try{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
   const page=await browser.newPage({acceptDownloads:true,locale:'en-US'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   async function takeDownload(button){
    const [got]=await Promise.all([page.waitForEvent('download',{timeout:180000}),button.click()]);
    assert.equal(await got.failure(),null,'Chrome original file download incomplete');
    const filename=got.suggestedFilename();
    const file=await got.path();
    assert(file&&fs.existsSync(file),'downloaded file not available for source readback');
    return {file,filename};
   }
   try{
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
    await page.locator('input[webkitdirectory]').setInputFiles(originals);
    await page.getByRole('button',{name:'Change directory'}).waitFor({timeout:240000});
    await page.getByRole('button',{name:'Asset library'}).click();
    await page.getByRole('button',{name:'Decode & browse'}).click();
    const evidence=page.locator('.asset-evidence summary');
    await evidence.waitFor({timeout:300000});
    assert.match(await evidence.innerText(),/9,186 assets$/);
    await page.getByRole('button',{name:'Show 19 recovered indexed graphics'}).click();
    await page.getByText('P76 source-row graphics added: 19 separate indexed images.')
      .waitFor({timeout:300000});
    assert.match(await evidence.innerText(),/9,205 assets$/);
    await page.getByRole('button',{name:'Show 197 additional indexed graphics'}).click();
    await page.getByText('P78 original chained indexed images added: 197 separate source records.')
      .waitFor({timeout:300000});
    assert.match(await evidence.innerText(),/9,402 assets$/);
    await page.getByRole('button',{name:'Show leading base image + 216 raw records'}).click();
    await page.getByText('P80 source recovered: 1 original indexed base image and 216 raw continuation records.')
      .waitFor({timeout:300000});
    assert.match(await evidence.innerText(),/9,619 assets$/,
      'one original base index image and 216 raw records required');
    const group=page.getByLabel('Resource group'),kind=page.getByLabel('Asset type');
    const options=page.getByRole('listbox',{name:'Assets'}).getByRole('option');
    assert.equal(await options.count(),1,'P80 original base group contains exactly one source image');
    assert.match(await options.first().locator('strong').innerText(),/Leading source index plane/);
    await group.selectOption('DATA.MK3 · recovered indexed (P76)');
    assert.equal(await options.count(),19,'previous accepted P76 first source images changed');
    await group.selectOption('DATA.MK3 · additional chained indexed (P78)');
    assert.equal(await options.count(),60,'accepted P78 first page must remain accessible');
    assert.match(await page.locator('.asset-page-controls span').innerText(),/of 197$/);
    await group.selectOption('DATA.MK3 · leading base indexed (P80)');
    await options.first().click();
    const inspector=page.locator('.asset-inspector');
    assert.match(await inspector.innerText(),/original.*opacity|Original.*alpha|native opacity/i);
    const baseDownload=await takeDownload(
      inspector.getByRole('button',{name:'Export indexed asset ZIP'}));
    assert.equal(baseDownload.filename,
      'MK3_DATA_LEADING_P80_BASE_INDEX_GRAYSCALE_INDEXED.zip');
    // The original raw bytes are individually exportable, not invented frames.
    await kind.selectOption('raw');
    await group.selectOption('DATA.MK3 · leading raw continuations (P80)');
    assert.equal(await options.count(),60,'P80 raw first 60 records displayed');
    assert.match(await page.locator('.asset-page-controls span').innerText(),/of 216$/);
    assert.match(await options.first().locator('strong').innerText(),/record 000/);
    await options.first().click();
    const raw000=await takeDownload(inspector.getByRole('button',{name:'Export this asset'}));
    assert.equal(raw000.filename,'MK3_DATA_LEADING_P80_RECORD_000.bin');
    const next=page.locator('.asset-page-controls').getByRole('button',{name:'Next'});
    await next.click();await next.click();
    assert.match(await page.locator('.asset-page-controls span').innerText(),/121.*180 of 216/);
    assert.match(await options.first().locator('strong').innerText(),/record 120/);
    await options.first().click();
    const raw120=await takeDownload(inspector.getByRole('button',{name:'Export this asset'}));
    assert.equal(raw120.filename,'MK3_DATA_LEADING_P80_RECORD_120.bin');
    const py=spawnSync(process.env.PYTHON||'python',[
      path.join(__dirname,'verify-mk3-p80-browser-independent.py'),
      originals,baseDownload.file,raw000.file,raw120.file
    ],{encoding:'utf8',timeout:360000,maxBuffer:2*1024*1024,windowsHide:true});
    if(py.error||py.status!==0)throw Error('P80 independent Chrome PNG/original raw verification FAILED:\n'+
      [py.error?.message,py.stderr,py.stdout].filter(Boolean).join('\n'));
    const truth=JSON.parse(py.stdout);
    assert.equal(truth.status,'PASS');
    assert.equal(truth.originalSourceIndexedPositions,64000);
    assert.equal(truth.downloadedOriginalRawRecordsByteExact,2);
    assert.equal(truth.originalEmptyStoredRecordsPreserved,6);
    assert.equal(truth.unknownNativePaletteAndOpacityPreserved,true);
    assert.equal(truth.nativeContinuationFramesAsserted,false);
    assert.deepStrictEqual(errors,[],'Chrome original game page errors');
    console.log(JSON.stringify({
      pass:'P80_BROWSER',status:'PASS',game:'mk3',
      acceptedOriginalBaseline:9186,p76ImageOptIn:19,p78ImageOptIn:197,
      newP80BaseImages:1,newOriginalRawContinuationRecords:216,
      visibleAfterExplicitOptIn:9619,
      originalBaseIndexedPngPixelsVerified:64000,
      originalDownloadedRawRecordBytesVerified:2,
      emptyOriginalRecordDownloadVerified:true,
      acceptedP76AndP78GroupsPreserved:true,
      nativePaletteOrOpacityVerified:false,
      nativeAnimationFramesFromContinuationsDecoded:0,
      independentOriginalIndexedZipAndRawRecordParity:true,
    },null,2));
   }finally{await page.close();}
  }finally{await browser.close();}
 }finally{await server.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
