# Modules métier

Chaque module métier est créé seulement lorsqu'une Epic le nécessite. Sa logique pure vit dans `domain`, ses cas d'usage et ports dans `application`, et ses adaptateurs dans `infrastructure`.

Les modules ne dépendent pas directement des tables d'un autre module.
