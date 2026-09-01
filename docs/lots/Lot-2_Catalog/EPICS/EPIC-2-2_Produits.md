# Epic 2.2 — Produits

## Intention

Codes, conditionnements, formes et statuts.

## Périmètre

- Modèle et cas d usage nécessaires.
- Isolation organisation et boutique.
- Erreurs métier stables, audit et tests.
- Interface Next.js limitée au rôle d adaptateur.

## Hors périmètre

Extensions des Lots ultérieurs, comptabilité, achats avancés et fonctions médicales.

## Dépendances

Lots 0-1 et Epics antérieures du Lot.

## Critères d acceptation

- Chemin nominal couvert de bout en bout.
- Invariants testés au niveau domaine/application.
- Écritures atomiques ou compensables et idempotentes si nécessaire.
- Aucun import interdit entre couches.
- Décisions importantes traçables avec acteur, date et référence.
- Un produit peut être créé, relu, modifié et recherché avec un nom français, bambara ou mixte.
- Les tests couvrent au minimum `Nsiirin`, `Ɛ`, `Ɔ`, `ɲ`, `ŋ` et un nom composé avec espaces et diacritiques.
- La valeur relue est identique au texte normalisé stocké; aucun caractère n est remplacé par `?` ou supprimé.

## Statut

DONE

## Vérification

2026-09-01 : `pnpm db:migrate:deploy`, `pnpm lint`, `pnpm typecheck`, `pnpm test` et `pnpm build` réussissent.
