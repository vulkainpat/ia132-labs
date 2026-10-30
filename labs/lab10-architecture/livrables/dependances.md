# Analyse des dépendances du prototype de 2019

Fichiers analysés : `dependances/requirements-legacy.txt` et `dependances/package.json`.

## Méthode et outils

Les chiffres et identifiants de ce document viennent des outils d'audit. Les jugements (fin de vie, abandon, recommandation) sont ceux de l'auteur et sont signalés comme tels.

- Python : `pip-audit --disable-pip --no-deps -r dependances/requirements-legacy.txt`. Le service interrogé est celui de PyPI, par défaut dans `pip-audit` (d'où les identifiants `PYSEC-…` et `GHSA-…`).
- JavaScript : `npm install --package-lock-only && npm audit`, exécuté dans une copie temporaire du `package.json` pour ne pas ajouter de `package-lock.json` au dépôt.

Les chiffres sont ceux de l'exécution du 2026-10-30 et évolueront avec les bases de vulnérabilités.

## Python · pip-audit

| Paquet | Version | Vulnérabilités | Correctif minimal indiqué |
| --- | --- | --- | --- |
| Django | 2.2.0 | 43 | 6.0.8 pour couvrir toutes les alertes |
| requests | 2.19.1 | 5 | 2.33.0 |
| urllib3 | 1.24.1 | 13 | 2.8.0 |
| PyYAML | 5.3 | 2 | 5.4 |
| Jinja2 | 2.10 | 6 | 3.1.6 |
| Pillow | 8.0.0 | 69 | 13.0.0 |
| celery | 4.3.0 | 1 | 5.2.2 |

Exemples d'identifiants renvoyés par l'outil : CVE-2019-11358 et CVE-2019-12308 (Django), CVE-2018-18074 (requests), CVE-2020-14343 (PyYAML), CVE-2021-23727 (celery).

## JavaScript · npm audit

15 paquets touchés : 2 critiques, 8 élevées, 2 modérées, 3 faibles. Six sont déclarés dans `package.json` (dépendances directes) ; les neuf autres sont des dépendances transitives.

### Dépendances directes

| Paquet | Version | Gravité | Exemple de problème signalé | Correctif indiqué par npm |
| --- | --- | --- | --- | --- |
| request | 2.88.0 | critique | Server-Side Request Forgery ; hérite aussi des alertes de `form-data` et `qs` | aucun |
| lodash | 4.17.15 | élevée | Injection de commande, prototype pollution, ReDoS | 4.18.1 |
| jsonwebtoken | 8.5.1 | élevée | Contournement de la validation de signature, clés forgeables | 9.0.3 |
| moment | 2.29.1 | élevée | Path traversal, ReDoS | 2.31.0 |
| express | 4.16.0 | élevée | XSS via `response.redirect()`, redirection ouverte, plus les alertes de `body-parser` | 4.22.3 |
| axios | 0.21.0 | élevée | SSRF, CSRF, ReDoS | 0.21.4, **insuffisant** (voir ci-dessous) |

### Dépendances transitives

| Paquet | Gravité | Tiré par | Problème signalé | Correctif indiqué |
| --- | --- | --- | --- | --- |
| form-data | critique | request | Fonction aléatoire non sûre, injection CRLF | aucun |
| qs | élevée | request, express (via body-parser) | Prototype pollution, DoS | aucun |
| body-parser | élevée | express | Dénis de service | via express 4.22.3 |
| path-to-regexp | élevée | express | ReDoS | via express 4.22.3 |
| tough-cookie | modérée | request | Prototype pollution | aucun |
| uuid | modérée | request | Contrôle de bornes manquant (v3/v5/v6) | aucun |
| cookie | faible | express | Caractères hors bornes dans nom, chemin ou domaine | via express 4.22.3 |
| send | faible | express, serve-static | Injection de gabarit pouvant mener à un XSS | via express 4.22.3 |
| serve-static | faible | express | Injection de gabarit pouvant mener à un XSS | npm indique un correctif sans préciser la version |

Remplacer `request` supprime d'un coup `form-data`, `tough-cookie` et `uuid`, et une des sources de `qs`.

### Cas d'axios

`npm audit` propose 0.21.4 comme correctif. Vérifié en auditant `axios@0.21.4` seul : il reste une alerte de gravité élevée qui regroupe plus de vingt avis (SSRF, contournement de `NO_PROXY`, pollution de prototype, fuite d'identifiants proxy). Passer à 0.21.4 ne suffit donc pas : il faut migrer vers une version 1.x récente.

## Identifiants CVE inventés par l'IA

Aucun identifiant n'est repris sans vérification : seuls ceux qu'un outil d'audit a renvoyés figurent dans ce document. Aucune analyse de `dependances/` par l'IA n'a été produite pour ce livrable, il n'y a donc aucun identifiant inventé à signaler ici.

Pour réaliser l'étape 5 du lab : demander à l'IA d'analyser `dependances/`, puis comparer chacun de ses CVE à la sortie de `pip-audit` et de `npm audit`, et noter ici ceux qui n'y figurent pas.

## Recommandation (jugement de l'auteur, hors sortie des outils)

Ne pas réutiliser ces dépendances. Django 2.2 et Celery 4.3 ne sont plus maintenus à notre connaissance, et `request` est déclaré obsolète par ses mainteneurs (à confirmer sur le dépôt du paquet). Même sans ce point, le nombre d'alertes, dont plusieurs sans correctif disponible, dépasse ce qu'une mise à jour ponctuelle corrige. Repartir de versions maintenues, épingler les versions, et ajouter `pip-audit` et `npm audit` à l'intégration continue : cette vérification n'est pas encore dans les critères de la story US-02 du backlog.
