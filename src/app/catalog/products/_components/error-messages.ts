import { CatalogApiError } from "./types";
const messages: Readonly<Record<string, string>> = {
  "catalog.invalid_product_name": "Le nom du produit est obligatoire.",
  "catalog.product_barcode_taken": "Ce code-barres est déjà utilisé.",
  "catalog.product_code_taken": "Ce code produit est déjà utilisé.",
  "catalog.product_not_found": "Ce produit n’existe plus.",
  "catalog.product_pricing_not_found": "Aucun prix n’a encore été défini.",
  "security.invalid_api_key": "La clé d’accès est invalide ou révoquée.",
};
export function catalogErrorMessage(error: unknown) {
  return error instanceof CatalogApiError
    ? (messages[error.code] ?? `Une erreur est survenue (${error.code}).`)
    : "Une erreur inattendue est survenue.";
}
