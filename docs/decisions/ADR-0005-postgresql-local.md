# ADR-0005 — PostgreSQL local

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.5 — PostgreSQL local

## Décision

Le développement local utilise PostgreSQL 17 dans Docker Compose, avec un volume nommé persistant et un healthcheck `pg_isready`. Le port hôte `5433` est lié à `127.0.0.1` afin d'éviter le PostgreSQL déjà présent sur `5432`. Les identifiants de `.env.example` sont exclusivement destinés au développement local.

## Conséquences

La base locale peut être démarrée avec `docker compose up -d postgres`. Les secrets réels restent dans `.env`, qui est ignoré par Git.
