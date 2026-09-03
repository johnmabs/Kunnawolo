import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/class-names";

type PageHeaderProps = HTMLAttributes<HTMLElement> &
  Readonly<{
    action?: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    title: ReactNode;
  }>;

export function PageHeader({
  action,
  className,
  description,
  eyebrow,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-sm font-medium text-primary">{eyebrow}</div>
        ) : null}
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-text-primary">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-3xl text-sm text-text-secondary">
            {description}
          </div>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap gap-2">{action}</div>
      ) : null}
    </header>
  );
}
