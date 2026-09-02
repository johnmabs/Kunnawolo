import type { Metadata } from "next";
import { ProductsWorkspace } from "./_components/products-workspace";
export const metadata: Metadata = { title: "Produits · Astu Sales" };
export default function ProductsPage() { return <ProductsWorkspace />; }
