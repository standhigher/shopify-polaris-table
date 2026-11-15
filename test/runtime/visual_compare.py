"""Compare independent PNG captures; Pillow is a test-only prerequisite."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops

parser = argparse.ArgumentParser()
parser.add_argument('baseline', type=Path)
parser.add_argument('candidate', type=Path)
parser.add_argument('--diff', type=Path, required=True)
parser.add_argument('--threshold', type=float, default=0.001)
args = parser.parse_args()
a = Image.open(args.baseline).convert('RGB')
b = Image.open(args.candidate).convert('RGB')
if a.size != b.size:
    print(json.dumps({'pass': False, 'sizeMismatch': True, 'baseline': a.size, 'candidate': b.size}))
    raise SystemExit(1)
diff = ImageChops.difference(a, b)
changed = sum(1 for pixel in diff.getdata() if max(pixel) > 20)
ratio = changed / (a.width * a.height)
passed = ratio <= args.threshold
if not passed:
    args.diff.parent.mkdir(parents=True, exist_ok=True)
    diff.save(args.diff)
print(json.dumps({'pass': passed, 'changedPixels': changed, 'changedRatio': ratio, 'threshold': args.threshold, 'size': a.size}))
raise SystemExit(0 if passed else 1)
