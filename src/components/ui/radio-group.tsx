"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/class-names";

export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>(function RadioGroup({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} ref={ref} {...props} />;
});

export const Radio = forwardRef<ElementRef<typeof RadioGroupPrimitive.Item>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>>(function Radio({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item className={cn("grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface outline-none hover:bg-surface-subtle focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary", className)} ref={ref} {...props}>
      <RadioGroupPrimitive.Indicator className="size-4 rounded-full bg-primary" />
    </RadioGroupPrimitive.Item>
  );
});
