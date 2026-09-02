"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, EmptyState, ErrorState, SearchInput, Skeleton } from "@/components/ui";
import { salesErrorMessage } from "./error-messages";
import { searchProducts } from "./sales-api";
import type { ProductSearchItem, SalesAccess } from "./types";

type ProductSearchProps = Readonly<{
  access: SalesAccess;
  busyProductId: string | null;
  onAdd: (product: ProductSearchItem) => void;
}>;

export function ProductSearch({ access, busyProductId, onAdd }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<readonly ProductSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedQuery = query.trim();

  const runSearch = useCallback(async (signal?: AbortSignal) => {
    if (normalizedQuery.length < 2) {
      setProducts([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await searchProducts(access, normalizedQuery);
      if (!signal?.aborted) setProducts(result.items);
    } catch (searchError) {
      if (!signal?.aborted) setError(salesErrorMessage(searchError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [access, normalizedQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void runSearch(controller.signal), 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [runSearch]);

  return (
    <section aria-labelledby="product-search-title" className="flex min-h-0 flex-col">
      <div className="border-b border-border p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-text-primary" id="product-search-title">Produits</h2>
          <Badge variant="warning">Prix disponible à l’ajout</Badge>
        </div>
        <SearchInput aria-label="Rechercher un produit" className="mt-4" onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher nom, code ou code-barres…" value={query} />
        <p className="mt-2 text-xs text-text-secondary">Saisissez au moins deux caractères. La projection des prix de vente reste un BACKEND GAP confirmé.</p>
      </div>
      <div className="flex-1 p-4 sm:p-6">
        {normalizedQuery.length < 2 ? <EmptyState description="Recherchez un produit par son nom, son code ou son code-barres." title="Commencez votre recherche" /> : null}
        {loading ? <div className="grid gap-3" aria-label="Chargement des produits"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : null}
        {!loading && error ? <ErrorState description={error} onRetry={() => void runSearch()} /> : null}
        {!loading && !error && normalizedQuery.length >= 2 && products.length === 0 ? <EmptyState description="Aucun résultat ne correspond à cette recherche." title="Aucun produit trouvé" /> : null}
        {!loading && !error && products.length > 0 ? (
          <ul className="grid gap-3">
            {products.map((product) => (
              <li className="flex min-h-24 items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4" key={product.id}>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text-primary">{product.name}</p>
                  <p className="mt-1 truncate text-xs text-text-secondary">{product.code ?? product.barcode ?? "Sans code"}</p>
                  <p className="mt-2 text-sm font-medium text-text-secondary">Prix chargé lors de l’ajout</p>
                </div>
                <Button disabled={busyProductId !== null} isLoading={busyProductId === product.id} onClick={() => onAdd(product)} variant="secondary">Ajouter</Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
