# ADR-0008 — Intégration continue

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.8 — CI

## Décision

GitHub Actions exécute le pipeline complet sur Node 24 et pnpm 10.18.2. PostgreSQL 17 est fourni comme service pour les migrations et les tests d'intégration.

## Conséquences

Chaque pull request et chaque push vers `main` vérifient la génération Prisma, les migrations, la qualité, les tests et le build avant intégration.
