# Prompt de lancement de l implémentation

Implémente Kunnawolo en suivant strictement ce pack de spécifications.

Commence par lire `ai/README.md`, `ai/PROJECT_CONTEXT.md`, `ai/SPEC_ROUTING.md` et `ai/IMPLEMENTATION_STATUS.md`. Lis ensuite uniquement le contexte du Lot actif et le fichier de l Epic active afin de limiter les tokens.

Commence par le Lot 0 et traite ses Epics dans l ordre. Pour chaque Epic: inspecte le dépôt, passe le statut à `IN_PROGRESS`, implémente le périmètre complet, ajoute les tests, exécute lint, typecheck, tests et build, vérifie les critères d acceptation, puis passe à `DONE` uniquement avec des preuves. Poursuis automatiquement tant qu aucun choix métier important ou blocage réel ne nécessite une décision.

Respecte `ai/ARCHITECTURE_RULES.md`, `ai/BUSINESS_INVARIANTS.md` et `ai/TECH_STACK.md`. Le domaine ne dépend ni de Next.js, ni de Prisma. Prisma reste un adaptateur. `src/app` ne contient aucune logique métier. Préserve les changements existants et ne lance aucune commande destructive.

Exigence multilingue obligatoire: tous les textes saisis par les utilisateurs utilisent Unicode UTF-8. Les noms de produits acceptent le français, le bambara et toute autre langue. Ils sont trimés et normalisés en NFC, sans translittération ni filtre ASCII. Ajoute des tests de persistance, validation et recherche avec les caractères bambara `ɛ`, `ɔ`, `ɲ` et `ŋ`.

À la fin de chaque Epic, rapporte le résultat livré, les fichiers modifiés, les vérifications exécutées, leurs résultats, les critères validés et la prochaine Epic.
