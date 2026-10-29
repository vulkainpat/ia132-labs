// Module hérité : calcule le total, la livraison et la priorité des commandes.
// Écrit en 2017, « ça marche, on n'y touche pas ». Jusqu'à aujourd'hui.

/** Ligne d'une commande : prix unitaire et quantité. */
export type Ligne = { prix: number; qte: number };

/** Commande à traiter. */
export type Commande = { id: string; statut: string; poids: number; lignes: Ligne[] };

/** Résultat du traitement d'une commande. */
export type CommandeTraitee = { id: string; total: number; livraison: number; priorite: string };

/**
 * Calcule total, livraison et priorité des commandes non annulées au poids valide.
 * @param commandes commandes à traiter
 * @param region code de région de livraison ('QC', 'ON', sinon tarif par défaut)
 * @param clientPremium true si le client est premium
 */
export function traiter(commandes: Commande[], region: string, clientPremium: boolean): CommandeTraitee[] {
  const resultats: CommandeTraitee[] = [];
  for (let i = 0; i < commandes.length; i++) {
    const commande = commandes[i];
    if (commande.statut != 'annulee') {
      if (commande.poids > 0) {
        let sousTotal = 0;
        for (let j = 0; j < commande.lignes.length; j++) {
          sousTotal = sousTotal + commande.lignes[j].prix * commande.lignes[j].qte;
        }
        let livraison: number;
        if (region == 'QC') {
          if (commande.poids <= 2) {
            livraison = 8;
          } else {
            if (commande.poids <= 10) {
              livraison = 15;
            } else {
              livraison = 15 + (commande.poids - 10) * 1.5;
            }
          }
        } else if (region == 'ON') {
          if (commande.poids <= 2) {
            livraison = 10;
          } else {
            if (commande.poids <= 10) {
              livraison = 18;
            } else {
              livraison = 18 + (commande.poids - 10) * 1.75;
            }
          }
        } else {
          if (commande.poids <= 2) {
            livraison = 14;
          } else {
            if (commande.poids <= 10) {
              livraison = 25;
            } else {
              livraison = 25 + (commande.poids - 10) * 2.5;
            }
          }
        }
        if (clientPremium) {
          if (sousTotal > 100) {
            livraison = 0;
          } else {
            livraison = livraison / 2;
          }
        }
        let priorite: string;
        if (sousTotal > 500) {
          priorite = 'haute';
        } else if (sousTotal > 100) {
          priorite = 'normale';
        } else {
          priorite = 'basse';
        }
        resultats.push({
          id: commande.id,
          total: Math.round((sousTotal + livraison) * 100) / 100,
          livraison: Math.round(livraison * 100) / 100,
          priorite: priorite,
        });
      } else {
        console.log('poids invalide ' + commande.id);
      }
    }
  }
  return resultats;
}
