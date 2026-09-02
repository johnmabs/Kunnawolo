import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { SaleSummary } from "./sale-summary";
import type { SaleCartDto } from "./types";

type FinalizeDialogProps = Readonly<{
  busy: boolean;
  cart: SaleCartDto;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>;

export function FinalizeDialog({ busy, cart, onConfirm, onOpenChange, open }: FinalizeDialogProps) {
  const articleCount = cart.lines.reduce((total, line) => total + line.quantity, 0);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader><DialogTitle>Finaliser la vente</DialogTitle><DialogDescription>Vérifiez le montant avant de sortir les articles du stock.</DialogDescription></DialogHeader>
        <p className="mt-6 text-sm font-medium text-text-primary">{articleCount} {articleCount > 1 ? "articles" : "article"}</p>
        <div className="mt-4"><SaleSummary cart={cart} /></div>
        <p className="mt-4 rounded-md bg-warning/10 p-3 text-sm text-text-primary">La finalisation déduira immédiatement les produits suivis du stock de la boutique de travail.</p>
        <DialogFooter><Button disabled={busy} onClick={() => onOpenChange(false)} variant="secondary">Retour</Button><Button disabled={busy} isLoading={busy} onClick={onConfirm}>Finaliser</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
