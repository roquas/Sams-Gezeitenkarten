"""Actual playtest archive: exact allowlist, public projection, repeatable bytes."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
import zipfile

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('packager', ROOT / 'scripts/package.py')
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class PositivePackagingTests(unittest.TestCase):
    def test_public_only_deterministic_archive_uses_existing_runtime(self):
        command = ['python3', 'scripts/package-b2-positive.py']
        subprocess.run(command, cwd=ROOT, check=True, capture_output=True)
        output = ROOT / 'dist/B2-positive-playtest.zip'
        first = hashlib.sha256(output.read_bytes()).hexdigest()
        subprocess.run(command, cwd=ROOT, check=True, capture_output=True)
        self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), first)
        runtime = packager.collect(ROOT)
        extras = {'.dev/b2-positive/manifest.json', '.dev/b2-positive/B2-POSITIVE-01.json'}
        expected = {packager.deployment_name(ref) for ref in runtime} | extras
        with zipfile.ZipFile(output) as archive:
            self.assertEqual(set(archive.namelist()), expected)
            for entry in archive.infolist():
                self.assertEqual(entry.external_attr >> 16 & 0o777, 0o644)
                self.assertFalse(entry.filename.endswith('.mjs'))
            dto = json.loads(archive.read('.dev/b2-positive/B2-POSITIVE-01.json'))
            self.assertEqual(set(dto['puzzle']), {'schemaVersion', 'rulesVersion', 'dataVersion', 'id', 'logic', 'presentation'})
            self.assertEqual(dto['puzzle']['presentation']['hints'], [])
            text = archive.read('.dev/b2-positive/B2-POSITIVE-01.json').decode()
            for token in ('"solution"', '"trace"', '"proof"', '"diagnosis"', 'handCertificate'):
                self.assertNotIn(token, text)
            for ref in runtime:
                self.assertEqual(archive.read(packager.deployment_name(ref)), packager.deployment_bytes(ROOT, ref))
        self.assertFalse(any(ref.startswith(('.dev/', 'docs/', 'scripts/')) for ref in runtime))


if __name__ == '__main__':
    unittest.main()
