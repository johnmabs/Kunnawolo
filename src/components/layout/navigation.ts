export type NavigationItem = Readonly<{
  enabled?: boolean;
  href: string;
  icon: "dashboard" | "sales" | "stock" | "catalog" | "expenses" | "admin";
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
      { href: "/inventory", icon: "stock", label: "Stock" },
      { href: "/catalog/products", icon: "catalog", label: "Catalogue" },
      { href: "/expenses", icon: "expenses", label: "Dépenses" },
    ],
  },
  {
    label: "Configuration",
    items: [{ href: "/administration/organization", icon: "admin", label: "Administration" }],
  },
];
