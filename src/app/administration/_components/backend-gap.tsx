import { EmptyState } from "@/components/ui";
export function BackendGap({ capability, description }: Readonly<{ capability: string; description: string }>) { return <EmptyState description={<><strong>BACKEND GAP: {capability}</strong><br />{description}</>} title="Fonction indisponible" />; }
