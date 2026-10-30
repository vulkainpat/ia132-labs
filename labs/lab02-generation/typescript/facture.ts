// Lab 02 — Calcul d'une facture avec TPS et TVQ.
// Tous les montants sont des entiers, en cents.

export type Ligne = { produit: string; prix: number; quantite: number };

export type Facture = {
  sousTotal: number;
  rabais: number;
  livraison: number;
  tps: number;
  tvq: number;
  total: number;
};

/** Taux exprimés en fraction entière (numérateur / dénominateur) pour éviter les flottants. */
type Taux = { numerateur: number; denominateur: number };

const TAUX_BIENVENUE10: Taux = { numerateur: 10, denominateur: 100 };
const TAUX_ETE15: Taux = { numerateur: 15, denominateur: 100 };
const TAUX_TPS: Taux = { numerateur: 5, denominateur: 100 };
const TAUX_TVQ: Taux = { numerateur: 9_975, denominateur: 100_000 };

const SEUIL_ETE15 = 10_000;
const SEUIL_LIVRAISON_GRATUITE = 7_500;
const FRAIS_LIVRAISON = 999;

/** Applique un taux à un montant, arrondi au cent le plus proche (la moitié vers le haut). */
function appliquerTaux(montant: number, { numerateur, denominateur }: Taux): number {
  return Math.floor((2 * montant * numerateur + denominateur) / (2 * denominateur));
}

function validerLignes(lignes: Ligne[]): void {
  if (lignes.length === 0) {
    throw new RangeError('Facture vide');
  }
  for (const { prix, quantite } of lignes) {
    if (!Number.isInteger(quantite) || quantite < 1) {
      throw new RangeError(`Quantité invalide : ${quantite}`);
    }
    if (!Number.isInteger(prix) || prix < 0) {
      throw new RangeError(`Prix invalide : ${prix}`);
    }
  }
}

function calculerRabais(sousTotal: number, codePromo?: string): number {
  const code = codePromo?.trim().toUpperCase();
  if (!code) {
    return 0;
  }
  switch (code) {
    case 'BIENVENUE10':
      return appliquerTaux(sousTotal, TAUX_BIENVENUE10);
    case 'ETE15':
      return sousTotal >= SEUIL_ETE15 ? appliquerTaux(sousTotal, TAUX_ETE15) : 0;
    default:
      throw new RangeError('Code promo inconnu');
  }
}

/** Calcule une facture. Les règles complètes sont dans SPEC.md. */
export function calculerFacture(lignes: Ligne[], codePromo?: string): Facture {
  validerLignes(lignes);

  const sousTotal = lignes.reduce((somme, { prix, quantite }) => somme + prix * quantite, 0);
  const rabais = calculerRabais(sousTotal, codePromo);
  const livraison = sousTotal - rabais >= SEUIL_LIVRAISON_GRATUITE ? 0 : FRAIS_LIVRAISON;
  const baseTaxable = sousTotal - rabais + livraison;
  const tps = appliquerTaux(baseTaxable, TAUX_TPS);
  const tvq = appliquerTaux(baseTaxable, TAUX_TVQ);

  return { sousTotal, rabais, livraison, tps, tvq, total: baseTaxable + tps + tvq };
}
