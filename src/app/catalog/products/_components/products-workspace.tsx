"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageContainer, useWorkspace } from "@/components/layout";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from "@/components/ui";
import { createProduct, listProducts } from "./catalog-api";
import { catalogErrorMessage } from "./error-messages";
import { CreateProductDialog } from "./create-product-dialog";
import { ProductDetailDrawer } from "./product-detail-drawer";
import type { CatalogAccess, ProductInput, ProductItem } from "./types";

type Filter = "all" | "active" | "inactive";
export function ProductsWorkspace() {
  const workspace = useWorkspace();
  const { toast } = useToast();
  const access = useMemo<CatalogAccess>(
    () => ({ organizationId: workspace.organizationId.trim() }),
    [workspace.organizationId],
  );
  const ready = access.organizationId.length > 0;
  const [products, setProducts] = useState<readonly ProductItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const load = useCallback(
    async (search = query) => {
      if (!ready) return;
      setLoading(true);
      setError(null);
      try {
        setProducts((await listProducts(access, search)).items);
      } catch (failure) {
        setError(catalogErrorMessage(failure));
      } finally {
        setLoading(false);
      }
    },
    [access, query, ready],
  );
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = window.setTimeout(
      () => {
        void listProducts(access, query)
          .then((result) => {
            if (active) setProducts(result.items);
          })
          .catch((failure: unknown) => {
            if (active) setError(catalogErrorMessage(failure));
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      },
      query ? 250 : 0,
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [access, query, ready]);
  const filtered = products.filter(
    (product) => filter === "all" || product.isActive === (filter === "active"),
  );
  async function create(input: ProductInput) {
    setBusy(true);
    try {
      const product = await createProduct(access, input);
      setCreateOpen(false);
      await load();
      setSelectedId(product.id);
      toast({ title: "Produit créé", variant: "success" });
    } catch (failure) {
      toast({
        title: "Création impossible",
        description: catalogErrorMessage(failure),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <PageContainer>
        <EmptyState
          description="Votre organisation est en cours de chargement."
          title="Contexte catalogue indisponible"
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <PageHeader
        action={
          <Button onClick={() => setCreateOpen(true)}>+ Nouveau produit</Button>
        }
        description="Gérez les informations, le suivi de stock et la tarification de vos produits."
        title="Produits"
      />
      <div className="mt-6 grid gap-4">
        <SearchInput
          aria-label="Rechercher les produits"
          onChange={(event) => {
            setLoading(true);
            setError(null);
            setQuery(event.target.value);
          }}
          placeholder="Rechercher nom, code ou code-barres…"
          value={query}
        />
        <Tabs
          onValueChange={(value) => setFilter(value as Filter)}
          value={filter}
        >
          <TabsList aria-label="Filtrer les produits">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="inactive">Inactifs</TabsTrigger>
          </TabsList>
        </Tabs>
        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : null}
        {!loading && error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : null}
        {!loading && !error && products.length === 0 ? (
          <EmptyState
            description={
              query
                ? "Aucun résultat ne correspond à votre recherche."
                : "Aucun produit n’existe encore dans ce catalogue."
            }
            title={query ? "Aucun résultat" : "Aucun produit"}
          />
        ) : null}
        {!loading && !error && products.length > 0 && filtered.length === 0 ? (
          <EmptyState
            description="Aucun produit ne correspond à ce filtre."
            title="Aucun résultat"
          />
        ) : null}
        {!loading && !error && filtered.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-border bg-surface md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-subtle text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Suivi stock</th>
                    <th className="px-4 py-3">État</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      className="cursor-pointer border-t border-border hover:bg-surface-subtle"
                      key={product.id}
                      onClick={() => setSelectedId(product.id)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          setSelectedId(product.id);
                      }}
                    >
                      <td className="px-4 py-4 font-medium">{product.name}</td>
                      <td className="px-4 py-4 text-text-secondary">
                        {product.code ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        {product.trackInventory ? "Activé" : "Désactivé"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={product.isActive ? "success" : "neutral"}
                        >
                          {product.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 md:hidden">
              {filtered.map((product) => (
                <button
                  className="min-h-24 rounded-lg border border-border bg-surface p-4 text-left"
                  key={product.id}
                  onClick={() => setSelectedId(product.id)}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block font-semibold">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-sm text-text-secondary">
                        {product.code ?? "Sans code"} · Stock{" "}
                        {product.trackInventory ? "suivi" : "non suivi"}
                      </span>
                    </span>
                    <Badge variant={product.isActive ? "success" : "neutral"}>
                      {product.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      {createOpen ? (
        <CreateProductDialog
          busy={busy}
          onConfirm={(input) => void create(input)}
          onOpenChange={setCreateOpen}
          open
        />
      ) : null}
      {selectedId ? (
        <ProductDetailDrawer
          access={access}
          key={selectedId}
          onChanged={() => void load()}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null);
          }}
          productId={selectedId}
        />
      ) : null}
    </PageContainer>
  );
}
