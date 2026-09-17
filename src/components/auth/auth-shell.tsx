import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="auth-atmosphere relative flex min-h-dvh w-full justify-center overflow-hidden bg-background text-foreground">
      <main className="relative z-10 flex w-full max-w-[27rem] flex-col px-5 py-8 sm:py-9">
        <header className="auth-rise flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-foreground/10 ring-1 ring-foreground/15">
              <span className="font-display text-sm font-bold text-muted-foreground">v</span>
            </div>
            <span className="font-display text-[15px] font-semibold">Véu</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> seguro
          </span>
        </header>
        {children}
        <footer className="mt-auto flex items-center justify-center gap-2 pt-6 text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase">Conexão criptografada</span>
        </footer>
      </main>
    </div>
  );
}