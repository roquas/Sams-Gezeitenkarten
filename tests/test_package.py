import contextlib
import importlib.util
import io
import json
import hashlib
import subprocess
import sys
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
            self.assertIn('assets/catalog/library.json', names)
            self.assertIn('assets/library/technical-double.png', names)
            self.assertNotIn('dev/asset-library.html', names)
            for name in ['assets/seekarte/sea-blue-01.webp', 'assets/seekarte/frame-parchment-01.webp', 'assets/seekarte/frame-parchment-02.webp', 'assets/ui/logbook-chart.svg', '.htaccess']:
                self.assertIn(name, names)
                self.assertEqual(archive.read(name), (ROOT / name).read_bytes())
            self.assertEqual(names, [packager.deployment_name(n) for n in packager.collect(self.root)])
            self.assertFalse(any(n.startswith(('tests/', 'docs/', 'node_modules/', 'prototypes/', '.git')) for n in names))
            manifest = json.loads(archive.read('puzzles/manifest.json'))
            self.assertEqual(len(manifest['puzzles']), 4)
            for entry in manifest['puzzles']:
                self.assertIn('puzzles/' + entry['path'], names)

    def test_all_module_references_are_exported_as_js(self):
        import re
        import posixpath
        with contextlib.redirect_stdout(io.StringIO()):
            output = packager.package(self.root)
        with zipfile.ZipFile(output) as archive:
            names = set(archive.namelist())
            self.assertFalse(any(n.endswith('.mjs') for n in names))
            self.assertIn('src/ui/game.js', names)
            self.assertIn('type="module" src="src/ui/game.js"', archive.read('index.html').decode())
            for name in names:
                if not name.endswith('.js'):
                    continue
                text = archive.read(name).decode()
                self.assertNotIn('.mjs', text)
                refs = re.findall(r"(?:from\s*|import\s*)[\"']([^\"']+)[\"']", text)
                for ref in refs:
                    self.assertIn(posixpath.normpath(posixpath.join(posixpath.dirname(name), ref)), names)
            for name in packager.collect(self.root):
                if not name.endswith(('.mjs', '.html')):
                    self.assertEqual(archive.read(name), (self.root / name).read_bytes())

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

    def test_missing_catalog_image(self):
        (self.root / 'assets/library/technical-single.png').unlink()
        with self.assertRaisesRegex(ValueError, 'technical-single.png'):
            packager.collect(self.root)

    def test_catalog_path_escape(self):
        path = self.root / 'assets/catalog/library.json'
        data = json.loads(path.read_text())
        data['assets'][0]['image']['path'] = 'assets/library/../../README.md'
        path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'Assetpfad'):
            packager.collect(self.root)

    def test_unapproved_catalog_placement_is_not_shipped(self):
        path = self.root / 'puzzles/reference-3.6.json'
        data = json.loads(path.read_text())
        data['presentation']['assetBackground'] = 'sea-blue-01'
        data['presentation']['assetPlacements'] = [{'id': 'new', 'assetId': 'technical.single.v1', 'anchor': 'B3'}]
        path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'visually approved'):
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

    def update_json(self, ref, mutate):
        target = self.root / ref
        data = json.loads(target.read_text())
        mutate(data)
        target.write_text(json.dumps(data))

    def approve_fixture(self):
        def approve(c):
            for a in c['assets']:
                a['stage'] = 'illustration'
            for r in c['reviews']:
                a = next(a for a in c['assets'] if a['id'] == r['assetId'])
                b = next(b for b in c['backgrounds'] if b['id'] == r['backgroundId'])
                r.update(status='approved', reviewer='Package test only', date='2026-10-18',
                         assetSha256=hashlib.sha256((self.root / a['image']['path']).read_bytes()).hexdigest(),
                         backgroundSha256=hashlib.sha256((self.root / b['image']).read_bytes()).hexdigest())
        self.update_json('assets/catalog/library.json', approve)
        def place(p):
            p['presentation']['assetBackground'] = 'sea-blue-01'
            p['presentation']['assetPlacements'] = [dict(id='fixture', assetId='technical.single.v1', anchor='B3')]
        self.update_json('puzzles/reference-3.6.json', place)

    def rejected_release(self, pattern):
        # A failed validation never creates a ZIP or replaces an earlier release.
        output = self.root / 'dist/Sams-Gezeitenkarten.zip'
        output.parent.mkdir(exist_ok=True)
        output.write_bytes(b'previous valid release')
        with self.assertRaisesRegex(ValueError, pattern):
            packager.package(self.root)
        self.assertEqual(output.read_bytes(), b'previous valid release')
        self.assertFalse(output.with_suffix('.zip.tmp').exists())

    def test_approved_fixture_can_be_exported(self):
        self.approve_fixture()
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertTrue(packager.package(self.root).is_file())

    def test_wrong_asset_and_background_approval_hashes(self):
        self.approve_fixture()
        for field in ['assetSha256', 'backgroundSha256']:
            with self.subTest(field=field):
                original = (self.root / 'assets/catalog/library.json').read_bytes()
                self.update_json('assets/catalog/library.json', lambda c: c['reviews'][0].update({field: '0'*64}))
                self.rejected_release('Stale visual approval')
                (self.root / 'assets/catalog/library.json').write_bytes(original)

    def test_stale_approval_after_asset_change(self):
        self.approve_fixture()
        image = self.root / 'assets/library/technical-single.png'
        image.write_bytes(image.read_bytes()+b'changed')
        self.rejected_release('Stale visual approval')

    def test_incomplete_approval_metadata(self):
        self.approve_fixture()
        for field in ['reviewer', 'date', 'assetSha256', 'backgroundSha256']:
            with self.subTest(field=field):
                original = (self.root / 'assets/catalog/library.json').read_bytes()
                self.update_json('assets/catalog/library.json', lambda c: c['reviews'][0].pop(field))
                self.rejected_release('Approval requires')
                (self.root / 'assets/catalog/library.json').write_bytes(original)

    def test_forbidden_transform_parameters(self):
        self.approve_fixture()
        for field in ['scale', 'dx', 'dy', 'rotation', 'mirror']:
            with self.subTest(field=field):
                original = (self.root / 'puzzles/reference-3.6.json').read_bytes()
                self.update_json('puzzles/reference-3.6.json', lambda p: p['presentation']['assetPlacements'][0].update({field: 2}))
                self.rejected_release(field)
                (self.root / 'puzzles/reference-3.6.json').write_bytes(original)

    def test_placement_outside_board(self):
        self.approve_fixture()
        self.update_json('puzzles/reference-3.6.json', lambda p: p['presentation']['assetPlacements'][0].update(assetId='technical.double.v1', anchor='E3'))
        self.rejected_release('outside chart')

    def test_disconnected_asset_geometry(self):
        self.update_json('assets/catalog/library.json', lambda c: c['assets'][0]['geometry'].update(cells=[[0, 0], [2, 0]]))
        self.rejected_release('edge-connected')

    def test_corrupt_image_even_with_current_approval_hashes(self):
        (self.root / 'assets/library/technical-single.png').write_bytes(b'broken PNG')
        self.approve_fixture()
        self.rejected_release('technical.single.v1:.*cannot identify image')

    def test_same_background_id_with_different_file(self):
        self.update_json('assets/catalog/library.json', lambda c: c['backgrounds'][0].update(image='assets/seekarte/meer-pergament.webp'))
        self.approve_fixture()
        self.rejected_release('rendered background')

    def test_corrupt_background_even_with_current_hashes(self):
        (self.root / 'assets/seekarte/sea-blue-01.webp').write_bytes(b'broken WebP')
        self.approve_fixture()
        self.rejected_release('damaged runtime image')

    def test_corrupt_legacy_runtime_image(self):
        (self.root / 'assets/seekarte/tesoro.png').write_bytes(b'broken PNG')
        self.rejected_release('damaged runtime image')

    def test_internal_asset_symlink_alias(self):
        alias = self.root / 'assets/library/alias.png'
        alias.symlink_to('technical-single.png')
        self.update_json('assets/catalog/library.json', lambda c: c['assets'][0]['image'].update(path='assets/library/alias.png'))
        self.rejected_release('Symbolische Links')

    def test_symlink_directory_component(self):
        source = self.root / 'assets/library'
        target = self.root / 'assets/library-real'
        source.rename(target)
        source.symlink_to('library-real', target_is_directory=True)
        self.rejected_release('Symbolische Links')

    def test_alpha_outside_graphic_footprint(self):
        from PIL import Image
        path = self.root / 'assets/library/technical-single.png'
        image = Image.open(path)
        image.putpixel((0, 0), (0, 0, 0, 1))
        image.save(path)
        self.rejected_release('visible pixel outside geometry')

    def test_map_edge_alpha_outside_safety(self):
        from PIL import Image
        path = self.root / 'assets/library/technical-single.png'
        image = Image.open(path)
        image.putpixel((343, 204), (0, 0, 0, 1))
        image.save(path)
        self.approve_fixture()
        self.update_json('puzzles/reference-3.6.json', lambda p: p['presentation']['assetPlacements'][0].update(anchor='E2'))
        self.rejected_release('map boundary')

    def test_puzzle_solver_is_a_publication_gate(self):
        self.update_json('puzzles/reference-3.6.json', lambda p: p['logic'].update(clues=p['logic']['clues'][:1]))
        self.update_json('puzzles/reference-3.6.json', lambda p: p['presentation'].update(clues={'I': p['presentation']['clues']['I']}))
        self.rejected_release('Lösungen')

    def test_both_cli_entrypoints_report_failure_and_preserve_archive(self):
        self.approve_fixture()
        self.update_json('assets/catalog/library.json', lambda c: c['reviews'][0].update(assetSha256='0'*64))
        for command in [['sh', str(ROOT / 'scripts/package.sh')], [sys.executable, str(ROOT / 'scripts/package.py')]]:
            with self.subTest(command=command):
                result = subprocess.run([*command, '--root', str(self.root)], capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Export fehlgeschlagen', result.stderr)
                self.assertIn('Stale visual approval', result.stderr)
                self.assertFalse((self.root / 'dist/Sams-Gezeitenkarten.zip').exists())


if __name__ == '__main__':
    unittest.main()
