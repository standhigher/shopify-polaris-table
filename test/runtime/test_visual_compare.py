import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from PIL import Image


class VisualComparatorTests(unittest.TestCase):
    def compare(self, first, second):
        with tempfile.TemporaryDirectory(prefix='polaris-p6-visual-') as directory:
            root = Path(directory)
            a, b = root / 'a.png', root / 'b.png'
            first.save(a)
            second.save(b)
            result = subprocess.run([sys.executable, str(Path(__file__).with_name('visual_compare.py')), str(a), str(b), '--diff', str(root / 'diff.png')], capture_output=True, text=True, check=False)
            return result.returncode, json.loads(result.stdout)

    def test_equal_pixels_pass(self):
        code, result = self.compare(Image.new('RGB', (4, 4), 'white'), Image.new('RGB', (4, 4), 'white'))
        self.assertEqual(code, 0)
        self.assertEqual(result['changedRatio'], 0)

    def test_real_changed_pixels_fail(self):
        a = Image.new('RGB', (4, 4), 'white')
        b = a.copy()
        b.putpixel((0, 0), (0, 0, 0))
        code, result = self.compare(a, b)
        self.assertEqual(code, 1)
        self.assertEqual(result['changedPixels'], 1)
        self.assertEqual(result['changedRatio'], 1 / 16)

    def test_size_change_fails(self):
        code, result = self.compare(Image.new('RGB', (4, 4)), Image.new('RGB', (4, 5)))
        self.assertEqual(code, 1)
        self.assertTrue(result['sizeMismatch'])


if __name__ == '__main__':
    unittest.main()
