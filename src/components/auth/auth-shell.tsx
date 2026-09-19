import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh w-full justify-center overflow-hidden bg-background text-foreground">
      <img src="/uploads/logotipo-5-1.png" alt="Access corporate" className="pointer-events-none absolute inset-0 size-full object-cover object-center opacity-45" />
      <div className="pointer-events-none absolute inset-0 bg-background/75 backdrop-blur-[2px]" />
      <main className="relative z-10 flex w-full max-w-[27rem] flex-col px-5 py-8 sm:py-9">
        <header className="auth-rise flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-28 items-center overflow-hidden rounded-lg border border-white/15 bg-background/50 p-1 shadow-lg">
              <img src="/uploads/logotipo-5-1.png" alt="Access corporate" className="h-full w-full object-cover object-[center_68%]" />
            </div>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> seguro
          </span>
        </header>
        {children}
        <footer className="mt-auto flex items-center justify-center gap-2 pt-6 text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase">Conexão segura</span>
        </footer>
      </main>
    </div>
  );
}