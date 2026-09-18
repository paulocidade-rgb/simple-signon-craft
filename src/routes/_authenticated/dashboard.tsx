import { createFileRoute } from "@tanstack/react-router";
import { Building2, MailPlus, UserCheck, Users } from "lucide-react";
import { AppShell } from "@/components/hub/app-shell";
import { PageError, PageLoading } from "@/components/admin/page-state";
import { PageHeading } from "@/components/admin/page-heading";
import { useAdminData } from "@/hooks/use-admin-data";

export const Route = createFileRoute("/_authenticated/dashboard")({ head: () => ({ meta: [{ title: "Visão geral — Núcleo" }, { name: "description", content: "Resumo de usuários, departamentos e convites da organização." }, { property: "og:title", content: "Visão geral — Núcleo" }, { property: "og:description", content: "Resumo de usuários, departamentos e convites da organização." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Dashboard });
function Dashboard() {
  const { data, isLoading, error } = useAdminData();
  if (isLoading) return <AppShell><PageLoading /></AppShell>;
  if (error || !data) return <AppShell><PageError message={error instanceof Error ? error.message : "Não foi possível carregar o painel."} /></AppShell>;
  const active = data.users.filter((user) => user.ativo).length;
  const pending = data.invites.filter((invite) => !invite.usado && !invite.cancelado_em && new Date(invite.expira_em) > new Date()).length;
  const metrics = [{ label: "Usuários", value: data.users.length, Icon: Users }, { label: "Acessos ativos", value: active, Icon: UserCheck }, { label: "Convites pendentes", value: pending, Icon: MailPlus }, { label: "Departamentos", value: 5, Icon: Building2 }];
  return <AppShell><PageHeading eyebrow="Visão geral" title="Painel administrativo" description="Acompanhe acessos, equipes e convites em um só lugar." /><section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, Icon }) => <article key={label} className="rounded-md border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="size-5 text-primary" /></div><p className="mt-8 text-3xl font-semibold">{value}</p></article>)}</section><section className="mt-8 border-t border-border pt-8"><h2 className="font-display text-lg font-semibold">Distribuição por departamento</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{(["ADMIN","FINANCEIRO","VENDAS","ESTOQUE","JURIDICO"] as const).map((department) => <div key={department} className="border-l-2 border-primary bg-card p-4"><p className="text-xs text-muted-foreground">{department}</p><p className="mt-2 text-2xl font-semibold">{data.users.filter((user) => user.departamento === department).length}</p></div>)}</div></section></AppShell>;
}
