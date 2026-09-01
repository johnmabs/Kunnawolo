# ADR-0004 — Contrôle automatisé des dépendances

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.4 — Qualité et dépendances

## Décision

`dependency-cruiser` vérifie les frontières d'import au sein de `src`. Le lint exécute aussi ce contrôle.

## Conséquences

Une dépendance depuis le domaine vers Next.js, Prisma ou une infrastructure, ou depuis l'application vers le web, fait échouer le contrôle de qualité.
