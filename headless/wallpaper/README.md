# MK2 DOS Living Forest wallpaper

The renderer consumes the O196 original floor indices and executable-linked palette candidate, and the O197 original layer indices and opacity masks. It verifies visible RGB and alpha against the package previews. O201 supplies fitted origins and the floor row, and O202 supplies the five relative motion ratios. The centered distant layer, horizon gradient, 36-pixel sinusoidal camera and foreground-speed floor are wallpaper choices. The clip is silent, with no HUD, fighters or animated tree sprites.

Run from the continuation checkout under `F:\Dev\MKEXT\SOURCE\mkdosext-headless` in Windows PowerShell. Install Pillow 12 or newer in your Python environment. Set `$ffmpeg` to an available FFmpeg executable with libx264. A project-local portable build can live under `F:\Dev\MKEXT\TOOLS`. Install the checkout's npm dependencies with `npm ci` if TypeScript is unavailable.

```powershell
$root = 'F:\Dev\MKEXT'
Set-Location "$root\SOURCE\mkdosext-headless"
$original = "$root\FIXTURES\mk2\mk2"
$out = "$root\FIXTURES\VALIDATION\LivingForest-v01"
$ffmpeg = "$root\TOOLS\ffmpeg\bin\ffmpeg.exe"
New-Item -ItemType Directory -Force $out | Out-Null
$env:O196_ZIP_PATH = "$out\floor.zip"
$env:O197_ZIP_PATH = "$out\layers.zip"
node scripts/verify-o196-fixture.cjs $original
if ($LASTEXITCODE) { throw 'O196 extraction failed' }
node scripts/verify-o197-fixture.cjs $original
if ($LASTEXITCODE) { throw 'O197 extraction failed' }
python headless/wallpaper/check-forest.py $env:O196_ZIP_PATH $env:O197_ZIP_PATH
if ($LASTEXITCODE) { throw 'Forest composition check failed' }
python headless/wallpaper/render-forest.py $env:O196_ZIP_PATH $env:O197_ZIP_PATH `
    "$out\MK2_Living_Forest_Wallpaper_v01.mp4" --ffmpeg $ffmpeg
if ($LASTEXITCODE) { throw 'Forest wallpaper render failed' }
```

Existing private O196/O197 ZIPs can be passed directly. Use `--still` for a single PNG or `--frames` for numbered native-size PNGs. Keep all generated media and forensic packages under FIXTURES.

## v02 animated scene

After exporting the two forensic ZIPs as above, extract the seven Forest sprites
with the existing headless CLI. Use the same original DOS directory.

```powershell
foreach ($i in 0..6) {
    node headless/cli.mts extract $original forest.gra $i "$out\anim-$i"
    if ($LASTEXITCODE) { throw "Forest sprite $i extraction failed" }
}
python headless/wallpaper/render-forest.py $env:O196_ZIP_PATH $env:O197_ZIP_PATH `
    "$out\MK2_Living_Forest_Wallpaper_v02.mp4" --ffmpeg $ffmpeg `
    --scene headless/wallpaper/forest-scene-v02.json --animations $out
if ($LASTEXITCODE) { throw 'Forest wallpaper render failed' }
```

v02 uses the checked-in 20-entry Forest descriptor list and extracted sprite masks.
The foreground canvas placements (234, 72), (459, 72), and (675, 72) were fitted
against the three repeated trunks. The original O200 object fields give the same
225- and 216-pixel spacing. Timing is a wallpaper choice: four output frames
per source entry, one cycle at 2.1 seconds, with the idle frame held outside it.
Fractional horizontal positioning uses bilinear filtering, so motion is smoother
at the cost of a little horizontal softness between native pixel positions.

## v03 hidden characters

After preparing the v02 sprites and the two forensic ZIPs, extract the two
original 25×89 Forest cameo sprites into the same private output folder.

```powershell
node headless/wallpaper/extract-forest-cameos.mts $original $out
if ($LASTEXITCODE) { throw 'Forest cameo extraction failed' }
python headless/wallpaper/render-forest.py $env:O196_ZIP_PATH $env:O197_ZIP_PATH `
    "$out\MK2_Living_Forest_Wallpaper_v03.mp4" --ffmpeg $ffmpeg `
    --scene headless/wallpaper/forest-scene-v03.json --animations $out
if ($LASTEXITCODE) { throw 'Forest wallpaper render failed' }
```

The DOS Forest task at physical EXE offset 0x82B04 selects descriptor 0x16F6C
for Jade or 0x16F7C for Smoke. Both point to the Forest palette record.
v03 alternates the two cameos on a fixed wallpaper timeline. The blocking,
movement, and timing are creative fits. Each sprite is composited behind
the foreground opacity mask and shares the foreground camera transform.
