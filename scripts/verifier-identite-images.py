#!/usr/bin/env python3
"""
Contrôle d'IDENTITÉ des images du catalogue.

    python3 scripts/verifier-identite-images.py lignes.txt

Distinct du contrôle de disponibilité : celui-ci ne demande pas « l'URL
renvoie-t-elle une image ? » mais « renvoie-t-elle LA BONNE image ? ».
Pour chaque URL TCGdex, on interroge l'API et on compare le nom du Pokémon et
le numéro de collection à ce que la fiche annonce.

C'est ce contrôle qui a montré que ex13 est Holon Phantoms et non EX Delta
Species — cinq fiches Métamorph affichaient Élecsprint et Donphan alors que
toutes leurs URL répondaient HTTP 200.

Format d'entrée, une fiche par ligne :
    id|langue|numero|set|role|langue_tcgdex/id_tcgdex
"""
import json, urllib.request, re, unicodedata, concurrent.futures as cf, sys

def norm(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '', s)

def get(url):
    r = urllib.request.Request(url, headers={'User-Agent': 'maison-de-carapuce/verif'})
    try:
        with urllib.request.urlopen(r, timeout=30) as f:
            return json.load(f)
    except Exception:
        return None

def verifier(ligne):
    fid, lang, num, setname, role, chemin = ligne.split('|')
    l, cid = chemin.split('/', 1)
    d = get(f'https://api.tcgdex.net/v2/{l}/cards/{cid}')
    if d is None or not d.get('name'):
        return (fid, 'METADONNEE_ABSENTE', f'TCGdex ne decrit pas {l}/{cid}', '')

    nom_reel = d.get('name')
    set_reel = (d.get('set') or {}).get('name') or ''
    num_reel = str(d.get('localId') or '')
    num_fiche = num.split('/')[0].lstrip('0') or num.split('/')[0]

    pbs = []
    # Pour une carte sujet, l'image doit montrer Carapuce.
    NOMS = {'squirtle','carapuce','schiggy','ゼニガメ','傑尼龜','杰尼龟','꼬부기','เซนิกาเมะ'}
    if role == 'sujet' and norm(nom_reel) not in {norm(n) for n in NOMS}:
        pbs.append(f'montre « {nom_reel} »')
    if num_reel.lstrip('0') != num_fiche.lstrip('0'):
        pbs.append(f'numero {num_reel} vs {num_fiche} annonce')
    return (fid, 'PROBLEME' if pbs else 'OK', ' ; '.join(pbs), f'{nom_reel} — {set_reel} n°{num_reel}')

lignes = [l.strip() for l in open('lignes.txt') if l.strip()]
with cf.ThreadPoolExecutor(max_workers=6) as ex:
    res = list(ex.map(verifier, lignes))

bad = [r for r in res if r[1] != 'OK']
print(f'{len(res)} fiches controlees — {len(res)-len(bad)} conformes, {len(bad)} a revoir\n')
for fid, v, why, reel in sorted(bad):
    print(f'  [{v}] {fid}')
    print(f'        {why}')
    if reel: print(f'        image reelle : {reel}')
