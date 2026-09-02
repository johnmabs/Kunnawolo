"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/class-names";

type ErrorStateProps = Readonly<{
  className?: string;
  description: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  title?: ReactNode;
}>;

export function ErrorState({ className, description, onRetry, retryLabel = "Réessayer", title = "Une erreur est survenue" }: ErrorStateProps) {
  return (
    <div className={cn("rounded-lg border border-danger/25 bg-danger/5 px-4 py-8 text-center", className)} role="alert">
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <div className="mx-auto mt-1 max-w-xl text-sm text-text-secondary">{description}</div>
      {onRetry ? <Button className="mt-5" onClick={onRetry} variant="secondary">{retryLabel}</Button> : null}
    </div>
  );
}
