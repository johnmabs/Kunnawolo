"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/class-names";

export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root className={cn("grid size-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary outline-none hover:bg-surface-subtle focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white", className)} ref={ref} {...props}>
      <CheckboxPrimitive.Indicator aria-hidden="true">
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
