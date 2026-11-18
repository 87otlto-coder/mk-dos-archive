import { identify, intro, writeAsset } from './engine.mts';
import { mountain, mountainRelationships } from './mountain.mts';

import { sourceSprites, spriteFamilies } from './source-sprites.mts';
import { sourceProgram } from './source-program.mts';
import { stageSetup } from './stage-setup.mts';
import { diagnostic } from './preview.mts';

async function main([command, root, resource, ordinal, output, ...extra]: string[]) {
  if (extra.length) throw new Error('Unexpected arguments');
  if (command === 'identify' && root && !resource) {
    console.log(JSON.stringify(await identify(root), null, 2));
    return;
  }
  if (!root || !resource)
    throw new Error('Usage: stage ROOT STAGE MODE | identify ROOT | list ROOT RESOURCE | relationships ROOT RESOURCE | extract/preview ROOT RESOURCE ORDINAL NEW_DIRECTORY');
  if (command === 'relationships' && !ordinal) {
    console.log(JSON.stringify(resource === 'mountain.gra' ? await mountainRelationships(root) : await sourceProgram(root, resource), null, 2));
    return;
  }
  if (command === 'stage' && ordinal && !output) {
    console.log(JSON.stringify(await stageSetup(root, resource, ordinal), null, 2));
    return;
  }
  const listing = command === 'list' && !ordinal;
  const exporting = (command === 'extract' || command === 'preview') && /^\d+$/.test(ordinal) && output;
  if (!listing && !exporting) throw new Error('Invalid command or arguments');
  const assets = resource === 'mountain.gra' ? await mountain(root) : spriteFamilies.includes(resource) ? await sourceSprites(root, resource) : await intro(root, resource);
  if (listing) {
    console.log(JSON.stringify(assets.map(asset => asset.metadata), null, 2));
    return;
  }
  if (exporting && assets[Number(ordinal)]) {
    const asset = assets[Number(ordinal)];
    await writeAsset(output, asset, command === 'preview' ? diagnostic(asset) : undefined);
    return;
  }
  throw new Error('Invalid command, asset ordinal or output directory');
}

main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
