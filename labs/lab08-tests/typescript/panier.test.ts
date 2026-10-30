// Tests du panier (lab 08). Fixtures, tables de cas, noms de tests en phrases.
//   npm run cov:lab08
//   node labs/lab08-tests/typescript/mutants.ts
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { Panier, QUANTITE_MAX, StockInsuffisant, type Produit } from './panier.ts';

/** Fabrique un produit, avec des valeurs par defaut surchargeables. */
function produit(partiel: Partial<Produit> = {}): Produit {
  return { sku: 'GEN-00', nom: 'Produit', prix: 1_000, stock: 50, ...partiel };
}

const CLAVIER: Produit = produit({ sku: 'KB-01', nom: 'Clavier', prix: 4_999, stock: 10 });
const SOURIS: Produit = produit({ sku: 'MS-02', nom: 'Souris', prix: 1_250, stock: 4 });
const CABLE: Produit = produit({ sku: 'CB-03', nom: 'Cable', prix: 1_000, stock: 200 });

/** Un ajout a passer a `panier.ajouter`. */
type Ajout = [Produit, number];

/** Rejoue une liste d'ajouts puis, si fourni, un code promo. */
function remplir(panier: Panier, ajouts: Ajout[], code?: string): void {
  for (const [article, quantite] of ajouts) panier.ajouter(article, quantite);
  if (code !== undefined) panier.appliquerCode(code);
}

describe('ajouter', () => {
  let panier: Panier;
  beforeEach(() => {
    panier = new Panier();
  });

  it('ajoute une unite quand la quantite est omise', () => {
    panier.ajouter(CLAVIER);
    assert.equal(panier.nombreArticles(), 1);
    assert.equal(panier.lignes.get('KB-01'), 1);
  });

  it('enregistre la quantite demandee', () => {
    panier.ajouter(SOURIS, 3);
    assert.equal(panier.lignes.get('MS-02'), 3);
  });

  it('cumule les quantites du meme article sur une seule ligne', () => {
    panier.ajouter(CLAVIER);
    panier.ajouter(CLAVIER, 2);
    assert.equal(panier.lignes.size, 1);
    assert.equal(panier.nombreArticles(), 3);
  });

  it('cree une ligne par article different', () => {
    panier.ajouter(CLAVIER);
    panier.ajouter(SOURIS, 2);
    assert.equal(panier.lignes.size, 2);
    assert.equal(panier.nombreArticles(), 3);
  });

  it('memorise le produit au catalogue pour pouvoir le facturer', () => {
    panier.ajouter(CLAVIER, 2);
    assert.equal(panier.catalogue.get('KB-01')?.prix, 4_999);
    assert.equal(panier.sousTotal(), 9_998);
  });

  for (const quantite of [0, -1, -99]) {
    it(`refuse la quantite invalide ${quantite}`, () => {
      assert.throws(() => panier.ajouter(CLAVIER, quantite), RangeError);
      assert.equal(panier.lignes.size, 0);
    });
  }

  it('accepte exactement 99 articles du meme produit', () => {
    panier.ajouter(CABLE, QUANTITE_MAX);
    assert.equal(panier.nombreArticles(), 99);
  });

  it('refuse le 100e article du meme produit', () => {
    assert.throws(() => panier.ajouter(CABLE, 100), RangeError);
  });

  it('refuse le 100e article meme atteint en deux ajouts', () => {
    panier.ajouter(CABLE, 98);
    panier.ajouter(CABLE, 1);
    assert.throws(() => panier.ajouter(CABLE, 1), RangeError);
    assert.equal(panier.nombreArticles(), 99);
  });

  it('accepte une quantite egale au stock disponible', () => {
    panier.ajouter(SOURIS, 4);
    assert.equal(panier.nombreArticles(), 4);
  });

  it('refuse une quantite qui depasse le stock d une seule unite', () => {
    assert.throws(() => panier.ajouter(SOURIS, 5), StockInsuffisant);
  });

  it('nomme le produit et le stock restant dans l erreur de stock', () => {
    assert.throws(
      () => panier.ajouter(SOURIS, 5),
      (erreur: unknown) =>
        erreur instanceof StockInsuffisant && erreur.message.includes('Souris') && erreur.message.includes('4'),
    );
  });

  it('refuse tout ajout d un produit en rupture de stock', () => {
    assert.throws(() => panier.ajouter(produit({ sku: 'RP-04', stock: 0 })), StockInsuffisant);
  });

  it('signale le maximum par article avant le manque de stock', () => {
    assert.throws(() => panier.ajouter(produit({ stock: 2 }), 150), RangeError);
  });

  it('laisse le panier intact apres un ajout refuse', () => {
    panier.ajouter(CLAVIER, 2);
    assert.throws(() => panier.ajouter(SOURIS, 5), StockInsuffisant);
    assert.equal(panier.lignes.size, 1);
    assert.equal(panier.catalogue.has('MS-02'), false);
    assert.equal(panier.sousTotal(), 9_998);
  });
});

describe('retirer', () => {
  let panier: Panier;
  beforeEach(() => {
    panier = new Panier();
    panier.ajouter(CABLE, 5);
  });

  it('supprime toute la ligne quand la quantite est omise', () => {
    panier.retirer('CB-03');
    assert.equal(panier.lignes.size, 0);
    assert.equal(panier.nombreArticles(), 0);
  });

  it('decremente la ligne lors d un retrait partiel', () => {
    panier.retirer('CB-03', 2);
    assert.equal(panier.lignes.get('CB-03'), 3);
    assert.equal(panier.sousTotal(), 3_000);
  });

  it('supprime la ligne quand on retire exactement la quantite presente', () => {
    panier.retirer('CB-03', 5);
    assert.equal(panier.lignes.size, 0);
  });

  it('supprime la ligne sans quantite negative quand on retire plus que present', () => {
    panier.retirer('CB-03', 12);
    assert.equal(panier.lignes.size, 0);
    assert.equal(panier.nombreArticles(), 0);
  });

  it('refuse de retirer un article absent et nomme le sku', () => {
    assert.throws(() => panier.retirer('INCONNU-99'), (erreur: unknown) =>
      erreur instanceof RangeError && erreur.message.includes('INCONNU-99'));
  });

  it('ne touche pas aux autres lignes quand le sku est absent', () => {
    assert.throws(() => panier.retirer('INCONNU-99', 1), RangeError);
    assert.equal(panier.nombreArticles(), 5);
  });
});

describe('appliquerCode', () => {
  let panier: Panier;
  beforeEach(() => {
    panier = new Panier();
    panier.ajouter(CABLE, 10);
  });

  for (const code of ['MOINS10', 'LIVRAISON']) {
    it(`accepte le code promo ${code}`, () => {
      panier.appliquerCode(code);
      assert.equal(panier.codePromo, code);
    });
  }

  for (const saisie of ['moins10', 'Moins10', 'mOiNs10']) {
    it(`accepte le code ${saisie} sans tenir compte de la casse`, () => {
      panier.appliquerCode(saisie);
      assert.equal(panier.codePromo, 'MOINS10');
      assert.equal(panier.rabais(), 1_000);
    });
  }

  for (const code of ['', 'MOINS20', 'LIVRAISONS', 'moins 10']) {
    it(`refuse le code inconnu « ${code} »`, () => {
      assert.throws(() => panier.appliquerCode(code), RangeError);
    });
  }

  it('conserve le code precedent apres un code refuse', () => {
    panier.appliquerCode('MOINS10');
    assert.throws(() => panier.appliquerCode('MOINS20'), RangeError);
    assert.equal(panier.codePromo, 'MOINS10');
  });

  it('remplace le code precedent par le nouveau', () => {
    panier.appliquerCode('MOINS10');
    panier.appliquerCode('LIVRAISON');
    assert.equal(panier.codePromo, 'LIVRAISON');
    assert.equal(panier.rabais(), 0);
  });
});

describe('sousTotal', () => {
  const CAS: { phrase: string; ajouts: Ajout[]; attendu: number }[] = [
    { phrase: 'vaut 0 pour un panier vide', ajouts: [], attendu: 0 },
    { phrase: 'vaut prix fois quantite pour une ligne', ajouts: [[CLAVIER, 2]], attendu: 9_998 },
    { phrase: 'additionne les lignes', ajouts: [[CLAVIER, 1], [SOURIS, 2]], attendu: 7_499 },
    { phrase: 'reste un entier en cents', ajouts: [[SOURIS, 3]], attendu: 3_750 },
  ];

  for (const { phrase, ajouts, attendu } of CAS) {
    it(`le sous-total ${phrase}`, () => {
      const panier = new Panier();
      remplir(panier, ajouts);
      assert.equal(panier.sousTotal(), attendu);
    });
  }

  it('ignore le code promo et les frais de livraison', () => {
    const panier = new Panier();
    remplir(panier, [[CLAVIER, 1]], 'MOINS10');
    assert.equal(panier.sousTotal(), 4_999);
  });
});

describe('rabais', () => {
  let panier: Panier;
  beforeEach(() => {
    panier = new Panier();
  });

  it('est nul sans code promo', () => {
    panier.ajouter(CABLE, 10);
    assert.equal(panier.rabais(), 0);
  });

  it('est nul avec le code LIVRAISON', () => {
    remplir(panier, [[CABLE, 10]], 'LIVRAISON');
    assert.equal(panier.rabais(), 0);
  });

  it('vaut 10 % du sous-total avec le code MOINS10', () => {
    remplir(panier, [[CABLE, 10]], 'MOINS10');
    assert.equal(panier.sousTotal(), 10_000);
    assert.equal(panier.rabais(), 1_000);
  });

  it('arrondit au cent inferieur quand le sous-total n est pas divisible par 10', () => {
    remplir(panier, [[CLAVIER, 1]], 'MOINS10');
    assert.equal(panier.rabais(), 499);
  });

  it('est nul sur un panier vide malgre le code MOINS10', () => {
    panier.appliquerCode('MOINS10');
    assert.equal(panier.rabais(), 0);
  });
});

describe('livraison et total', () => {
  const CAS: { phrase: string; ajouts: Ajout[]; code?: string; sousTotal: number; rabais: number; livraison: number; total: number }[] = [
    { phrase: 'un panier vide ne paie aucun frais', ajouts: [], sousTotal: 0, rabais: 0, livraison: 0, total: 0 },
    { phrase: 'un panier vide avec MOINS10 reste a zero', ajouts: [], code: 'MOINS10', sousTotal: 0, rabais: 0, livraison: 0, total: 0 },
    { phrase: 'un panier vide avec LIVRAISON reste a zero', ajouts: [], code: 'LIVRAISON', sousTotal: 0, rabais: 0, livraison: 0, total: 0 },
    { phrase: 'un petit panier paie les frais de livraison', ajouts: [[CABLE, 1]], sousTotal: 1_000, rabais: 0, livraison: 799, total: 1_799 },
    { phrase: 'un sous-total juste sous le seuil paie les frais', ajouts: [[CLAVIER, 1]], sousTotal: 4_999, rabais: 0, livraison: 799, total: 5_798 },
    { phrase: 'un sous-total exactement au seuil donne la livraison gratuite', ajouts: [[CABLE, 5]], sousTotal: 5_000, rabais: 0, livraison: 0, total: 5_000 },
    { phrase: 'un sous-total au-dessus du seuil donne la livraison gratuite', ajouts: [[CLAVIER, 2]], sousTotal: 9_998, rabais: 0, livraison: 0, total: 9_998 },
    { phrase: 'le code LIVRAISON annule les frais sous le seuil', ajouts: [[CABLE, 1]], code: 'LIVRAISON', sousTotal: 1_000, rabais: 0, livraison: 0, total: 1_000 },
    { phrase: 'le seuil s evalue apres rabais : au seuil puis MOINS10, les frais reviennent', ajouts: [[CABLE, 5]], code: 'MOINS10', sousTotal: 5_000, rabais: 500, livraison: 799, total: 5_299 },
    { phrase: 'un panier encore au-dessus du seuil apres rabais reste livre gratuitement', ajouts: [[CABLE, 6]], code: 'MOINS10', sousTotal: 6_000, rabais: 600, livraison: 0, total: 5_400 },
    { phrase: 'MOINS10 sous le seuil cumule rabais et frais', ajouts: [[SOURIS, 2]], code: 'MOINS10', sousTotal: 2_500, rabais: 250, livraison: 799, total: 3_049 },
  ];

  for (const cas of CAS) {
    it(cas.phrase, () => {
      const panier = new Panier();
      remplir(panier, cas.ajouts, cas.code);
      assert.equal(panier.sousTotal(), cas.sousTotal);
      assert.equal(panier.rabais(), cas.rabais);
      assert.equal(panier.livraison(), cas.livraison);
      assert.equal(panier.total(), cas.total);
    });
  }
});

describe('nombreArticles', () => {
  let panier: Panier;
  beforeEach(() => {
    panier = new Panier();
  });

  it('vaut 0 pour un panier vide', () => {
    assert.equal(panier.nombreArticles(), 0);
  });

  it('somme les quantites et non le nombre de lignes', () => {
    panier.ajouter(CLAVIER, 2);
    panier.ajouter(SOURIS, 3);
    assert.equal(panier.lignes.size, 2);
    assert.equal(panier.nombreArticles(), 5);
  });

  it('diminue apres un retrait partiel puis retombe a 0', () => {
    panier.ajouter(CABLE, 4);
    panier.retirer('CB-03', 1);
    assert.equal(panier.nombreArticles(), 3);
    panier.retirer('CB-03');
    assert.equal(panier.nombreArticles(), 0);
  });
});

describe('invariants du panier', () => {
  it('ajouter puis retirer la meme quantite laisse le panier inchange', () => {
    const panier = new Panier();
    panier.ajouter(CLAVIER, 2);
    const avant = panier.total();
    panier.ajouter(SOURIS, 3);
    panier.retirer('MS-02', 3);
    assert.equal(panier.total(), avant);
    assert.equal(panier.nombreArticles(), 2);
    assert.equal(panier.lignes.size, 1);
  });
});
