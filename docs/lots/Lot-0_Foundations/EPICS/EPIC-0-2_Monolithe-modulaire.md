# Epic 0.2 — Monolithe modulaire

## Intention

Structure app, modules, shared-kernel et infrastructure.

## Périmètre

- Modèle et cas d usage nécessaires.
- Isolation organisation et boutique.
- Erreurs métier stables, audit et tests.
- Interface Next.js limitée au rôle d adaptateur.

## Hors périmètre

Extensions des Lots ultérieurs, comptabilité, achats avancés et fonctions médicales.

## Dépendances

Aucun et Epics antérieures du Lot.

## Critères d acceptation

- Chemin nominal couvert de bout en bout.
- Invariants testés au niveau domaine/application.
- Écritures atomiques ou compensables et idempotentes si nécessaire.
- Aucun import interdit entre couches.
- Décisions importantes traçables avec acteur, date et référence.

## Statut

DONE
