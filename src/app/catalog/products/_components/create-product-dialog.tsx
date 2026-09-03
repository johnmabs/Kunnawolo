"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
} from "@/components/ui";
import type { ProductInput } from "./types";

const initial: ProductInput = {
  name: "",
  code: "",
  barcode: "",
  packaging: "",
  form: "",
  trackInventory: true,
};
export function CreateProductDialog({
  busy,
  onConfirm,
  onOpenChange,
  open,
}: Readonly<{
  busy: boolean;
  onConfirm: (input: ProductInput) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>) {
  const [form, setForm] = useState(initial);
  function text(field: keyof Omit<ProductInput, "trackInventory">) {
    return (event: ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim()) onConfirm(form);
  }
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Nouveau produit</DialogTitle>
            <DialogDescription>
              Le produit sera créé actif automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              className="sm:col-span-2"
              label="Nom"
              name="product-name"
              required
            >
              {({ controlId }) => (
                <Input
                  autoFocus
                  id={controlId}
                  onChange={text("name")}
                  value={form.name}
                />
              )}
            </Field>
            <Field label="Code" name="product-code">
              {({ controlId }) => (
                <Input
                  id={controlId}
                  onChange={text("code")}
                  value={form.code}
                />
              )}
            </Field>
            <Field label="Code-barres" name="product-barcode">
              {({ controlId }) => (
                <Input
                  id={controlId}
                  onChange={text("barcode")}
                  value={form.barcode}
                />
              )}
            </Field>
            <Field label="Conditionnement" name="product-packaging">
              {({ controlId }) => (
                <Input
                  id={controlId}
                  onChange={text("packaging")}
                  value={form.packaging}
                />
              )}
            </Field>
            <Field label="Forme" name="product-form">
              {({ controlId }) => (
                <Input
                  id={controlId}
                  onChange={text("form")}
                  value={form.form}
                />
              )}
            </Field>
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium sm:col-span-2">
              <Checkbox
                checked={form.trackInventory}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    trackInventory: checked === true,
                  }))
                }
              />
              Suivre le stock de ce produit
            </label>
          </div>
          <DialogFooter>
            <Button
              disabled={busy}
              onClick={() => onOpenChange(false)}
              variant="secondary"
            >
              Annuler
            </Button>
            <Button disabled={!form.name.trim()} isLoading={busy} type="submit">
              Créer le produit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
