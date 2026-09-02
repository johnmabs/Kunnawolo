import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";
import { Input } from "./input";

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function SearchInput({ className, ...props }, ref) {
  return (
    <div className={cn("relative", className)}>
      <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
      <Input className="pl-9" ref={ref} type="search" {...props} />
    </div>
  );
});
