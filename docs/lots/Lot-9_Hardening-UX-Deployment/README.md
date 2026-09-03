# Lot 9 — Durcissement UX et déploiement

## Objectif

Rendre la V1 sûre, observable, résiliente et exploitable.

## Dépendances

Lots 0-8

## Epics

- Epic 9.1 — Sécurité et isolation: Permissions, tenant scoping et secrets
- Epic 9.2 — Audit et observabilité: Logs, audit, métriques et alertes
- Epic 9.3 — UX opérationnelle: Parcours critiques, accessibilité, responsive
- Epic 9.4 — Performance et résilience: Index, pagination, idempotence, charge
- Epic 9.5 — Exploitation: Migrations, sauvegardes, restauration et release

## Definition of Done

- Toutes les Epics satisfaites.
- Invariants et frontières testés.
- Lint, typecheck, tests et build réussissent.
- Statut et documentation synchronisés.

## Traitement des invitations

La création d’une invitation écrit le membership, l’invitation et son message d’envoi dans une même transaction PostgreSQL. Le premier envoi est tenté immédiatement, puis les échecs restent dans l’outbox avec un backoff exponentiel.

En production, configurer `RESEND_API_KEY`, `RESEND_FROM`, `APP_URL` et `INVITATION_DELIVERY_CRON_SECRET`, puis déclencher le worker toutes les minutes :

```sh
APP_URL="https://sales.example.com" \
INVITATION_DELIVERY_CRON_SECRET="..." \
pnpm invitations:dispatch
```

Chaque appel traite au maximum 25 messages. Plusieurs workers peuvent fonctionner simultanément : la prise en charge optimiste empêche qu’ils traitent le même message. Un traitement interrompu est récupéré après dix minutes. Les liens expirés ne sont jamais envoyés et le lien conservé dans l’outbox est effacé après réussite ou annulation.

Le renvoi depuis Administration → Membres invalide l’ancien jeton, renouvelle sa durée de 48 heures et crée un nouveau message transactionnel.
