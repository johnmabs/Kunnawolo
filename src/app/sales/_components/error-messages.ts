const messages: Readonly<Record<string, string>> = {
  "catalog.product_search_failed": "La recherche des produits a échoué.",
  "inventory.insufficient_stock": "Le stock disponible est insuffisant pour finaliser cette vente.",
  "sales.cart_not_found": "Ce panier n’est plus disponible. Commencez une nouvelle vente.",
  "sales.empty_cart": "Ajoutez au moins un produit avant de finaliser.",
  "sales.invalid_discount": "La remise dépasse le montant de la ligne.",
  "sales.product_not_found": "Ce produit n’est pas actif ou ne possède pas de prix courant.",
  "sales.shop_not_found": "La boutique de travail n’est pas active ou n’appartient pas à cette organisation.",
  "sales.under_cost_reason_required": "Une justification est obligatoire pour une vente sous coût.",
  "security.invalid_api_key": "La clé d’accès est invalide.",
  "security.api_key_forbidden": "Cette clé d’accès n’est pas autorisée.",
};

export function salesErrorMessage(error: unknown): string {
  const code = error instanceof Error && "code" in error ? String(error.code) : "";
  return messages[code] ?? "L’opération n’a pas pu être effectuée. Réessayez.";
}
