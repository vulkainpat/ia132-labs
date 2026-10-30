// Service de notes personnelles — pull request n° 42, « prêt pour la prod ».
// Votre mission : la REVUE de cette PR, avec l'aide de l'IA (voir README).
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

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
  #cle: string;

  constructor(cheminBd = ':memory:') {
    const cle = process.env.NOTES_SECRET;
    if (!cle) throw new Error('NOTES_SECRET doit être défini dans l\'environnement');
    this.#cle = cle;
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
    const row = this.bd.prepare('select contenu from notes where id = ? and owner = ?').get(noteId, userId) as any;
    return row ? row.contenu : null;
  }

  jeton(userId: number): string {
    return createHmac('sha256', this.#cle).update(String(userId)).digest('hex');
  }
}
