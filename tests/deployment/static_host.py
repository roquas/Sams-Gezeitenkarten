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
        if relative.startswith('legacy/'):
            relative = relative[len('legacy/'):]
            if relative.endswith('.mjs'):
                relative = relative[:-4] + '.js'
        return super().translate_path('/' + relative)

    def send_header(self, keyword, value):
        if keyword.lower() == 'content-type' and urlsplit(self.path).path.endswith('.mjs'):
            return  # Matches the actual response observed on roquas.de.
        super().send_header(keyword, value)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def do_GET(self):
        if urlsplit(self.path).path == PREFIX + 'legacy/':
            # The former entry URL, with exactly the same current application bytes.
            data = (ROOT / 'index.html').read_bytes().replace(b'src/ui/game.js', b'src/ui/game.mjs')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('DEPLOY_PORT', '4174'))), Handler).serve_forever()
