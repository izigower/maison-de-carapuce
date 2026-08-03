# Déploiement — La Maison de Carapuce

## Stack
- **Front-end** : Next.js 15 (App Router)
- **Base de données + Auth + Storage** : Supabase
- **Hébergement** : Vercel

---

## 1. Supabase

### Créer le projet
1. Aller sur [supabase.com](https://supabase.com) → New project
2. Choisir un nom, un mot de passe fort, une région (Europe West)

### Appliquer le schéma
Dans l'éditeur SQL de Supabase (Database → SQL Editor), **dans cet ordre** :

| # | Fichier | Rôle |
|---|---------|------|
| 1 | `supabase/migrations/001_initial.sql` | Tables de base |
| 2 | `supabase/migrations/002_search_moderation.sql` | Recherche, modération, correctifs de sécurité |
| 3 | `supabase/seed.sql` | 24 cartes saisies à la main |
| 4 | `supabase/seed_tcgdex.sql` | 186 cartes importées de TCGdex |

> **002 est obligatoire.** Sans lui, la page catalogue affiche une erreur (la
> recherche passe par la fonction `search_cards`) et deux failles restent
> ouvertes : n'importe quel compte peut écrire dans le catalogue, et lire les
> emails de tous les contributeurs.

### Se nommer conservateur
Crée ton compte sur `/auth`, puis, dans le SQL Editor :
```sql
UPDATE profiles SET is_admin = TRUE
 WHERE id = (SELECT id FROM auth.users WHERE email = 'ton@email.fr');
```
Le lien **Conservation** apparaît alors dans la navigation, et donne accès à `/admin`.

### Régénérer le catalogue depuis TCGdex
```bash
node scripts/import-tcgdex.mjs      # réécrit supabase/seed_tcgdex.sql
```
Le seed est ré-exécutable : il met à jour les fiches existantes sans toucher aux
contributions communautaires.

### Tester les migrations avant de les appliquer
```bash
./supabase/tests/run.sh    # nécessite Docker ; n'touche pas à la prod
```
Rejoue tout le schéma sur un Postgres jetable et vérifie la recherche
(accents, multi-mots, filtres, pagination) puis la sécurité (RLS, modération,
escalade de privilèges).

### Récupérer les clés
Settings → API :
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon / public key

### Configurer l'auth
Authentication → URL Configuration :
- Site URL : `https://ton-projet.vercel.app`
- Redirect URLs : `https://ton-projet.vercel.app/auth/callback`

### Storage (scans communautaires)
Le bucket `scans` et ses règles d'accès sont créés par `002_search_moderation.sql`.
Rien à faire à la main. Lecture publique, dépôt réservé aux comptes connectés,
suppression réservée aux conservateurs.

---

## 2. Vercel

### Déployer
```bash
npm i -g vercel
vercel
```
Ou connecter le repo GitHub directement sur [vercel.com](https://vercel.com).

### Variables d'environnement
Dans Vercel → Settings → Environment Variables :
```
NEXT_PUBLIC_SUPABASE_URL    = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
```

---

## 3. Développement local

```bash
# Copier les variables d'environnement
cp .env.local.example .env.local
# Remplir .env.local avec tes clés Supabase

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Structure des pages

| URL | Description |
|-----|-------------|
| `/` | Accueil — stats + acquisitions récentes |
| `/catalogue` | Recherche, filtres langue/variante/période, pagination |
| `/carte/[id]` | Détail d'une carte |
| `/contribuer` | Formulaires de contribution (3 voies) + dépôt de scan |
| `/donateurs` | Classement des contributeurs |
| `/admin` | Salle de conservation — modération (conservateurs uniquement) |
| `/auth` | Connexion / inscription |
| `/auth/callback` | Callback OAuth/email (géré automatiquement) |

---

## Les visuels de carte

Trois sources, par ordre de priorité (`src/lib/cardImage.ts`) :

1. **`scan_url`** — scan déposé par un contributeur (bucket `scans`)
2. **`image_url`** — image posée à la main sur la fiche
3. **`official_image_url`** — visuel de référence TCGdex

Si aucune n'est renseignée, le placeholder aquatique s'affiche — c'est le cas de
39 des 186 cartes importées, surtout en allemand et en italien. Ce sont
exactement les fiches où un scan communautaire a le plus de valeur.

Les URLs TCGdex n'ont pas d'extension : `tcgdexImage()` suffixe `/high.png` ou
`/low.webp` selon le contexte.
