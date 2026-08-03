# Faire connaître la Maison — plan de lancement

Objectif : des contributeurs, pas du trafic. Mille visites qui repartent ne valent
pas dix collectionneurs qui envoient un scan.

---

## 1. À faire avant de poster quoi que ce soit

Un lancement raté ne se rejoue pas : les communautés se souviennent d'un lien
mort ou d'un site vide. Vérifie dans l'ordre :

- [ ] `002_search_moderation.sql` appliqué en production — **sans lui la page
      catalogue est cassée** (elle appelle `search_cards`)
- [ ] `seed_tcgdex.sql` appliqué → le catalogue affiche ~210 fiches, pas 24
- [ ] Ton compte est conservateur, `/admin` s'ouvre
- [ ] Tu as soumis une contribution de test depuis un autre compte, et tu l'as
      approuvée — le circuit complet doit avoir tourné au moins une fois
- [ ] Une carte au hasard affiche bien son visuel
- [ ] Les compteurs de la page d'accueil sont les vrais

**Point de vigilance.** N'importe qui peut déposer une contribution sans compte
(c'est voulu : ça baisse la barrière). Le jour où tu postes, surveille `/admin` :
il n'y a pas encore de limitation de débit. Si du spam arrive, le correctif le
plus simple est d'exiger un compte connecté pour soumettre :

```sql
DROP POLICY "contributions_insert" ON contributions;
CREATE POLICY "contributions_insert" ON contributions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 2. L'angle

Ne vends pas « une archive de cartes Carapuce ». Il en existe des dizaines et
personne n'a besoin d'une base de plus — TCGdex et Pokémon TCG API font déjà ça.

Ce que la Maison a et que les autres bases n'ont pas :

1. **Le grain de la variante.** Les bases listent une référence par carte. Ici,
   une ligne par variante physique réellement éditée : Set de Base FR existe en
   Édition 1 *et* en normale, ce sont deux objets distincts.
2. **Les trous assumés.** 63 fiches sur 210 n'ont aucun visuel. Le japonais est
   quasi absent : 5 fiches, alors que le vrai corpus JP en compte largement plus.
   C'est précisément ce qui donne une prise aux gens.
3. **Le hors-jeu.** Topps, Merlin, Panini : les stickers ne sont dans aucune base
   TCG. Ils n'existeront ici que si des collectionneurs les apportent.

**La demande doit être précise.** « Aidez-nous » ne marche pas. « Il manque le
visuel de 63 cartes, en voici la liste » marche :

```
https://ton-site.vercel.app/catalogue?sansvisuel=1
https://ton-site.vercel.app/catalogue?sansvisuel=1&langs=DE
https://ton-site.vercel.app/catalogue?langs=JP
```

Les filtres sont dans l'URL : chaque lien pointe exactement le manque dont tu
parles. C'est à ça que sert le partage d'état dans l'URL.

---

## 3. Où poster

Par ordre de rendement attendu. Ne fais pas tout le même jour — un post par
semaine, le temps d'absorber les contributions.

| Où | Ce qui marche | Réserve |
|---|---|---|
| **r/pkmntcgcollections** | Montrer une collection + demander de l'aide | Poste des photos de TES cartes, pas juste un lien |
| **Pokécardex (forum FR)** | Section collections. Public FR, exactement ta cible | Présente-toi avant de poster un lien |
| **Discord Pokémon FR/collection** | Le meilleur pour des contributeurs réguliers | Participe deux semaines avant de parler du projet |
| **r/PokemonTCG** | Grosse audience | Très strict sur l'autopromo — lis les règles |
| **Groupes Facebook collectionneurs FR** | Public plus âgé, grosses collections | Qualité variable |
| **X / Instagram, #PokemonTCG** | Visuel, viral possible | Faible taux de conversion en contributions |

La cible réelle : les gens qui font des **master sets d'un seul Pokémon**. Ils
existent, ils sont obsessionnels, et ils sont exactement ton public. Cherche
« Squirtle master set », « collection complète Carapuce » et parle-leur en direct.

**Chaque communauté a une règle anti-autopromo.** Lis-la. Un post supprimé pour
spam grille le sous-reddit durablement.

---

## 4. Brouillons

### Reddit / anglophone

> **Titre :** I catalogued every Squirtle card ever printed — 210 entries, 9 languages, and I'm stuck on Japanese
>
> I've been collecting Squirtle cards for a while and got frustrated that no
> database tracks *variants* properly — Base Set French 1st Edition and French
> unlimited are two different objects, but most databases show one entry.
>
> So I built an archive that has one entry per physical variant. 210 so far,
> 1996 to 2025, nine languages.
>
> Two things I can't fix alone:
> - **Japanese is nearly empty** — 5 entries. The JP corpus is much larger and
>   that's where the interesting Squirtles are (No Rarity, Master Ball).
> - **63 entries have no image at all** — mostly German and Italian.
>   [Here's the exact list](lien?sansvisuel=1).
>
> If you own any of these, a phone photo is enough. No account needed.
> Non-commercial, no price tracking, no ads.
>
> [link]

### Français

> **Titre :** J'ai recensé toutes les cartes Carapuce jamais imprimées — 210 fiches, et il me manque le japonais
>
> Je collectionne Carapuce depuis un moment, et aucune base ne gère
> correctement les **variantes** : Set de Base FR Édition 1 et Set de Base FR
> normale, ce sont deux objets différents. La plupart des bases n'en montrent
> qu'un.
>
> J'ai donc monté une archive avec une fiche par variante physique. 210 pour
> l'instant, de 1996 à 2025, neuf langues.
>
> Ce que je ne peux pas faire seul :
> - **le japonais est quasi vide** (5 fiches) — c'est pourtant là que sont les
>   Carapuce intéressants
> - **63 fiches n'ont aucun visuel**, surtout en allemand et italien —
>   [la liste exacte](lien?sansvisuel=1)
> - **les stickers Topps, Merlin, Panini** ne sont dans aucune base TCG
>
> Une photo au téléphone suffit. Pas besoin de compte. Pas de pub, pas de suivi
> de prix, pas de revente.
>
> [lien]

**Ce qui rend ces posts crédibles, c'est d'annoncer les trous.** Un projet qui
dit « regardez comme c'est complet » n'appelle aucune contribution. Un projet
qui dit « voilà précisément ce qui manque » en appelle.

---

## 5. Après le post

- **Réponds dans l'heure.** Le pic d'attention d'un post dure quelques heures.
- **Traite `/admin` le jour même.** Une contribution approuvée en trois jours
  ne donne pas de deuxième contribution.
- **Crédite.** Le mur des donateurs existe déjà, sers-t'en et dis-le.
- **Reviens avec un bilan.** « Grâce à vous, 40 nouvelles fiches en une
  semaine » relance la dynamique et rend le deuxième post légitime.

Compte quelques contributions sur un bon post, pas des dizaines. Le succès, ce
sont trois habitués qui reviennent — pas un pic de trafic.

---

## 6. Deux points à trancher avant d'être visible

**Les visuels.** Les images de référence viennent de TCGdex ; les illustrations
sont la propriété de The Pokémon Company. Un usage documentaire non commercial
est la norme dans ce milieu et se pratique largement, mais ça reste toléré, pas
autorisé. Concrètement : pas de pub, pas d'affiliation, pas de revente, et une
mention de la source (déjà en place sur chaque fiche). Si tu monétises un jour,
c'est cette partie qui devra changer en premier.

**L'adresse postale.** La page contribuer affiche « BP 007, France », qui est un
placeholder. Avant de faire venir du monde, mets une vraie adresse ou retire la
Voie II — annoncer une adresse d'envoi qui n'existe pas est la seule chose qui
peut réellement griller la réputation du projet.
