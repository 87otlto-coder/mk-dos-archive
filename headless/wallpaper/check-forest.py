from PIL import ImageChops, ImageStat
import importlib.util
from pathlib import Path
import json
import sys

renderer = Path(__file__).with_name("render-forest.py")
spec = importlib.util.spec_from_file_location("forest_renderer", renderer)
forest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(forest)
config = json.loads(renderer.with_name("forest-scene.json").read_text(encoding="utf-8-sig"))
draw = forest.load_scene(config, *map(Path, sys.argv[1:]))
count = config["fps"] * config["seconds"]
first = forest.render(config, draw, 0)
assert first.size == (320, 200)
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
