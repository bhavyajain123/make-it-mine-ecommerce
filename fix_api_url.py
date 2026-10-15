import pathlib
import re

RENDER = "https://mim-backend-api-2026-bj111234.onrender.com"

SNIPPET = (
    "\n<script>\n"
    "  window.API_ORIGIN = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')\n"
    "    ? 'http://localhost:5000'\n"
    f"    : '{RENDER}';\n"
    "</script>"
)

for p in pathlib.Path("frontend").glob("*.html"):
    with open(p, encoding="utf-8", newline="") as f:
        text = f.read()

    if "http://localhost:5000" not in text:
        continue

    # "http://localhost:5000/api/x"  ->  `${API_ORIGIN}/api/x`
    text = re.sub(r'"http://localhost:5000([^"]*)"', r'`${API_ORIGIN}\1`', text)
    # `http://localhost:5000/api/x/${id}`  ->  `${API_ORIGIN}/api/x/${id}`
    text = text.replace("`http://localhost:5000", "`${API_ORIGIN}")

    # <head> ke turant baad API_ORIGIN define karo
    if "window.API_ORIGIN" not in text:
        text = re.sub(r"(<head[^>]*>)", lambda m: m.group(1) + SNIPPET, text, count=1)

    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(text)
    print("fixed:", p)