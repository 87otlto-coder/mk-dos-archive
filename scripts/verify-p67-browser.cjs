/** Run after npm run build. See docs/EXTRACTOR_P67_BROWSER_ACCEPTANCE.md. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright-core');

async function download(page, button, filename) {
  const [file] = await Promise.all([page.waitForEvent('download'), button.click()]);
  assert.equal(file.suggestedFilename(), filename);
  assert.equal(await file.failure(), null);
  return file.path();
}

async function exercise(browser, url, game, root, count) {
  const page = await browser.newPage({ acceptDownloads: true, locale: 'en-US' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const button = name => page.getByRole('button', { name, exact: true });
  try {
    await page.goto(url);
    await page.locator('input[webkitdirectory]').setInputFiles(root);
    await button('Change directory').waitFor();
    await button('Asset library').click();
    await button('Decode & browse').click();
    const summary = page.locator('.asset-evidence summary');
    await summary.waitFor({ timeout: 300000 });
    assert.match(await summary.innerText(), new RegExp(count + ' assets$'));
    assert(await button('Export selection ZIP (0)').isDisabled());
    const search = page.getByLabel('Search assets');
    await search.fill('p67-impossible-asset-name');
    assert(await button('Add all 0 matches to selection').isDisabled());
    await search.fill(game === 'mk2' ? 'animb.mid' : '');
    const kind = page.getByLabel('Asset type');
    const inspector = page.locator('.asset-inspector');
    const names = [];
    for (const type of game === 'mk2' ? ['raw', 'sequence'] : ['audio']) {
      await kind.selectOption(type);
      const card = page.getByRole('listbox').getByRole('option').first();
      const name = await card.locator('strong').innerText();
      names.push(name);
      await card.click({ modifiers: names.length > 1 ? ['Control'] : [] });
      assert.equal(await card.getAttribute('aria-selected'), 'true');
      assert.equal(await inspector.locator('strong').innerText(), name);
      if (type === 'audio') {
        const audio = inspector.locator('audio[controls]');
        await audio.waitFor();
        await page.waitForFunction(() => {
          const element = document.querySelector('.asset-inspector audio');
          return element?.readyState >= 1 && Number.isFinite(element.duration) && element.duration > 0;
        });
      }
    }
    const selection = await download(page, button('Export selection ZIP (' + names.length + ')'), 'MKDOS_selection.zip');
    const args = [path.join(__dirname, 'check-p67-download.py'), game, root, selection, JSON.stringify(names)];
    if (game === 'mk1') {
      await summary.click();
      for (const name of ['MK1_P65_INDEXED_ANITAB_SOURCE_STREAMS.zip', 'MK1_animations_evidence.zip']) {
        args.push(await download(page, button(name), name));
      }
    }
    const check = spawnSync(process.env.PYTHON || 'python', args, { stdio: 'inherit' });
    if (check.error) throw check.error;
    assert.equal(check.status, 0, game + ' downloaded archive readback');
    await button('Clear selection').click();
    assert(await button('Export selection ZIP (0)').isDisabled());
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
}

async function main() {
  assert.equal(process.argv.length, 5, 'Supply MK1, MK2 and MK3 installation directories in order');
  const roots = process.argv.slice(2).map(root => fs.realpathSync(root));
  const { preview } = await import('vite');
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
  try {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
      console.log('Chrome', browser.version());
      const url = 'http://127.0.0.1:' + server.httpServer.address().port;
      for (const [i, count] of ['2,656', '5,369', '9,186'].entries()) {
        await exercise(browser, url, 'mk' + (i + 1), roots[i], count);
      }
    } finally {
      await browser.close();
    }
  } finally {
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
