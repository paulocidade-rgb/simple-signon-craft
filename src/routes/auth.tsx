import { createFileRoute } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — LovableHub" }, { name: "description", content: "Entre no LovableHub com sua conta GitHub." }, { property: "og:title", content: "Entrar — LovableHub" }, { property: "og:description", content: "Conecte o GitHub para instalar extensões e editar seus projetos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthRoute,
});
function AuthRoute() {
  const connect = async () => { await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: "repo read:user user:email" } }); };
  return <main className="grid min-h-screen place-items-center bg-background px-4"><section className="w-full max-w-sm border border-border bg-card p-8 shadow-2xl"><div className="mb-8"><div className="mb-6 grid size-10 place-items-center rounded-md bg-primary text-primary-foreground"><Github /></div><h1 className="text-2xl font-semibold">Entre no LovableHub</h1><p className="mt-2 text-sm text-muted-foreground">Conecte o GitHub para acessar repositórios e editar seus projetos.</p></div><Button className="w-full" size="lg" onClick={connect}><Github />Continuar com GitHub</Button><p className="mt-5 text-xs leading-5 text-muted-foreground">O acesso ao repositório é usado somente para as ações que você autorizar no editor.</p></section></main>;
}