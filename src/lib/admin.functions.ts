import { createHash, randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const departments = ["ADMIN", "FINANCEIRO", "VENDAS", "ESTOQUE", "JURIDICO"] as const;
const departmentSchema = z.enum(departments);

async function assertOwner(context: { supabase: { rpc: Function }; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
  if (error || !data) throw new Error("Você não tem permissão para acessar esta área.");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: users, error: usersError }, { data: invites, error: invitesError }] = await Promise.all([
      supabaseAdmin.from("usuarios").select("id,nome,email,departamento,ativo,criado_em").order("criado_em", { ascending: false }),
      supabaseAdmin.from("convites_usuario").select("id,email,departamento,expira_em,usado,usado_em,cancelado_em,criado_em").order("criado_em", { ascending: false }),
    ]);
    if (usersError || invitesError) throw new Error("Não foi possível carregar o painel.");
    return { users: users ?? [], invites: invites ?? [] };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), nome: z.string().trim().min(2).max(150), departamento: departmentSchema, ativo: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    if (data.id === context.userId && !data.ativo) throw new Error("Você não pode desativar o próprio acesso.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("usuarios").update({ nome: data.nome, departamento: data.departamento, ativo: data.ativo }).eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar o usuário.");
    return { ok: true };
  });

export const createAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ email: z.string().trim().toLowerCase().email().max(150), departamento: departmentSchema }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("convites_usuario").insert({ email: data.email, departamento: data.departamento, token_hash: tokenHash, expira_em: expiresAt, criado_por: context.userId });
    if (error) throw new Error("Não foi possível criar o convite. Verifique se já existe um convite ativo.");
    return { token, expiresAt };
  });

export const cancelAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("convites_usuario").update({ cancelado_em: new Date().toISOString() }).eq("id", data.id).eq("usado", false);
    if (error) throw new Error("Não foi possível cancelar o convite.");
    return { ok: true };
  });
