"use client";

import { useRef, useState } from "react";

type Dashboard = Readonly<{ sales?: Readonly<{ revenue?: Readonly<{ amountMinor?: number; currency?: string }>; grossMargin?: Readonly<{ amountMinor?: number }> }>; stock?: Readonly<{ onHandQuantity?: Readonly<{ value?: number }>; anomalyCount?: number }>; estimatedResult?: Readonly<{ amount?: Readonly<{ amountMinor?: number }> }> }>;

export function OperationalConsole() {
  const [organizationId, setOrganizationId] = useState("");
  const [shopId, setShopId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [compact, setCompact] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [message, setMessage] = useState("Saisissez un périmètre et une clé d’accès pour consulter les indicateurs.");
  const [busy, setBusy] = useState(false);
  const preferenceRequestKey = useRef(crypto.randomUUID());

  const headers = { Authorization: `Bearer ${apiKey}` };

  async function loadDashboard() {
    setBusy(true);
    setMessage("Chargement des indicateurs…");
    const search = new URLSearchParams({ organizationId });
    if (shopId.trim().length > 0) search.set("shopId", shopId.trim());
    const response = await fetch(`/api/reports/dashboard?${search.toString()}`, { headers, cache: "no-store" });
    const body = await response.json() as Dashboard & Readonly<{ code?: string }>;
    setBusy(false);
    if (!response.ok) {
      setDashboard(null);
      setMessage(`Impossible de charger les indicateurs (${body.code ?? "erreur"}).`);
      return;
    }
    setDashboard(body);
    setMessage("Indicateurs à jour.");
  }

  async function savePreference() {
    setBusy(true);
    const response = await fetch("/api/workspace-preference", { method: "PUT", headers: { ...headers, "Content-Type": "application/json", "Idempotency-Key": preferenceRequestKey.current }, body: JSON.stringify({ organizationId, shopId: shopId.trim() || null, isCompact: compact }) });
    const body = await response.json() as Readonly<{ code?: string }>;
    setBusy(false);
    if (response.ok) preferenceRequestKey.current = crypto.randomUUID();
    setMessage(response.ok ? "Préférence de poste enregistrée." : `Impossible d’enregistrer la préférence (${body.code ?? "erreur"}).`);
  }

  return (
    <main className="console-shell" aria-labelledby="console-title">
      <header className="console-header">
        <p className="eyebrow">Kunnawolo · poste opérationnel</p>
        <h1 id="console-title">Pilotage des ventes et du stock</h1>
        <p>Choisissez votre organisation et, si nécessaire, une boutique historique ou active. Les chiffres restent toujours dans ce périmètre.</p>
      </header>
      <section className="console-panel" aria-labelledby="scope-title">
        <h2 id="scope-title">Périmètre de travail</h2>
        <div className="console-fields">
          <label>Organisation<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required autoComplete="organization" /></label>
          <label>Boutique <span>(facultatif)</span><input value={shopId} onChange={(event) => setShopId(event.target.value)} autoComplete="off" /></label>
          <label>Clé d’accès<input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" required autoComplete="current-password" /></label>
        </div>
        <label className="checkbox"><input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} /> Affichage compact</label>
        <div className="console-actions">
          <button type="button" onClick={loadDashboard} disabled={busy || organizationId.trim().length === 0 || apiKey.trim().length === 0}>Actualiser les indicateurs</button>
          <button type="button" className="secondary" onClick={savePreference} disabled={busy || organizationId.trim().length === 0 || apiKey.trim().length === 0}>Enregistrer ce poste</button>
        </div>
        <p className="console-status" role="status" aria-live="polite">{message}</p>
      </section>
      <section className={`metric-grid${compact ? " compact" : ""}`} aria-label="Indicateurs du périmètre sélectionné">
        <Metric label="Chiffre d’affaires" value={dashboard?.sales?.revenue?.amountMinor} suffix={dashboard?.sales?.revenue?.currency} />
        <Metric label="Marge brute" value={dashboard?.sales?.grossMargin?.amountMinor} suffix={dashboard?.sales?.revenue?.currency} />
        <Metric label="Stock disponible" value={dashboard?.stock?.onHandQuantity?.value} />
        <Metric label="Anomalies" value={dashboard?.stock?.anomalyCount} />
        <Metric label="Résultat estimé" value={dashboard?.estimatedResult?.amount?.amountMinor} suffix={dashboard?.sales?.revenue?.currency} />
      </section>
    </main>
  );
}

function Metric({ label, value, suffix }: Readonly<{ label: string; value: number | undefined; suffix?: string }>) {
  return <article className="metric"><h2>{label}</h2><p>{value === undefined ? "—" : `${value.toLocaleString("fr-FR")}${suffix === undefined ? "" : ` ${suffix}`}`}</p></article>;
}
