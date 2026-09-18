import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Building2, LayoutDashboard, LogOut, MailPlus, Menu, ShieldCheck, Users, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppShellProps { children: ReactNode; }
const navigation = [
  { label: "Visão geral", to: "/dashboard", Icon: LayoutDashboard },
  { label: "Usuários", to: "/users", Icon: Users },
  { label: "Convites", to: "/invites", Icon: MailPlus },
  { label: "Departamentos", to: "/departments", Icon: Building2 },
] as const;

export function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };
  return <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[15rem_1fr]">
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-16 items-center gap-3 border-b border-border px-5"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span><div><p className="font-display font-semibold">Núcleo</p><p className="text-xs text-muted-foreground">Administração</p></div><Button variant="ghost" size="icon" className="ml-auto lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)}><X /></Button></div>
      <nav className="grid gap-1 p-3" aria-label="Navegação principal">{navigation.map(({ label, to, Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", pathname === to && "bg-accent text-foreground")}><Icon className="size-4" />{label}</Link>)}</nav>
      <div className="mt-auto border-t border-border p-3"><Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}><LogOut />Sair</Button></div>
    </aside>
    {open && <button className="fixed inset-0 z-40 bg-background/80 lg:hidden" aria-label="Fechar navegação" onClick={() => setOpen(false)} />}
    <div className="min-w-0"><header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu /></Button><p className="ml-3 text-sm text-muted-foreground lg:ml-0">Gestão de acessos e equipes</p></header><main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main></div>
  </div>;
}
