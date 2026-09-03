"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/components/layout";
import { Card, CardContent, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { getOrganization, type OrganizationProfile } from "../_components/administration-api";

export function OrganizationView() {
  const workspace = useWorkspace(); const access = useMemo(() => ({ organizationId: workspace.organizationId.trim() }), [workspace.organizationId]); const ready = Boolean(access.organizationId); const [profile, setProfile] = useState<OrganizationProfile | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setProfile(await getOrganization(access)); } catch (failure) { setError(failure instanceof Error ? failure.message : "Erreur inattendue"); } finally { setLoading(false); } }, [access]);
  useEffect(() => { if (!ready) return; let active = true; void getOrganization(access).then((result) => { if (active) setProfile(result); }).catch((failure: unknown) => { if (active) setError(failure instanceof Error ? failure.message : "Erreur inattendue"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [access, ready]);
  if (!ready) return <EmptyState description="Votre organisation est en cours de chargement." title="Contexte administratif indisponible" />;
  if (loading) return <Skeleton className="h-44" />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  return profile ? <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><div><p className="text-xs text-text-secondary">Nom</p><p className="mt-1 text-lg font-semibold">{profile.name}</p></div><div><p className="text-xs text-text-secondary">Devise</p><p className="mt-1 text-lg font-semibold">{profile.currency}</p></div><div className="sm:col-span-2"><p className="text-xs text-text-secondary">Identifiant</p><p className="mt-1 break-all text-sm">{profile.id}</p></div><p className="text-sm text-text-secondary sm:col-span-2">La modification du profil n’est pas exposée : aucun use case applicatif ne la prend actuellement en charge.</p></CardContent></Card> : null;
}
