"""Deterministic, dependency-checked static deployment. Python 3 standard library only."""
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def collect(root):
    root = root.resolve()
    files = set()

    def add(path):
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
    manifest = json.loads((root / 'puzzles/manifest.json').read_text(encoding='utf-8'))
    registry = (root / 'src/puzzles/assets.mjs').read_text(encoding='utf-8')
    backgrounds = dict(re.findall(r"'([^']+)'\s*:\s*'(assets/[^']+)'", registry))
    motifs = dict(re.findall(r"'([^']+)'\s*:\s*\{asset:'([^']+)'", registry))
    omitted = set(re.findall(r"'([^']+)'\s*:\s*null", registry))
    # Include every registered motif: the registry itself is shipped in the app.
    for asset in motifs.values():
        add(root / 'assets/seekarte' / asset)
    ids = set()
    for entry in manifest['puzzles']:
        filename = entry['path']
        if not re.fullmatch(r'[A-Za-z0-9_.-]+\.json', filename):
            raise ValueError(f"Unzulässiger Rätselpfad: {filename}")
        path = root / 'puzzles' / filename
        add(path)
        puzzle = json.loads(path.read_text(encoding='utf-8'))
        if puzzle['id'] != entry['id'] or entry['id'] in ids:
            raise ValueError(f"Falsche oder doppelte Rätsel-ID: {filename}")
        ids.add(entry['id'])
        presentation = puzzle['presentation']
        background = presentation['background']
        if background not in backgrounds:
            raise ValueError(f"Unbekannter Hintergrund in {filename}: {background}")
        add(root / backgrounds[background])
        for overlay in presentation['overlays']:
            asset = overlay['asset']
            if asset not in motifs and asset not in omitted:
                raise ValueError(f"Unbekanntes Kartenmotiv in {filename}: {asset}")
    if manifest['defaultId'] not in ids:
        raise ValueError('Standardrätsel fehlt im Manifest')
    return sorted(files)


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
    try:
        package()
    except (ValueError, KeyError, OSError) as error:
        sys.exit(f'Export fehlgeschlagen: {error}')
