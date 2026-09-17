import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Coins, Github, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppShellProps { children: ReactNode; }

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined;
    void supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) { void navigate({ to: "/auth" }); return; }
      await supabase.rpc("provision_current_user");
      const refresh = async () => {
        const { data: credit } = await supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle();
        setBalance(credit?.balance ?? 0);
      };
      await refresh();
      channel = supabase.channel(`credits-${user.id}`).on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}`,
      }, () => { void refresh(); }).subscribe();
    });
    return () => { if (channel) void supabase.removeChannel(channel); };
  }, [navigate]);

  const nav = [
    ["Marketplace", "/marketplace"], ["Meu GitHub", "/my-github"],
    ["Editor", "/editor"], ["Créditos", "/pricing"],
  ] as const;
  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/marketplace" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><Github className="size-4" /></span>
          <span>LovableHub</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {nav.map(([label, to]) => <Link key={to} to={to} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/pricing" className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium"><Coins className="size-4 text-primary" />{balance === null ? "—" : balance}</Link>
          <Button variant="ghost" size="icon" aria-label="Sair" onClick={async () => { await supabase.auth.signOut(); void navigate({ to: "/" }); }}><LogOut /></Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" onClick={() => setMenu((value) => !value)}>{menu ? <X /> : <Menu />}</Button>
        </div>
      </div>
      <nav className={cn("border-t border-border p-3 md:hidden", menu ? "grid" : "hidden")}>
        {nav.map(([label, to]) => <Link key={to} to={to} onClick={() => setMenu(false)} className="rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-accent">{label}</Link>)}
      </nav>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
  </div>;
}