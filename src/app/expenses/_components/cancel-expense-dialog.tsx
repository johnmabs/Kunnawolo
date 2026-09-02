"use client";
import { useState, type FormEvent } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, Textarea } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import type { ExpenseItem } from "./types";

export function CancelExpenseDialog({ busy, expense, onConfirm, onOpenChange, open }: Readonly<{ busy: boolean; expense: ExpenseItem; onConfirm: (reference: string, reason: string) => void; onOpenChange: (open: boolean) => void; open: boolean }>) {
  const [reference, setReference] = useState(""); const [reason, setReason] = useState(""); const valid = reference.trim().length > 0 && reason.trim().length > 0;
  function submit(event: FormEvent) { event.preventDefault(); if (valid) onConfirm(reference, reason); }
  return <Dialog onOpenChange={onOpenChange} open={open}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>Annuler la dépense</DialogTitle><DialogDescription>{expense.description} · {formatMoney(expense.amountMinor, expense.currency)}</DialogDescription></DialogHeader><div className="mt-6 grid gap-4"><Field label="Référence d’annulation" name="cancellation-reference" required>{({ controlId }) => <Input autoFocus id={controlId} onChange={(event) => setReference(event.target.value)} value={reference} />}</Field><Field label="Motif" name="cancellation-reason" required>{({ controlId }) => <Textarea id={controlId} onChange={(event) => setReason(event.target.value)} rows={4} value={reason} />}</Field><p className="rounded-md border border-warning/30 bg-warning/5 p-4 text-sm"><span className="font-semibold text-warning">Conséquence :</span> la dépense restera dans l’historique, mais ne sera plus comptabilisée comme active.</p></div><DialogFooter><Button disabled={busy} onClick={() => onOpenChange(false)} variant="secondary">Retour</Button><Button disabled={!valid} isLoading={busy} type="submit" variant="danger">Annuler la dépense</Button></DialogFooter></form></DialogContent></Dialog>;
}
