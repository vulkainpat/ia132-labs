# Lab 05 · Notes — optimiser et prouver par la mesure

## 1. Complexité en temps (code de départ)

n = taille de la liste, u = éléments uniques, m = taille de la 2ᵉ liste.

| Fonction | Complexité | Ligne responsable |
| --- | --- | --- |
| `dedoublonner` | O(n·u) → **O(n²)** | `resultat.includes(c)` (TS) / `c not in resultat` (Python) : recherche linéaire dans une liste, refaite pour chaque élément. |
| `topDomaines` / `top_domaines` | O(n·u + d²) → **O(n²)** | `domaines.filter(...)` / `domaines.count(d)` : parcourt toute la liste pour chaque domaine unique. S'y ajoute `dedoublonner(domaines)`, lui-même quadratique. |
| `communs` | O(n² + n·m) → **O(n²)** | `b.includes(c)` / `c in b` : `b` est une liste, donc recherche linéaire pour chaque élément de A. S'y ajoute `dedoublonner(listeA)`, quadratique. |

## 2. Versions O(n) (même résultat, même ordre)

| Fonction | Après | Pourquoi l'ordre est conservé |
| --- | --- | --- |
| `dedoublonner` | O(n) : `[...new Set(xs.map(normaliser))]` / `list(dict.fromkeys(...))` | `Set` (JS) et `dict` (Python) gardent l'ordre d'insertion, donc la première apparition. `list(set(...))` en Python l'aurait perdu. |
| `topDomaines` | O(n + u log u) : un seul passage avec `Map` / `Counter`, puis tri | Le tri (nombre décroissant, puis nom) est total sur des clés distinctes : l'ordre d'insertion n'a aucun effet. |
| `communs` | O(n + m) : `Set` pour B (`has` en O(1)), puis `filter` sur `dedoublonner(listeA)` | On filtre la liste A dédoublonnée : l'ordre de A est conservé. |

Le tri de `topDomaines` reste en O(u log u), mais u ≤ 200 domaines ici : c'est négligeable.

## 3. Mesures avant / après (secondes)

Mêmes listes générées par `generer(n, 1)` et `generer(n, 2)` ; machine du poste, Python 3. Mesures TS « avant » prises avec un script externe sous Node 22.17 ; mesures TS « après » reconfirmées avec `npm run bench:lab05` sous Node 22.23.4 (écarts négligeables).

### TypeScript

| Taille | Fonction | Avant | Après |
| --- | --- | --- | --- |
| 5 000 | dedoublonner | 0,072 | 0,003 |
| 5 000 | topDomaines | 0,065 | 0,075 (*) |
| 5 000 | communs | 0,193 | 0,006 |
| 10 000 | dedoublonner | 0,310 | 0,007 |
| 10 000 | topDomaines | 0,099 | 0,010 |
| 10 000 | communs | 0,956 | 0,009 |
| 20 000 | dedoublonner | 1,380 | 0,013 |
| 20 000 | topDomaines | 0,193 | 0,027 |
| 20 000 | communs | 4,071 | 0,018 |
| 200 000 | dedoublonner | non mesuré (> 2 min extrapolé) | 0,220 |
| 200 000 | topDomaines | non mesuré | 0,113 |
| 200 000 | communs | non mesuré | 0,259 |

(*) Première mesure du processus : le temps est dominé par le démarrage du moteur JIT, pas par l'algorithme. Dès la taille suivante, le temps redevient proportionnel à n.

### Python

| Taille | Fonction | Avant | Après |
| --- | --- | --- | --- |
| 5 000 | dedoublonner | 0,279 | 0,003 |
| 5 000 | top_domaines | 0,040 | 0,004 |
| 5 000 | communs | 1,001 | 0,005 |
| 10 000 | dedoublonner | 1,196 | 0,006 |
| 10 000 | top_domaines | 0,081 | 0,008 |
| 10 000 | communs | 3,737 | 0,013 |
| 20 000 | dedoublonner | 4,513 | 0,012 |
| 20 000 | top_domaines | 0,165 | 0,015 |
| 20 000 | communs | 13,671 | 0,023 |
| 200 000 | dedoublonner | non mesuré | 0,144 |
| 200 000 | top_domaines | non mesuré | 0,146 |
| 200 000 | communs | non mesuré | 0,266 |

### Lecture

- **Avant** : quand la taille double, `dedoublonner` et `communs` sont multipliés par ~4 (TS : 0,31 → 1,38 s ; Python : 1,20 → 4,51 s). C'est la signature de O(n²). `topDomaines` ne grimpe pas aussi vite (≈ ×2) car il n'y a que 200 domaines uniques : son coût est O(n·d) avec d petit.
- **Après** : le temps double quand la taille double (≈ ×2) : c'est du O(n). À 200 000 abonnés (la vraie liste), chaque fonction répond en moins de 0,3 s.
- **Gain** à 20 000 : `communs` passe de 4,07 s à 0,018 s en TS (~230×) et de 13,7 s à 0,023 s en Python (~600×).

## 4. Vérification

- TypeScript : 7 tests sur 7 verts, dont les 2 budgets (10 000 courriels en moins de 150 ms). Tests non modifiés.
- Python : 8 tests sur 8 verts, dont les 2 budgets (250 ms). Tests non modifiés.
- Avant optimisation : les 2 budgets étaient rouges dans les deux langages.

## 5. Remarques

- `pytest` n'est pas installé sur le poste : les tests Python ont été exécutés en appelant directement les fonctions `test_*`.
- Cas non couvert : un courriel sans `@` dans `topDomaines`. Python lève `IndexError` (avant et après). En TS, le code de départ plantait (`TypeError` dans `normaliser(undefined)`), alors que la version optimisée compte silencieusement une clé `undefined`. Aucun test ne couvre ce cas ; à traiter avec un test dédié et une `RangeError` explicite si on veut un comportement défini.
