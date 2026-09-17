import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Gauge, LoaderCircle, Palette, SearchCheck } from "lucide-react";
import { AppShell } from "@/components/hub/app-shell";
import { PaywallDialog } from "@/components/hub/paywall-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/marketplace")({ head: () => ({ meta: [{ title: "Marketplace — LovableHub" }, { name: "description", content: "Explore extensões para seus projetos Lovable." }, { property: "og:title", content: "Marketplace — LovableHub" }, { property: "og:description", content: "Instale extensões para acelerar seus projetos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Marketplace });
const icons = [Gauge, Palette, SearchCheck];
function Marketplace() {
  const [items, setItems] = useState<Tables<"extensions">[]>([]); const [busy, setBusy] = useState<string | null>(null); const [paywall, setPaywall] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { void supabase.from("extensions").select("*").eq("is_published", true).order("price").then(({ data }) => setItems(data ?? [])); }, []);
  const install = async (id: string) => { setBusy(id); setMessage(""); const { data, error } = await supabase.rpc("install_extension", { p_extension_id: id }); setBusy(null); if (error) { setMessage(error.message); return; } if (!data) { setPaywall(true); return; } setMessage("Extensão instalada com sucesso."); };
  return <AppShell><div className="mb-10"><p className="text-xs font-medium uppercase text-primary">Marketplace</p><h1 className="mt-2 text-3xl font-semibold">Amplie o que seu projeto pode fazer</h1><p className="mt-3 text-muted-foreground">Cada instalação utiliza 10 créditos. Owners têm acesso livre.</p>{message && <p className="mt-4 text-sm text-primary">{message}</p>}</div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => { const Icon = icons[index % icons.length]; return <article key={item.id} className="flex min-h-72 flex-col border border-border bg-card p-6"><div className="grid size-10 place-items-center rounded-md border border-border bg-secondary text-primary"><Icon /></div><div className="mt-8 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">{item.name}</h2><span className="text-sm font-medium">R${(item.price / 100).toFixed(0)}{item.billing_period === "monthly" ? "/m" : ""}</span></div><p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{item.description}</p><Button className="mt-6 w-full" onClick={() => void install(item.id)} disabled={busy === item.id}>{busy === item.id ? <LoaderCircle className="animate-spin" /> : "Instalar · 10 créditos"}</Button></article>; })}</div><PaywallDialog open={paywall} onOpenChange={setPaywall} /></AppShell>;
}