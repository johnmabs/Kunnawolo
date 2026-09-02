import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & Readonly<{ invalid?: boolean }>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn("min-h-28 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-secondary/80 hover:border-text-secondary focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70 aria-invalid:border-danger aria-invalid:ring-danger/15", className)}
      ref={ref}
      {...props}
    />
  );
});
