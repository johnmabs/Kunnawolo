"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/class-names";

export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root className={cn("relative inline-flex h-11 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface-subtle px-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary", className)} ref={ref} {...props}>
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-6" />
    </SwitchPrimitive.Root>
  );
});
