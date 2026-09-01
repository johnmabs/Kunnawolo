# ADR-0006 — Prisma ORM et PostgreSQL

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.6 — Prisma

## Décision

L'adaptateur de persistance utilise Prisma ORM 7.10.0, `@prisma/adapter-pg` 7.10.0 et PostgreSQL. Prisma 8 est annoncé comme version courante, mais aucun adaptateur PostgreSQL stable v8 n'est publié ; Prisma 7.10.0 est la dernière combinaison stable complète disponible.

Le client est généré sous `src/infrastructure/prisma/generated`, jamais dans le domaine. Une migration de baseline vide initialise uniquement le suivi Prisma Migrate. Le seed vérifie uniquement la connectivité tant qu'aucune Epic métier n'autorise de modèle ou de donnée métier.

## Conséquences

Les futures migrations seront créées avec les modèles des modules concernés. Prisma ne servira pas de modèle métier et ses types resteront confinés à l'infrastructure.
