"""Compare the published repair and retained briefing files with this checkout."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import sys
import urllib.request

root = Path(__file__).resolve().parents[2]
expected_commit = sys.argv[1]
base = "https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/"
files = [
    "index.html", "phone.html", "sw.js", "src/prototype/build-info.js",
    "src/prototype/treasury.js", "src/prototype/rules.js",
    "src/prototype/boss-combat.js", "src/prototype/combat-visuals.js",
    "src/prototype/combat.js", "src/prototype/fortifications.js",
    "src/prototype/app.js", "src/prototype/menus.js",
]


def fetch(path):
    request = urllib.request.Request(
        base + path + "?repair=" + expected_commit,
        headers={"Cache-Control": "no-cache"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def verify(path):
    published = fetch(path)
    local = (root / path).read_bytes()
    assert published == local, "Published file differs: " + path
    return {"path": path, "sha256": hashlib.sha256(published).hexdigest(), "bytes": len(published)}


assert fetch("build.txt").decode().strip() == expected_commit, "Wrong published commit"
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    verified = list(pool.map(verify, files))
receipt = {
    "version": "0.9.1+snapshot.dev.151",
    "publishedCommit": expected_commit,
    "pullRequest": 390,
    "packageOnlyRun": 39700991767,
    "verifiedUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "files": verified,
    "broadCiRun": False,
    "validationReceipt": "FORT_REPAIRS_DEV151.json",
}
print(json.dumps(receipt, indent=2))
