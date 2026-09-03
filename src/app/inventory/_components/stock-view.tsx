"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  EmptyState,
  ErrorState,
  SearchInput,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { inventoryErrorMessage } from "./error-messages";
import { listStock } from "./inventory-api";
import { StockDetailDrawer } from "./stock-detail-drawer";
import type { InventoryAccess, StockList } from "./types";

export function StockView({ access }: Readonly<{ access: InventoryAccess }>) {
  const [stock, setStock] = useState<StockList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStock(await listStock(access));
    } catch (loadError) {
      setError(inventoryErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [access]);
  useEffect(() => {
    let active = true;
    void listStock(access)
      .then((result) => {
        if (active) setStock(result);
      })
      .catch((loadError: unknown) => {
        if (active) setError(inventoryErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [access]);

  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    return (stock?.items ?? []).filter(
      (item) =>
        (filter !== "low" || item.isLowStock) &&
        (needle.length === 0 ||
          [item.productName, item.productCode, item.barcode].some((value) =>
            value?.toLocaleLowerCase("fr").includes(needle),
          )),
    );
  }, [filter, query, stock]);

  if (loading)
    return (
      <div className="grid gap-3">
        <Skeleton className="h-11" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  if (error)
    return <ErrorState description={error} onRetry={() => void load()} />;
  if (!stock || stock.items.length === 0)
    return (
      <EmptyState
        description="Aucun niveau de stock n’existe encore pour cette boutique."
        title="Aucun stock"
      />
    );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          aria-label="Rechercher dans le stock"
          className="w-full sm:max-w-md"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un produit…"
          value={query}
        />
        <Tabs onValueChange={setFilter} value={filter}>
          <TabsList aria-label="Filtrer les niveaux de stock">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="low">Stock faible</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Aucun résultat ne correspond à la recherche et aux filtres."
            title="Aucun produit trouvé"
          />
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-lg border border-border bg-surface md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Seuil</TableHead>
                  <TableHead>État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <button
                        className="min-h-11 bg-transparent p-0 text-left font-semibold text-primary hover:underline"
                        onClick={() => setSelectedProductId(item.productId)}
                        type="button"
                      >
                        {item.productName}
                        <span className="block text-xs font-normal text-text-secondary">
                          {item.productCode ?? "Sans code"}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {item.lowStockThreshold}
                    </TableCell>
                    <TableCell>
                      {item.isLowStock ? (
                        <Badge variant="warning">Stock faible</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="mt-6 grid gap-3 md:hidden">
            {items.map((item) => (
              <li key={item.productId}>
                <button
                  className="flex min-h-24 w-full items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 text-left text-text-primary"
                  onClick={() => setSelectedProductId(item.productId)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {item.productName}
                    </span>
                    <span className="mt-1 block text-xs text-text-secondary">
                      Seuil : {item.lowStockThreshold}
                    </span>
                    <span className="mt-2 block">
                      {item.isLowStock ? (
                        <Badge variant="warning">Stock faible</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </span>
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {item.quantity}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {selectedProductId ? (
        <StockDetailDrawer
          access={access}
          onChanged={() => void load()}
          onOpenChange={(open) => {
            if (!open) setSelectedProductId(null);
          }}
          productId={selectedProductId}
        />
      ) : null}
    </>
  );
}
