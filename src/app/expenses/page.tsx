import type { Metadata } from "next";
import { ExpensesWorkspace } from "./_components/expenses-workspace";
export const metadata: Metadata = { title: "Dépenses · Astu Sales" };
export default function ExpensesPage() { return <ExpensesWorkspace />; }
