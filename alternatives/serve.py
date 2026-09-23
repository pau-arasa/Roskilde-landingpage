"""Serve the three quiz hand-off alternatives side by side.

    python alternatives/serve.py      (from the project folder, or double-click)

  A  http://localhost:5501  Summary on the result screen + pre-filled message
  B  http://localhost:5502  Quiz profile attached to the application
  C  http://localhost:5503  Pick a foster type, then a pre-written message
"""
import functools, http.server, pathlib, sys, threading, webbrowser

ROOT = pathlib.Path(__file__).resolve().parent
SITES = [
    (5500, '..', 'Main landing page (current version)'),
    (5501, 'A-prefilled-message', 'Summary + pre-filled message'),
    (5502, 'B-attached-profile', 'Quiz profile attached'),
    (5503, 'C-pick-foster-type', 'Pick a foster type'),
]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

servers = []
for port, folder, label in SITES:
    handler = functools.partial(QuietHandler, directory=str(ROOT / folder))
    server = http.server.ThreadingHTTPServer(('localhost', port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    servers.append(server)
    print(f'  {"main" if folder == ".." else folder[0]:>4}  http://localhost:{port}   {label}')

if '--open' in sys.argv:
    for port, _, _ in SITES[:1]:
        webbrowser.open_new_tab(f'http://localhost:{port}')

print('\nPress Ctrl+C (or close this window) to stop.')
try:
    threading.Event().wait()
except KeyboardInterrupt:
    for server in servers:
        server.shutdown()
