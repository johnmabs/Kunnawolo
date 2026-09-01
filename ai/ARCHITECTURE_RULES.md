# Architecture DDD et dépendances

Monolithe modulaire: Organization, IdentityAccess, Catalog, Inventory, Sales, Transfers, Expenses, Reporting.

`src/app` (présentation) → `application` (cas d usage et ports) → `domain` (métier pur). `infrastructure` implémente les ports et dépend vers l intérieur.

## Interdictions

- Domain n importe ni Next.js, ni Prisma, ni infrastructure.
- Application n importe pas la présentation.
- Un module ne lit pas les tables d un autre comme API implicite.
- Prisma n est jamais le modèle métier.
- Route handlers et server actions ne contiennent pas le métier.
- Reporting ne possède pas les faits sources.

Intégration par ports explicites, événements et projections. Écritures critiques transactionnelles et idempotentes. Les snapshots historiques ne sont pas recalculés.
