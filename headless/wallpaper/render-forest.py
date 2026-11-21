"""Render the Living Forest from private O196/O197 forensic ZIPs."""
import argparse
import io
import json
import math
from pathlib import Path
import subprocess
from zipfile import ZipFile

from PIL import Image, ImageOps


def indexed_image(indices, opacity, size, colors, reference=None):
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
    if reference is None:
        return rgba
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


def load_scene(config, floor_zip, layer_zip, animations=None, program=None):
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
            if layer == 1 and "tree_animation" in config:
                image = animate_trees(image, colors, config["tree_animation"], animations, program)
            if layer == 1 and config.get("cameos"):
                if animations is None:
                    raise ValueError("The cameo scene requires --animations")
                cameos = []
                for cue in config["cameos"]:
                    name = cue["name"]
                    sprite = indexed_image(
                        (animations / f"{name}-indices.bin").read_bytes(),
                        (animations / f"{name}-opacity.bin").read_bytes(), (25, 89), colors,
                    )
                    cameos.append((cue, sprite))
                draw.append((image, x, y, ratio, cameos))
            else:
                draw.append((image, x, y, ratio))
        width, height, x, y, ratio = config["floor"]
        image = indexed_image(
            floor.read("results/forest_896x32_original_indices.bin"),
            bytes([1]) * (width * height), (width, height), colors,
            floor.read("results/forest_896x32_candidate_rgba.png"),
        )
        if config.get("extend_floor"):
            # Cover the panorama margins while keeping every original floor column.
            output_width = config["size"][0]
            right = output_width - x - width
            if not (0 <= x <= width and 0 <= right <= width):
                raise ValueError("Floor must fit inside the panorama")
            expanded = Image.new("RGBA", (output_width, height))
            expanded.paste(ImageOps.mirror(image.crop((0, 0, x, height))), (0, 0))
            expanded.paste(image, (x, 0))
            expanded.paste(ImageOps.mirror(image.crop((width - right, 0, width, height))), (x + width, 0))
            image, x = expanded, 0
        draw.append((image, x, y, ratio))
    return draw


def animate_trees(layer, colors, settings, assets, program_path):
    if assets is None:
        raise ValueError("The animated scene requires --animations")
    program = json.loads(program_path.read_text(encoding="utf-8"))["programs"][0]
    frames = {}
    for folder in sorted(assets.glob("anim-*")):
        meta = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
        frames[meta["id"]] = indexed_image(
            (folder / "indices.bin").read_bytes(), (folder / "opacity.bin").read_bytes(),
            (meta["width"], meta["height"]), colors,
        )
    sequence = [frames[entry["assetId"]] for entry in program["entries"]]
    positions = settings["source_positions"]
    idle = layer.copy()
    for position in positions:
        idle.alpha_composite(sequence[0], tuple(position))

    if "start_frames" in settings:
        starts = settings["start_frames"]
        duration = len(sequence) * settings["frames_per_entry"]
        if len(starts) != len(positions) or any(b - a < duration for a, b in zip(starts, starts[1:])):
            raise ValueError("Staggered roars require one non-overlapping cue per tree")
        clips = []
        for position in positions:
            clip = []
            for sprite in sequence:
                image = layer.copy()
                for anchor in positions:
                    image.alpha_composite(sprite if anchor == position else sequence[0], tuple(anchor))
                clip.append(image)
            clips.append(clip)
        return idle, clips

    composed = []
    for sprite in sequence:
        image = layer.copy()
        for position in positions:
            image.alpha_composite(sprite, tuple(position))
        composed.append(image)
    return composed


def place_cameos(foreground, cameos, frame_number):
    for cue, sprite in cameos:
        elapsed = frame_number - cue["start"]
        edge, hold = cue["travel"], cue["hold"]
        duration = edge * 2 + hold
        if 0 <= elapsed <= duration:
            phase = min(elapsed / edge, 1, (duration - elapsed) / edge)
            eased = (1 - math.cos(math.pi * phase)) / 2
            x, y = cue["position"]
            combined = Image.new("RGBA", foreground.size)
            combined.alpha_composite(sprite, (x + round(cue["step"] * eased), y))
            combined.alpha_composite(foreground)
            return combined
    return foreground


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
    for image, x, y, ratio, *extras in draw:
        if isinstance(image, list):
            settings = config["tree_animation"]
            index = (frame_number % frames - settings["start_frame"]) // settings["frames_per_entry"]
            image = image[min(max(index, 0), len(image) - 1)]
        elif isinstance(image, tuple):
            idle, clips = image
            image = idle
            settings = config["tree_animation"]
            for start, clip in zip(settings["start_frames"], clips):
                index = (frame_number % frames - start) // settings["frames_per_entry"]
                if 0 <= index < len(clip):
                    image = clip[index]
                    break
        if extras:
            image = place_cameos(image, extras[0], frame_number % frames)
        position = x + camera * ratio
        if config.get("fractional_pan") and ratio:
            # Pillow resamples RGBA with premultiplied alpha to keep transparent edges clean.
            image = image.transform((width, height), Image.Transform.AFFINE,
                                    (1, 0, -position, 0, 1, -y), Image.Resampling.BILINEAR)
            frame.paste(image, (0, 0), image.getchannel("A"))
        else:
            frame.paste(image, (x + round(camera * ratio), y), image.getchannel("A"))
    return frame


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("floor_zip", type=Path)
    parser.add_argument("layer_zip", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--scene", type=Path, default=Path(__file__).with_name("forest-scene.json"))
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--animations", type=Path)
    parser.add_argument("--program", type=Path, default=Path(__file__).resolve().parents[1] / "forest-program.json")
    parser.add_argument("--still", action="store_true")
    parser.add_argument("--frames", action="store_true")
    args = parser.parse_args()
    config = json.loads(args.scene.read_text(encoding="utf-8-sig"))
    draw = load_scene(config, args.floor_zip, args.layer_zip, args.animations, args.program)
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
