import type { HTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-surface-subtle", className)} {...props} />;
}
