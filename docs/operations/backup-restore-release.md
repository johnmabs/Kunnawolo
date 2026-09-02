# Exploitation V1

## Préparer une release

Exécuter `pnpm ops:verify-release` avec une base PostgreSQL accessible via `DATABASE_URL`. Le script génère le client Prisma, applique les migrations, lance les contrôles, les tests, le build, puis vérifie l état final des migrations.

Enregistrer ensuite la référence, la version et le SHA-256 de l artefact avec le cas d usage `RegisterOperationalRelease`. Une référence est idempotente seulement pour le même artefact.

## Sauvegarder

Installer les outils PostgreSQL côté opérateur, puis lancer :

`BACKUP_DIR=/chemin/absolu DATABASE_URL='…' sh scripts/backup-db.sh`

Le dump custom est écrit d abord dans un fichier temporaire, renommé seulement après succès, puis accompagné de son checksum SHA-256. Conserver dump et checksum ensemble hors de l hôte de production.

## Restaurer

La restauration remplace les objets présents dans la base cible. Vérifier le checksum et utiliser une base isolée avant toute restauration de production :

`BACKUP_FILE=/chemin/absolu/kunnawolo.dump DATABASE_URL='…' CONFIRM_RESTORE=RESTORE sh scripts/restore-db.sh`

Après restauration, lancer `pnpm db:migrate:status`, le contrôle de santé `/api/health` et les parcours organisation/boutique nécessaires. Les données Unicode et les boutiques inactives sont restaurées avec les contraintes PostgreSQL existantes.
