import pathlib

LEAD = "ÂÃÅâãðï"

def fix_text(s):
    out = []
    i = 0
    while i < len(s):
        done = False
        if s[i] in LEAD:
            for n in (3, 2, 1):
                chunk = s[i:i + n + 1]
                try:
                    dec = chunk.encode("cp1252").decode("utf-8")
                except (UnicodeEncodeError, UnicodeDecodeError):
                    continue
                out.append(dec)
                i += n + 1
                done = True
                break
        if not done:
            out.append(s[i])
            i += 1
    return "".join(out)

root = pathlib.Path("frontend")
skip = {"node_modules", "dist"}

for p in root.rglob("*"):
    if p.suffix not in {".html", ".js", ".css"} or skip & set(p.parts):
        continue
    with open(p, encoding="utf-8", newline="") as f:
        text = f.read()
    fixed = fix_text(text)
    if fixed != text:
        with open(p, "w", encoding="utf-8", newline="") as f:
            f.write(fixed)
        print("fixed:", p)