import { useEffect, useState, type FormEvent } from "react";
import { Chrome, LoaderCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "./auth-input";
import { AuthShell } from "./auth-shell";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { credentialsSchema, emailSchema, readableAuthError } from "@/lib/auth-schema";

type AuthMode = "signin" | "signup" | "forgot";
type FieldErrors = { email?: string; password?: string };

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(""); setErrors({});
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const parsed = mode === "forgot" ? emailSchema.safeParse(email) : credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      setErrors({ email: flattened.formErrors[0] ?? flattened.fieldErrors?.email?.[0], password: flattened.fieldErrors?.password?.[0] });
      return;
    }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage("Enviamos as instruções de recuperação para seu e-mail.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setMessage(data.session ? "Conta criada com sucesso." : "Confira seu e-mail para confirmar a conta.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) { setMessage(readableAuthError(error instanceof Error ? error.message : "")); }
    finally { setBusy(false); }
  }

  if (userEmail) return <SignedIn email={userEmail} onSignOut={() => void supabase.auth.signOut()} />;
  return <AuthForm mode={mode} busy={busy} message={message} errors={errors} onSubmit={submit} onModeChange={(next) => { setMode(next); setMessage(""); setErrors({}); }} />;
}

interface AuthFormProps { mode: AuthMode; busy: boolean; message: string; errors: FieldErrors; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onModeChange: (mode: AuthMode) => void; }

function AuthForm({ mode, busy, message, errors, onSubmit, onModeChange }: AuthFormProps) {
  const title = mode === "signup" ? "Crie sua conta" : mode === "forgot" ? "Recupere seu acesso" : "Acesse sua conta";
  const subtitle = mode === "forgot" ? "Digite seu e-mail para receber o link de recuperação." : "Entre com seu e-mail para continuar.";
  async function googleSignIn() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } });
    if (result.error) throw result.error;
  }
  return <AuthShell><section className="auth-rise mt-8 rounded-2xl bg-card p-6 shadow-2xl ring-1 ring-border backdrop-blur-2xl">
    <h1 className="font-display text-[26px] font-semibold leading-tight">{title}</h1><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>
    <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
      <AuthInput id="email" name="email" label="E-mail" type="email" autoComplete="email" placeholder="voce@empresa.com" error={errors.email} disabled={busy} />
      {mode !== "forgot" ? <AuthInput id="password" name="password" label="Senha" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Mínimo de 8 caracteres" error={errors.password} disabled={busy} /> : null}
      {mode === "signin" ? <div className="flex items-center justify-end"><button type="button" className="text-xs text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground" onClick={() => onModeChange("forgot")}>Esqueceu a senha?</button></div> : null}
      {message ? <p className="rounded-lg bg-secondary px-3 py-2.5 text-xs leading-relaxed text-muted-foreground" role="status">{message}</p> : null}
      <Button className="auth-sheen w-full" variant="auth" size="auth" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : null}{mode === "signup" ? "Criar conta" : mode === "forgot" ? "Enviar link" : "Entrar"}</Button>
    </form>
    {mode !== "forgot" ? <><div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-border"/><span className="font-mono text-[10px] uppercase text-muted-foreground">ou</span><span className="h-px flex-1 bg-border"/></div><Button type="button" className="w-full" variant="authOutline" size="auth" onClick={() => void googleSignIn()}><Chrome />Continuar com Google</Button></> : null}
  </section><div className="auth-rise mt-4 rounded-xl bg-card/70 p-4 ring-1 ring-border backdrop-blur-xl"><p className="text-[13px] text-muted-foreground">{mode === "signin" ? "Não tem conta? " : mode === "signup" ? "Já tem uma conta? " : "Lembrou sua senha? "}<button type="button" className="font-medium text-foreground underline decoration-accent/60 underline-offset-4" onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Criar conta" : "Voltar para entrar"}</button></p></div></AuthShell>;
}

function SignedIn({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return <AuthShell><section className="auth-rise mt-8 rounded-2xl bg-card p-6 text-center ring-1 ring-border backdrop-blur-2xl"><div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/20 text-accent ring-1 ring-accent/40"><ShieldCheckIcon /></div><h1 className="mt-5 font-display text-2xl font-semibold">Acesso confirmado</h1><p className="mt-2 text-sm text-muted-foreground">Você entrou como <span className="text-foreground">{email}</span>.</p><Button className="mt-6 w-full" variant="authOutline" size="auth" onClick={onSignOut}><LogOut />Sair</Button></section></AuthShell>;
}

function ShieldCheckIcon() { return <span className="font-display text-lg font-bold" aria-hidden="true">✓</span>; }