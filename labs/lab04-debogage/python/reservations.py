"""Lab 04 — Réservation de salles de réunion.

Ce module est en production… et le support a ouvert 5 tickets (voir rapport-incidents.md).
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal


@dataclass
class Reservation:
    salle: str
    debut: datetime
    fin: datetime
    tarif_horaire: float  # en dollars


def duree_heures(r: Reservation) -> float:
    """Durée de la réservation, en heures."""
    return (r.fin - r.debut).total_seconds() / 3600


def se_chevauchent(a: Reservation, b: Reservation) -> bool:
    """Vrai si les deux réservations occupent la même salle au même moment."""
    return a.salle == b.salle and a.debut < b.fin and b.debut < a.fin


def peut_reserver(existantes: list[Reservation], nouvelle: Reservation) -> bool:
    return not any(se_chevauchent(r, nouvelle) for r in existantes)


def cout(r: Reservation) -> float:
    """Coût de la réservation en dollars, arrondi au cent (la moitié vers le haut)."""
    # Calcul en cents entiers : round() sur un flottant et son arrondi « au pair » faussent la moitié.
    tarif_cents = int((Decimal(str(r.tarif_horaire)) * 100).to_integral_value(ROUND_HALF_UP))
    minutes = round(duree_heures(r) * 60)
    cents = (Decimal(tarif_cents * minutes) / 60).to_integral_value(ROUND_HALF_UP)
    return float(cents) / 100


def paginer(items: list, page: int, taille: int = 10) -> list:
    """Retourne la page `page` (1 = première page) de `taille` éléments."""
    debut = (page - 1) * taille
    return items[debut : debut + taille]


def taux_occupation(reservations: list[Reservation], salle: str, heures_ouvertes: int = 10) -> float:
    """Part des heures d'ouverture occupées pour une salle, sur les jours où elle est réservée."""
    de_la_salle = [r for r in reservations if r.salle == salle]
    jours = {r.debut.date() for r in de_la_salle}
    if not jours:
        return 0.0
    heures = sum(duree_heures(r) for r in de_la_salle)
    return round(heures / (heures_ouvertes * len(jours)), 2)
