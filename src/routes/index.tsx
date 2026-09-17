import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth/auth-page";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Entrar — Véu" },
    { name: "description", content: "Entre com segurança na sua conta Véu usando e-mail ou Google." },
    { property: "og:title", content: "Entrar — Véu" },
    { property: "og:description", content: "Acesso seguro à sua conta Véu." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});
