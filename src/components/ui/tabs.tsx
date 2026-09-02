"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/class-names";

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(function TabsList({ className, ...props }, ref) {
  return <TabsPrimitive.List className={cn("inline-flex min-h-11 max-w-full items-center gap-1 overflow-x-auto rounded-md bg-surface-subtle p-1", className)} ref={ref} {...props} />;
});

export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(function TabsTrigger({ className, ...props }, ref) {
  return <TabsPrimitive.Trigger className={cn("inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm px-3 text-sm font-medium text-text-secondary outline-none hover:text-text-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-surface data-[state=active]:text-text-primary data-[state=active]:shadow-sm", className)} ref={ref} {...props} />;
});

export const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content className={cn("mt-4 outline-none focus-visible:ring-3 focus-visible:ring-primary/20", className)} ref={ref} {...props} />;
});
