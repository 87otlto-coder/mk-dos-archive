from PIL import ImageChops, ImageStat
import importlib.util
from pathlib import Path
import json
import sys

renderer = Path(__file__).with_name("render-forest.py")
spec = importlib.util.spec_from_file_location("forest_renderer", renderer)
forest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(forest)
floor_zip, layer_zip, *optional = map(Path, sys.argv[1:])
scene, animations, program = optional or (renderer.with_name("forest-scene.json"), None, None)
config = json.loads(scene.read_text(encoding="utf-8-sig"))
draw = forest.load_scene(config, floor_zip, layer_zip, animations, program)
if "tree_animation" in config:
    animation, = [image for image, *_ in draw if isinstance(image, (list, tuple))]
    if isinstance(animation, tuple):
        idle, sequences = animation
        positions = config["tree_animation"]["source_positions"]
        for sequence, (x, y) in zip(sequences, positions, strict=True):
            peak = ImageChops.difference(idle.convert("RGB"), sequence[6].convert("RGB"))
            bounds = peak.getbbox()
            assert bounds and x <= bounds[0] < bounds[2] <= x + 64
            assert y <= bounds[1] < bounds[3] <= y + 64
    else:
        sequences = [animation]
    for sequence in sequences:
        assert len(sequence) == 20
        assert sequence[0].tobytes() == sequence[-1].tobytes()
        assert len({image.tobytes() for image in sequence}) == 7
count = config["fps"] * config["seconds"]
first = forest.render(config, draw, 0)
assert first.size == tuple(config["size"])
assert forest.render(config, draw, count).tobytes() == first.tobytes()
assert forest.render(config, draw, 75).tobytes() != forest.render(config, draw, 225).tobytes()


def difference(a, b):
    return sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3


last = first
changes = []
for number in range(1, count):
    frame = forest.render(config, draw, number)
    changes.append(difference(last, frame))
    last = frame
seam = difference(last, first)
assert 0 < seam <= max(changes)
print(f"{count} source frames, seam mean RGB delta {seam:.3f}, "
      f"maximum interior delta {max(changes):.3f}")
