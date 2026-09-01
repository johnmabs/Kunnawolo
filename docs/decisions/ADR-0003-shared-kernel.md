# ADR-0003 — Shared Kernel minimal

- Statut : accepté
- Date : 2026-09-01
- Décideur : équipe Kunnawolo
- Référence : Epic 0.3 — Shared Kernel

## Décision

Les identifiants, montants, quantités, erreurs de domaine et horloge sont des types explicites et sans dépendance de framework. `Money` stocke toujours un entier sûr en unité mineure. `Quantity` accepte une valeur finie non négative afin de ne pas présumer de l'unité ou de la précision métier avant les Epics d'inventaire.

## Conséquences

Les futures règles métier exprimeront explicitement la stricte positivité lorsqu'elle est requise. Les adaptateurs techniques pourront implémenter `Clock`, sans que le domaine dépende de l'horloge système.
