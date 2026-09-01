# ADR-0007 — Tests d'intégration PostgreSQL

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.7 — Tests

## Décision

Les tests unitaires restent indépendants de PostgreSQL. Les tests d'intégration utilisent la base locale configurée et ne réalisent, au socle, qu'une requête de lecture.

## Conséquences

`pnpm test:unit` est rapide et isolé. `pnpm test:integration` exige PostgreSQL Compose démarré et prouve l'adaptateur réel.
