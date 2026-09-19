import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { credentialsSchema, readableAuthError } from "@/lib/auth-schema";
import { provisionPanelProfile } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Núcleo" }, { name: "description", content: "Acesso seguro ao painel administrativo da equipe." }, { property: "og:title", content: "Entrar — Núcleo" }, { property: "og:description", content: "Acesso seguro ao painel administrativo da equipe." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthRoute,
});
function AuthRoute() {
  const navigate = useNavigate();
  const provisionProfile = useServerFn(provisionPanelProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const parsed = credentialsSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revise os dados informados."); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    if (authError) { setError(readableAuthError(authError.message)); setLoading(false); return; }
    await supabase.rpc("provision_current_user");
    await provisionProfile();
    await navigate({ to: "/dashboard", replace: true });
  };
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10"><img src="/uploads/logotipo-5-1.png" alt="Access corporate" className="absolute inset-0 size-full object-cover object-center opacity-45" /><div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" /><section className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-card/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8"><div className="mb-8"><div className="mb-6 flex h-16 items-center overflow-hidden rounded-xl border border-white/15 bg-background/50 p-2 shadow-lg"><img src="/uploads/logotipo-5-1.png" alt="Access corporate" className="h-full w-full object-cover object-[center_68%]" /></div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Área restrita</p><h1 className="mt-2 font-display text-3xl font-semibold">Acesse sua conta</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Use suas credenciais corporativas para continuar.</p></div><form className="grid gap-5" onSubmit={submit}><div className="grid gap-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com" /></div><div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="password">Senha</Label><Link to="/reset-password" className="text-xs text-muted-foreground hover:text-foreground">Esqueci minha senha</Link></div><Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} /></div>{error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button size="lg" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}{loading ? "Entrando..." : "Entrar"}</Button></form></section></main>;
}
