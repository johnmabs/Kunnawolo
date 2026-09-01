# Lot 0 — Fondations techniques

## Objectif

Établir une base exécutable, testable et déployable sans logique métier complexe.

## Dépendances

Aucun

## Epics

- Epic 0.1 — Initialisation Next.js: Next.js 16, TypeScript strict, pnpm, Node 24 et health check
- Epic 0.2 — Monolithe modulaire: Structure app, modules, shared-kernel et infrastructure
- Epic 0.3 — Shared Kernel: Identifier, Money, Quantity, erreurs et temps
- Epic 0.4 — Qualité et dépendances: Lint, typecheck et frontières d imports
- Epic 0.5 — PostgreSQL local: Configuration et vérification de connexion
- Epic 0.6 — Prisma: Adaptateur, migrations et seed
- Epic 0.7 — Tests: Tests unitaires et intégration
- Epic 0.8 — CI: Lint, typecheck, tests et build automatisés
- Epic 0.9 — Déploiement: Configuration, health, logs et build production

## Definition of Done

- Toutes les Epics satisfaites.
- Invariants et frontières testés.
- Lint, typecheck, tests et build réussissent.
- Statut et documentation synchronisés.
