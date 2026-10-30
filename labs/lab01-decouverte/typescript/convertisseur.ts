// Lab 01 — Convertisseur d'unités.
// Complétez chaque fonction avec votre assistant, en suivant les 4 étapes du README :
// complétion en ligne, chat, édition, agent.

import { pathToFileURL } from 'node:url';

export const ZERO_ABSOLU_C = -273.15;
export const KM_PAR_MILE = 1.609344;

export type Unite = 'C' | 'F' | 'km' | 'mi';

/** Celsius → Fahrenheit. Lève une RangeError sous le zéro absolu. */
export function celsiusVersFahrenheit(c: number): number {
  if (c < ZERO_ABSOLU_C) throw new RangeError(`${c} °C est sous le zéro absolu`);
  return (c * 9) / 5 + 32;
}

/** Fahrenheit → Celsius. Lève une RangeError si le résultat est sous le zéro absolu. */
export function fahrenheitVersCelsius(f: number): number {
  const c = ((f - 32) * 5) / 9;
  if (c < ZERO_ABSOLU_C) throw new RangeError(`${f} °F est sous le zéro absolu`);
  return c;
}

/** Kilomètres → miles. Lève une RangeError si la distance est négative. */
export function kmVersMiles(km: number): number {
  if (km < 0) throw new RangeError('La distance ne peut pas être négative');
  return km / KM_PAR_MILE;
}

/** Miles → kilomètres. Lève une RangeError si la distance est négative. */
export function milesVersKm(miles: number): number {
  if (miles < 0) throw new RangeError('La distance ne peut pas être négative');
  return miles * KM_PAR_MILE;
}

const CONVERSIONS: Partial<Record<`${Unite}->${Unite}`, (valeur: number) => number>> = {
  'C->F': celsiusVersFahrenheit,
  'F->C': fahrenheitVersCelsius,
  'km->mi': kmVersMiles,
  'mi->km': milesVersKm,
};

/**
 * Convertit `valeur` de l'unité `de` vers l'unité `vers`.
 * Même unité des deux côtés : la valeur est retournée telle quelle.
 * Paire non prise en charge (ex. 'C' vers 'km') : RangeError.
 */
export function convertir(valeur: number, de: Unite, vers: Unite): number {
  if (de === vers) return valeur;
  const fonction = CONVERSIONS[`${de}->${vers}`];
  if (!fonction) throw new RangeError(`Conversion non prise en charge : ${de} vers ${vers}`);
  return fonction(valeur);
}

const UNITES: readonly Unite[] = ['C', 'F', 'km', 'mi'];

const estUnite = (s: string): s is Unite => (UNITES as readonly string[]).includes(s);

/** Point d'entrée CLI : `main(['100', 'C', 'F'])` → `'212.00 F'`. Retourne un message d'erreur ou d'usage au lieu de lever. */
export function main(argv: string[]): string {
  if (argv.length !== 3) return `Usage : <valeur> <${UNITES.join('|')}> <${UNITES.join('|')}>`;
  const [brut, de, vers] = argv;
  const valeur = Number(brut);
  if (brut.trim() === '' || Number.isNaN(valeur)) return `Erreur : valeur invalide « ${brut} »`;
  if (!estUnite(de) || !estUnite(vers)) return `Erreur : unité inconnue (${UNITES.join(', ')})`;
  try {
    return `${convertir(valeur, de, vers).toFixed(2)} ${vers}`;
  } catch (e) {
    return `Erreur : ${(e as Error).message}`;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(main(process.argv.slice(2)));
}
