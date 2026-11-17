import re
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else "public")

# Asal paths (jaise tumhare folders mein hain) - koi rename nahi chahiye
TARGET = {
    "login": "/login/Login.html",
    "admin-dashboard": "/admin_dashboard/code.html",
    "projects": "/projects/Projects.html",
    "project-details": "/project_details/code.html",
    "team-directory": "/team_directory/code.html",
    "my-tasks": "/my_tasks_developer/code.html",
    "create-transcript": "/create_from_transcript/code.html",
}
IDS = ["urbancart", "quickserve", "helpdesk"]

HASH_JS = """
    // Open the right project tab from the URL hash
    function openFromHash() {
      const id = location.hash.replace('#', '');
      if (['urbancart', 'quickserve', 'helpdesk'].includes(id)) showProject(id);
    }
    window.addEventListener('DOMContentLoaded', openFromHash);
    window.addEventListener('hashchange', openFromHash);
"""

for f in sorted(root.rglob("*.html")):
    text = f.read_text(encoding="utf-8")
    old = text

    # 1) project cards: har card ko apna #hash (dashboard + projects page)
    if f.parent.name in ("admin_dashboard", "projects"):
        n = {"i": 0}

        def add_hash(m):
            i = n["i"]
            n["i"] += 1
            return 'href="%s#%s"' % (m.group(1), IDS[i % 3])

        text = re.sub(
            r'href="(\.\./project-details/ProjectDetails\.html|/project_details/code\.html)"',
            add_hash,
            text,
        )

    # 2) har navigation link ko asal path par lagao (login redirect bhi)
    def fix_path(m):
        return TARGET.get(m.group(1), m.group(0))

    text = re.sub(r"\.\./([a-z-]+)/[A-Za-z]+\.html", fix_path, text)

    # 3) ProjectDetails page hash padhe
    if f.parent.name == "project_details" and "function openFromHash" not in text:
        i = text.rfind("</script>")
        if i != -1:
            text = text[:i] + HASH_JS + "  " + text[i:]

    if text != old:
        f.write_text(text, encoding="utf-8")
        print("fixed:", f.relative_to(root))
    else:
        print("no change:", f.relative_to(root))
