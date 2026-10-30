# Module `geo`

Utilitaires géographiques sans dépendance : distance entre deux points, recherche par rayon,
point le plus proche et formatage de coordonnées.

## But

Le module répond à quatre questions, toutes posées sur des coordonnées en **degrés décimaux** :

| Fonction | Question |
| --- | --- |
| `distanceKm(a, b)` | À quelle distance sont ces deux lieux ? |
| `dansLeRayon(centre, points, rayonKm)` | Quels lieux sont à moins de *N* km d'ici, du plus proche au plus loin ? |
| `plusProche(origine, points)` | Quel est le lieu le plus proche, sans compter l'origine ? |
| `formatCoordonnees(p)` | Comment afficher ces coordonnées à un humain ? |

Les distances utilisent la formule de **haversine** sur une Terre **sphérique** de rayon
`RAYON_TERRE_KM = 6371`. C'est un modèle simple, suffisant pour trier des lieux ou filtrer une
liste ; ce n'est pas un calcul géodésique (voir *Limites*).

## Installation

Aucune : le module est en TypeScript pur, sans dépendance, et Node ≥ 22.18 exécute les `.ts`
directement (pas d'étape de build).

```ts
import { dansLeRayon, distanceKm, formatCoordonnees, plusProche, type Point } from './geo.ts';
```

Depuis la racine du dépôt, le chemin est `./labs/lab06-documentation/typescript/geo.ts`.
L'extension `.ts` dans l'import et le `import type` pour `Point` sont imposés par le `tsconfig`
du dépôt (`verbatimModuleSyntax`).

## Exemple

```ts
import { dansLeRayon, distanceKm, formatCoordonnees, plusProche, type Point } from './geo.ts';

const mtl: Point = { nom: 'Montréal', lat: 45.5019, lon: -73.5674 };
const qc: Point = { nom: 'Québec', lat: 46.8139, lon: -71.208 };
const tr: Point = { nom: 'Trois-Rivières', lat: 46.343, lon: -72.5477 };
const sh: Point = { nom: 'Sherbrooke', lat: 45.4042, lon: -71.8929 };

distanceKm(mtl, qc);                                     // 233
dansLeRayon(mtl, [qc, tr, sh], 150).map((p) => p.nom);   // ['Trois-Rivières', 'Sherbrooke']
plusProche(mtl, [mtl, qc, tr, sh])?.nom;                 // 'Trois-Rivières'
formatCoordonnees(mtl);                                  // '45.5019° N, 73.5674° O'
```

Les quatre valeurs ci-dessus ont été obtenues en exécutant le code, pas estimées.

### Tests

```bash
npm run test:lab06                                          # comportement + documentation
node --test labs/lab06-documentation/typescript/geo.test.ts  # un seul fichier
npm run typecheck                                            # tsc strict, noEmit
```

Le fichier de tests vérifie deux choses : le **comportement** des quatre fonctions, et la
**documentation** elle-même (un bloc TSDoc avec un `@param` par paramètre, `@returns`,
`@example`, et `@throws` quand la fonction lève).

## Limites

- **Terre sphérique, pas ellipsoïde.** Le rayon réel varie d'environ 6357 km aux pôles à
  6378 km à l'équateur ; avec un rayon unique de 6371 km, l'échelle du résultat peut donc
  s'écarter de l'ordre de 0,3 % selon la latitude. Pour du cadastre ou de la navigation,
  utilisez une bibliothèque géodésique (WGS84).
- **Arrondi à 0,1 km, appliqué avant le filtrage.** `dansLeRayon` compare la distance
  *arrondie* au rayon : un point à 150,02 km est inclus dans un rayon de 150 km. L'arrondi
  peut aussi créer des ex æquo ; le tri étant stable, l'ordre d'entrée tranche.
- **Aucune validation des coordonnées.** Une latitude de 500° ne lève rien et produit une
  distance absurde. Seul `rayonKm < 0` est refusé, par un `RangeError`. Un `rayonKm` égal à
  `NaN` ne lève pas non plus : il renvoie simplement un tableau vide.
- **`plusProche` compare par référence** (`p === origine`). Une *copie* de l'origine
  (`{ ...mtl }`) n'est pas reconnue comme l'origine et sera renvoyée, à 0 km. Passez les mêmes
  objets `Point`, pas des copies. ⚠️ C'est le point qui diverge de l'implémentation Python,
  où `Point` est un dataclass gelé comparé par valeur : là, toutes les copies de l'origine sont
  écartées.
- **Coût en O(n log n) distances.** `dansLeRayon` et `plusProche` recalculent `distanceKm` à
  chaque comparaison du tri. Négligeable sur quelques centaines de points, à revoir au-delà
  (décorer-trier-dédécorer).
- **Pas d'altitude, pas de dates, pas de fuseaux.** Un `Point` est un nom et deux angles.
- `formatCoordonnees` affiche des **degrés décimaux** à 4 décimales avec hémisphère
  (`45.5019° N, 73.5674° O`), jamais des degrés-minutes-secondes. L'abréviation de l'ouest est
  `O` (français), pas `W`.
