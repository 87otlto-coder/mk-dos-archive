"""Export private P82 source planes and conditional P90 component projections."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess
import zipfile

from PIL import Image

ARCHIVE_SHA = 'd66a8099721391a6606297b50057213a8ad459ffc773fe652ce112583bb777d9'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def file_sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def need(ok, why):
    if not ok:
        raise ValueError(why)

def source_components(root, archive, stage, mode):
    cli = Path(__file__).with_name('cli.mts')
    setup = json.loads(subprocess.check_output(['node', str(cli), 'stage', str(root), stage, mode]))
    need(file_sha(archive) == ARCHIVE_SHA, 'P82 archive fingerprint mismatch')
    with zipfile.ZipFile(archive) as package:
        manifest = json.loads(package.read('O132_SCENE_LAYERS.json'))
        need(manifest['sourceExecutableSHA256'] == setup['executable']['sha256'], 'P82 executable mismatch')
        source = next(s for s in manifest['stages'] if s['stage'] == stage)
        resource = source['originalResource'].lower()
        need(resource == setup['resource']['name'].lower() and
             file_sha(root / resource) == source['resourceSHA256'], 'Original stage GRA fingerprint mismatch')
        local = {item['setupObject2Offset']: item for item in source['setupLocalLayers']}
        parts = {}
        missing = []
        for binding in setup['setupBindings']:
            if binding['kind'] != 'setup_pair':
                continue
            address = binding['setupObject2']
            if address not in local:
                missing.append(address)
                continue
            item = local[address]
            name = f"{stage}/setups/{item['assetId']}"
            dimensions = item['dimensions']
            need(binding['size'] == dimensions, 'Layer setup dimensions mismatch')
            indices = plane(package, name + '_indices.png', dimensions, item['sourceIndexSHA256'])
            opacity = plane(package, name + '_opacity.png', dimensions, item['opacitySHA256'])
            need(all(x in (0, 255) for x in set(opacity)), 'Invalid P82 source mask')
            key = f'{address:05x}'
            parts[key] = (indices, opacity, dict(kind='setup_layer', binding=binding, dimensions=dimensions,
                                                sourceAssetId=item['assetId']))
        floor = source['packedFloor']
        dimensions = floor['nativeDimensions']
        indices = plane(package, stage + '/floor_indices.png', dimensions, floor['sourceIndexSHA256'])
        parts['floor'] = (indices, bytes([255]) * len(indices), dict(kind='packed_floor', dimensions=dimensions,
                          sourceAssetId=floor['assetId'], resourceOffset=floor['sourceOffset']))
    return setup, source['resourceSHA256'], parts, missing

def plane(package, member, dimensions, digest):
    with Image.open(io.BytesIO(package.read(member))) as png:
        need(png.mode == 'L' and list(png.size) == dimensions, 'P82 indexed plane shape mismatch')
        value = png.tobytes()
    need(sha(value) == digest, 'P82 indexed plane digest mismatch')
    return value

def project(setup, item, indices, opacity, delta):
    """Forward-copy one contribution into a 320×200 diagnostic viewport."""
    out, mask = bytearray(64000), bytearray(64000)
    width, height = item['dimensions']
    vertical = setup['headerSignedWords'][2]
    if item['kind'] == 'setup_layer':
        binding = item['binding']
        x, y = binding['originSignedXY']
        dx, dy = x - binding['initialHorizontalInteger'] - delta, y - vertical
        for sy in range(max(0, -dy), min(height, 200 - dy)):
            for sx in range(max(0, -dx), min(width, 320 - dx)):
                source = sy * width + sx
                if opacity[source]:
                    destination = (sy + dy) * 320 + sx + dx
                    out[destination], mask[destination] = indices[source], 255
        state = {'translation': [dx, dy]}
    else:
        draw, = [op for op in setup['drawCommands'] if op['opcode'] == 'minus_one_draw']
        center, = [row for row in setup['centerOverrides']
                   if row['channelObject2'] + 2 == draw['sourcePointerObject2']]
        camera = center['initialInteger'] + delta
        numerator = (288 - camera) * 65536
        step = (-1 if numerator < 0 else 1) * (abs(numerator) // 112)
        start_y = draw['rawParameter2'] - vertical
        rows = min(draw['rawParameter3'], 200 - start_y) if 0 <= start_y < 200 else 0
        need(width == 896 and rows <= height, 'Floor projection outside qualified source geometry')
        for row in range(rows):
            source_x = camera - ((row * step) >> 16)
            need(0 <= source_x <= width - 320, 'Floor sample outside original row')
            offset = row * width + source_x
            dest = (start_y + row) * 320
            out[dest:dest+320] = indices[offset:offset+320]
            mask[dest:dest+320] = bytes([255]) * 320
        state = {'cameraInput': camera, 'verticalInput': vertical, 'startY': start_y,
                 'rows': rows, 'rowStepSigned16_16': step}
    return bytes(out), bytes(mask), state

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('root', type=Path)
    p.add_argument('archive', type=Path)
    p.add_argument('stage', choices=['tomb', 'portal'])
    p.add_argument('mode', choices=['1','2','other'])
    p.add_argument('--component', help='Setup address in five-digit hex or floor')
    p.add_argument('--output', type=Path)
    p.add_argument('--projection', choices=['initial', 'plus32'])
    a = p.parse_args()
    if bool(a.component) != bool(a.output) or (a.projection and (not a.output or a.mode != '2')):
        p.error('Supply component and output together. Projection is qualified only for mode 2.')
    setup, gra_hash, parts, missing = source_components(a.root, a.archive, a.stage, a.mode)
    report = dict(schema=1, stage=a.stage, mode=a.mode, evidence='VERIFIED STATIC',
                  executable=setup['executable'], resource=setup['resource'], resourceSha256=gra_hash,
                  p82ArchiveSha256=ARCHIVE_SHA, missingSetupAddressesObject2=missing,
                  unqualifiedContributions=['runtime object activation', 'native draw order effects', 'effective DAC', 'scanout'],
                  runtime=setup['runtime'])
    if not a.output:
        print(json.dumps(dict(report, components={key: value[2] for key, value in parts.items()}), indent=2))
        return
    need(a.component in parts, 'Component unavailable for selected stage and mode')
    indices, opacity, item = parts[a.component]
    metadata = dict(report, component=a.component, source=item,
                    sourcePlaneSha256={'indices': sha(indices), 'opacity255': sha(opacity)},
                    space='P82 source space', dimensions=item['dimensions'])
    if a.projection:
        indices, opacity, state = project(setup, item, indices, opacity, 32 if a.projection == 'plus32' else 0)
        metadata.update(space='conditional P90 test vector', dimensions=[320,200], projection=a.projection, inputs=state,
                        unprovenViewportPixels=opacity.count(0))
    metadata['exportPlaneSha256'] = {'indices': sha(indices), 'opacity255': sha(opacity)}
    a.output.mkdir()
    for name, data in [('indices.bin', indices), ('opacity.bin', opacity)]:
        with (a.output / name).open('xb') as stream:
            stream.write(data)
    size = tuple(metadata['dimensions'])
    preview = Image.frombytes('L', size, indices).convert('LA')
    preview.putalpha(Image.frombytes('L', size, opacity))
    with (a.output / 'diagnostic.png').open('xb') as stream:
        preview.save(stream, format='PNG')
    with (a.output / 'metadata.json').open('x', encoding='utf-8') as stream:
        json.dump(metadata, stream, indent=2)
        stream.write('\n')

if __name__ == '__main__':
    main()
