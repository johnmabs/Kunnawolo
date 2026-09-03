"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/class-names";
import { navigation } from "./navigation";
import { NavigationIcon } from "./navigation-icon";

type SidebarProps = Readonly<{
  mobile?: boolean;
  onNavigate?: () => void;
}>;

function isCurrentPath(pathname: string, href: string): boolean {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-white",
        mobile ? "w-full" : "w-[4.5rem] xl:w-60",
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-3 xl:px-5">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-lg font-bold text-sidebar"
        >
          A
        </span>
        <span
          className={cn(
            "truncate text-base font-semibold",
            !mobile && "hidden xl:block",
          )}
        >
          Astu Sales
        </span>
      </div>
      <nav
        aria-label="Navigation principale"
        className="flex-1 overflow-y-auto px-2 py-4"
      >
        {navigation.map((group, groupIndex) => (
          <div
            className={cn(groupIndex > 0 && "mt-6")}
            key={group.label ?? "primary"}
          >
            {group.label ? (
              <p
                className={cn(
                  "mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-300",
                  !mobile && "hidden xl:block",
                )}
              >
                {group.label}
              </p>
            ) : null}
            <ul className="grid gap-1">
              {group.items.map((item) => {
                const current = isCurrentPath(pathname, item.href);
                const itemClassName = cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  item.enabled
                    ? "text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline-white/70"
                    : "cursor-not-allowed text-slate-400",
                  current && "bg-white/15 text-white",
                  !mobile && "justify-center xl:justify-start",
                );
                const content = (
                  <>
                    <NavigationIcon
                      className="size-5 shrink-0"
                      name={item.icon}
                    />
                    <span
                      className={cn("truncate", !mobile && "hidden xl:block")}
                    >
                      {item.label}
                    </span>
                  </>
                );
                return (
                  <li key={item.href}>
                    {item.enabled ? (
                      <Link
                        aria-current={current ? "page" : undefined}
                        className={itemClassName}
                        href={item.href}
                        onClick={onNavigate}
                        title={!mobile ? item.label : undefined}
                      >
                        {content}
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className={itemClassName}
                        title={`${item.label} — prochaine étape`}
                      >
                        {content}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div
        className={cn(
          "border-t border-white/10 p-3 text-xs text-slate-300",
          !mobile && "hidden xl:block",
        )}
      >
        Gestion commerciale
      </div>
    </aside>
  );
}
