# Epic 1.3 — Comptes et adhésions

## Intention

Séparer compte et membership; invitation et activation.

## Périmètre

- Modèle et cas d usage nécessaires.
- Isolation organisation et boutique.
- Erreurs métier stables, audit et tests.
- Interface Next.js limitée au rôle d adaptateur.

## Hors périmètre

Extensions des Lots ultérieurs, comptabilité, achats avancés et fonctions médicales.

## Dépendances

Lot 0 et Epics antérieures du Lot.

## Critères d acceptation

- Chemin nominal couvert de bout en bout.
- Invariants testés au niveau domaine/application.
- Écritures atomiques ou compensables et idempotentes si nécessaire.
- Aucun import interdit entre couches.
- Décisions importantes traçables avec acteur, date et référence.

## Statut

DONE
