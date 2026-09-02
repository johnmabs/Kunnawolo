export type NavigationItem = Readonly<{
  enabled?: boolean;
  href: string;
  icon: "dashboard" | "sales" | "stock" | "transfers" | "catalog" | "expenses" | "admin";
  label: string;
}>;

export type NavigationGroup = Readonly<{
  items: readonly NavigationItem[];
  label?: string;
}>;

export const navigation: readonly NavigationGroup[] = [
  {
    items: [
      { enabled: true, href: "/", icon: "dashboard", label: "Tableau de bord" },
      { enabled: true, href: "/sales", icon: "sales", label: "Ventes" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { enabled: true, href: "/inventory", icon: "stock", label: "Stock" },
      { enabled: true, href: "/transfers", icon: "transfers", label: "Transferts" },
      { enabled: true, href: "/catalog/products", icon: "catalog", label: "Catalogue" },
      { enabled: true, href: "/expenses", icon: "expenses", label: "Dépenses" },
    ],
  },
  {
    label: "Configuration",
    items: [{ enabled: true, href: "/administration/organization", icon: "admin", label: "Administration" }],
  },
];
