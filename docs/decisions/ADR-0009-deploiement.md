# ADR-0009 — Image de production

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.9 — Déploiement

## Décision

L'application est distribuée via une image Docker Node 24 multi-stage utilisant la sortie Next.js standalone. Le healthcheck appelle `GET /api/health`; les logs applicatifs sont émis sur stdout.
