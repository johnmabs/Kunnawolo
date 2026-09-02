"use client";

import { Dialog as DrawerPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export const Drawer = DrawerPrimitive.Root;
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;

export const DrawerContent = forwardRef<ElementRef<typeof DrawerPrimitive.Content>, ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>>(function DrawerContent({ children, className, ...props }, ref) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/55" />
      <DrawerPrimitive.Content className={cn("fixed inset-y-0 right-0 z-50 w-[min(22rem,calc(100%-2rem))] overflow-y-auto border-l border-border bg-surface p-5 text-text-primary shadow-2xl outline-none sm:p-6", className)} ref={ref} {...props}>
        {children}
        <DrawerPrimitive.Close aria-label="Fermer" className="absolute right-2 top-2 grid size-11 place-items-center rounded-md border border-transparent bg-transparent text-xl text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:ring-3 focus-visible:ring-primary/20">×</DrawerPrimitive.Close>
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
});

export function DrawerHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1.5 pr-10", className)} {...props} />;
}

export const DrawerTitle = forwardRef<ElementRef<typeof DrawerPrimitive.Title>, ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>>(function DrawerTitle({ className, ...props }, ref) {
  return <DrawerPrimitive.Title className={cn("text-xl font-semibold leading-tight text-text-primary", className)} ref={ref} {...props} />;
});

export const DrawerDescription = forwardRef<ElementRef<typeof DrawerPrimitive.Description>, ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>>(function DrawerDescription({ className, ...props }, ref) {
  return <DrawerPrimitive.Description className={cn("text-sm text-text-secondary", className)} ref={ref} {...props} />;
});

export function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
