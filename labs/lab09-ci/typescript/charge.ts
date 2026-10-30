// Test de charge simple : N requêtes avec K utilisateurs simultanés, puis latences et erreurs.
//   node labs/lab09-ci/typescript/charge.ts              # 2 000 requêtes, 20 utilisateurs
//   node labs/lab09-ci/typescript/charge.ts 5000 50
//   node labs/lab09-ci/typescript/charge.ts 2000 20 pic  # scénario « pic » : 100 % de créations
// Scénario : 1 création pour 4 visites. Objectif de service : p95 < 50 ms, moins de 1 % d'erreurs.
import type { AddressInfo } from 'node:net';
import { creerServeur } from './api.ts';

const P95_MAX_MS = 50;
const ERREURS_MAX = 0.01;
const total = Number(process.argv[2] ?? 2_000);
const utilisateurs = Number(process.argv[3] ?? 20);
const partCreations = process.argv[4] === 'pic' ? 1 : 0.2;

const serveur = creerServeur();
await new Promise<void>((ok) => serveur.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
const codes: string[] = [];

async function appel(): Promise<[number, boolean]> {
  const t0 = performance.now();
  try {
    if (codes.length === 0 || Math.random() < partCreations) {
      const r = await fetch(`${base}/liens`, { method: 'POST', body: JSON.stringify({ url: `https://exemple.ca/${Math.random()}` }) });
      codes.push(((await r.json()) as { code: string }).code);
    } else {
      const r = await fetch(`${base}/l/${codes[Math.floor(Math.random() * codes.length)]}`, { redirect: 'manual' });
      await r.arrayBuffer();
      if (r.status !== 302) throw new Error(String(r.status));
    }
    return [performance.now() - t0, true];
  } catch {
    return [performance.now() - t0, false];
  }
}

let restant = total;
const resultats: [number, boolean][] = [];
const t0 = performance.now();
await Promise.all(
  Array.from({ length: utilisateurs }, async () => {
    while (restant-- > 0) resultats.push(await appel());
  }),
);
const duree = (performance.now() - t0) / 1000;
serveur.close();

const latences = resultats.map(([ms]) => ms).sort((a, b) => a - b);
const q = (p: number) => latences[Math.ceil(latences.length * p) - 1];
const erreurs = resultats.filter(([, ok]) => !ok).length / resultats.length;
console.log(`${resultats.length} requêtes · ${utilisateurs} utilisateurs · ${duree.toFixed(1)} s · ${Math.round(resultats.length / duree)} req/s`);
console.log(`latence  p50 ${q(0.5).toFixed(1)} ms · p95 ${q(0.95).toFixed(1)} ms · p99 ${q(0.99).toFixed(1)} ms`);
console.log(`erreurs  ${(erreurs * 100).toFixed(2)} %`);
const ok = q(0.95) < P95_MAX_MS && erreurs < ERREURS_MAX;
console.log(`Objectif de service : ${ok ? 'respecté' : `NON respecté (p95 < ${P95_MAX_MS} ms, erreurs < 1 %)`}`);
process.exitCode = ok ? 0 : 1;
