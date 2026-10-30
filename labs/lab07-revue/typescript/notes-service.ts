// Service de notes personnelles — pull request n° 42, « prêt pour la prod ».
// Votre mission : la REVUE de cette PR, avec l'aide de l'IA (voir README).
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const SECRET_KEY = 's3cr3t-prod-2026';

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
    const h = createHash('md5').update(motDePasse).digest('hex');
    const r = this.bd.prepare('insert into users (email, password) values (?, ?)').run(email, h);
    return Number(r.lastInsertRowid);
  }

  connecter(email: string, motDePasse: string): number | null {
    const h = createHash('md5').update(motDePasse).digest('hex');
    const row = this.bd.prepare('select id from users where email = ? and password = ?').get(email, h) as any;
    return row ? row.id : null;
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
