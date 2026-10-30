# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Nature du dépôt

Labs de la formation IA132 (IA pour développeurs). Chaque dossier `labs/labNN-*/` est **indépendant** et contient un `README.md` (objectif · point de départ · étapes · livrable · pièges · bonus), un sous-dossier `python/` et un sous-dossier `typescript/` avec le même exercice dans les deux langages. Les tests **sont volontairement rouges au départ** : c'est l'exercice. Un lab est fini quand ses tests passent **sans les avoir modifiés**.

Lire le `README.md` du lab concerné (et `SPEC.md` / `AGENTS.md` s'ils existent, labs 02 et 11) avant de toucher au code. Le lab 11 (`taches`) a ses propres règles dans `labs/lab11-projet-final/AGENTS.md` (gabarit à compléter par l'apprenant).

## Commandes

TypeScript (Node ≥ 22.18 exécute les `.ts` directement, aucun build) :

```bash
npm test                      # tous les labs
npm run test:lab04            # un lab (lab00 … lab11)
node --test labs/lab04-debogage/typescript/reservations.test.ts          # un seul fichier
node --test --test-name-pattern="motif" labs/lab04-debogage/typescript/reservations.test.ts  # un seul test
npm run typecheck             # tsc strict, noEmit
npm run cov:lab08             # couverture (lab 08)
npm run bench:lab05           # benchmark (lab 05)
npm run api:lab09             # serveur API (lab 09)
npm run taches -- <args>      # CLI du projet final (lab 11)
```

Python (≥ 3.10, `pip install -r requirements-dev.txt` dans un venv) :

```bash
pytest labs/lab04-debogage                       # un lab
pytest labs/lab04-debogage/python/test_reservations.py::test_nom   # un seul test
ruff check .                                     # lint (line-length 130, complexité McCabe ≤ 8)
python scripts/verifier_env.py                   # vérification du poste
```

## Conventions (de `.github/copilot-instructions.md`)

- Code, noms et commentaires en **français**, **sans accents dans les identifiants** (`calculer_facture`, `dureeHeures`).
- Python : PEP 8, annotations de type, docstrings Google. TypeScript : `strict`, pas de `any`, TSDoc sur les exports. `tsconfig` impose `erasableSyntaxOnly` et `verbatimModuleSyntax` (pas d'`enum`/`namespace`, `import type` pour les types, extensions `.ts` dans les imports).
- Montants en **entiers (cents)**, jamais en flottants. SQL toujours paramétré. Aucun secret dans le code.
- Erreurs : lever `ValueError` / `RangeError` explicite, jamais de `except` vide.
- Tout changement de comportement s'accompagne d'un test.

## À ne pas faire

- Ne jamais modifier un test pour le faire passer (sauf consigne explicite du README du lab).
- Ne pas ajouter de dépendance sans le signaler ; ne pas toucher aux fichiers hors du lab en cours.
- Garder les implémentations Python et TypeScript d'un même lab équivalentes en comportement.
