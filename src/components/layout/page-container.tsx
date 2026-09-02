import type { HTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8", className)} {...props} />;
}
