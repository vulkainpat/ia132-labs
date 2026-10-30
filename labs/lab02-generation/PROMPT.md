# PROMPT · Lab 02 · Calcul d'une facture

## CONTEXTE

- Langage : TypeScript (Node ≥ 22.18, mode `strict`, pas de `any`), fichier `typescript/facture.ts`.
- Conventions du dépôt (`.github/copilot-instructions.md`) : code et commentaires en français, identifiants sans accents, exports documentés en TSDoc.
- La signature et les types `Ligne` et `Facture` existent déjà : `calculerFacture(lignes: Ligne[], codePromo?: string): Facture`.

## TÂCHE

Implémente `calculerFacture` en suivant à la lettre @SPEC.md (sous-total, rabais selon le code promo, livraison, base taxable, TPS, TVQ, total), dans cet ordre. Les tests d'acceptation de `typescript/facture.test.ts` doivent tous passer.

## CONTRAINTES

- Tous les montants sont des **entiers en cents** : aucun nombre à virgule dans les montants finaux.
- Arrondi de chaque montant calculé par pourcentage (rabais, TPS, TVQ) : **au cent le plus proche, la moitié vers le haut**.
- TPS (5 %) et TVQ (9,975 %) sont calculées chacune sur la base taxable, **pas en cascade**.
- Code promo insensible à la casse et aux espaces autour ; `ETE15` seulement si le sous-total ≥ 10 000 cents ; code inconnu → erreur « Code promo inconnu ».
- Livraison gratuite si (sous-total − rabais) ≥ 7 500 cents, sinon 999 cents.
- Erreurs en `RangeError` : liste vide (« Facture vide »), quantité < 1, prix < 0.
- Aucune dépendance externe.

## FORMAT

- Une seule fonction exportée (`calculerFacture`) + des fonctions privées petites et nommées.
- Les seuils et taux sont des constantes nommées.
- Ne modifie pas les tests ni la signature exportée.
- Réponds avec le contenu complet de `typescript/facture.ts` uniquement.

## EXEMPLES

1. Une ligne `{ produit: "Livre", prix: 2000, quantite: 2 }`, sans code promo :
   sous-total 4000 · rabais 0 · livraison 999 · base 4999 · TPS 250 (249,95) · TVQ 499 (498,65) · **total 5748**.
2. Une ligne `{ produit: "Chaise", prix: 10000, quantite: 1 }`, code `" ete15 "` :
   sous-total 10000 · rabais 1500 · livraison 0 (8500 ≥ 7500) · base 8500 · TPS 425 · TVQ 848 (847,875) · **total 9773**.

---

## Bilan

- Nombre d'itérations nécessaires : _à compléter_
