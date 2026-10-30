/**
 * @module geo
 * Utilitaires géographiques : distances orthodromiques entre points, recherche par rayon,
 * point le plus proche et formatage de coordonnées.
 */

/** Rayon moyen de la Terre, en kilomètres. */
export const RAYON_TERRE_KM = 6371;

/**
 * Lieu géographique nommé.
 *
 * @example
 * const mtl: Point = { nom: 'Montréal', lat: 45.5019, lon: -73.5674 };
 */
export type Point = { nom: string; lat: number; lon: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Calcule la distance orthodromique entre deux points (formule de haversine).
 *
 * @param a - Premier point (latitude et longitude en degrés décimaux).
 * @param b - Second point (latitude et longitude en degrés décimaux).
 * @returns Distance en kilomètres, arrondie à 0,1 km près.
 * @example
 * distanceKm({ nom: 'Montréal', lat: 45.5019, lon: -73.5674 }, { nom: 'Québec', lat: 46.8139, lon: -71.208 }); // 233
 */
export function distanceKm(a: Point, b: Point): number {
  const dlat = rad(b.lat - a.lat);
  const dlon = rad(b.lon - a.lon);
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlon / 2) ** 2;
  return Math.round(2 * RAYON_TERRE_KM * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/**
 * Retourne les points situés à au plus `rayonKm` du centre, du plus proche au plus éloigné.
 *
 * @param centre - Point de référence.
 * @param points - Points candidats (le tableau n'est pas modifié).
 * @param rayonKm - Rayon de recherche en kilomètres (inclusif, doit être ≥ 0).
 * @returns Nouveau tableau des points dans le rayon, triés par distance croissante.
 * @throws {RangeError} Si `rayonKm` est négatif.
 * @example
 * dansLeRayon(mtl, [qc, ott, tr, sh], 150).map((p) => p.nom); // ['Trois-Rivières', 'Sherbrooke']
 */
export function dansLeRayon(centre: Point, points: Point[], rayonKm: number): Point[] {
  if (rayonKm < 0) throw new RangeError('rayon négatif');
  return points.filter((p) => distanceKm(centre, p) <= rayonKm).sort((p, q) => distanceKm(centre, p) - distanceKm(centre, q));
}

/**
 * Trouve le point le plus proche de l'origine, en ignorant l'origine elle-même (comparée par référence).
 *
 * @param origine - Point de référence.
 * @param points - Points candidats; peut contenir `origine`.
 * @returns Le point le plus proche, ou `undefined` s'il ne reste aucun candidat.
 * @example
 * plusProche(mtl, [mtl, qc, tr]); // tr
 */
export function plusProche(origine: Point, points: Point[]): Point | undefined {
  let meilleur: Point | undefined;
  for (const p of points) {
    if (p === origine) continue;
    if (!meilleur || distanceKm(origine, p) < distanceKm(origine, meilleur)) meilleur = p;
  }
  return meilleur;
}

/**
 * Formate les coordonnées d'un point en degrés décimaux avec hémisphères (N/S, E/O).
 *
 * @param p - Point à formater.
 * @returns Chaîne de la forme « 45.5019° N, 73.5674° O » (4 décimales).
 * @example
 * formatCoordonnees(mtl); // '45.5019° N, 73.5674° O'
 */
export function formatCoordonnees(p: Point): string {
  const ns = p.lat >= 0 ? 'N' : 'S';
  const eo = p.lon >= 0 ? 'E' : 'O';
  return `${Math.abs(p.lat).toFixed(4)}° ${ns}, ${Math.abs(p.lon).toFixed(4)}° ${eo}`;
}
