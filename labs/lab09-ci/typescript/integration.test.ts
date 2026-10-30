// Tests d'intégration : un VRAI serveur HTTP, de vraies requêtes. À compléter (voir README).
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { creerServeur, LONGUEUR_CODE } from './api.ts';

const serveur = creerServeur();
let base = '';

before(async () => {
  await new Promise<void>((ok) => serveur.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
});
after(() => serveur.close());

// redirect: 'manual' pour lire la réponse 302 elle-même.
const appel = (chemin: string, init: RequestInit = {}) => fetch(base + chemin, { redirect: 'manual', ...init });

test('santé', async () => {
  const r = await appel('/sante');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { statut: 'ok' });
});

const poster = (corps: unknown) => appel('/liens', { method: 'POST', body: typeof corps === 'string' ? corps : JSON.stringify(corps) });

async function creerLien(url = 'https://exemple.ca/page'): Promise<string> {
  const r = await poster({ url });
  assert.equal(r.status, 201);
  return ((await r.json()) as { code: string }).code;
}

// --- Nominal ---

test('créer puis suivre un lien', async () => {
  const url = 'https://exemple.ca/a?b=1';
  const creation = await poster({ url });
  assert.equal(creation.status, 201);
  const corps = (await creation.json()) as { code: string; url: string };
  assert.equal(corps.url, url);
  assert.equal(corps.code.length, LONGUEUR_CODE);

  const visite = await appel(`/l/${corps.code}`);
  assert.equal(visite.status, 302);
  assert.equal(visite.headers.get('location'), url);
});

test('statistiques après trois visites', async () => {
  const code = await creerLien();
  assert.equal(((await (await appel(`/stats/${code}`)).json()) as { clics: number }).clics, 0);
  for (let i = 0; i < 3; i++) assert.equal((await appel(`/l/${code}`)).status, 302);
  const r = await appel(`/stats/${code}`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { code, url: 'https://exemple.ca/page', clics: 3 });
});

// --- Erreurs 4xx ---

const urlsInvalides: [string, unknown][] = [
  ['absente', {}],
  ['nombre', { url: 42 }],
  ['null', { url: null }],
  ['ftp', { url: 'ftp://exemple.ca' }],
  ['sans hôte', { url: 'https://' }],
  ['texte', { url: 'pas une url' }],
  ['trop longue', { url: 'https://e.ca/' + 'x'.repeat(2_048) }],
  ['corps non objet', ['https://exemple.ca']],
];
for (const [nom, corps] of urlsInvalides) {
  test(`URL invalide (${nom}) → 400`, async () => {
    const r = await poster(corps);
    assert.equal(r.status, 400);
    assert.match(((await r.json()) as { erreur: string }).erreur, /url invalide/);
  });
}

test('JSON invalide → 400', async () => {
  const r = await poster('{pas du json');
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { erreur: 'JSON invalide' });
});

for (const chemin of ['/l/inconnu', '/stats/inconnu', '/nimporte/quoi']) {
  test(`GET ${chemin} → 404`, async () => {
    const r = await appel(chemin);
    assert.equal(r.status, 404);
    assert.ok('erreur' in ((await r.json()) as object));
  });
}

test('POST sur une route inconnue → 404', async () => {
  const r = await appel('/autre', { method: 'POST', body: JSON.stringify({ url: 'https://exemple.ca' }) });
  assert.equal(r.status, 404);
});

// --- Concurrence ---

// 20 clients simultanés au plus (comme charge.ts) : ouvrir 200 sockets d'un coup dépasse le backlog
// d'écoute et donne des ECONNRESET côté client, sans rapport avec l'API.
async function enParallele<T>(total: number, fn: (i: number) => Promise<T>, clients = 20): Promise<T[]> {
  const resultats: T[] = new Array(total);
  let suivant = 0;
  await Promise.all(
    Array.from({ length: clients }, async () => {
      while (suivant < total) {
        const i = suivant++;
        resultats[i] = await fn(i);
      }
    }),
  );
  return resultats;
}

test('200 créations concurrentes donnent 200 codes uniques', async () => {
  const codes = await enParallele(200, async (i) => {
    const r = await poster({ url: `https://exemple.ca/${i}` });
    assert.equal(r.status, 201);
    return ((await r.json()) as { code: string }).code;
  });
  assert.equal(new Set(codes).size, 200);
});

test('100 visites concurrentes comptent 100 clics', async () => {
  const code = await creerLien();
  const statuts = await enParallele(100, async () => (await appel(`/l/${code}`)).status);
  assert.ok(statuts.every((s) => s === 302));
  const stats = (await (await appel(`/stats/${code}`)).json()) as { clics: number };
  assert.equal(stats.clics, 100);
});
