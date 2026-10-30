# Registre des risques · Cantine+

| Risque | Probabilité | Impact | Mesure |
| --- | --- | --- | --- |
| Erreur d'allergène affichée à un employé | Faible | Critique | Responsable nommé par site, historique des modifications, relecture avant publication, source de données unique |
| Saturation au pic de 10 h 30 | Moyenne | Élevé | Cache du menu, requêtes indexées, test de charge à 3 fois la charge attendue avant le pilote (US-10) |
| Intégration SAP (SOAP, lot nocturne) plus longue que prévu | Élevée | Élevé | Retenue sur la paie reportée au sprint 4, maquette du service SOAP dès le sprint 2, paiement par carte disponible sans SAP |
| Non-conformité Loi 25 (habitudes alimentaires) | Moyenne | Élevé | Consentement explicite (US-11), minimisation des données, durée de conservation définie, revue par le responsable de la protection des renseignements personnels |
| Dépendances obsolètes du prototype de 2019 réutilisées | Élevée | Élevé | Ne pas les réutiliser : partir de versions à jour et auditer en continu (voir dependances.md) |
| Vélocité de 20 points surestimée pour une équipe de 4 | Moyenne | Moyen | Sprint 1 limité à 18 points, revue de vélocité après le sprint 1, stories SHOULD et COULD repoussables |
| Logiciel de caisse du prestataire non intégrable | Moyenne | Faible | Hors du pilote (US-15 COULD), question ouverte à lever auprès du prestataire |
| Statut des employés contractuels non défini | Moyenne | Moyen | Question au PO avant le sprint 2 ; paiement par carte ouvert à tous en attendant |
