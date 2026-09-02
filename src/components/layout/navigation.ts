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
      { href: "/ventes", icon: "sales", label: "Ventes" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/stock", icon: "stock", label: "Stock" },
      { href: "/catalogue/produits", icon: "catalog", label: "Catalogue" },
      { href: "/depenses", icon: "expenses", label: "Dépenses" },
    ],
  },
  {
    label: "Configuration",
    items: [{ href: "/administration/organisation", icon: "admin", label: "Administration" }],
  },
];
