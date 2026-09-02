import type { HTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-subtle text-text-secondary ring-border",
  info: "bg-info/10 text-info ring-info/20",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/20",
  danger: "bg-danger/10 text-danger ring-danger/20",
};

export function Badge({ className, variant = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & Readonly<{ variant?: BadgeVariant }>) {
  return <span className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", variants[variant], className)} {...props} />;
}
