import type { SVGAttributes } from "react";
import type { NavigationItem } from "./navigation";

type IconProps = SVGAttributes<SVGSVGElement> & Readonly<{ name: NavigationItem["icon"] }>;

const paths: Record<NavigationItem["icon"], React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  sales: <><path d="M4 5h16v11H4z" /><path d="M8 20h8M8 9h8M8 13h5" /></>,
  stock: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  catalog: <><path d="M4 4h6v16H4zM14 4h6v7h-6zM14 15h6v5h-6z" /></>,
  expenses: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></>,
  admin: <><circle cx="12" cy="8" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2M19 4v4M17 6h4" /></>,
};

export function NavigationIcon({ name, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" {...props}>{paths[name]}</svg>;
}
