#!/usr/bin/env python3
"""
Récupère au navigateur les images que curl ne peut pas obtenir.

    python3 scripts/capturer-images.py /tmp/verif/a-capturer.txt

Certains hôtes (Bulbagarden en tête) renvoient 403 à tout client qui n'est pas
un vrai navigateur : l'image existe, mais le hotlink direct est refusé. On passe
donc par Chromium et on écrit le résultat dans public/captures/, pour que le
site serve les fichiers lui-même au lieu de dépendre d'un hôte hostile.

Chaque fichier est revérifié après écriture (décodage + dimensions) : une page
d'erreur déguisée en .jpg ne doit pas passer pour une image.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "captures"

CHROME = next(
    (p for p in Path.home().joinpath(".cache/ms-playwright").glob("chromium-*/chrome-linux64/chrome")),
    None,
)


def nom_fichier(url: str, ext: str) -> str:
    """Nom court et stable, dérivé de l'URL."""
    h = hashlib.sha1(url.encode()).hexdigest()[:12]
    base = url.split("/")[-1].split("?")[0]
    base = re.sub(r"\.[a-zA-Z0-9]+$", "", base)
    base = unicodedata.normalize("NFD", base)
    base = "".join(c for c in base if unicodedata.category(c) != "Mn")
    base = re.sub(r"[^a-zA-Z0-9]+", "-", base).strip("-").lower()[:60]
    return f"{base or 'img'}-{h}.{ext}"


def valider(chemin: Path):
    """Une image valide décode et fait plus de 40 px de côté."""
    try:
        out = subprocess.run(
            ["identify", "-format", "%m %w %h", str(chemin)],
            capture_output=True, text=True, timeout=30, check=True,
        ).stdout.split()
        fmt, w, h = out[0], int(out[1]), int(out[2])
        if w < 40 or h < 40:
            return None, f"trop petite ({w}x{h})"
        return {"format": fmt, "w": w, "h": h}, None
    except Exception:
        return None, "ne décode pas comme une image"


def main():
    liste = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/verif/a-capturer.txt")
    urls = [u.strip() for u in liste.read_text().splitlines() if u.strip()]
    OUT.mkdir(parents=True, exist_ok=True)

    resultats = []
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=str(CHROME) if CHROME else None,
                                args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = nav.new_context(
            user_agent=("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
            viewport={"width": 1280, "height": 900},
        )
        page = ctx.new_page()

        for i, url in enumerate(urls, 1):
            tag = f"[{i}/{len(urls)}]"
            try:
                # Le Referer du wiki lève le blocage anti-hotlink des archives.
                if "bulbagarden" in url:
                    page.set_extra_http_headers({"Referer": "https://bulbapedia.bulbagarden.net/"})
                else:
                    page.set_extra_http_headers({})

                rep = page.goto(url, wait_until="domcontentloaded", timeout=45_000)
                if rep is None or not rep.ok:
                    raison = f"HTTP {rep.status if rep else '?'}"
                    resultats.append({"url": url, "ok": False, "raison": raison})
                    print(f"{tag} ✗ {raison}", flush=True)
                    continue

                ctype = (rep.headers.get("content-type") or "").lower()
                if not ctype.startswith("image/"):
                    raison = f"réponse {ctype or 'inconnue'}, pas une image"
                    resultats.append({"url": url, "ok": False, "raison": raison})
                    print(f"{tag} ✗ {raison}", flush=True)
                    continue

                ext = "png" if "png" in ctype else "webp" if "webp" in ctype else "jpg"
                fichier = nom_fichier(url, ext)
                chemin = OUT / fichier
                chemin.write_bytes(rep.body())

                info, raison = valider(chemin)
                if info is None:
                    chemin.unlink(missing_ok=True)
                    resultats.append({"url": url, "ok": False, "raison": raison})
                    print(f"{tag} ✗ {raison}", flush=True)
                    continue

                resultats.append({
                    "url": url, "ok": True, "fichier": fichier,
                    "chemin_public": f"/captures/{fichier}",
                    "octets": chemin.stat().st_size,
                    "dimensions": f"{info['w']}x{info['h']}",
                })
                print(f"{tag} ✓ {fichier}  {info['w']}x{info['h']}", flush=True)
            except Exception as e:
                raison = str(e).split("\n")[0][:120]
                resultats.append({"url": url, "ok": False, "raison": raison})
                print(f"{tag} ✗ {raison}", flush=True)

        nav.close()

    Path("/tmp/verif/captures.json").write_text(json.dumps(resultats, ensure_ascii=False, indent=2))
    ok = [r for r in resultats if r["ok"]]
    print(f"\n{len(ok)}/{len(resultats)} récupérées → public/captures/")
    for r in resultats:
        if not r["ok"]:
            print(f"  échec : {r['raison']} — {r['url']}")


if __name__ == "__main__":
    main()
