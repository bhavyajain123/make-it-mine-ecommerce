import pathlib

TAG = '<script type="module" src="js/chatbot.js"></script>'
SKIP = {"admin-dashboard.html"}

for p in sorted(pathlib.Path("frontend").glob("*.html")):
    if p.name in SKIP:
        continue

    with open(p, encoding="utf-8", newline="") as f:
        text = f.read()

    if "js/chatbot.js" in text:
        continue

    idx = text.rfind("</body>")
    if idx == -1:
        continue

    text = text[:idx] + "  " + TAG + "\n" + text[idx:]

    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(text)

    print("added:", p)