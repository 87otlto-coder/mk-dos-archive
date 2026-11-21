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
