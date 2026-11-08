#!/usr/bin/env node
/** P78 real Chrome original MK3 source-chained indexed image opt-in and ZIP.
 *
 * node scripts/verify-p78-browser-chained.cjs <original MK3 directory>
 * Requires locally built app, Google Chrome and playwright-core via NODE_PATH.
 * Independently validates the downloaded second record with original DOS
 * compressed bytes, row tables, index/opacity and PNG pixel parity.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
async function main(){
 assert.equal(process.argv.length,3,'original DOS MK3 directory required');
 const originals=fs.realpathSync(process.argv[2]);
 assert(fs.statSync(originals).isDirectory());
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
 try {
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
   const page=await browser.newPage({acceptDownloads:true,locale:'en-US'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try {
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
    await page.locator('input[webkitdirectory]').setInputFiles(originals);
    await page.getByRole('button',{name:'Change directory'}).waitFor({timeout:240000});
    await page.getByRole('button',{name:'Asset library'}).click();
    await page.getByRole('button',{name:'Decode & browse'}).click();
    const heading=page.locator('.asset-evidence summary');
    await heading.waitFor({timeout:300000});
    assert.match(await heading.innerText(),/9,186 assets$/,'accepted original MK3 baseline changed');
    await page.getByRole('button',{name:'Show 19 recovered indexed graphics'}).click();
    await page.getByText('P76 source-row graphics added: 19 separate indexed images.')
      .waitFor({timeout:300000});
    assert.match(await heading.innerText(),/9,205 assets$/,'accepted P76 opt-in count changed');
    const prior=page.getByRole('listbox',{name:'Assets'}).getByRole('option');
    assert.equal(await prior.count(),19,'original P76 first 19 images unavailable');
    await page.getByRole('button',{name:'Show 197 additional indexed graphics'}).click();
    await page.getByText('P78 original chained indexed images added: 197 separate source records.')
      .waitFor({timeout:300000});
    assert.match(await heading.innerText(),/9,402 assets$/,'P78 additional 197 original source records missing');
    const records=page.getByRole('listbox',{name:'Assets'}).getByRole('option');
    const first=records.first();await first.waitFor();
    assert.equal(await records.count(),60,'P78 first page must show 60 of 197 original source records');
    assert.match(await page.locator('.asset-page-controls span').innerText(),/of 197$/);
    assert.match(await first.locator('strong').innerText(),/Non-IFF chained image 01 \/ 001/);
    // Existing P76 first 19 records remain accessible and selectable.
    const group=page.getByLabel('Resource group');
    await group.selectOption('DATA.MK3 · recovered indexed (P76)');
    assert.equal(await records.count(),19,'P76 original accepted images must not be replaced');
    await group.selectOption('DATA.MK3 · additional chained indexed (P78)');
    await first.click();
    const inspector=page.locator('.asset-inspector');
    assert.match(await inspector.innerText(),/palette UNKNOWN/);
    const zipButton=inspector.getByRole('button',{name:'Export indexed asset ZIP'});
    const [download]=await Promise.all([
      page.waitForEvent('download',{timeout:180000}),zipButton.click()
    ]);
    assert.match(download.suggestedFilename(),
      /^MK3_DATA_NONIFF_P78_01_001_INDEX_GRAYSCALE_INDEXED\.zip$/);
    assert.equal(await download.failure(),null);
    const archive=await download.path();
    assert(archive&&fs.existsSync(archive),'P78 original indexed Chrome ZIP not downloaded');
    const oracle=spawnSync(process.env.PYTHON||'python',[
      path.join(__dirname,'verify-mk3-p78-browser-independent.py'),originals,archive
    ],{encoding:'utf8',maxBuffer:2*1024*1024,timeout:360000,windowsHide:true});
    if(oracle.error||oracle.status!==0)throw Error(
      'P78 original indexed Chrome ZIP/PNG independent oracle failed:\n'+
      [oracle.error?.message,oracle.stderr,oracle.stdout].filter(Boolean).join('\n'));
    const result=JSON.parse(oracle.stdout);
    assert.equal(result.status,'PASS');
    assert.equal(result.originalSourceAndPngPixelwiseParity,true);
    assert.equal(result.binaryEvidenceSidecarsChecked,6);
    assert.deepEqual(errors,[],'original Chrome rendered errors');
    console.log(JSON.stringify({
      pass:'P78_BROWSER',status:'PASS',originalGame:'mk3',
      defaultOriginalAssets:9186,preservedP76FirstIndexedImages:19,
      additionalOriginalSourceIndexedImages:197,
      explicitlyVisibleAssets:9402,
      sourceIndexedPixelsOfFirstNewRecordVerified:result.originalIndexedPositions,
      originalSourceStreamRowTablesAndPngPixelParity:true,
      sourceRecordOrderNotClaimedAsNativeAnimation:true,
      nativePaletteOrStageMembershipClaimed:false
    },null,2));
   }finally{await page.close();}
  }finally{await browser.close();}
 }finally{await server.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
