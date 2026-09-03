import type { ReactNode } from "react";
import { cn } from "@/lib/class-names";

type EmptyStateProps = Readonly<{
  action?: ReactNode;
  className?: string;
  description: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
}>;

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center",
        className,
      )}
    >
      <div className="max-w-md">
        {icon ? (
          <div
            aria-hidden="true"
            className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-surface-subtle text-text-secondary"
          >
            {icon}
          </div>
        ) : null}
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <div className="mt-1 text-sm text-text-secondary">{description}</div>
        {action ? (
          <div className="mt-5 flex justify-center">{action}</div>
        ) : null}
      </div>
    </div>
  );
}
