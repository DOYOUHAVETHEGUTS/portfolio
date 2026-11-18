#!/usr/bin/env python3
"""
Local preview server.

    python serve.py             http://localhost:8000
    python serve.py --port 4000
    python serve.py --no-watch  serve only, don't rebuild on save

Rebuilds the site whenever a file in content/, templates/, static/, or a
top-level file like site.yaml changes, then reloads the open browser tab.
Ctrl-C to stop.
"""

from __future__ import annotations

import argparse
import threading
import time
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import build as builder

ROOT = Path(__file__).parent.resolve()

# Directories watched recursively. Only real directories go here — watchdog
# cannot watch a bare file path on Windows (ReadDirectoryChangesW needs a
# directory handle), so top-level files like site.yaml are covered by the
# non-recursive watch on ROOT instead.
WATCH_DIRS = ["content", "templates", "static"]

# Never trigger a rebuild for anything under these. `dist` is the build's own
# output — without this the build would retrigger itself forever.
IGNORE_PARTS = {"dist", ".venv", "venv", "__pycache__", ".git", ".idea", ".vscode"}
IGNORE_SUFFIXES = ("~", ".swp", ".swx", ".tmp", ".pyc")

_state = {"stamp": str(time.time())}
_lock = threading.Lock()


def rebuild(reason: str = "") -> None:
    """Rebuild the site. Serialized so overlapping events can't interleave."""
    with _lock:
        try:
            builder.build(dev=True)
            _state["stamp"] = str(time.time())
            if reason:
                print(f"  -> changed: {reason}")
        except SystemExit as exc:
            # build.py raises SystemExit for content errors (duplicate slug,
            # unknown track). Report it and keep serving the last good build.
            print(f"\n  Build stopped: {exc}\n")
        except Exception as exc:
            print(f"\n  Build failed: {type(exc).__name__}: {exc}\n")


def is_ignored(path_str: str) -> bool:
    try:
        rel = Path(path_str).resolve().relative_to(ROOT)
    except (ValueError, OSError):
        return True
    if any(part in IGNORE_PARTS for part in rel.parts):
        return True
    return path_str.endswith(IGNORE_SUFFIXES)


def start_watcher():
    """Start watching for edits. Returns the observer, or None if unavailable."""
    try:
        from watchdog.events import FileSystemEventHandler
        from watchdog.observers import Observer
    except ImportError:
        print("  (watchdog not installed - auto-rebuild off; run "
              "`pip install -r requirements.txt` to enable it)")
        return None

    class Rebuilder(FileSystemEventHandler):
        def __init__(self):
            self.last = 0.0

        def on_any_event(self, event):
            if event.is_directory or is_ignored(event.src_path):
                return
            now = time.time()
            if now - self.last < 0.4:      # debounce editors that save twice
                return
            self.last = now
            rebuild(Path(event.src_path).name)

    observer = Observer()
    handler = Rebuilder()
    watched = []

    for name in WATCH_DIRS:
        path = ROOT / name
        if path.is_dir():
            observer.schedule(handler, str(path), recursive=True)
            watched.append(name + "/")

    # Non-recursive watch on the project root catches site.yaml, build.py, and
    # any other top-level file - without descending into .venv or dist.
    observer.schedule(handler, str(ROOT), recursive=False)
    watched.append("site.yaml")

    try:
        observer.start()
    except Exception as exc:
        print(f"  (file watching unavailable: {exc} - auto-rebuild off)")
        return None

    print(f"  Watching: {', '.join(watched)}")
    return observer


class Handler(SimpleHTTPRequestHandler):
    """Serves dist/, plus a /__build endpoint the page polls for reloads."""

    def do_GET(self):
        if self.path.startswith("/__build"):
            body = _state["stamp"].encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # the build output is the useful signal, not every asset request


def main() -> None:
    parser = argparse.ArgumentParser(description="Preview the site locally.")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-open", action="store_true", help="don't launch a browser")
    parser.add_argument("--no-watch", action="store_true", help="don't rebuild on save")
    args = parser.parse_args()

    rebuild()

    dist = ROOT / "dist"
    if not (dist / "index.html").exists():
        raise SystemExit(
            "No dist/index.html was produced - fix the build error above, "
            "then run this again."
        )

    observer = None if args.no_watch else start_watcher()

    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(dist)))
    except OSError as exc:
        raise SystemExit(
            f"Could not start on port {args.port}: {exc}\n"
            f"Something else is probably using it - try: python serve.py --port {args.port + 1}"
        )

    url = f"http://localhost:{args.port}"
    print(f"\n  Serving {url}  -  Ctrl-C to stop\n")
    if not args.no_open:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.shutdown()
        server.server_close()
        if observer is not None:
            observer.stop()
            observer.join(timeout=3)


if __name__ == "__main__":
    main()
