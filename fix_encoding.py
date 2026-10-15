import pathlib
import ftfy

root = pathlib.Path("frontend")
skip = {"node_modules", "dist"}

for p in root.rglob("*"):
    if p.suffix not in {".html", ".js", ".css"} or skip & set(p.parts):
        continue
    with open(p, encoding="utf-8", newline="") as f:
        text = f.read()
    fixed = ftfy.fix_text(
        text,
        unescape_html=False,
        remove_terminal_escapes=False,
        fix_latin_ligatures=False,
        fix_character_width=False,
        uncurl_quotes=False,
        fix_line_breaks=False,
        remove_control_chars=False,
        normalization=None,
    )
    if fixed != text:
        with open(p, "w", encoding="utf-8", newline="") as f:
            f.write(fixed)
        print("fixed:", p)