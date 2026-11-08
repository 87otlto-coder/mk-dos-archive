#!/usr/bin/env node
/** P69 original MK3 user-facing on-demand indexed FTR ZIP browser acceptance.
 * node scripts/verify-p69-browser-ftr.cjs <original MK3 directory>
 * After npm.cmd run build and NODE_PATH for playwright-core, launch one Chrome
 * tab, load originals via directory input, select a source sprite, export the
 * complete original FTR indexed bundle, and run independent Python readback.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright-core');

async function main(){
 assert.equal(process.argv.length,3,'Provide original MK3 directory');
 const original=fs.realpathSync(process.argv[2]);
 assert(fs.statSync(original).isDirectory(),'Original MK3 directory missing');
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
 try {
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
   const page=await browser.newPage({acceptDownloads:true,locale:'en-US'});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try {
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
    await page.locator('input[webkitdirectory]').setInputFiles(original);
    await page.getByRole('button',{name:'Change directory'}).waitFor({timeout:180000});
    await page.getByRole('button',{name:'Asset library'}).click();
    await page.getByRole('button',{name:'Decode & browse'}).click();
    const summary=page.locator('.asset-evidence summary');
    await summary.waitFor({timeout:300000});
    assert.match(await summary.innerText(),/9,186 assets$/,'canonical MK3 census');

    await page.getByLabel('Search assets').fill('BLADE.FTR');
    await page.getByLabel('Asset type').selectOption('sprite');
    const card=page.getByRole('listbox',{name:'Assets'}).getByRole('option').first();
    await card.waitFor({timeout:30000});
    const title=await card.locator('strong').innerText();
    assert.match(title,/BLADE\.FTR/,'must select original fighter sprite');
    await card.click();
    assert.equal(await card.getAttribute('aria-selected'),'true');
    const exportButton=page.getByRole('button',{
     name:'Export all original indexed sprites from this FTR'});
    await exportButton.waitFor({timeout:30000});
    const [download]=await Promise.all([
      page.waitForEvent('download',{timeout:180000}),exportButton.click(),
    ]);
    assert.equal(download.suggestedFilename(),
      'MK3_P69_BLADE_ORIGINAL_INDEXED_SPRITES.zip');
    assert.equal(await download.failure(),null);
    const output=await download.path();
    assert(output && fs.existsSync(output),'browser ZIP was not downloaded');

    const python=spawnSync(process.env.PYTHON||'python',
      [path.join(__dirname,'check-p69-browser-ftr.py'),original,output],
      {encoding:'utf8',timeout:180000,maxBuffer:1024*1024,windowsHide:true});
    if(python.error||python.status!==0)throw Error('Independent downloaded ZIP readback failed: '+
      [python.error?.message,python.stderr,python.stdout].filter(Boolean).join('\n'));
    const independent=JSON.parse(python.stdout);
    assert.equal(independent.status,'PASS');
    assert.equal(independent.originalFtr,'BLADE.FTR');
    assert(independent.independentlyCheckedFrames>0);
    assert.deepStrictEqual(errors,[],'unexpected page errors');
    console.log(JSON.stringify({pass:'P69_BROWSER',status:'PASS',
      game:'mk3',mk3Assets:9186,originalFtr:'BLADE.FTR',
      independentlyCheckedFrames:independent.independentlyCheckedFrames,
      originalCompressedIntervalsChecked:true,downloadIndexedPixelsAndMasksVerified:true,
      nativePaletteOrAnimationOrderClaimed:false},null,2));
   }finally{await page.close();}
  }finally{await browser.close();}
 }finally{await server.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
