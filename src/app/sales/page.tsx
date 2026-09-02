import type { Metadata } from "next";
import { SalesWorkspace } from "./_components/sales-workspace";

export const metadata: Metadata = { title: "Ventes · Astu Sales" };

export default function SalesPage() {
  return <SalesWorkspace />;
}
