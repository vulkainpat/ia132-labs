"""Lab 05 — Analyse d'une liste de diffusion.

Correct, testé… et beaucoup trop lent sur les 200 000 abonnés de la vraie liste.
"""

from collections import Counter


def normaliser(courriel: str) -> str:
    return courriel.strip().lower()


def dedoublonner(courriels: list[str]) -> list[str]:
    """Courriels uniques, normalisés, dans l'ordre de leur PREMIÈRE apparition."""
    # dict conserve l'ordre d'insertion : première apparition préservée (set l'aurait perdue).
    return list(dict.fromkeys(normaliser(c) for c in courriels))


def top_domaines(courriels: list[str], n: int = 3) -> list[tuple[str, int]]:
    """Les n domaines les plus fréquents : (domaine, nombre), par nombre décroissant puis par nom."""
    comptes = Counter(normaliser(c).split("@")[1] for c in courriels)
    return sorted(comptes.items(), key=lambda x: (-x[1], x[0]))[:n]


def communs(liste_a: list[str], liste_b: list[str]) -> list[str]:
    """Courriels présents dans les deux listes, sans doublon, dans l'ordre de liste_a."""
    b = {normaliser(c) for c in liste_b}
    return [c for c in dedoublonner(liste_a) if c in b]
