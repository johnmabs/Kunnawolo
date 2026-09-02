"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(function DialogContent({ children, className, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[1px]" />
      <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-5 text-text-primary shadow-2xl outline-none sm:p-6", className)} ref={ref} {...props}>
        {children}
        <DialogPrimitive.Close aria-label="Fermer" className="absolute right-2 top-2 grid size-11 place-items-center rounded-md border border-transparent bg-transparent text-xl text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:ring-3 focus-visible:ring-primary/20">×</DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1.5 pr-10", className)} {...props} />;
}

export const DialogTitle = forwardRef<ElementRef<typeof DialogPrimitive.Title>, ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title className={cn("text-xl font-semibold leading-tight text-text-primary", className)} ref={ref} {...props} />;
});

export const DialogDescription = forwardRef<ElementRef<typeof DialogPrimitive.Description>, ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(function DialogDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description className={cn("text-sm text-text-secondary", className)} ref={ref} {...props} />;
});

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
