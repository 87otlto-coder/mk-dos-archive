#!/usr/bin/env node
/** P83 original MK2 real Chrome Asset Library native source archive acceptance.
 * node scripts/verify-p83-browser-stage-layers.cjs <ORIGINAL_MK2_DIR> <PRIVATE_P82_ZIP> <NEW_PRIVATE_WORK_DIR>
 *
 * Loads original MK2 via the real directory picker; retains 5,369 baseline,
 * imports 115 source PNGs from the P82 archive via explicit user-facing input,
 * previews both full 896-column stage floors, separately exports Tomb/Portal
 * original indexed PNGs and one native sprite opacity source plane.
 * Independent Python oracle runs original source O132/P82 939,425-index/115-PNG
 * replay and confirms all Chrome downloads byte-exact. No inferred scene.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
async function main(){
 assert.equal(process.argv.length,5,
  'usage: node scripts/verify-p83-browser-stage-layers.cjs ORIGINAL_MK2 PRIVATE_P82_ZIP NEW_PRIVATE_WORK');
 const original=fs.realpathSync(process.argv[2]);
 const archive=fs.realpathSync(process.argv[3]);
 const work=path.resolve(process.argv[4]);
 assert(fs.statSync(original).isDirectory(),'original DOS MK2 directory required');
 assert(fs.statSync(archive).isFile(),'private original-source P82 ZIP required');
 const workspace=path.resolve('F:\\Dev\\MKEXT\\FIXTURES\\VALIDATION');
 assert(work.toLowerCase().startsWith(workspace.toLowerCase()+path.sep),
  'private Chrome downloaded source evidence must remain in FIXTURES/VALIDATION');
 const root=path.resolve(__dirname,'..');
 assert(!work.toLowerCase().startsWith(root.toLowerCase()+path.sep),
  'private browser outputs cannot be written inside SOURCE');
 assert(!work.toLowerCase().startsWith(original.toLowerCase()+path.sep),
  'private browser outputs cannot be written inside the commercial game folder');
 assert(!fs.existsSync(work),'private validation work path must be new');
 assert(fs.statSync(path.dirname(work)).isDirectory(),
  'private work parent directory absent');
 fs.mkdirSync(work);
 process.env.TEMP=work;process.env.TMP=work;process.env.TMPDIR=work;
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
 try{
  const browser=await chromium.launch({channel:'chrome',headless:true,downloadsPath:work});
  try{
   const page=await browser.newPage({acceptDownloads:true,locale:'en-US'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   async function downloadAsset(expectedName){
    const inspector=page.locator('.asset-inspector');
    const [item]=await Promise.all([
      page.waitForEvent('download',{timeout:180000}),
      inspector.getByRole('button',{name:'Export this asset'}).click(),
    ]);
    assert.equal(await item.failure(),null,'original P83 Chrome download failed');
    const filename=item.suggestedFilename();
    assert.equal(filename,expectedName,'wrong original source layer exported');
    const location=await item.path();
    assert(location&&fs.existsSync(location),'downloaded PNG unavailable to independent oracle');
    return {file:location,name:filename};
   }
   try{
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port);
    await page.locator('input[webkitdirectory]').setInputFiles(original);
    await page.getByRole('button',{name:'Change directory'}).waitFor({timeout:240000});
    await page.getByRole('button',{name:'Asset library'}).click();
    await page.getByRole('button',{name:'Decode & browse'}).click();
    const evidence=page.locator('.asset-evidence summary');
    await evidence.waitFor({timeout:300000});
    assert.match(await evidence.innerText(),/5,369 assets$/,
      'accepted MK2 original default catalogue changed');
    await page.getByLabel('Import P82 stage-layer ZIP').setInputFiles(archive);
    await page.getByText('P83 imported: 115 original Tomb/Portal source PNGs,')
      .waitFor({timeout:300000});
    assert.match(await evidence.innerText(),/5,484 assets$/,
      'expected exactly 115 separate opt-in MK2 source PNG resources');
    const group=page.getByLabel('Resource group');
    const results=page.getByRole('listbox',{name:'Assets'}).getByRole('option');
    const inspector=page.locator('.asset-inspector');
    async function selectResourceGroup(target) {
      await group.selectOption(target);
      // count() is not an auto-wait: Tomb and Portal both have two floors.
      // Wait for a row from the new group, not just the number of old rows.
      await results.first().getByText(target,{exact:true}).waitFor({timeout:30000});
    }
    const downloads=[];
    for(const [stage,name,height] of [
      ['Kombat Tomb','tomb',48],['The Portal','portal',40]]){
      await selectResourceGroup('P83 '+stage+' · native-width floor');
      assert.equal(await results.count(),2,'both original full-source floor images required');
      const floor=results.filter({hasText:'floor_indices.png'}).first();
      await floor.click();
      // Both stages use floor_indices.png; verify the selected source
      // actually changed before inspecting the image or downloading bytes.
      await inspector.locator('p').filter({
        hasText:name==='tomb'?'TOMB.GRA':'PORTAL.GRA'
      }).waitFor({timeout:30000});
      const preview=inspector.locator('img').first();
      await preview.waitFor({timeout:30000});
      await preview.evaluate(img=>img.decode());
      assert.equal(await preview.evaluate(img=>img.naturalWidth),896,
        stage+' native floor width clipped by browser');
      assert.equal(await preview.evaluate(img=>img.naturalHeight),height,
        stage+' native floor native rows changed');
      downloads.push(await downloadAsset('MK2_P83_'+name+'_floor_indices.png'));
    }
    await selectResourceGroup('P83 Kombat Tomb · uncropped source sprites');
    assert.equal(await results.count(),48,'16 original native sprites require three PNG planes each');
    const opacity=results.filter({hasText:'_opacity.png'}).first();
    await opacity.click();
    const nativePreview=inspector.locator('img').first();
    await nativePreview.waitFor({timeout:30000});
    await nativePreview.evaluate(img=>img.decode());
    const opaqueName=await opacity.locator('strong').innerText();
    assert.match(opaqueName,/_opacity\.png$/);
    const opacityDownload=await downloadAsset('MK2_P83_tomb_native_sprites_'+opaqueName);
    downloads.push(opacityDownload);
    await selectResourceGroup('P83 The Portal · uncropped source sprites');
    assert.equal(await results.count(),39,'13 original Portal sprites require three PNG planes each');
    await selectResourceGroup('P83 Kombat Tomb · setup-local layers');
    assert.equal(await results.count(),18,'6 Tomb setup-local source layers require three PNG planes each');
    await selectResourceGroup('P83 The Portal · setup-local layers');
    assert.equal(await results.count(),6,'2 Portal setup-local source layers require three PNG planes each');
    assert.deepEqual(errors,[],'original MK2 real Chrome application errors');
    const pyArgs=[
      path.join(__dirname,'verify-mk2-p83-browser-independent.py'),
      '--original-mk2',original,'--archive',archive,
      ...downloads.flatMap(d=>['--download',d.file,d.name])
    ];
    const oracle=spawnSync(process.env.PYTHON||'python',pyArgs,{
      cwd:root,encoding:'utf8',maxBuffer:2*1024*1024,timeout:600000,windowsHide:true
    });
    if(oracle.error||oracle.status!==0)throw Error(
      'P83 independent original and Chrome download oracle FAILED:\n'+
      [oracle.error?.message,oracle.stderr,oracle.stdout].filter(Boolean).join('\n'));
    const truth=JSON.parse(oracle.stdout);
    assert.equal(truth.pass,'P83_BROWSER_INDEPENDENT');
    assert.equal(truth.status,'PASS');
    assert.equal(truth.allP82SourcePngsReopened,115);
    assert.equal(truth.originalP82IndependentPixelPositions,939425);
    assert.equal(truth.realChromeDownloadedPngsByteExact,3);
    assert.equal(truth.uncroppedSourceFloorsVerified,2);
    assert.equal(truth.nativeRuntimePaletteCameraAnimationClaimed,false);
    console.log(JSON.stringify({
      pass:'P83_BROWSER',status:'PASS',originalGame:'mk2',
      acceptedDefaultMk2Assets:5369,explicitAdditionalStageSourcePngs:115,
      visibleAfterExplicitImport:5484,
      originalNativeFloorColumns:896,
      originalStagesVerified:['tomb','portal'],
      originalNativeSpritesRepresented:29,setupLocalSourceLayersRepresented:8,
      originalP82SourcePngsIndependentlyRechecked:115,
      sourceIndexedPositionsIndependent:939425,
      originalChromePngDownloadsByteExact:3,
      sourceStageImageFilesRemainByteExact:true,
      originalNativePaletteCameraStageCompositionOrAnimationClaimed:false,
      originalCommercialGameSourcesIncludedInExport:false,
    },null,2));
   }finally{await page.close();}
  }finally{await browser.close();}
 }finally{await server.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
