import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const repoSchema = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);

async function cryptToken(token: string, mode: "encrypt" | "decrypt") {
  const secret = process.env["GITHUB_TOKEN_ENCRYPTION_KEY"];
  if (!secret) throw new Error("A proteção da conexão GitHub não está configurada.");
  const keyData = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, [mode]);
  if (mode === "encrypt") {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token));
    return `${Buffer.from(iv).toString("base64")}.${Buffer.from(encrypted).toString("base64")}`;
  }
  const [ivValue, dataValue] = token.split(".");
  if (!ivValue || !dataValue) throw new Error("Conexão GitHub inválida.");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(ivValue, "base64") },
    key,
    Buffer.from(dataValue, "base64"),
  );
  return new TextDecoder().decode(decrypted);
}

async function getConnection(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("github_connections")
    .select("github_token, github_username, repo_selected")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Conecte sua conta GitHub primeiro.");
  return { ...data, token: await cryptToken(data.github_token, "decrypt") };
}

export const saveGithubConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ token: z.string().min(20).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { Octokit } = await import("octokit");
    const octokit = new Octokit({ auth: data.token });
    const profile = await octokit.rest.users.getAuthenticated();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("github_connections").upsert({
      user_id: context.userId,
      github_token: await cryptToken(data.token, "encrypt"),
      github_username: profile.data.login,
    });
    if (error) throw new Error("Não foi possível salvar a conexão GitHub.");
    return { username: profile.data.login };
  });

export const listGithubRepos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const connection = await getConnection(context.userId);
    const { Octokit } = await import("octokit");
    const response = await new Octokit({ auth: connection.token }).rest.repos.listForAuthenticatedUser({
      visibility: "all", sort: "updated", per_page: 100,
    });
    return {
      selected: connection.repo_selected,
      username: connection.github_username,
      repos: response.data.map((repo) => ({
        id: repo.id, fullName: repo.full_name, private: repo.private,
        description: repo.description, updatedAt: repo.updated_at,
      })),
    };
  });

export const selectGithubRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ repo: repoSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("github_connections")
      .update({ repo_selected: data.repo }).eq("user_id", context.userId);
    if (error) throw new Error("Não foi possível selecionar o repositório.");
    return { selected: data.repo };
  });

export const getReadme = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const connection = await getConnection(context.userId);
    const repo = repoSchema.parse(connection.repo_selected);
    const [owner, name] = repo.split("/");
    if (!owner || !name) throw new Error("Selecione um repositório.");
    const { Octokit } = await import("octokit");
    try {
      const result = await new Octokit({ auth: connection.token }).rest.repos.getContent({ owner, repo: name, path: "README.md" });
      if (Array.isArray(result.data) || result.data.type !== "file" || !("content" in result.data)) throw new Error("README inválido.");
      return { repo, sha: result.data.sha, content: Buffer.from(result.data.content, "base64").toString("utf8") };
    } catch (error) {
      const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
      if (status === 404) return { repo, sha: null, content: `# ${name}\n` };
      throw error;
    }
  });

export const commitReadme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    content: z.string().max(1_000_000), sha: z.string().nullable(),
    message: z.string().trim().min(3).max(120),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const connection = await getConnection(context.userId);
    const repo = repoSchema.parse(connection.repo_selected);
    const [owner, name] = repo.split("/");
    if (!owner || !name) throw new Error("Selecione um repositório.");
    const { data: paid, error } = await context.supabase.rpc("consume_credits", {
      p_user_id: context.userId, p_amount: 5, p_description: `Commit no ${repo}`,
    });
    if (error) throw error;
    if (!paid) return { ok: false as const, insufficient: true as const };
    try {
      const { Octokit } = await import("octokit");
      const result = await new Octokit({ auth: connection.token }).rest.repos.createOrUpdateFileContents({
        owner, repo: name, path: "README.md", message: data.message,
        content: Buffer.from(data.content, "utf8").toString("base64"),
        ...(data.sha ? { sha: data.sha } : {}),
      });
      return { ok: true as const, sha: result.data.content?.sha ?? null, url: result.data.commit.html_url ?? null };
    } catch (commitError) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.rpc("refund_credits", {
        p_user_id: context.userId,
        p_amount: 5,
        p_description: `Estorno de commit com falha no ${repo}`,
      });
      throw commitError;
    }
  });