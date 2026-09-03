import { cn } from "@/lib/class-names";

type WorkspaceShopSelectorProps = Readonly<{
  className?: string;
  label: string;
  onClick?: () => void;
}>;

export function WorkspaceShopSelector({
  className,
  label,
  onClick,
}: WorkspaceShopSelectorProps) {
  return (
    <button
      className={cn(
        "flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm font-medium text-text-primary hover:bg-surface-subtle disabled:cursor-default disabled:opacity-100",
        className,
      )}
      disabled={onClick === undefined}
      onClick={onClick}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="size-4 shrink-0 text-text-secondary"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M4 10v10h16V10M3 10l2-6h14l2 6M8 20v-6h8v6" />
        <path d="M3 10a3 3 0 0 0 5 0 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5 0" />
      </svg>
      <span className="truncate">{label}</span>
      {onClick ? (
        <span aria-hidden="true" className="text-text-secondary">
          ⌄
        </span>
      ) : null}
    </button>
  );
}
