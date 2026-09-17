import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Github, Puzzle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "LovableHub — Extensões para projetos Lovable" }, { name: "description", content: "Instale extensões e edite seus projetos Lovable diretamente pelo GitHub." }, { property: "og:title", content: "LovableHub — Extensões para projetos Lovable" }, { property: "og:description", content: "O marketplace de extensões que edita seus projetos via GitHub." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Landing,
});
function Landing() {
  const features = [
    { Icon: Puzzle, title: "Extensões selecionadas", text: "Ferramentas prontas para acelerar projetos Lovable." },
    { Icon: Code2, title: "Editor integrado", text: "Edite o README com uma experiência de código profissional." },
    { Icon: ShieldCheck, title: "Ações sob controle", text: "Cada instalação e commit exige uma ação explícita sua." },
  ];
  return <main className="min-h-screen overflow-hidden bg-background text-foreground">
    <header className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6"><div className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><Github className="size-4" /></span>LovableHub</div><Button asChild className="ml-auto"><Link to="/auth">Começar <ArrowRight /></Link></Button></header>
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 pb-24 pt-16 sm:px-6">
      <div className="max-w-4xl"><div className="mb-7 inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Extensões com acesso controlado ao GitHub</div><h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] sm:text-7xl">O marketplace de extensões que edita seu Lovable via GitHub.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">Instale ferramentas, escolha um repositório e publique melhorias sem sair do seu fluxo de trabalho.</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/auth">Conectar GitHub <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><Link to="/marketplace">Explorar marketplace</Link></Button></div></div>
      <div className="mt-20 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">{features.map(({ Icon, title, text }) => <article key={title} className="bg-background p-6"><Icon className="mb-8 size-5 text-primary" /><h2 className="font-medium">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
    </section>
  </main>;
}