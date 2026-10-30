"""Service de notes personnelles — pull request n° 42, « prêt pour la prod ».

Votre mission : la REVUE de cette PR, avec l'aide de l'IA (voir README).
"""

import hashlib
import sqlite3

SECRET_KEY = "s3cr3t-prod-2026"

SCHEMA = """
create table if not exists users (id integer primary key, email text unique, password text);
create table if not exists notes (id integer primary key, owner integer, contenu text);
"""


class NotesService:
    def __init__(self, chemin_bd: str = ":memory:"):
        self.bd = sqlite3.connect(chemin_bd)
        self.bd.executescript(SCHEMA)

    def inscrire(self, email, mot_de_passe):
        h = hashlib.md5(mot_de_passe.encode()).hexdigest()
        cur = self.bd.execute("insert into users (email, password) values (?, ?)", (email, h))
        self.bd.commit()
        return cur.lastrowid

    def connecter(self, email, mot_de_passe):
        h = hashlib.md5(mot_de_passe.encode()).hexdigest()
        row = self.bd.execute("select id from users where email = ? and password = ?", (email, h)).fetchone()
        return row[0] if row else None

    def ajouter_note(self, user_id, contenu):
        cur = self.bd.execute("insert into notes (owner, contenu) values (?, ?)", (user_id, contenu))
        self.bd.commit()
        return cur.lastrowid

    def lire_note(self, user_id, note_id):
        row = self.bd.execute("select contenu from notes where id = ?", (note_id,)).fetchone()
        return row[0] if row else None

    def jeton(self, user_id):
        return hashlib.sha256(f"{user_id}:{SECRET_KEY}".encode()).hexdigest()
