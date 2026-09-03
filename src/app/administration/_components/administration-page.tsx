"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageContainer } from "@/components/layout";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/class-names";

const links = [
  { href: "/administration/organization", label: "Organisation" },
  { href: "/administration/shops", label: "Boutiques" },
  { href: "/administration/members", label: "Membres" },
  { href: "/administration/access", label: "Accès" },
  { href: "/administration/api-keys", label: "Clés API" },
  { href: "/administration/preferences", label: "Préférences" },
] as const;
export function AdministrationPage({
  children,
  description,
  title,
}: Readonly<{ children: ReactNode; description: string; title: string }>) {
  const pathname = usePathname();
  return (
    <PageContainer>
      <PageHeader
        description={description}
        eyebrow="Administration"
        title={title}
      />
      <nav
        aria-label="Sections de l’administration"
        className="mt-6 overflow-x-auto"
      >
        <ul className="flex min-w-max gap-1 rounded-md bg-surface-subtle p-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-sm px-3 text-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary/30",
                  pathname === link.href &&
                    "bg-surface text-text-primary shadow-sm",
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6">{children}</div>
    </PageContainer>
  );
}
