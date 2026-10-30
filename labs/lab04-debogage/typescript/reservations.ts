// Lab 04 — Réservation de salles de réunion.
// Ce module est en production… et le support a ouvert 5 tickets (voir rapport-incidents.md).

export type Reservation = { salle: string; debut: Date; fin: Date; tarifHoraire: number };

/** Durée de la réservation, en heures. */
export function dureeHeures(r: Reservation): number {
  return (r.fin.getTime() - r.debut.getTime()) / 3_600_000;
}

/** Vrai si les deux réservations occupent la même salle au même moment. */
export function seChevauchent(a: Reservation, b: Reservation): boolean {
  return a.salle === b.salle && a.debut < b.fin && b.debut < a.fin;
}

export function peutReserver(existantes: Reservation[], nouvelle: Reservation): boolean {
  return !existantes.some((r) => seChevauchent(r, nouvelle));
}

/** Coût de la réservation en dollars, arrondi au cent (la moitié vers le haut). */
export function cout(r: Reservation): number {
  // Calcul en cents entiers : 31,15 $/h × 1,5 h vaut 4672,4999… en flottant, pas 4672,5.
  const tarifCents = Math.round(r.tarifHoraire * 100);
  const minutes = Math.round(dureeHeures(r) * 60);
  return Math.round((tarifCents * minutes) / 60) / 100;
}

/** Retourne la page `page` (1 = première page) de `taille` éléments. */
export function paginer<T>(items: T[], page: number, taille = 10): T[] {
  const debut = (page - 1) * taille;
  return items.slice(debut, debut + taille);
}

/** Part des heures d'ouverture occupées pour une salle, sur les jours où elle est réservée. */
export function tauxOccupation(reservations: Reservation[], salle: string, heuresOuvertes = 10): number {
  const deLaSalle = reservations.filter((r) => r.salle === salle);
  const jours = new Set(deLaSalle.map((r) => r.debut.toDateString()));
  if (jours.size === 0) return 0;
  const heures = deLaSalle.reduce((s, r) => s + dureeHeures(r), 0);
  return Math.round((heures / (heuresOuvertes * jours.size)) * 100) / 100;
}
