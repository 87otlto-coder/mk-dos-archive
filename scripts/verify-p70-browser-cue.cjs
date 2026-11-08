#!/usr/bin/env node
/** P70 browser fixture: original GOG MK3 music inspector one-click ZIP.
 * node scripts/verify-p70-browser-cue.cjs <original MK3 folder>
 * Requires npm.cmd run build, Chrome and playwright-core in NODE_PATH.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright-core');

async function main(){
 assert.equal(process.argv.length,3,'Original MK3 folder required');
 const original=fs.realpathSync(process.argv[2]);
 assert(fs.statSync(original).isDirectory());
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
 const work=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p70-browser-'));
 try{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
   const page=await browser.newPage({acceptDownloads:true,locale:'en-US'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
    await page.locator('input[webkitdirectory]').setInputFiles(original);
    await page.getByRole('button',{name:'Change directory'}).waitFor({timeout:180000});
    await page.getByRole('button',{name:'Asset library'}).click();
    await page.getByRole('button',{name:'Decode & browse'}).click();
    const summary=page.locator('.asset-evidence summary');
    await summary.waitFor({timeout:300000});
    assert.match(await summary.innerText(),/9,186 assets$/);
    await page.getByLabel('Search assets').fill('Track02.ogg');
    await page.getByLabel('Asset type').selectOption('music');
    const card=page.getByRole('listbox').getByRole('option').first();
    await card.waitFor({timeout:30000});
    assert.equal(await card.locator('strong').innerText(),'Track02.ogg');
    await card.click();
    assert.equal(await card.getAttribute('aria-selected'),'true');
    const button=page.getByRole('button',{name:'Export original CUE-linked MK3 audio tracks 02–47'});
    await button.waitFor({timeout:30000});
    const [item]=await Promise.all([page.waitForEvent('download',{timeout:240000}),button.click()]);
    assert.equal(item.suggestedFilename(),'MK3_P70_GOG_CUE_AUDIO_TRACKS_02-47.zip');
    assert.equal(await item.failure(),null);
    const file=await item.path();
    assert(file && fs.existsSync(file),'Chrome did not download CUE audio bundle');
    const r=spawnSync(process.env.PYTHON||'python',
     [path.join(__dirname,'verify-mk3-p70-cue-independent.py'),
      original,file,path.join(work,'p70-browser-independent.json')],
     {encoding:'utf8',timeout:300000,maxBuffer:4*1024*1024,windowsHide:true});
    if(r.error||r.status!==0)throw Error('P70 original browser downloaded ZIP readback failed:\n'+
     [r.error?.message,r.stderr,r.stdout].filter(Boolean).join('\n'));
    const verified=JSON.parse(fs.readFileSync(path.join(work,'p70-browser-independent.json'),'utf8'));
    assert.equal(verified.status,'PASS');
    assert.equal(verified.originalOggTracks,46);
    assert.equal(verified.originalOggByteTotal,43367491);
    assert.equal(verified.allOriginalCueAndOggBytesMatched,true);
    assert.deepStrictEqual(errors,[],'browser runtime errors');
    console.log(JSON.stringify({pass:'P70_BROWSER',status:'PASS',game:'mk3',
      mk3Assets:9186,oneClickOriginalCueMusicDownload:true,
      independentOriginalOggTracks:46,originalCueBytesPreserved:true,
      originalOggSourceBytesVerified:verified.originalOggByteTotal,
      cueMp3VsActualOggMismatchPreserved:true,
      completeOriginalDiscImageClaimed:false,
      nativeRuntimeMusicAssociationsClaimed:false,
      audiblePlaybackVerified:false},null,2));
   }finally{await page.close();}
  }finally{await browser.close();}
 }finally{await server.close();fs.rmSync(work,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
