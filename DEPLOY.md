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
Dans l'éditeur SQL de Supabase (Database → SQL Editor) :
```sql
-- Coller le contenu de supabase/migrations/001_initial.sql
```

### Insérer les données de départ
```sql
-- Coller le contenu de supabase/seed.sql
```

### Récupérer les clés
Settings → API :
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon / public key

### Configurer l'auth
Authentication → URL Configuration :
- Site URL : `https://ton-projet.vercel.app`
- Redirect URLs : `https://ton-projet.vercel.app/auth/callback`

### Storage (pour les photos de cartes)
Storage → New bucket :
- Nom : `card-photos`
- Public : ✓

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
| `/` | Accueil — stats animées + acquisitions récentes |
| `/catalogue` | Catalogue avec filtres langue/recherche |
| `/carte/[id]` | Détail d'une carte |
| `/contribuer` | Formulaires de contribution (3 voies) |
| `/donateurs` | Classement des contributeurs |
| `/auth` | Connexion / inscription |
| `/auth/callback` | Callback OAuth/email (géré automatiquement) |

---

## Ajouter de vrais scans de cartes

1. Dans Supabase Storage → `card-photos`, uploader le scan
2. Copier l'URL publique
3. Dans Database → `cards`, mettre à jour le champ `image_url` pour la carte concernée

Le placeholder SVG est remplacé automatiquement dès qu'une URL est présente.
