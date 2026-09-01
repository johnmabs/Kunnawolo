-- Le suivi de stock est activé par défaut pour préserver le comportement des produits existants.
ALTER TABLE "Product" ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT true;
