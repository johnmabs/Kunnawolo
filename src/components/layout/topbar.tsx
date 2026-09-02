import { WorkspaceShopSelector } from "./workspace-shop-selector";

type TopbarProps = Readonly<{
  onMenuOpen: () => void;
  organizationLabel: string;
  shopLabel: string;
  userLabel: string;
}>;

export function Topbar({ onMenuOpen, organizationLabel, shopLabel, userLabel }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button aria-label="Ouvrir le menu" className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-surface p-0 text-text-primary hover:bg-surface-subtle md:hidden" onClick={onMenuOpen} type="button">
        <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <div className="min-w-0 flex-1">
        <p className="hidden text-xs text-text-secondary sm:block">Organisation actuelle</p>
        <p className="truncate text-sm font-semibold text-text-primary">{organizationLabel}</p>
      </div>
      <WorkspaceShopSelector className="max-w-[13rem] sm:max-w-[16rem]" label={shopLabel} />
      <div className="hidden min-w-0 items-center gap-2 border-l border-border pl-4 lg:flex">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">U</span>
        <div className="min-w-0">
          <p className="text-xs text-text-secondary">Utilisateur courant</p>
          <p className="max-w-40 truncate text-sm font-medium text-text-primary">{userLabel}</p>
        </div>
      </div>
    </header>
  );
}
