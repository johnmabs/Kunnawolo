"use client";

import { Select as SelectPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/class-names";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<ElementRef<typeof SelectPrimitive.Trigger>, ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(function SelectTrigger({ children, className, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger className={cn("flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm text-text-primary shadow-sm outline-none hover:border-text-secondary focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-text-secondary", className)} ref={ref} {...props}>
      {children}
      <SelectPrimitive.Icon aria-hidden="true" className="text-text-secondary">⌄</SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = forwardRef<ElementRef<typeof SelectPrimitive.Content>, ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(function SelectContent({ children, className, position = "popper", ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className={cn("z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-surface p-1 text-text-primary shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in", className)} position={position} ref={ref} {...props}>
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(function SelectItem({ children, className, ...props }, ref) {
  return (
    <SelectPrimitive.Item className={cn("relative flex min-h-11 cursor-default select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-subtle data-[disabled]:opacity-50", className)} ref={ref} {...props}>
      <span className="absolute left-2 grid size-5 place-items-center"><SelectPrimitive.ItemIndicator aria-hidden="true">✓</SelectPrimitive.ItemIndicator></span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
