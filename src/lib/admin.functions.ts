import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: owner } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
    if (!owner) throw new Error("Acesso restrito ao owner.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: users }, { data: credits }, { data: payments }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 }),
      supabaseAdmin.from("user_credits").select("user_id, balance, updated_at").order("updated_at", { ascending: false }),
      supabaseAdmin.from("payments").select("id, user_id, amount_cents, credits, status, created_at").order("created_at", { ascending: false }),
    ]);
    const balanceMap = new Map((credits ?? []).map((item) => [item.user_id, item.balance]));
    return {
      users: (users?.users ?? []).map((user) => ({ id: user.id, email: user.email ?? "Sem e-mail", balance: balanceMap.get(user.id) ?? 0, createdAt: user.created_at })),
      payments: payments ?? [],
    };
  });