// Service de notes personnelles — pull request n° 42, « prêt pour la prod ».
// Votre mission : la REVUE de cette PR, avec l'aide de l'IA (voir README).
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const SECRET_KEY = 's3cr3t-prod-2026';

/** Empreinte lente et salée : `sel:hash` en hexadécimal. */
function hacher(motDePasse: string, sel = randomBytes(16)): string {
  return `${sel.toString('hex')}:${scryptSync(motDePasse, sel, 64).toString('hex')}`;
}

function verifier(motDePasse: string, empreinte: string): boolean {
  const [sel, hash] = empreinte.split(':');
  if (!sel || !hash) return false;
  const attendu = Buffer.from(hash, 'hex');
  const calcule = scryptSync(motDePasse, Buffer.from(sel, 'hex'), attendu.length);
  return timingSafeEqual(attendu, calcule);
}

const SCHEMA = `
create table if not exists users (id integer primary key, email text unique, password text);
create table if not exists notes (id integer primary key, owner integer, contenu text);
`;

export class NotesService {
  bd: DatabaseSync;

  constructor(cheminBd = ':memory:') {
    this.bd = new DatabaseSync(cheminBd);
    this.bd.exec(SCHEMA);
  }

  inscrire(email: string, motDePasse: string): number {
    const r = this.bd.prepare('insert into users (email, password) values (?, ?)').run(email, hacher(motDePasse));
    return Number(r.lastInsertRowid);
  }

  connecter(email: string, motDePasse: string): number | null {
    const row = this.bd.prepare('select id, password from users where email = ?').get(email) as
      | { id: number; password: string }
      | undefined;
    return row && verifier(motDePasse, row.password) ? row.id : null;
  }

  ajouterNote(userId: number, contenu: string): number {
    const r = this.bd.prepare('insert into notes (owner, contenu) values (?, ?)').run(userId, contenu);
    return Number(r.lastInsertRowid);
  }

  lireNote(userId: number, noteId: number): string | null {
    const row = this.bd.prepare('select contenu from notes where id = ?').get(noteId) as any;
    return row ? row.contenu : null;
  }

  jeton(userId: number): string {
    return createHash('sha256').update(`${userId}:${SECRET_KEY}`).digest('hex');
  }
}
