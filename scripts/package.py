"""Deterministic static deployment; publication requires Node.js and Pillow."""
import json
import argparse
import re
import sys
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def collect(root):
    root = root.resolve()
    files = set()

    def add(path):
        component = root
        for part in path.relative_to(root).parts:
            component = component / part
            if component.is_symlink():
                raise ValueError(f'Symbolische Links werden nicht unterstützt: {component}')
        path = path.resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError(f"Fehlende oder unzulässige Laufzeitdatei: {path}")
        relative = path.relative_to(root).as_posix()
        if relative in files:
            return
        files.add(relative)
        if path.suffix not in ('.html', '.css', '.mjs'):
            return
        text = path.read_text(encoding='utf-8')
        refs = []
        if path.suffix == '.html':
            refs += re.findall(r'(?:src|href)=[\"\']([^\"\']+)[\"\']', text)
        if path.suffix == '.css':
            refs += re.findall(r'url\([\"\']?([^\"\')]+)[\"\']?\)', text)
        if path.suffix == '.mjs':
            refs += re.findall(r'(?:from\s*|import\s*)[\"\']([^\"\']+)[\"\']', text)
            for ref in re.findall(r'[\"\'](assets/[^\"\']+\.(?:png|webp|svg|jpg))[\"\']', text):
                add(root / ref)
        for ref in refs:
            if ref.startswith(('data:', '#')):
                continue
            if re.match(r'^[a-z]+:|^//|^/', ref):
                raise ValueError(f"Nicht eigenständig verpackbare Referenz in {relative}: {ref}")
            add(path.parent / ref.split('#')[0].split('?')[0])

    add(root / 'index.html')
    if (root / '.htaccess').is_file():
        add(root / '.htaccess')
    add(root / 'puzzles/manifest.json')
    manifest_path = root / 'puzzles/manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    def package_source(ref):
        if not re.fullmatch(r'(?:\.\./)*[A-Za-z0-9_./-]+\.json', ref):
            raise ValueError(f'Unzulässige Paketquelle: {ref}')
        candidate = manifest_path.parent / ref
        if not candidate.resolve().is_relative_to(root):
            raise ValueError(f'Paketquelle außerhalb des Pakets: {ref}')
        # Normalize dot segments, retaining symlinks for add() to reject.
        return Path(__import__('os').path.normpath(candidate))
    resource_root = (manifest_path.parent / manifest.get('resourceBase', './')).resolve()
    if not resource_root.is_relative_to(root):
        raise ValueError('Ressourcenbasis außerhalb des Pakets')
    if manifest.get('assetCatalog'):
        catalog_path = package_source(manifest['assetCatalog'])
        add(catalog_path)
        library = json.loads(catalog_path.read_text(encoding='utf-8'))
        for ref in [a['image']['path'] for a in library['assets']] + [b['image'] for b in library['backgrounds']]:
            if not re.fullmatch(r'assets/[A-Za-z0-9_/-]+\.(png|webp)', ref):
                raise ValueError(f'Unzulässiger Assetpfad: {ref}')
            add(resource_root / ref)
    for entry in manifest['puzzles']:
        add(package_source(entry['path']))
    validate_release(root, files)
    return sorted(files)


def validate_release(root, files):
    # Use the application validators, including the independent solver. Python
    # only collects dependencies and writes bytes; it does not reimplement rules.
    for command in [['node', str(ROOT / 'scripts/validate-puzzles.mjs')],
                    [sys.executable, str(ROOT / 'scripts/check-library-images.py'),
                     *[arg for ref in sorted(files) if Path(ref).suffix in ('.png', '.webp')
                       for arg in ('--runtime-file', ref)]]]:
        result = subprocess.run([*command, '--root', str(root)], cwd=ROOT,
                                capture_output=True, text=True)
        if result.returncode:
            raise ValueError('Vollständige Veröffentlichungsvalidierung fehlgeschlagen:\n' +
                             (result.stderr.strip() or result.stdout.strip()))


def deployment_name(name):
    return name[:-4] + '.js' if name.endswith('.mjs') else name


def deployment_bytes(root, name):
    data = (root / name).read_bytes()
    if name.endswith(('.html', '.mjs')):
        # Preserve ESM semantics; only local module filenames change for static hosts.
        pattern = r"([\"'])([^\"'\r\n]+)\.mjs\1"
        data = re.sub(pattern, lambda m: m[1] + m[2] + '.js' + m[1],
                      data.decode('utf-8')).encode('utf-8')
    return data


def package(root=ROOT):
    files = collect(root)  # Fail before replacing any previous valid archive.
    output = root / 'dist/Sams-Gezeitenkarten.zip'
    output.parent.mkdir(exist_ok=True)
    temporary = output.with_suffix('.zip.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name in files:
                info = zipfile.ZipInfo(deployment_name(name), date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                archive.writestr(info, deployment_bytes(root, name))
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)
    print(f'{output}\n{len(files)} Dateien, {output.stat().st_size} Bytes')
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Source tree to validate and export')
    args = parser.parse_args()
    try:
        package(args.root.resolve())
    except (ValueError, KeyError, OSError) as error:
        sys.exit(f'Export fehlgeschlagen: {error}')
