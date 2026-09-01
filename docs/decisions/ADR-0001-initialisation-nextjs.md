# ADR-0001 — Initialisation Next.js

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.1 — Initialisation Next.js

## Décision

Le projet démarre avec Next.js 16 App Router, TypeScript strict, Tailwind CSS et pnpm 10.18.2. Le point de contrôle technique est un route handler `GET /api/health`; il ne contient aucune logique métier.

## Conséquences

La logique métier et les adaptateurs de persistance ne sont pas créés avant les Epics qui les requièrent. Node 24 est déclaré dans `.node-version` et `package.json`; l'environnement d'exécution doit fournir cette version pour les contrôles de conformité. Le runtime Node 24 local est disponible via nvm, bien que Node 26 soit le binaire par défaut au moment de la décision.
