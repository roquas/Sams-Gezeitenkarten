"""Local deterministic playtest ZIP, using the existing runtime packager."""
import subprocess
import zipfile
from package import ROOT, collect, deployment_bytes, deployment_name


def package_positive():
    # Fresh validated public projection; no generation or diagnostic export.
    subprocess.run(['node', str(ROOT / 'scripts/export-b2-playtest.mjs'),
                    '--stock', 'POSITIVE'], cwd=ROOT, check=True)
    files = collect(ROOT)
    files += ['.dev/b2-positive/B2-POSITIVE-01.json', '.dev/b2-positive/manifest.json']
    output = ROOT / 'dist/B2-positive-playtest.zip'
    output.parent.mkdir(exist_ok=True)
    temporary = output.with_suffix('.zip.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name in sorted(files):
                info = zipfile.ZipInfo(deployment_name(name), date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                archive.writestr(info, deployment_bytes(ROOT, name))
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)
    print(f'{output}\nLocal playtest ZIP only; no upload.')
    return output


if __name__ == '__main__':
    package_positive()
