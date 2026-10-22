"""Model the observed static host: nested deployment, nosniff, no .mjs MIME mapping."""
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = Path(os.environ['DEPLOY_ROOT']).resolve()
PREFIX = '/gk/pr38/'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        path = urlsplit(path).path
        if not path.startswith(PREFIX):
            return str(ROOT / '__outside_deployment__')
        relative = path[len(PREFIX):]
        return super().translate_path('/' + relative)

    def send_header(self, keyword, value):
        if keyword.lower() == 'content-type' and urlsplit(self.path).path.endswith('.mjs'):
            return  # Matches the actual response observed on roquas.de.
        super().send_header(keyword, value)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()



if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('DEPLOY_PORT', '4174'))), Handler).serve_forever()
