#!/usr/bin/env python3
"""Serve this static project in development without Safari's stale 304 responses.

Only for local development; do not deploy as a production web server.
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        # Python's default handler may return 304 based on mtime (rounded to
        # seconds). That can reuse an old Safari/ES-module cache after git pull.
        # Development should always return the current file with status 200.
        for header in ("If-Modified-Since", "If-None-Match"):
            if header in self.headers:
                del self.headers[header]
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        return super().end_headers()


def self_test():
    from tempfile import TemporaryDirectory
    from threading import Thread
    from urllib.request import Request, urlopen
    with TemporaryDirectory() as directory:
        Path(directory, "index.html").write_text("old", encoding="utf-8")
        handler = partial(NoCacheHandler, directory=directory)
        with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            url = f"http://127.0.0.1:{server.server_port}/index.html"
            try:
                def fetch():
                    request = Request(url, headers={
                        "If-Modified-Since": "Wed, 01 Jan 2100 00:00:00 GMT",
                        "If-None-Match": '"stale"',
                    })
                    with urlopen(request, timeout=5) as response:
                        assert response.status == 200, response.status
                        assert response.headers["Cache-Control"] == "no-store, max-age=0"
                        assert response.headers["Pragma"] == "no-cache"
                        assert response.headers["Expires"] == "0"
                        return response.read().decode("utf-8")
                assert fetch() == "old"
                Path(directory, "index.html").write_text("new", encoding="utf-8")
                assert fetch() == "new"
            finally:
                server.shutdown()
                thread.join(timeout=5)
    print("No-cache developer HTTP: self-test passed")


def main():
    parser = argparse.ArgumentParser(description="No-cache local server for Sams-Gezeitenkarten")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="127.0.0.1",
                        help="Bind address; use 0.0.0.0 only for trusted local device testing")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    handler = partial(NoCacheHandler, directory=str(ROOT))
    with ThreadingHTTPServer((args.host, args.port), handler) as httpd:
        print(f"No-cache development server: http://{args.host}:{args.port}/", flush=True)
        print(f"Files from: {ROOT}", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping development server")


if __name__ == "__main__":
    main()
