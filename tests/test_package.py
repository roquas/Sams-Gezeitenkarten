import contextlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('packager', ROOT / 'scripts/package.py')
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in packager.collect(ROOT):
            target = self.root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / path, target)

    def test_deterministic_runtime_only_archive(self):
        with contextlib.redirect_stdout(io.StringIO()):
            output = packager.package(self.root)
            first = output.read_bytes()
            self.assertEqual(first, packager.package(self.root).read_bytes())
        with zipfile.ZipFile(output) as archive:
            names = archive.namelist()
            self.assertIn('index.html', names)
            self.assertEqual(names, packager.collect(self.root))
            self.assertFalse(any(n.startswith(('tests/', 'docs/', 'node_modules/', 'prototypes/', '.git')) for n in names))
            manifest = json.loads(archive.read('puzzles/manifest.json'))
            self.assertEqual(len(manifest['puzzles']), 4)
            for entry in manifest['puzzles']:
                self.assertIn('puzzles/' + entry['path'], names)

    def test_missing_puzzle(self):
        (self.root / 'puzzles/quittung-nombreo.json').unlink()
        with self.assertRaisesRegex(ValueError, 'quittung-nombreo.json'):
            packager.collect(self.root)

    def test_missing_asset(self):
        (self.root / 'assets/seekarte/tesoro.png').unlink()
        with self.assertRaisesRegex(ValueError, 'tesoro.png'):
            packager.collect(self.root)

    def test_missing_module(self):
        (self.root / 'src/engine/hex.mjs').unlink()
        with self.assertRaisesRegex(ValueError, 'hex.mjs'):
            packager.collect(self.root)

    def test_unknown_asset_id(self):
        path = self.root / 'puzzles/quittung-nombreo.json'
        data = json.loads(path.read_text()); data['presentation']['overlays'][0]['asset'] = 'invented.png'
        path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'invented.png'):
            packager.collect(self.root)

    def test_path_escape(self):
        path = self.root / 'puzzles/manifest.json'
        data = json.loads(path.read_text()); data['puzzles'][0]['path'] = '../secret.json'
        path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'Unzulässiger Rätselpfad'):
            packager.collect(self.root)


if __name__ == '__main__':
    unittest.main()
