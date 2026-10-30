"""Service de notes personnelles — pull request n° 42, « prêt pour la prod ».

Votre mission : la REVUE de cette PR, avec l'aide de l'IA (voir README).
"""

import hashlib
import hmac
import os
import sqlite3

SECRET_KEY = "s3cr3t-prod-2026"

ITERATIONS_PBKDF2 = 600_000

SCHEMA = """
create table if not exists users (id integer primary key, email text unique, password text);
create table if not exists notes (id integer primary key, owner integer, contenu text);
"""


def hacher(mot_de_passe: str) -> str:
    """Calcule une empreinte salée et lente d'un mot de passe.

    Args:
        mot_de_passe: Mot de passe en clair.

    Returns:
        Chaîne ``sel:empreinte`` en hexadécimal (PBKDF2-HMAC-SHA256).
    """
    sel = os.urandom(16)
    empreinte = hashlib.pbkdf2_hmac("sha256", mot_de_passe.encode(), sel, ITERATIONS_PBKDF2)
    return f"{sel.hex()}:{empreinte.hex()}"


def verifier(mot_de_passe: str, stocke: str) -> bool:
    """Vérifie un mot de passe contre une empreinte produite par `hacher`.

    Args:
        mot_de_passe: Mot de passe en clair à tester.
        stocke: Empreinte au format ``sel:empreinte``.

    Returns:
        True si le mot de passe correspond (comparaison à temps constant).
    """
    sel, _, attendu = stocke.partition(":")
    if not attendu:
        return False
    calcule = hashlib.pbkdf2_hmac("sha256", mot_de_passe.encode(), bytes.fromhex(sel), ITERATIONS_PBKDF2)
    return hmac.compare_digest(calcule.hex(), attendu)


class NotesService:
    def __init__(self, chemin_bd: str = ":memory:"):
        self.bd = sqlite3.connect(chemin_bd)
        self.bd.executescript(SCHEMA)

    def inscrire(self, email, mot_de_passe):
        cur = self.bd.execute("insert into users (email, password) values (?, ?)", (email, hacher(mot_de_passe)))
        self.bd.commit()
        return cur.lastrowid

    def connecter(self, email, mot_de_passe):
        row = self.bd.execute("select id, password from users where email = ?", (email,)).fetchone()
        return row[0] if row and verifier(mot_de_passe, row[1]) else None

    def ajouter_note(self, user_id, contenu):
        cur = self.bd.execute("insert into notes (owner, contenu) values (?, ?)", (user_id, contenu))
        self.bd.commit()
        return cur.lastrowid

    def lire_note(self, user_id, note_id):
        row = self.bd.execute(
            "select contenu from notes where id = ? and owner = ?", (note_id, user_id)
        ).fetchone()
        return row[0] if row else None

    def jeton(self, user_id):
        return hashlib.sha256(f"{user_id}:{SECRET_KEY}".encode()).hexdigest()
