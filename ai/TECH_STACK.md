# Conventions techniques

- Node.js 24.x; pnpm figé.
- Next.js 16 App Router; TypeScript strict; Tailwind.
- PostgreSQL; Prisma comme adaptateur et migrations, jamais comme domaine.
- ESLint, typecheck, tests domaine et intégration PostgreSQL, build.
- UTC en stockage; fuseau organisation à l affichage; occurredAt distinct de recordedAt.
- Identifiants opaques; numéros métier distincts et uniques dans l organisation.
- Validation aux frontières, erreurs stables, pagination et idempotency key.
- Encodage UTF-8 de bout en bout. Les colonnes PostgreSQL de libellés utilisent `text` ou `varchar`, tous deux compatibles Unicode.
- Les validateurs acceptent les lettres Unicode et ne doivent pas employer une règle ASCII telle que `[A-Za-z]` pour les noms.
- Normaliser les entrées textuelles en Unicode NFC avant stockage, après suppression des espaces extérieurs, sans retirer les signes diacritiques.
- Recherche multilingue: commencer par une recherche insensible à la casse compatible avec la collation retenue; tester explicitement le bambara. Ne jamais utiliser une transformation de recherche comme valeur affichée.
