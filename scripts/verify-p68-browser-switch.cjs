/** P68 original DOS same-tab game-switch browser acceptance.
 * Run after npm run build, with playwright-core available via NODE_PATH.
 * node scripts/verify-p68-browser-switch.cjs <MK1-dir> <MK2-dir> <MK3-dir>
 * Uses ONE Chrome page/context for three original game installations. Native
 * picker is stubbed ONLY to deterministically test cancel/denial; file upload
 * and every game decode/download are actual original-fixture browser operations.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {chromium} = require('playwright-core');

async function download(page,button){
 const [item]=await Promise.all([page.waitForEvent('download'),button.click()]);
 assert.equal(item.suggestedFilename(),'MKDOS_selection.zip');
 assert.equal(await item.failure(),null);
 return item.path();
}
const button=(page,name)=>page.getByRole('button',{name,exact:true});
async function loadOriginal(page,root,game,count){
 await page.locator('input[webkitdirectory]').setInputFiles(root);
 await button(page,'Change directory').waitFor({timeout:300000});
 assert.match(await page.locator('.mw-game-pill').innerText(),/Mortal Kombat/i);
 await button(page,'Asset library').click();
 await button(page,'Decode & browse').click();
 const summary=page.locator('.asset-evidence summary');
 await summary.waitFor({timeout:300000});
 assert.match(await summary.innerText(),new RegExp(count+' assets$'),game+' census');
 assert(await button(page,'Export selection ZIP (0)').isDisabled(),'new game queue must start empty');
 assert.equal(await page.getByLabel('Search assets').inputValue(),'','no carried-over search');
 assert.equal(await page.getByLabel('Asset type').inputValue(),'','no carried-over category');
 assert.equal(await page.locator('.asset-inspector audio').count(),0,'no old sound preview');
 assert.equal(await page.locator('.asset-inspector strong').count(),0,'no old inspector');
 return summary;
}
async function selectAudio(page){
 await page.getByLabel('Asset type').selectOption('audio');
 const card=page.getByRole('listbox').getByRole('option').first();
 const name=await card.locator('strong').innerText();
 await card.click();
 assert.equal(await card.getAttribute('aria-selected'),'true');
 assert.equal(await page.locator('.asset-inspector strong').innerText(),name);
 const audio=page.locator('.asset-inspector audio[controls]');
 await audio.waitFor();
 await page.waitForFunction(()=>{
  const a=document.querySelector('.asset-inspector audio');
  return a && a.readyState>=1&&Number.isFinite(a.duration)&&a.duration>0;
 },null,{timeout:30000});
 return name;
}
async function queueMK2(page){
 await page.getByLabel('Search assets').fill('animb.mid');
 const names=[];
 for(const type of ['raw','sequence']){
  await page.getByLabel('Asset type').selectOption(type);
  const card=page.getByRole('listbox').getByRole('option').first();
  const name=await card.locator('strong').innerText();
  await card.click({modifiers:names.length?['Control']:[]});
  assert.equal(await card.getAttribute('aria-selected'),'true');
  names.push(name);
 }
 assert.equal(names.length,2);
 return names;
}
async function openSwitcher(page){
 await button(page,'Change directory').click();
 const dialog=page.getByRole('dialog',{name:'Change game installation'});
 await dialog.waitFor();
 return dialog;
}
async function main(){
 assert.equal(process.argv.length,5,'Require original MK1, MK2, MK3 directories');
 const roots=process.argv.slice(2).map(x=>fs.realpathSync(x));
 const mixed=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p68-invalid-'));
 fs.writeFileSync(path.join(mixed,'MK1.EXE'),Buffer.from('MZ_invalid_MK1'));
 fs.writeFileSync(path.join(mixed,'MK2.EXE'),Buffer.from('MZ_invalid_MK2'));
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
 try {
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
   const page=await browser.newPage({acceptDownloads:true,locale:'en-US'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   const records=[];
   try {
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
    await loadOriginal(page,roots[0],'mk1','2,656');
    const mk1Name=await selectAudio(page);
    assert.equal(mk1Name,'001.WAV');
    assert(await button(page,'Export selection ZIP (1)').isEnabled());
    const oldPreview=await page.locator('.asset-inspector strong').innerText();
    const oldEvidence=await page.locator('.asset-evidence summary').innerText();

    // Native API cancellation and denial must not erase the existing session.
    let dialog=await openSwitcher(page);
    await page.evaluate(()=>{
      Object.defineProperty(window,'showDirectoryPicker',{configurable:true,
       value:async()=>{throw new DOMException('User cancelled','AbortError');}});
    });
    await dialog.getByRole('button',{name:'Open Game Directory'}).click();
    assert.equal(await dialog.getByText('Source Access Error').count(),0,'AbortError is not fatal');
    assert.equal(await page.locator('.asset-inspector strong').innerText(),oldPreview);
    // aria-modal makes background unavailable to role queries; query the
    // still-mounted DOM directly without trying to click through the dialog.
    assert(await page.locator('.asset-toolbar button').filter({hasText:'Export selection ZIP (1)'}).isEnabled());

    await page.evaluate(()=>{
      Object.defineProperty(window,'showDirectoryPicker',{configurable:true,
       value:async()=>{throw new DOMException('Permission denied','NotAllowedError');}});
    });
    await dialog.getByRole('button',{name:'Open Game Directory'}).click();
    await dialog.getByText('Source Access Error').waitFor();
    assert.equal(await page.locator('.asset-inspector strong').innerText(),oldPreview);
    await button(page,'Cancel change').click();
    await dialog.waitFor({state:'detached'});
    assert.equal(await page.locator('.asset-evidence summary').innerText(),oldEvidence);
    assert(await button(page,'Export selection ZIP (1)').isEnabled());

    // Ambiguous original-file signatures are rejected transactionally too.
    dialog=await openSwitcher(page);
    await dialog.locator('input[webkitdirectory]').setInputFiles(mixed);
    await dialog.getByRole('alert').waitFor({timeout:30000});
    assert.match(await dialog.getByRole('alert').innerText(),/not a recognized single/i);
    assert(await page.locator('.asset-toolbar button').filter({hasText:'Export selection ZIP (1)'}).isEnabled());
    assert.equal(await page.locator('.asset-inspector strong').innerText(),oldPreview);

    // Accept MK2 in the SAME tab. Previous queue and preview must disappear.
    await dialog.locator('input[webkitdirectory]').setInputFiles(roots[1]);
    await dialog.waitFor({state:'detached',timeout:300000});
    await button(page,'Asset library').click();
    await button(page,'Decode & browse').click();
    let summary=page.locator('.asset-evidence summary');
    await summary.waitFor({timeout:300000});
    assert.match(await summary.innerText(),/5,369 assets$/);
    assert(await button(page,'Export selection ZIP (0)').isDisabled());
    assert.equal(await page.locator('.asset-inspector strong').count(),0);
    assert.equal(await page.locator('.asset-inspector audio').count(),0);
    assert.equal(await page.locator('.asset-evidence button').filter({hasText:'MK1_P65_INDEXED_ANITAB_SOURCE_STREAMS.zip'}).count(),0,'old MK1 evidence must not remain in MK2 DOM');
    assert.equal(await page.getByLabel('Search assets').inputValue(),'');
    const mk2Names=await queueMK2(page);
    assert(await button(page,'Export selection ZIP (2)').isEnabled());
    const mk2Zip=await download(page,button(page,'Export selection ZIP (2)'));
    records.push({game:'mk2',root:roots[1],download:mk2Zip,names:mk2Names});

    // Switching to MK3 again discards selected raw+MIDI and its inspector.
    dialog=await openSwitcher(page);
    await dialog.locator('input[webkitdirectory]').setInputFiles(roots[2]);
    await dialog.waitFor({state:'detached',timeout:300000});
    await button(page,'Asset library').click();
    await button(page,'Decode & browse').click();
    summary=page.locator('.asset-evidence summary');
    await summary.waitFor({timeout:300000});
    assert.match(await summary.innerText(),/9,186 assets$/);
    assert(await button(page,'Export selection ZIP (0)').isDisabled());
    assert.equal(await page.locator('.asset-inspector strong').count(),0);
    assert.equal(await page.getByLabel('Search assets').inputValue(),'');
    const mk3Name=await selectAudio(page);
    assert.match(mk3Name,/BLADE\.FTR.*Spec0003.*0/);
    const mk3Zip=await download(page,button(page,'Export selection ZIP (1)'));
    records.push({game:'mk3',root:roots[2],download:mk3Zip,names:[mk3Name]});

    // Reopen MK1 in this same tab; same path/name must create a fresh
    // asset session rather than inheriting the former MK1 state.
    dialog=await openSwitcher(page);
    await dialog.locator('input[webkitdirectory]').setInputFiles(roots[0]);
    await dialog.waitFor({state:'detached',timeout:300000});
    await button(page,'Asset library').click();
    await button(page,'Decode & browse').click();
    summary=page.locator('.asset-evidence summary');
    await summary.waitFor({timeout:300000});
    assert.match(await summary.innerText(),/2,656 assets$/);
    assert(await button(page,'Export selection ZIP (0)').isDisabled());
    assert.equal(await page.locator('.asset-inspector strong').count(),0);
    const mk1Again=await selectAudio(page);
    assert.equal(mk1Again,'001.WAV');
    const mk1Zip=await download(page,button(page,'Export selection ZIP (1)'));
    records.unshift({game:'mk1',root:roots[0],download:mk1Zip,names:[mk1Again]});

    const python=spawnSync(process.env.PYTHON||'python',
     [path.join(__dirname,'check-p68-switch-download.py'),JSON.stringify(records)],
     {stdio:'inherit',windowsHide:true,timeout:180000});
    if(python.error)throw python.error;
    assert.equal(python.status,0,'independent same-tab original-source ZIP readback');
    assert.deepEqual(errors,[],'unexpected page exceptions');
    console.log(JSON.stringify({pass:'P68_BROWSER',status:'PASS',oneBrowserTab:true,
      originalGamesSwitchedInOrder:['mk1','mk2','mk3','mk1'],
      nativePickerCancelPreservedQueue:true,nativePermissionDeniedPreservedQueue:true,
      mixedCandidateRejectedWithoutLosingQueue:true,
      staleInspectorAudioAndEvidenceResetOnAcceptedSwitch:true,
      privateDownloadsVerifiedAgainstOriginals:3,gameCensus:[2656,5369,9186],
      audiblePlaybackVerified:false},null,2));
   }finally{await page.close();}
  }finally{await browser.close();}
 }finally{await server.close();fs.rmSync(mixed,{recursive:true,force:true});}
}
main().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
