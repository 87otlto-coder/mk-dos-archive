import { identify, intro, writeAsset } from './engine.mts';

async function main([command, root, resource, ordinal, output]: string[]) {
  if (command === 'identify' && root && !resource) {
    console.log(JSON.stringify(await identify(root), null, 2));
    return;
  }
  if (!root || !resource)
    throw new Error('Usage: identify ROOT | list ROOT RESOURCE | extract ROOT RESOURCE ORDINAL NEW_DIRECTORY');
  const assets = await intro(root, resource);
  if (command === 'list' && !ordinal) {
    console.log(JSON.stringify(assets.map(asset => asset.metadata), null, 2));
    return;
  }
  if (command === 'extract' && /^\d+$/.test(ordinal) && output && assets[Number(ordinal)]) {
    await writeAsset(output, assets[Number(ordinal)]);
    return;
  }
  throw new Error('Invalid command, asset ordinal or output directory');
}

main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
