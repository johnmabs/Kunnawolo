import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/class-names";

type SectionHeaderProps = HTMLAttributes<HTMLElement> &
  Readonly<{
    action?: ReactNode;
    description?: ReactNode;
    title: ReactNode;
  }>;

export function SectionHeader({
  action,
  className,
  description,
  title,
  ...props
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <h2 className="text-xl font-semibold leading-tight text-text-primary">
          {title}
        </h2>
        {description ? (
          <div className="mt-1 text-sm text-text-secondary">{description}</div>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap gap-2">{action}</div>
      ) : null}
    </header>
  );
}
