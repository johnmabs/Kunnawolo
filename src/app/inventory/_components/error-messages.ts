const messages: Readonly<Record<string, string>> = {
  "catalog.product_pricing_not_found":
    "Ce produit ne possède pas de coût de référence courant.",
  "inventory.insufficient_stock":
    "Le stock disponible est insuffisant pour cette opération.",
  "inventory.shop_not_found":
    "La boutique de travail n’est pas disponible dans cette organisation.",
  "inventory.stock_level_not_found":
    "Aucun niveau de stock n’existe pour ce produit dans cette boutique.",
  "security.invalid_api_key": "La clé d’accès est invalide.",
  "workspace.preference_forbidden": "Vous n’êtes pas affecté à cette boutique.",
};

export function inventoryErrorMessage(error: unknown): string {
  const code =
    error instanceof Error && "code" in error ? String(error.code) : "";
  return messages[code] ?? "L’opération de stock n’a pas pu être effectuée.";
}
