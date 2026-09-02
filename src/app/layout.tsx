import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astu Sales",
  description: "Gestionnaire de ventes et de stocks.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
