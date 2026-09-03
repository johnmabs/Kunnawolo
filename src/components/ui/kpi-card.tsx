import type { ReactNode } from "react";
import { Card } from "./card";
import { cn } from "@/lib/class-names";

type KpiCardProps = Readonly<{
  className?: string;
  description?: ReactNode;
  label: ReactNode;
  value: ReactNode;
}>;

export function KpiCard({
  className,
  description,
  label,
  value,
}: KpiCardProps) {
  return (
    <Card className={cn("min-w-0 p-4 sm:p-6", className)}>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 break-words text-[clamp(1.75rem,4vw,2rem)] font-semibold leading-tight tabular-nums text-text-primary">
        {value}
      </p>
      {description ? (
        <div className="mt-2 text-xs text-text-secondary">{description}</div>
      ) : null}
    </Card>
  );
}
