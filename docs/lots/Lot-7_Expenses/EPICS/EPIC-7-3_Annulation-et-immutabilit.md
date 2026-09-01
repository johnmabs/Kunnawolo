# Epic 7.3 — Annulation et immutabilité

## Intention

Correction par annulation motivée.

## Périmètre

- Modèle et cas d usage nécessaires.
- Isolation organisation et boutique.
- Erreurs métier stables, audit et tests.
- Interface Next.js limitée au rôle d adaptateur.

## Hors périmètre

Extensions des Lots ultérieurs, comptabilité, achats avancés et fonctions médicales.

## Dépendances

Lots 0-6 et Epics antérieures du Lot.

## Critères d acceptation

- Chemin nominal couvert de bout en bout.
- Invariants testés au niveau domaine/application.
- Écritures atomiques ou compensables et idempotentes si nécessaire.
- Aucun import interdit entre couches.
- Décisions importantes traçables avec acteur, date et référence.

## Statut

PLANNED
