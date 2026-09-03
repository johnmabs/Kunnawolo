import Link from "next/link";
import type { ReactNode } from "react";

export function AuthLayout({ children, eyebrow, title, description }: Readonly<{ children: ReactNode; eyebrow: string; title: string; description: string }>) {
  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(20rem,0.85fr)_minmax(32rem,1.15fr)]">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10 bg-primary/25" />
        <Link className="relative text-xl font-bold tracking-tight" href="/">astu-sales</Link>
        <div className="relative max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">Pilotez votre activité</p>
          <p className="mt-4 text-4xl font-semibold leading-tight">Ventes, stocks et dépenses dans un seul espace de travail.</p>
          <p className="mt-5 text-base leading-7 text-slate-300">Une interface claire pour rester concentré sur les opérations quotidiennes.</p>
        </div>
        <p className="relative text-sm text-slate-400">Astu Sales · Gestion commerciale</p>
      </section>
      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Link className="mb-10 inline-block text-xl font-bold tracking-tight text-sidebar lg:hidden" href="/">astu-sales</Link>
          <p className="text-sm font-semibold text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-text-primary">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
