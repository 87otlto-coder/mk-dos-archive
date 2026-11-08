#!/usr/bin/env node
/** P72 actual Chrome original MK3 source-CMAP comparison, never native palette.
 *
 * node scripts/verify-p72-browser-cmap.cjs <original MK3 directory>
 * Requires built app, Chrome and playwright-core external NODE_PATH.
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
   try{
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
    await page.locator('input[webkitdirectory]').setInputFiles(originals);
    await page.getByRole('button',{name:'Change directory'}).waitFor({timeout:240000});
    await page.getByRole('button',{name:'Asset library'}).click();
    await page.getByRole('button',{name:'Decode & browse'}).click();
    const header=page.locator('.asset-evidence summary');
    await header.waitFor({timeout:300000});
    assert.match(await header.innerText(),/9,186 assets$/);
    await page.getByLabel('Search assets').fill('BLADE.FTR');
    await page.getByLabel('Asset type').selectOption('sprite');
    const first=page.getByRole('listbox',{name:'Assets'}).getByRole('option').first();
    await first.waitFor({timeout:30000});
    assert.match(await first.locator('strong').innerText(),/BLADE\.FTR/);
    await first.click();
    await page.getByText('Original IFF CMAP comparison — not fighter palette ownership').waitFor();
    const choices=page.getByLabel('Experimental source IFF CMAP');
    assert.equal(await choices.locator('option').count(),126,'125 distinct original CMAP plus no-comparison');
    assert.equal(await choices.inputValue(),'','no accidental native palette selected');
    await choices.selectOption({index:1}); // explicit user-controlled comparison selection
    await page.getByText('Comparison only. Native MK3 fighter palette: UNKNOWN.').waitFor();
    const previewCanvas=page.locator('.asset-palette-comparison canvas');
    await previewCanvas.waitFor();
    assert(await previewCanvas.evaluate(c=>c.width>0&&c.height>0));
    const downloadButton=page.getByRole('button',{
      name:'Export experimental comparison PNG + original indexed evidence'});
    const [item]=await Promise.all([
      page.waitForEvent('download',{timeout:180000}),downloadButton.click()
    ]);
    assert.match(item.suggestedFilename(),/^MK3_P72_.*_CMAP_COMPARISON\.zip$/);
    assert.equal(await item.failure(),null);
    const archive=await item.path();
    assert(archive&&fs.existsSync(archive),'browser experimental comparison ZIP missing');
    const result=spawnSync(process.env.PYTHON||'python',
     [path.join(__dirname,'verify-mk3-p72-iff-cmap-independent.py'),originals,archive],
     {encoding:'utf8',timeout:300000,maxBuffer:1024*1024,windowsHide:true});
    if(result.error||result.status!==0)
      throw Error('Independent original comparison PNG/indices/CMAP readback FAILED:\n'+
       [result.error?.message,result.stderr,result.stdout].filter(Boolean).join('\n'));
    const verified=JSON.parse(result.stdout);
    assert.equal(verified.status,'PASS');
    assert.equal(verified.sourceCmapEntries,256);
    assert.equal(verified.allSourceIndicesMaskPaletteAndPngBytesMatched,true);
    assert.equal(verified.nativeFighterPaletteOwnershipClaimed,false);
    assert.deepStrictEqual(errors,[]);
    console.log(JSON.stringify({pass:'P72_BROWSER',status:'PASS',
      originalGame:'mk3',mk3Assets:9186,sourceIffCmapChoices:125,
      explicitUserPaletteComparisonOnly:true,
      sourceFtr:verified.originalFtr,
      sourceIff:verified.originalIffSource,
      originalFtrIndexedPixelsVerified:verified.sourceIndexedPixels,
      originalCmapBytesOriginalMaskAndPngVerified:true,
      nativeFighterPaletteOwnershipClaimed:false,
      sourceImagePaletteWasNotPromotedToNative:true},null,2));
   }finally{await page.close();}
  }finally{await browser.close();}
 }finally{await server.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
