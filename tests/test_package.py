"""Contract tests on a small isolated demo package, never a fixed content count."""
import contextlib
import hashlib
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
    @classmethod
    def setUpClass(cls):
        cls.files = packager.collect(ROOT)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for ref in self.files:
            target = self.root / ref
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / ref, target)
        # Keep just the guaranteed demo package. Other installed assets are optional.
        dto = self.read('puzzles/model-demo.json')
        used = {p['assetId'] for p in dto['puzzle']['presentation']['assetPlacements']}
        c = self.read('assets/catalog/library.json')
        c['assets'] = [a for a in c['assets'] if a['id'] in used]
        c['backgrounds'] = [b for b in c['backgrounds'] if b['id'] == dto['puzzle']['presentation']['background']]
        c['reviews'] = [r for r in c['reviews'] if r['assetId'] in used and r['backgroundId'] == c['backgrounds'][0]['id']]
        self.write('assets/catalog/library.json', c)

    def read(self, ref):
        return json.loads((self.root / ref).read_text())

    def write(self, ref, data):
        (self.root / ref).write_text(json.dumps(data))

    def change_puzzle(self, mutate):
        d = self.read('puzzles/model-demo.json')
        mutate(d['puzzle'])
        self.write('puzzles/model-demo.json', d)

    def rejected(self, pattern):
        output = self.root / 'dist/Sams-Gezeitenkarten.zip'
        output.parent.mkdir(exist_ok=True)
        output.write_bytes(b'previous valid release')
        with self.assertRaisesRegex(ValueError, pattern):
            packager.package(self.root)
        self.assertEqual(output.read_bytes(), b'previous valid release')
        self.assertFalse(output.with_suffix('.zip.tmp').exists())

    def test_deterministic_runtime_only_archive_and_public_projection(self):
        with contextlib.redirect_stdout(io.StringIO()):
            output = packager.package(self.root)
            first = output.read_bytes()
            self.assertEqual(first, packager.package(self.root).read_bytes())
        with zipfile.ZipFile(output) as archive:
            names = archive.namelist()
            self.assertIn('src/ui/game.js', names)
            self.assertFalse(any(n.endswith('.mjs') or n.startswith(('tests/', 'docs/', 'archive/', 'prototypes/')) for n in names))
            self.assertNotIn('src/assets/legacy.js', names)
            self.assertNotIn('scripts/lib/publication-archive.js', names)
            for entry in self.read('puzzles/manifest.json')['puzzles']:
                dto = json.loads(archive.read('puzzles/' + entry['path']))
                self.assertNotIn('solution', dto['puzzle'])
                self.assertNotIn('metadata', dto['puzzle'])

    def test_all_module_references_are_exported_as_js(self):
        import re
        import posixpath
        with contextlib.redirect_stdout(io.StringIO()):
            output = packager.package(self.root)
        with zipfile.ZipFile(output) as archive:
            names = set(archive.namelist())
            for name in names:
                if not name.endswith('.js'):
                    continue
                text = archive.read(name).decode()
                self.assertNotIn('.mjs', text)
                for ref in re.findall(r"(?:from\s*|import\s*)[\"']([^\"']+)[\"']", text):
                    self.assertIn(posixpath.normpath(posixpath.join(posixpath.dirname(name), ref)), names)

    def test_missing_puzzle(self):
        (self.root / 'puzzles/model-demo.json').unlink()
        self.rejected('model-demo.json')

    def test_missing_asset(self):
        c = self.read('assets/catalog/library.json')
        (self.root / c['assets'][0]['image']['path']).unlink()
        self.rejected('Laufzeitdatei')

    def test_path_escape(self):
        c = self.read('puzzles/manifest.json')
        c['puzzles'][0]['path'] = '../../secret.json'
        self.write('puzzles/manifest.json', c)
        self.rejected('außerhalb')

    def test_stale_asset_and_background_approval_hashes(self):
        original = self.read('assets/catalog/library.json')
        for field in ['assetSha256', 'backgroundSha256']:
            c = json.loads(json.dumps(original))
            c['reviews'][0][field] = '0'*64
            self.write('assets/catalog/library.json', c)
            self.rejected('Stale visual approval')

    def test_incomplete_approval(self):
        c = self.read('assets/catalog/library.json')
        del c['reviews'][0]['reviewer']
        self.write('assets/catalog/library.json', c)
        self.rejected('Approval requires')

    def test_forbidden_placement_transform(self):
        self.change_puzzle(lambda p: p['presentation']['assetPlacements'][0].update(rotation=60))
        self.rejected('rotation')

    def test_mismatching_object_footprint(self):
        self.change_puzzle(lambda p: p['presentation']['assetPlacements'][0].update(anchor='D4'))
        self.rejected('footprint mismatch')

    def test_passability_is_never_overridden_by_asset(self):
        self.change_puzzle(lambda p: p['logic']['map']['objects'][1].update(passable=True))
        self.rejected('passable conflicts')

    def test_corrupt_image_with_updated_approval_hash(self):
        c = self.read('assets/catalog/library.json')
        a = c['assets'][0]
        broken = b'broken PNG'
        (self.root / a['image']['path']).write_bytes(broken)
        for r in c['reviews']:
            if r['assetId'] == a['id']:
                r['assetSha256'] = hashlib.sha256(broken).hexdigest()
        self.write('assets/catalog/library.json', c)
        self.rejected('cannot identify image')

    def test_alpha_outside_footprint(self):
        from PIL import Image
        c = self.read('assets/catalog/library.json')
        a = next(a for a in c['assets'] if len(a['geometry']['cells']) == 1)
        path = self.root / a['image']['path']
        image = Image.open(path)
        image.putpixel((0, 0), (0, 0, 0, 1))
        image.save(path)
        for r in c['reviews']:
            if r['assetId'] == a['id']:
                r['assetSha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.write('assets/catalog/library.json', c)
        self.rejected('visible pixel outside geometry')

    def test_symlink_components_rejected(self):
        original = self.root / 'assets/library'
        original.rename(self.root / 'assets/library-real')
        original.symlink_to('library-real', target_is_directory=True)
        self.rejected('Symbolische Links')

    def test_solver_is_a_release_gate(self):
        self.change_puzzle(lambda p: p['logic'].update(clues=[]))
        self.change_puzzle(lambda p: p['presentation'].update(clueTexts={}))
        self.rejected('Lösungen')

    def test_private_target_cannot_enter_runtime_dto(self):
        self.change_puzzle(lambda p: p.update(solution=['A5', 'B5', 'C5', 'D5']))
        self.rejected('solution')

    def test_deferred_art_cannot_be_exported(self):
        c = self.read('assets/catalog/library.json')
        c['assets'][0]['production'] = 'deferred'
        self.write('assets/catalog/library.json', c)
        self.rejected('not enabled for production')

    def test_empty_optional_catalog_needs_no_asset_catalog(self):
        self.write('puzzles/manifest.json', {'schemaVersion': 2, 'defaultId': None, 'puzzles': []})
        (self.root / 'assets/catalog/library.json').unlink()
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertTrue(packager.package(self.root).is_file())

    def test_catalog_and_resources_can_use_another_local_location(self):
        c = self.read('puzzles/manifest.json')
        c['assetCatalog'] = '../resources/catalog.json'
        c['resourceBase'] = '../resources/'
        directory = self.root / 'resources'
        directory.mkdir()
        shutil.copyfile(self.root / 'assets/catalog/library.json', directory / 'catalog.json')
        shutil.copytree(self.root / 'assets', directory / 'assets')
        self.write('puzzles/manifest.json', c)
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertTrue(packager.package(self.root).is_file())


if __name__ == '__main__':
    unittest.main()
