import { Slot } from "radix-ui";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Readonly<{
  asChild?: boolean;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}>;

const variants: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover",
  secondary: "border-border bg-surface text-text-primary hover:bg-surface-subtle",
  ghost: "border-transparent bg-transparent text-text-primary hover:bg-surface-subtle",
  danger: "border-danger bg-danger text-white hover:brightness-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
  icon: "size-11 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild = false, children, className, disabled, isLoading = false, size = "md", type = "button", variant = "primary", ...props },
  ref,
) {
  const styles = cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/40 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  if (asChild) {
    return <Slot.Root className={styles} ref={ref} {...props}>{children}</Slot.Root>;
  }

  return (
    <button
      className={styles}
      disabled={disabled || isLoading}
      type={type}
      aria-busy={isLoading || undefined}
      ref={ref}
      {...props}
    >
      {isLoading ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
      {children}
    </button>
  );
});
