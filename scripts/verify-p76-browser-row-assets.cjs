#!/usr/bin/env node
/** P76 real Chrome original MK3 opt-in row graphics + independently checked ZIP.
 * Requires built app, original MK3 directory, installed Chrome, and externally
 * accessible playwright-core via NODE_PATH. No commercial data in repository.
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
  try{
   const page=await browser.newPage({acceptDownloads:true,locale:'en-US'});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
    await page.locator('input[webkitdirectory]').setInputFiles(originals);
    await page.getByRole('button',{name:'Change directory'}).waitFor({timeout:240000});
    await page.getByRole('button',{name:'Asset library'}).click();
    await page.getByRole('button',{name:'Decode & browse'}).click();
    const header=page.locator('.asset-evidence summary');
    await header.waitFor({timeout:300000});
    assert.match(await header.innerText(),/9,186 assets$/,'P71 baseline unexpectedly modified');
    const reveal=page.getByRole('button',{name:'Show 19 recovered indexed graphics'});
    await reveal.waitFor();
    await reveal.click();
    await page.getByText('P76 source-row graphics added: 19 separate indexed images.').waitFor({timeout:300000});
    assert.match(await header.innerText(),/9,205 assets$/,'P76 explicit new count wrong');
    const filtered=page.getByRole('listbox',{name:'Assets'}).getByRole('option');
    assert.equal(await filtered.count(),19,'expected precisely 19 source-row graphic options');
    const first=filtered.first();
    assert.match(await first.innerText(),/Non-IFF source-row image 01/);
    await first.click();
    const inspector=page.locator('.asset-inspector');
    assert.match(await inspector.innerText(),/native palette UNKNOWN/);
    const archiveButton=inspector.getByRole('button',{name:'Export indexed asset ZIP'});
    const [download]=await Promise.all([
      page.waitForEvent('download',{timeout:180000}),archiveButton.click(),
    ]);
    assert.match(download.suggestedFilename(),/INDEX_GRAYSCALE_INDEXED\.zip$/);
    assert.equal(await download.failure(),null);
    const archive=await download.path();
    assert(archive&&fs.existsSync(archive),'downloaded P76 indexed ZIP missing');
    const oracle=spawnSync(process.env.PYTHON||'python',[
      path.join(__dirname,'verify-mk3-p76-browser-independent.py'),originals,archive
    ],{encoding:'utf8',maxBuffer:2*1024*1024,timeout:360000,windowsHide:true});
    if(oracle.error||oracle.status!==0)throw Error(
      'P76 independent original browser ZIP/PNG source oracle failed:\n'+
      [oracle.error?.message,oracle.stderr,oracle.stdout].filter(Boolean).join('\n'));
    const result=JSON.parse(oracle.stdout);
    assert.equal(result.status,'PASS');
    assert.equal(result.originalStreamAndTwoRowTablesAndRgbCandidateMatched,true);
    assert.equal(result.sourceAlphaAndGrayscalePngMatched,true);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({
      pass:'P76_BROWSER',status:'PASS',game:'mk3',
      originalBaselineAssets:9186,
      explicitRecoveredSourceRowImages:19,
      optInLibraryAssets:9205,
      sourceRow01IndexedPixelsVerified:result.indexedPixelsChecked,
      originalStreamRowTablesAndSourceRgb8Exact:true,
      sourceGrayscalePreviewPixelParity:true,
      nativePaletteAndRuntimePlacementClaims:false,
    },null,2));
   }finally{await page.close();}
  }finally{await browser.close();}
 }finally{await server.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
