"""Tests d'intégration : un VRAI serveur HTTP, de vraies requêtes. À compléter (voir README).

La fixture `serveur` démarre l'API sur un port libre et l'arrête à la fin du module.
"""

import json
import threading
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import pytest

from api import LONGUEUR_CODE, creer_serveur


class SansRedirection(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None  # pour lire la réponse 302 elle-même


ouvrir = urllib.request.build_opener(SansRedirection).open


@pytest.fixture(scope="module")
def serveur():
    srv = creer_serveur()
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def requete(base, methode, chemin, corps=None):
    """Retourne (statut, en-têtes, corps JSON ou None) sans lever d'exception sur 4xx."""
    donnees = json.dumps(corps).encode() if corps is not None else None
    req = urllib.request.Request(base + chemin, data=donnees, method=methode, headers={"Content-Type": "application/json"})
    try:
        with ouvrir(req, timeout=5) as r:
            brut = r.read()
            return r.status, r.headers, json.loads(brut) if brut else None
    except urllib.error.HTTPError as e:
        brut = e.read()
        return e.code, e.headers, json.loads(brut) if brut else None


def test_sante(serveur):
    statut, _, corps = requete(serveur, "GET", "/sante")
    assert (statut, corps) == (200, {"statut": "ok"})


def creer_lien(base, url="https://exemple.ca/page"):
    statut, _, corps = requete(base, "POST", "/liens", {"url": url})
    assert statut == 201
    return corps["code"]


def post_brut(base, brut: bytes):
    """POST d'un corps non JSON (requete() sérialise toujours en JSON valide)."""
    req = urllib.request.Request(base + "/liens", data=brut, method="POST")
    try:
        with ouvrir(req, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# --- Nominal ---------------------------------------------------------------------------------


def test_creer_puis_suivre_un_lien(serveur):
    url = "https://exemple.ca/a?b=1"
    statut, _, corps = requete(serveur, "POST", "/liens", {"url": url})
    assert statut == 201
    assert corps["url"] == url
    assert len(corps["code"]) == LONGUEUR_CODE

    statut, entetes, _ = requete(serveur, "GET", f"/l/{corps['code']}")
    assert statut == 302
    assert entetes["Location"] == url


def test_statistiques_apres_trois_visites(serveur):
    code = creer_lien(serveur)
    assert requete(serveur, "GET", f"/stats/{code}")[2]["clics"] == 0
    for _ in range(3):
        assert requete(serveur, "GET", f"/l/{code}")[0] == 302
    statut, _, stats = requete(serveur, "GET", f"/stats/{code}")
    assert statut == 200
    assert stats == {"code": code, "url": "https://exemple.ca/page", "clics": 3}


# --- Erreurs 4xx -----------------------------------------------------------------------------


@pytest.mark.parametrize(
    "corps",
    [
        {},
        {"url": 42},
        {"url": None},
        {"url": "ftp://exemple.ca"},
        {"url": "https://"},
        {"url": "pas une url"},
        {"url": "https://e.ca/" + "x" * 2_048},
    ],
    ids=["absente", "nombre", "null", "ftp", "sans-hote", "texte", "trop-longue"],
)
def test_url_invalide_donne_400(serveur, corps):
    statut, _, reponse = requete(serveur, "POST", "/liens", corps)
    assert statut == 400
    assert "url invalide" in reponse["erreur"]


def test_json_invalide_donne_400(serveur):
    assert post_brut(serveur, b"{pas du json") == (400, {"erreur": "JSON invalide"})


def test_corps_json_non_objet_donne_400(serveur):
    statut, _, reponse = requete(serveur, "POST", "/liens", ["https://exemple.ca"])
    assert statut == 400
    assert "url invalide" in reponse["erreur"]


@pytest.mark.parametrize("chemin", ["/l/inconnu", "/stats/inconnu", "/nimporte/quoi"])
def test_get_inconnu_donne_404(serveur, chemin):
    statut, _, reponse = requete(serveur, "GET", chemin)
    assert statut == 404
    assert "erreur" in reponse


def test_post_sur_route_inconnue_donne_404(serveur):
    assert requete(serveur, "POST", "/autre", {"url": "https://exemple.ca"})[0] == 404


# --- Concurrence -----------------------------------------------------------------------------


def test_200_creations_concurrentes_donnent_200_codes_uniques(serveur):
    with ThreadPoolExecutor(max_workers=20) as pool:
        reponses = list(pool.map(lambda i: requete(serveur, "POST", "/liens", {"url": f"https://exemple.ca/{i}"}), range(200)))
    assert all(statut == 201 for statut, _, _ in reponses)
    codes = {corps["code"] for _, _, corps in reponses}
    assert len(codes) == 200


def test_100_visites_concurrentes_comptent_100_clics(serveur):
    code = creer_lien(serveur)
    with ThreadPoolExecutor(max_workers=20) as pool:
        statuts = list(pool.map(lambda _: requete(serveur, "GET", f"/l/{code}")[0], range(100)))
    assert statuts == [302] * 100
    assert requete(serveur, "GET", f"/stats/{code}")[2]["clics"] == 100
