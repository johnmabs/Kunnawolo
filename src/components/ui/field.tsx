import { useId, type ReactNode } from "react";
import { cn } from "@/lib/class-names";

type FieldProps = Readonly<{
  children: (
    ids: Readonly<{
      controlId: string;
      descriptionId?: string;
      errorId?: string;
    }>,
  ) => ReactNode;
  className?: string;
  description?: ReactNode;
  error?: ReactNode;
  label: ReactNode;
  name?: string;
  required?: boolean;
}>;

export function Field({
  children,
  className,
  description,
  error,
  label,
  name,
  required = false,
}: FieldProps) {
  const generatedId = useId();
  const controlId = name ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label
        className="text-sm font-medium text-text-primary"
        htmlFor={controlId}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </label>
      {children({ controlId, descriptionId, errorId })}
      {description ? (
        <p className="text-xs text-text-secondary" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          className="text-xs font-medium text-danger"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
