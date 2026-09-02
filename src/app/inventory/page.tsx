import type { Metadata } from "next";
import { InventoryWorkspace } from "./_components/inventory-workspace";

export const metadata: Metadata = { title: "Stock · Astu Sales" };

export default function InventoryPage() { return <InventoryWorkspace />; }
