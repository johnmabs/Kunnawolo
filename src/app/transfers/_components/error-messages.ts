import { TransferApiError } from "./types";

const messages: Readonly<Record<string, string>> = {
  "api_access.invalid_key": "La clé d’accès est invalide ou révoquée.",
  "transfers.dispatch_forbidden": "Vous n’avez pas l’autorisation d’expédier depuis cette boutique.",
  "transfers.insufficient_stock": "Le stock disponible ne permet pas cette expédition.",
  "transfers.invalid_state": "Ce transfert a changé d’état. Actualisez la liste.",
  "transfers.line_save_failed": "La ligne n’a pas pu être enregistrée.",
  "transfers.list_failed": "Les transferts n’ont pas pu être chargés.",
  "transfers.reception_failed": "Le transfert n’a pas pu être réceptionné.",
  "transfers.reception_forbidden": "Vous n’avez pas l’autorisation de réceptionner dans cette boutique.",
  "transfers.shipment_failed": "Le transfert n’a pas pu être expédié.",
};

export function transferErrorMessage(error: unknown): string {
  if (error instanceof TransferApiError) return messages[error.code] ?? `Une erreur est survenue (${error.code}).`;
  return "Une erreur inattendue est survenue.";
}
