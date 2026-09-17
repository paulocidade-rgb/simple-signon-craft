import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthShell } from "@/components/auth/auth-shell";
import { passwordSchema } from "@/lib/auth-schema";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Redefinir senha — Véu" },
    { name: "description", content: "Defina uma nova senha para sua conta Véu." },
    { property: "og:title", content: "Redefinir senha — Véu" },
    { property: "og:description", content: "Recupere com segurança o acesso à sua conta Véu." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setRecoveryReady(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setRecoveryReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Senha inválida."); return; }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (updateError) setError("Não foi possível redefinir a senha. Solicite um novo link."); else setMessage("Senha atualizada. Você já pode entrar.");
  }
  return <AuthShell><section className="auth-rise mt-8 rounded-2xl bg-card p-6 ring-1 ring-border backdrop-blur-2xl"><h1 className="font-display text-[26px] font-semibold">Defina uma nova senha</h1><p className="mt-2 text-[13px] text-muted-foreground">Use pelo menos 8 caracteres para proteger sua conta.</p>{recoveryReady ? <form className="mt-6 space-y-4" onSubmit={submit}><AuthInput id="password" name="password" label="Nova senha" type="password" autoComplete="new-password" error={error} disabled={busy}/>{message ? <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground" role="status">{message}</p> : null}<Button className="w-full" variant="auth" size="auth" disabled={busy}>Atualizar senha</Button></form> : <p className="mt-6 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">Abra esta página pelo link enviado ao seu e-mail.</p>}<Button asChild className="mt-4 w-full" variant="authOutline" size="auth"><Link to="/">Voltar para entrar</Link></Button></section></AuthShell>;
}