# ADR-0002 — Frontières du monolithe modulaire

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.2 — Monolithe modulaire

## Décision

Les seules racines créées à ce stade sont `src/app`, `src/modules`, `src/shared` et `src/infrastructure`. Les modules métier et leurs sous-couches ne sont pas créés avant l'Epic qui les rend nécessaires.

## Conséquences

`src/app` reste un adaptateur Next.js. Le domaine futur ne dépendra ni de Next.js, ni de Prisma, ni de l'infrastructure. Les échanges entre modules passeront par des ports, événements ou services d'application explicites.
