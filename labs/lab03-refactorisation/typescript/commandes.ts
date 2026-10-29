// Module hérité : calcule le total, la livraison et la priorité des commandes.
// Écrit en 2017, « ça marche, on n'y touche pas ». Jusqu'à aujourd'hui.

/** Ligne d'une commande : prix unitaire et quantité. */
export type Ligne = { prix: number; qte: number };

/** Commande à traiter. */
export type Commande = { id: string; statut: string; poids: number; lignes: Ligne[] };

/** Résultat du traitement d'une commande. */
export type CommandeTraitee = { id: string; total: number; livraison: number; priorite: string };

const STATUT_ANNULEE = 'annulee';
const REGION_QUEBEC = 'QC';
const REGION_ONTARIO = 'ON';

/** Paliers de poids (kg) : jusqu'à LEGER inclus, jusqu'à MOYEN inclus, puis surcharge au-delà de MOYEN. */
const POIDS_LEGER_MAX = 2;
const POIDS_MOYEN_MAX = 10;

/** Client premium : livraison offerte si le sous-total dépasse ce seuil, sinon moitié prix. */
const SEUIL_LIVRAISON_OFFERTE_PREMIUM = 100;

/** Priorité : « haute » au-delà du premier seuil, « normale » au-delà du second, sinon « basse ». */
const SEUIL_PRIORITE_HAUTE = 500;
const SEUIL_PRIORITE_NORMALE = 100;
const PRIORITE_HAUTE = 'haute';
const PRIORITE_NORMALE = 'normale';
const PRIORITE_BASSE = 'basse';

/** Tarif de livraison d'une région : forfaits léger et moyen (le forfait moyen sert aussi de base au-delà), puis coût par kg au-delà du palier moyen. */
type TarifRegion = { forfaitLeger: number; forfaitMoyen: number; parKgSupplementaire: number };

const TARIFS_PAR_REGION = new Map<string, TarifRegion>([
  [REGION_QUEBEC, { forfaitLeger: 8, forfaitMoyen: 15, parKgSupplementaire: 1.5 }],
  [REGION_ONTARIO, { forfaitLeger: 10, forfaitMoyen: 18, parKgSupplementaire: 1.75 }],
]);
const TARIF_AUTRES_REGIONS: TarifRegion = { forfaitLeger: 14, forfaitMoyen: 25, parKgSupplementaire: 2.5 };

/** Frais de livraison (avant remise premium) selon la région et le poids en kg. */
function fraisLivraison(poids: number, region: string): number {
  const tarif = TARIFS_PAR_REGION.get(region) ?? TARIF_AUTRES_REGIONS;
  if (poids <= POIDS_LEGER_MAX) {
    return tarif.forfaitLeger;
  }
  if (poids <= POIDS_MOYEN_MAX) {
    return tarif.forfaitMoyen;
  }
  return tarif.forfaitMoyen + (poids - POIDS_MOYEN_MAX) * tarif.parKgSupplementaire;
}

/**
 * Calcule total, livraison et priorité des commandes non annulées au poids valide.
 * @param commandes commandes à traiter
 * @param region code de région de livraison ('QC', 'ON', sinon tarif par défaut)
 * @param clientPremium true si le client est premium
 */
export function traiter(commandes: Commande[], region: string, clientPremium: boolean): CommandeTraitee[] {
  const resultats: CommandeTraitee[] = [];
  for (const commande of commandes) {
    if (commande.statut === STATUT_ANNULEE) {
      continue;
    }
    if (!(commande.poids > 0)) {
      console.log('poids invalide ' + commande.id);
      continue;
    }
    let sousTotal = 0;
    for (const ligne of commande.lignes) {
      sousTotal += ligne.prix * ligne.qte;
    }
    let livraison = fraisLivraison(commande.poids, region);
    if (clientPremium) {
      if (sousTotal > SEUIL_LIVRAISON_OFFERTE_PREMIUM) {
        livraison = 0;
      } else {
        livraison = livraison / 2;
      }
    }
    let priorite: string;
    if (sousTotal > SEUIL_PRIORITE_HAUTE) {
      priorite = PRIORITE_HAUTE;
    } else if (sousTotal > SEUIL_PRIORITE_NORMALE) {
      priorite = PRIORITE_NORMALE;
    } else {
      priorite = PRIORITE_BASSE;
    }
    resultats.push({
      id: commande.id,
      total: Math.round((sousTotal + livraison) * 100) / 100,
      livraison: Math.round(livraison * 100) / 100,
      priorite: priorite,
    });
  }
  return resultats;
}
