"""Render the Living Forest from private O196/O197 forensic ZIPs."""
import argparse
import io
import json
import math
from pathlib import Path
import subprocess
from zipfile import ZipFile

from PIL import Image


def indexed_image(indices, opacity, size, colors, reference):
    if len(indices) != math.prod(size) or len(opacity) != len(indices):
        raise ValueError(f"Unexpected index or opacity length for {size}")
    if any(value not in (0, 1) for value in set(opacity)):
        raise ValueError("Expected a binary source opacity mask")
    if any(visible and index not in colors for index, visible in zip(indices, opacity)):
        raise ValueError("Opaque pixel references an unknown palette index")
    indexed = Image.frombytes("P", size, indices)
    indexed.putpalette(bytes(channel for key in range(256) for channel in colors.get(key, (0, 0, 0))))
    rgba = indexed.convert("RGBA")
    rgba.putalpha(Image.frombytes("L", size, opacity).point([0] + [255] * 255))
    expected = Image.open(io.BytesIO(reference)).convert("RGBA")
    # Hidden RGB is immaterial. Compare opacity separately from visible color.
    for image in (rgba, expected):
        if image.size != size:
            raise ValueError("Source preview dimensions differ")
    def visible_pixels(image):
        return [(r, g, b, a) if a else (0, 0, 0, 0) for r, g, b, a in image.get_flattened_data()]
    if visible_pixels(rgba) != visible_pixels(expected):
        raise ValueError("Source RGB or opacity differs from reference preview")
    return rgba


def load_scene(config, floor_zip, layer_zip):
    with ZipFile(floor_zip) as floor, ZipFile(layer_zip) as layers:
        palette = json.loads(floor.read("evidence/palette_80_original_words_and_candidate_rgb.json"))
        colors = {entry["index"]: tuple(entry["rgb8"]) for entry in palette["colors"]}
        if set(colors) != set(range(1, 81)):
            raise ValueError("Expected the 80 Forest colors")
        draw = []
        for layer, width, height, x, y, ratio in config["layers"]:
            prefix = f"variants/{layer}_{width}x{height}/"
            image = indexed_image(
                layers.read(prefix + "source_indices.bin"),
                layers.read(prefix + "opacity_mask.bin"), (width, height), colors,
                layers.read(prefix + "candidate_color.png"),
            )
            draw.append((image, x, y, ratio))
        width, height, x, y, ratio = config["floor"]
        image = indexed_image(
            floor.read("results/forest_896x32_original_indices.bin"),
            bytes([1]) * (width * height), (width, height), colors,
            floor.read("results/forest_896x32_candidate_rgba.png"),
        )
        draw.append((image, x, y, ratio))
    return draw


def render(config, draw, frame_number):
    frames = config["seconds"] * config["fps"]
    camera = config["camera_amplitude"] * math.sin(math.tau * (frame_number % frames) / frames)
    width, height = config["size"]
    stops = config["backdrop_stops"]
    rows = []
    for (first, top), (last, bottom) in zip(stops, stops[1:]):
        for y in range(first, last):
            shade = bytes(round(a + (b - a) * (y - first) / (last - first))
                          for a, b in zip(top, bottom))
            rows.append(shade * width)
    rows.append(bytes(stops[-1][1]) * width)
    frame = Image.frombytes("RGB", (width, height), b"".join(rows))
    for image, x, y, ratio in draw:
        frame.paste(image, (x + round(camera * ratio), y), image.getchannel("A"))
    return frame


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("floor_zip", type=Path)
    parser.add_argument("layer_zip", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--scene", type=Path, default=Path(__file__).with_name("forest-scene.json"))
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--still", action="store_true")
    parser.add_argument("--frames", action="store_true")
    args = parser.parse_args()
    config = json.loads(args.scene.read_text(encoding="utf-8-sig"))
    draw = load_scene(config, args.floor_zip, args.layer_zip)
    if args.still:
        render(config, draw, 0).save(args.output)
        return
    count = config["seconds"] * config["fps"]
    if args.frames:
        args.output.mkdir(exist_ok=True)
        for number in range(count):
            render(config, draw, number).save(args.output / f"{number:03d}.png")
        return
    width, height = config["size"]
    command = [
        args.ffmpeg, "-v", "error", "-n", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{width}x{height}", "-r", str(config["fps"]), "-i", "pipe:0",
        "-an", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(args.output),
    ]
    if args.output.exists():
        raise FileExistsError(args.output)
    with subprocess.Popen(command, stdin=subprocess.PIPE) as encoder:
        with encoder.stdin as stream:
            for number in range(count):
                stream.write(render(config, draw, number).tobytes())
        if encoder.wait():
            raise subprocess.CalledProcessError(encoder.returncode, command)


if __name__ == "__main__":
    main()
