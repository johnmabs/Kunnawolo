import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & Readonly<{ invalid?: boolean }>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-secondary/80 hover:border-text-secondary focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70 aria-invalid:border-danger aria-invalid:ring-danger/15",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
