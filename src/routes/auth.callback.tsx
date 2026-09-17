import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveGithubConnection } from "@/lib/github.functions";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Conectando GitHub — LovableHub" }, { name: "description", content: "Finalizando a conexão segura com o GitHub." }, { property: "og:title", content: "Conectando GitHub — LovableHub" }, { property: "og:description", content: "Finalizando sua entrada no LovableHub." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Callback,
});
function Callback() {
  const navigate = useNavigate(); const [error, setError] = useState("");
  useEffect(() => { void (async () => {
    const { data } = await supabase.auth.getSession(); const session = data.session;
    if (!session) { setError("Não foi possível concluir sua entrada."); return; }
    await supabase.rpc("provision_current_user");
    if (session.provider_token) await saveGithubConnection({ data: { token: session.provider_token } });
    void navigate({ to: "/marketplace" });
  })().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Falha ao conectar.")); }, [navigate]);
  return <main className="grid min-h-screen place-items-center bg-background"><div className="text-center">{error ? <p className="text-destructive">{error}</p> : <><LoaderCircle className="mx-auto mb-3 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Conectando seu GitHub…</p></>}</div></main>;
}