from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).parent / "dist"


class SPAHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        requested = ROOT / path.lstrip("/")
        if requested.is_file():
            return str(requested)
        if requested.is_dir() and (requested / "index.html").is_file():
            return str(requested / "index.html")
        return str(ROOT / "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8768"))
    server = ThreadingHTTPServer(("", port), SPAHandler)
    print(f"Serving Origin Daily app on http://127.0.0.1:{port}/")
    server.serve_forever()
