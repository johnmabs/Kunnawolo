import type { Metadata } from "next";
import { TransfersWorkspace } from "./_components/transfers-workspace";

export const metadata: Metadata = { title: "Transferts · Astu Sales" };

export default function TransfersPage() {
  return <TransfersWorkspace />;
}
